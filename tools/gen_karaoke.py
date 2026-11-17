"""Genera karaoke/words/<audio>.json: tiempos por palabra de cada grabación de aliyá.

Uso:  python3 tools/gen_karaoke.py <scribe_words.json> <parasha_id> <map_key>
  ej: python3 tools/gen_karaoke.py /tmp/w.json bereshit shabat_1_1

scribe_words.json = salida de ElevenLabs Scribe (eleven_scribe_v1) sobre el audio.
Alinea las palabras transcriptas con el texto masorético (data/torah/<parasha>.json)
por esqueleto consonántico (Needleman-Wunsch); las palabras no reconocidas se interpolan.
Palabras unidas por maqaf cuentan como una sola (igual que los spans del lector).
"""
import difflib, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LET = re.compile('[א-ת]')
FINAL = str.maketrans('ךםןףץ', 'כמנפצ')


def skel(w):
    s = ''.join(c for c in w if LET.match(c)).translate(FINAL)
    return s.replace('ו', '').replace('י', '')


def sim(a, b):
    return difflib.SequenceMatcher(None, a, b).ratio() if a and b else 0.0


def audio_map():
    line = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read().split('\n')
    src = next(l for l in line if l.startswith('const AUDIO_ALIYOT_MAP'))
    return json.loads(src[src.index('{'):src.rindex('}') + 1])


def verses_for(parasha, e):
    fp = os.path.join(ROOT, 'data/torah', parasha + '.json')
    if not os.path.exists(fp):  # p.ej. acharei_mot → achareimot.json
        fp = os.path.join(ROOT, 'data/torah', parasha.replace('_', '') + '.json')
    d = json.load(open(fp, encoding='utf-8'))
    dic, out, seen = d['dictionary'], [], set()
    lo, hi = (e['ch_s'], e['v_s']), (e['ch_e'], e['v_e'])
    for al in d['aliyot']:
        for ref, idx in zip(al.get('refs', []), al.get('verses', [])):
            m = re.search(r'(\d+):(\d+)\s*$', ref)
            cv = (int(m.group(1)), int(m.group(2)))
            if lo <= cv <= hi and cv not in seen:
                seen.add(cv)
                words = [dic[str(i)] if not isinstance(i, str) else i for i in idx]
                out.append(('%d:%d' % cv, words))
    return sorted(out, key=lambda v: tuple(map(int, v[0].split(':'))))


def scribe_tokens(words):
    out = []
    for w in words:
        if w.get('type', 'word') != 'word':
            continue
        parts = [p for p in re.split('[-־ ]', w['text']) if LET.search(p)]
        if not parts:
            continue
        L = [len(skel(p)) + 1 for p in parts]; tot = sum(L); t = w['start']
        for p, l in zip(parts, L):
            d = (w['end'] - w['start']) * l / tot
            out.append({'s': skel(p), 'start': t, 'end': t + d}); t += d
    return out


def align(A, B, G=-0.4):
    n, m = len(A), len(B)
    D = [[0.0] * (m + 1) for _ in range(n + 1)]; P = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n + 1): D[i][0] = i * G; P[i][0] = 1
    for j in range(m + 1): D[0][j] = j * G; P[0][j] = 2
    S = [[sim(a, b) * 2 - 1 for b in B] for a in A]
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            o = (D[i-1][j-1] + S[i-1][j-1], D[i-1][j] + G, D[i][j-1] + G)
            k = max(range(3), key=o.__getitem__); D[i][j] = o[k]; P[i][j] = k
    i, j, pairs = n, m, {}
    while i > 0 and j > 0:
        k = P[i][j]
        if k == 0:
            if S[i-1][j-1] > 0.2: pairs[i-1] = j - 1
            i -= 1; j -= 1
        elif k == 1: i -= 1
        else: j -= 1
    return pairs


def build(scribe_path, parasha, key):
    e = audio_map()[parasha][key]
    verses = verses_for(parasha, e)
    # subtokens (maqaf separado) para alinear; luego se reagrupan por palabra visible
    sub, owner = [], []
    for vi, (_, words) in enumerate(verses):
        for wi, w in enumerate(words):
            for p in w.replace('־', ' ').split():
                sub.append(skel(p)); owner.append((vi, wi))
    sc = scribe_tokens(json.load(open(scribe_path, encoding='utf-8'))['words'])
    pairs = align(sub, [s['s'] for s in sc])
    times = {}
    for si, j in pairs.items():
        o = owner[si]; s, t = sc[j]['start'], sc[j]['end']
        a = times.get(o); times[o] = (min(a[0], s), max(a[1], t)) if a else (s, t)
    flat = [(vi, wi) for vi, (_, ws) in enumerate(verses) for wi in range(len(ws))]
    known = [k for k, o in enumerate(flat) if o in times]
    if len(known) < 2:
        raise SystemExit('alineación fallida')
    res = []
    for k, o in enumerate(flat):
        if o in times:
            res.append(times[o]); continue
        p = max([x for x in known if x < k], default=None); q = min([x for x in known if x > k], default=None)
        if p is None: s0, s1, span = 0.0, times[flat[q]][0], q
        elif q is None: s0, s1, span = times[flat[p]][1], times[flat[p]][1] + 0.6 * (len(flat) - p), len(flat) - p
        else: s0, s1, span = times[flat[p]][1], times[flat[q]][0], q - p
        off = k - (p if p is not None else -1)
        a = s0 + (s1 - s0) * (off - 1) / span; b = s0 + (s1 - s0) * off / span
        res.append((a, b))
    out, k = [], 0
    for ref, ws in verses:
        out.append({'ref': ref, 'w': [[round(res[k + i][0], 2), round(res[k + i][1], 2)] for i in range(len(ws))]})
        k += len(ws)
    cov = round(len(known) / len(flat), 3)
    name = os.path.splitext(os.path.basename(e['audio']))[0]
    doc = {'audio': e['audio'], 'reading': e['reading'], 'coverage': cov, 'verses': out}
    os.makedirs(os.path.join(ROOT, 'karaoke/words'), exist_ok=True)
    json.dump(doc, open(os.path.join(ROOT, 'karaoke/words', name + '.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, separators=(',', ':'))
    print('%-28s palabras %3d  alineadas %5.1f%%' % (name, len(flat), cov * 100))
    return cov


if __name__ == '__main__':
    build(*sys.argv[1:4])
