"""Re-detecta el rango de grabaciones dudosas probando TODOS los rangos reales de su parashá
(trienal 1-3, completa, lunes/jueves y lecturas combinadas de Hebcal). Escribe en RES_DIR.
Uso: python3 tools/redetect_aliyot.py RES_DIR HEBCAL_DIR archivo1 archivo2 ...
"""
import glob, json, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
import gen_karaoke as G, align_local as A
RES, HEB, files = sys.argv[1], sys.argv[2], sys.argv[3:]
KR = json.load(open(os.path.join(G.ROOT, 'data/kriyah_data.json'), encoding='utf-8'))
def R(s):
    m = re.search(r'(\d+):(\d+)-(\d+):(\d+)', s); return tuple(map(int, m.groups())) if m else None
def cands(p):
    c = {}
    d = KR.get(p, {})
    for y, al in d.get('ty', {}).items():
        for a, s in al: c.setdefault(R(s), ('t%s' % y, a))
    for a, s in d.get('f', []):
        if a[0].isdigit() or a == 'maf': c.setdefault(R(s), ('f', a))
    for i, s in enumerate(d.get('w', [])): c.setdefault(R(s), ('w', str(i + 1)))
    return c
for f in files:
    name = os.path.splitext(f)[0]
    p = re.match(r'(.+?)_shabat_', name).group(1).lower()
    C = {k: v for k, v in cands(p).items() if k}
    lp, sec = A.emissions(os.path.join(G.ROOT, 'audios/aliyot', f))
    dur = lp.shape[0] * sec
    scored = []
    for rg, (src, a) in C.items():
        vs = G.verses_for(p, dict(zip(['ch_s', 'v_s', 'ch_e', 'v_e'], rg)))
        ws = [w for _, v in vs for w in v]
        if not ws or len(ws) > dur * 1.6 or len(ws) < dur * 0.15: continue  # descarta por largo
        res, sc = A.align_words(lp, sec, ws); scored.append((sc, rg, src, a, vs, res))
    scored.sort(key=lambda x: -x[0])
    if not scored:
        print('%-34s sin candidatos' % f); continue
    sc, rg, src, a, vs, res = scored[0]
    mg = sc - scored[1][0] if len(scored) > 1 else None
    k, verses = 0, []
    for ref, ws in vs:
        verses.append({'ref': ref, 'w': [[r[0], r[1]] for r in res[k:k + len(ws)]]}); k += len(ws)
    json.dump({'file': f, 'parasha': p, 'aliyah': a, 'year_label': None, 'year_detected': None, 'range': rg,
               'source': src, 'score': round(sc, 3), 'margin': None if mg is None else round(mg, 3),
               'low_words': 0, 'others': [], 'verses': verses},
              open(os.path.join(RES, name + '.json'), 'w'), ensure_ascii=False)
    print('%-34s → %s aliyá %-3s %-18s score %.2f margen %s' % (f, src, a, '%d:%d-%d:%d' % rg, sc, '-' if mg is None else '%.2f' % mg), flush=True)
