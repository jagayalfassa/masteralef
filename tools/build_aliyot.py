"""Procesa audios/aliyot/*: detecta qué rango de versículos se lee (entre los años del trienal
para ese número de aliyá) y calcula tiempos por palabra. Resultado por archivo en OUT/<nombre>.json.
Uso: python3 tools/build_aliyot.py OUT_DIR [max_minutos]
"""
import json, os, re, sys, time
sys.path.insert(0, os.path.dirname(__file__))
import gen_karaoke as G
import align_local as A

ROOT = G.ROOT
OUT = sys.argv[1]; LIMIT = float(sys.argv[2]) * 60 if len(sys.argv) > 2 else 1e9
os.makedirs(OUT, exist_ok=True)
KR = json.load(open(os.path.join(ROOT, 'data/kriyah_data.json'), encoding='utf-8'))


def parse_rng(s):
    m = re.match(r'\s*\S+\s+(\d+):(\d+)-(\d+):(\d+)', s.split('|')[0])
    return tuple(map(int, m.groups())) if m else None


def candidates(p, al):
    out = []
    for y, blk in enumerate(KR.get(p, {}).get('t', [])[:3], 1):
        for a, r in blk[1:]:
            if str(a) == str(al):
                rg = parse_rng(r)
                if rg and rg not in [c[1] for c in out]:
                    out.append((y, rg))
    return out


t0 = time.time()
files = sorted(f for f in os.listdir(os.path.join(ROOT, 'audios/aliyot')) if f.endswith(('.mp3', '.m4a')))
for f in files:
    if time.time() - t0 > LIMIT:
        break
    name = os.path.splitext(f)[0]
    dst = os.path.join(OUT, name + '.json')
    if os.path.exists(dst):
        continue
    mm = re.match(r'(.+?)_shabat_(\d+)_(\w+)$', name)
    if not mm:
        json.dump({'file': f, 'skip': 'nombre no reconocido'}, open(dst, 'w')); continue
    p, ylab, al = mm.group(1).lower(), int(mm.group(2)), mm.group(3)
    cands = candidates(p, al)
    if not cands or not any(os.path.exists(os.path.join(ROOT, 'data/torah', q + '.json')) for q in (p, p.replace('_', ''))):
        json.dump({'file': f, 'skip': 'sin datos de kriyah/torah'}, open(dst, 'w')); continue
    try:
        lp, sec = A.emissions(os.path.join(ROOT, 'audios/aliyot', f))
    except Exception as e:
        json.dump({'file': f, 'skip': 'audio ilegible: %s' % e}, open(dst, 'w')); continue
    best = []
    for y, (a, b, c, d) in cands:
        vs = G.verses_for(p, {'ch_s': a, 'v_s': b, 'ch_e': c, 'v_e': d})
        words = [w for _, ws in vs for w in ws]
        if not words:
            continue
        res, sc = A.align_words(lp, sec, words)
        best.append((sc, y, (a, b, c, d), vs, res))
    if not best:
        json.dump({'file': f, 'skip': 'sin texto para el rango'}, open(dst, 'w')); continue
    best.sort(key=lambda x: -x[0])
    sc, y, rg, vs, res = best[0]
    margin = sc - best[1][0] if len(best) > 1 else None
    k, verses = 0, []
    for ref, ws in vs:
        verses.append({'ref': ref, 'w': [[r[0], r[1]] for r in res[k:k + len(ws)]]}); k += len(ws)
    low = sum(1 for r in res if r[2] < 0.05) / len(res)
    json.dump({'file': f, 'parasha': p, 'aliyah': al, 'year_label': ylab, 'year_detected': y, 'range': rg,
               'score': round(sc, 3), 'margin': None if margin is None else round(margin, 3),
               'low_words': round(low, 3), 'others': [(round(b[0], 3), b[1]) for b in best[1:]],
               'verses': verses}, open(dst, 'w'), ensure_ascii=False)
    print('%-32s año %d→%d  score %.2f  margen %s' % (f, ylab, y, sc, '-' if margin is None else '%.2f' % margin), flush=True)
