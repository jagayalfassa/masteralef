"""Toma los resultados de build_aliyot.py y:
 1) escribe karaoke/words/<audio>.json (sin pisar los generados con Scribe),
 2) reescribe AUDIO_ALIYOT_MAP en index.html: cada entrada shabat_<año>_<aliyá> toma rango y fecha de
    kriyah_data (año N = bloque N, igual que el lector) y el audio cuyo rango detectado coincide.
    Las rutas a archivos inexistentes se eliminan, para no generar 404.
Uso: python3 tools/finalize_aliyot.py RES_DIR
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = sys.argv[1]
MIN_SCORE, MIN_MARGIN = 0.25, 0.05


def parse_rng(s):
    m = re.match(r'\s*\S+\s+(\d+):(\d+)-(\d+):(\d+)', s.split('|')[0])
    return tuple(map(int, m.groups())) if m else None


kr = json.load(open(os.path.join(ROOT, 'data/kriyah_data.json'), encoding='utf-8'))
res = [json.load(open(os.path.join(RES, f))) for f in sorted(os.listdir(RES))]
good, flagged = [], []
for r in res:
    if 'skip' in r:
        flagged.append((r['file'], r['skip'])); continue
    if r['score'] < MIN_SCORE or (r['margin'] is not None and r['margin'] < MIN_MARGIN):
        flagged.append((r['file'], 'dudoso: score %.2f margen %s' % (r['score'], r['margin']))); continue
    good.append(r)

# 1) karaoke
wdir = os.path.join(ROOT, 'karaoke/words'); os.makedirs(wdir, exist_ok=True)
written = 0
for r in good:
    name = os.path.splitext(r['file'])[0]
    dst = os.path.join(wdir, name + '.json')
    if os.path.exists(dst):
        continue  # piloto Scribe
    a, b, c, d = r['range']
    json.dump({'audio': 'audios/aliyot/' + r['file'], 'reading': '%d:%d-%d:%d' % (a, b, c, d),
               'coverage': r['score'], 'source': 'mms-forced-align', 'verses': r['verses']},
              open(dst, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    written += 1

# 2) mapa
lines = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read().split('\n')
li = next(i for i, l in enumerate(lines) if l.startswith('const AUDIO_ALIYOT_MAP'))
src = lines[li]; pre, post = src[:src.index('{')], src[src.rindex('}') + 1:]
m = json.loads(src[src.index('{'):src.rindex('}') + 1])
by = {}
for r in good:
    by.setdefault((r['parasha'], str(r['aliyah']), tuple(r['range'])), r['file'])
# preferir .mp3 si hay dos versiones del mismo audio
for r in good:
    k = (r['parasha'], str(r['aliyah']), tuple(r['range']))
    if r['file'].endswith('.mp3'):
        by[k] = r['file']

stats = {'con audio': 0, 'sin audio': 0, 'nuevas': 0, 'rutas quitadas': 0}
for p, pm in m.items():
    book = next(iter(pm.values())).get('book', '')
    t = kr.get(p, {}).get('t', [])
    for y, blk in enumerate(t[:3], 1):
        for al, rs in blk[1:]:
            if not re.match(r'^(\d+|maf)$', str(al)):
                continue
            rg = parse_rng(rs)
            if not rg:
                continue
            key = 'shabat_%d_%s' % (y, al)
            e = pm.get(key)
            if e is None and not by.get((p, str(al), rg)):
                continue
            if e is None:
                e = pm[key] = {'type': 'shabat', 'year': y, 'aliyah': str(al)}; stats['nuevas'] += 1
            a, b, c, d = rg
            e.update({'reading': '%s %d:%d-%d:%d' % (book, a, b, c, d), 'date': blk[0], 'book': book,
                      'ch_s': a, 'v_s': b, 'ch_e': c, 'v_e': d})
            f = by.get((p, str(al), rg))
            if f:
                e['audio'] = 'audios/aliyot/' + f; stats['con audio'] += 1
            else:
                e.pop('audio', None); stats['sin audio'] += 1
    # entradas no cubiertas arriba (weekday, etc.): quitar rutas a archivos que no existen
    for k, e in pm.items():
        if e.get('audio') and not os.path.exists(os.path.join(ROOT, e['audio'])):
            e.pop('audio'); stats['rutas quitadas'] += 1

lines[li] = pre + json.dumps(m, ensure_ascii=False) + post
open(os.path.join(ROOT, 'index.html'), 'w', encoding='utf-8').write('\n'.join(lines))
used = {os.path.basename(e['audio']) for pm in m.values() for e in pm.values() if e.get('audio')}
print('karaoke escritos:', written, '| mapa:', stats, '| archivos usados por el mapa:', len(used))
print('marcados para revisar:'); [print('  ', f, '—', why) for f, why in flagged]
