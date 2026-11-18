"""Audita data/torah/*.json contra el texto de Sefaria (bajado en SEF_DIR/<Libro>_<cap>.json).
Para cada versículo compara el texto consonántico con el de su referencia; si no coincide,
busca en todo el libro cuál es la referencia real.
Uso: python3 tools/audit_torah_refs.py SEF_DIR [--fix]
  --fix  reescribe los refs mal numerados en data/torah/*.json (solo si la coincidencia real es clara)
"""
import glob, json, os, re, sys, difflib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEF, FIX = sys.argv[1], '--fix' in sys.argv
ABBR = {'Gn': 'Genesis', 'Ex': 'Exodus', 'Lv': 'Leviticus', 'Nm': 'Numbers', 'Dt': 'Deuteronomy', 'Génesis': 'Genesis', 'Éxodo': 'Exodus', 'Levítico': 'Leviticus', 'Números': 'Numbers', 'Deuteronomio': 'Deuteronomy'}
LET = re.compile('[א-ת]')


def cons(t):
    t = re.sub(r'<[^>]+>', '', t).replace('־', ' ')
    t = re.sub(r'\{[^}]*\}', '', t)
    return ''.join(c for c in t if LET.match(c))


sef = {}
for f in glob.glob(os.path.join(SEF, '*.json')):
    b, c = os.path.basename(f)[:-5].rsplit('_', 1)
    for i, v in enumerate(json.load(open(f, encoding='utf-8')), 1):
        sef[(b, int(c), i)] = cons(v if isinstance(v, str) else ' '.join(v))
by_text = {}
for k, v in sef.items():
    by_text.setdefault(v, []).append(k)

report = {}
for fp in sorted(glob.glob(os.path.join(ROOT, 'data/torah/*.json'))):
    d = json.load(open(fp, encoding='utf-8'))
    dic = d.get('dictionary', {})
    bad, fixed, total = [], 0, 0
    for al in d.get('aliyot', []):
        refs = al.get('refs', [])
        for vi, idx in enumerate(al.get('verses', [])):
            if vi >= len(refs):
                continue
            m = re.match(r'^(\S+)\s+(\d+):(\d+)', refs[vi])
            if not m:
                continue
            book = ABBR.get(m.group(1), m.group(1)); key = (book, int(m.group(2)), int(m.group(3)))
            words = [dic[str(i)] if not isinstance(i, str) else i for i in idx]
            txt = cons(' '.join(words)); total += 1
            ref_txt = sef.get(key, '')
            if ref_txt and difflib.SequenceMatcher(None, txt, ref_txt, autojunk=False).ratio() > 0.9:
                continue
            # buscar el versículo real: exacto o el más parecido del mismo libro
            real = by_text.get(txt)
            if real:
                real = real[0]; sim = 1.0
            else:
                best = max(((difflib.SequenceMatcher(None, txt, v, autojunk=False).quick_ratio(), k)
                            for k, v in sef.items() if k[0] == book), default=(0, None))
                real, sim = best[1], best[0]
            bad.append({'ref': refs[vi], 'real': '%d:%d' % real[1:] if real else None, 'sim': round(sim, 2)})
            if FIX and real and sim > 0.95 and real[0] == book:
                refs[vi] = '%s %d:%d' % (m.group(1), real[1], real[2]); fixed += 1
    if FIX and fixed:
        json.dump(d, open(fp, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    report[os.path.basename(fp)[:-5]] = {'total': total, 'mal': len(bad), 'corregidos': fixed, 'ejemplos': bad[:4]}

bad_p = {k: v for k, v in report.items() if v['mal']}
print('parashot revisadas:', len(report), '| con versículos mal numerados:', len(bad_p),
      '| versículos mal:', sum(v['mal'] for v in report.values()), 'de', sum(v['total'] for v in report.values()))
for k, v in sorted(bad_p.items(), key=lambda x: -x[1]['mal']):
    print('  %-14s %3d/%3d  %s' % (k, v['mal'], v['total'], '; '.join('%s→%s' % (e['ref'].split()[-1], e['real']) for e in v['ejemplos'])))
json.dump(report, open('/tmp/torah_audit.json', 'w'), ensure_ascii=False, indent=1)
