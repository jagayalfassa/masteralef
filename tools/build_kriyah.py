"""Regenera data/kriyah_data.json y data/calendar.json desde el calendario de Hebcal (diáspora).

Fuente: https://www.hebcal.com/leyning (licencia CC BY 4.0). Descarga previa:
  for y in 2025..2040: curl "https://www.hebcal.com/leyning?cfg=json&start=$y-01-01&end=$y-12-31&triennial=on" > /tmp/heb/hc_$y.json
Uso: python3 tools/build_kriyah.py /tmp/heb

Por parashá (mismo formato que antes + campos nuevos):
  f   lectura completa "normal" (moda entre los Shabatot en que la parashá va sola) — aliyot 1-7 + maf;
      se conservan las haftarot existentes.
  w   lunes/jueves (moda).
  t   lista [fecha, [aliyá, rango]...] de los Shabatot en que va sola (trienal de ese día).
  ty  {"1"|"2"|"3": [[aliyá, rango]...]} trienal por AÑO DEL CICLO (no por posición en la lista).
  td  {fecha: año del ciclo} para todos sus Shabatot (también los combinados).
calendar.json: [{d, hd, p:[ids], y, n}] un registro por Shabat con lectura de parashá.
"""
import collections, glob, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1] if len(sys.argv) > 1 else '/tmp/heb'
BOOK = {'Genesis': 'Gn', 'Exodus': 'Ex', 'Leviticus': 'Lv', 'Numbers': 'Nm', 'Deuteronomy': 'Dt'}
KR_PATH = os.path.join(ROOT, 'data/kriyah_data.json')
kr = json.load(open(KR_PATH, encoding='utf-8'))

def norm(s): return re.sub(r'[^a-z]', '', s.lower())
ALIAS = {'lechlecha': 'lech_lecha', 'chayeisara': 'chayei_sara', 'vayetzei': 'vayetze', 'kitisa': 'ki_tisa',
         'achreimot': 'acharei_mot', 'behaalotcha': 'behaalotcha', 'shlach': 'shlach', 'kiteitzei': 'ki_tetze',
         'kitavo': 'ki_tavo', 'terumah': 'teruma', 'tetzaveh': 'tetzave', 'nasso': 'naso', 'shmini': 'shemini',
         'vezothaberakhah': 'vzot_habracha', 'eikev': 'ekev', 'shemot': 'shemot', 'bamidbar': 'bamidbar', 'reeh': 'reeh'}
IDS = {norm(k): k for k in kr}
def pid(en):
    n = norm(en)
    return ALIAS.get(n) or IDS.get(n)
def split_combined(en):
    for i in [m.start() for m in re.finditer('-', en)]:
        a, b = pid(en[:i]), pid(en[i + 1:])
        if a and b: return [a, b]
    return None

def rng(a):
    return '%s %s-%s' % (BOOK.get(a.get('k'), a.get('k', '?')), a['b'], a['e'])
def aliyot(d):
    out = [[str(i), rng(d[str(i)])] for i in range(1, 8) if str(i) in d]
    if 'M' in d: out.append(['maf', rng(d['M'])])
    return out

items = []
for f in sorted(glob.glob(os.path.join(SRC, 'hc_*.json'))):
    items += json.load(open(f))['items']

full = collections.defaultdict(list); tri = collections.defaultdict(lambda: collections.defaultdict(list))
wk = collections.defaultdict(list); dated = collections.defaultdict(list); td = collections.defaultdict(dict)
cal = []
for it in items:
    en = (it.get('name') or {}).get('en', '')
    ps = [pid(en)] if pid(en) else split_combined(en)
    if not ps: continue
    if it.get('weekday') and 'fullkriyah' not in it:
        if len(ps) == 1:
            d = it['weekday']
            wk[ps[0]].append(tuple('%s %s-%s' % (BOOK.get(d[k].get('k'), next(iter(kr[ps[0]]['w'])).split()[0] if kr[ps[0]].get('w') else '?'), d[k]['b'], d[k]['e']) for k in sorted(d)))
        continue
    if 'triennial' not in it or 'fullkriyah' not in it: continue
    date, y = it['date'][:10], it.get('triYear')
    cal.append({'d': date, 'hd': it.get('hdate', ''), 'p': ps, 'y': y, 'n': en})
    for p in ps: td[p][date] = y
    if len(ps) == 1:
        p = ps[0]
        full[p].append(tuple(map(tuple, aliyot(it['fullkriyah']))))
        ta = aliyot(it['triennial'])
        tri[p][y].append(tuple(map(tuple, ta)))
        dated[p].append([date] + ta)

def mode(lst): return collections.Counter(lst).most_common(1)[0][0] if lst else None
def bare(s): return s.split('|')[0].strip()

changed = collections.Counter()
for p, d in kr.items():
    haft = [e for e in d.get('f', []) if not re.match(r'^(\d+|maf)$', str(e[0]))]
    fm = mode(full.get(p, []))
    if fm:
        old = {e[0]: e[1] for e in d.get('f', [])}
        new_f = [[a, old[a] if a in old and bare(old[a]) == r else r] for a, r in fm]
        if [[a, bare(r)] for a, r in new_f] != [[e[0], bare(e[1])] for e in d.get('f', []) if re.match(r'^(\d+|maf)$', str(e[0]))]:
            changed['f'] += 1; changed['f:' + p] = 1
        d['f'] = new_f + haft
    wm = mode(wk.get(p, []))
    if wm:
        if list(wm) != d.get('w'): changed['w'] += 1; changed['w:' + p] = 1
        d['w'] = list(wm)
    if tri.get(p):
        d['ty'] = {str(y): [list(a) for a in mode(v)] for y, v in sorted(tri[p].items())}
        hf = haft[:1]
        d['t'] = [blk + [list(h) for h in hf] for blk in sorted(dated[p])]
    if td.get(p): d['td'] = dict(sorted(td[p].items()))

json.dump(kr, open(KR_PATH, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
cal.sort(key=lambda c: c['d'])
json.dump(cal, open(os.path.join(ROOT, 'data/calendar.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('Shabatot en calendario:', len(cal), '| combinados:', sum(1 for c in cal if len(c['p']) > 1))
print('f cambiadas:', changed['f'], sorted(k[2:] for k in changed if k.startswith('f:')))
print('w cambiadas:', changed['w'], sorted(k[2:] for k in changed if k.startswith('w:')))
print('sin trienal por año:', sorted(p for p in kr if 'ty' not in kr[p]))
print('años trienales faltantes:', {p: sorted(set('123') - set(kr[p]['ty'])) for p in kr if 'ty' in kr[p] and len(kr[p]['ty']) < 3})
