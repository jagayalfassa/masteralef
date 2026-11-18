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
by, best = {}, {}
for r in good:  # por lugar (parashá, aliyá, rango) gana la grabación con mejor puntaje
    k = (r['parasha'], str(r['aliyah']), tuple(r['range']))
    if k not in best or r['score'] > best[k]:
        by[k], best[k] = r['file'], r['score']

stats = {'con audio': 0, 'sin audio': 0, 'rutas quitadas': 0}
by_range = {}
for (pp, al, rg), f in by.items():  # rango → mejor archivo (sin importar el n° de aliyá del nombre)
    k = (pp, rg)
    if k not in by_range or best[(pp, al, rg)] > best.get(('_', k), -1):
        by_range[k] = f; best[('_', k)] = best[(pp, al, rg)]
for p, pm in m.items():
    d = kr.get(p, {})
    book = next(iter(pm.values())).get('book', '') if pm else ''
    slots = {}
    for y, al in d.get('ty', {}).items():          # trienal por año del ciclo (Hebcal)
        for a, rs in al: slots['shabat_%s_%s' % (y, a)] = (int(y), a, rs, d.get('td') and next((dt for dt, yy in d['td'].items() if yy == int(y)), None))
    for a, rs in d.get('f', []):                    # lectura completa
        if re.match(r'^(\d+|maf)$', str(a)): slots['full_%s' % a] = (None, a, rs, None)
    for i, rs in enumerate(d.get('w', []), 1):      # lunes y jueves
        slots['weekday_%d' % i] = (None, str(i), rs, None)
    # borrar entradas de shabat/full/weekday viejas y regenerarlas
    for k in [k for k in pm if re.match(r'^(shabat|full|weekday)_', k)]: del pm[k]
    for key, (y, a, rs, date) in slots.items():
        rg = parse_rng(rs)
        if not rg: continue
        e = {'type': key.split('_')[0], 'year': y, 'aliyah': str(a), 'reading': '%s %d:%d-%d:%d' % ((book,) + rg),
             'date': date or '', 'book': book, 'ch_s': rg[0], 'v_s': rg[1], 'ch_e': rg[2], 'v_e': rg[3]}
        f = by_range.get((p, rg))
        if f: e['audio'] = 'audios/aliyot/' + f; stats['con audio'] += 1
        else: stats['sin audio'] += 1
        pm[key] = e

lines[li] = pre + json.dumps(m, ensure_ascii=False) + post
open(os.path.join(ROOT, 'index.html'), 'w', encoding='utf-8').write('\n'.join(lines))
used = {os.path.basename(e['audio']) for pm in m.values() for e in pm.values() if e.get('audio')}
print('karaoke escritos:', written, '| mapa:', stats, '| archivos usados por el mapa:', len(used))
print('marcados para revisar:'); [print('  ', f, '—', why) for f, why in flagged]
