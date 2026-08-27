import re, json, os

SRC = 'index.html'
lines = open(SRC, encoding='utf-8').read().split('\n')
N = len(lines)

# --- 1. lineas gigantes (data blobs) ---
big = [(i+1, len(l)) for i, l in enumerate(lines) if len(l) > 20000]
big_names = []
for ln, sz in big:
    m = re.match(r'\s*(?:const|let|var)\s+([A-Za-z_0-9]+)', lines[ln-1])
    big_names.append((ln, sz, m.group(1) if m else '(anon)'))

# --- 2. anchors ---
anchors = []   # (line, indent_level, text)
for i, l in enumerate(lines):
    m = re.match(r'^(\s*)//\s*[─=━-]{2,}\s*(.+?)\s*[─=━-]{2,}\s*$', l)
    if m:
        anchors.append((i+1, len(m.group(1)), m.group(2).strip()))

top = [a for a in anchors if a[1] == 0]
sub = [a for a in anchors if a[1] > 0]

# --- 3. funciones ---
funcs = []
for i, l in enumerate(lines):
    m = re.match(r'^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)', l)
    if m:
        funcs.append((i+1, m.group(1)))

# --- 4. views HTML ---
views = []
for i, l in enumerate(lines):
    for m in re.finditer(r'id="(view-[A-Za-z0-9_-]+)"', l):
        views.append((i+1, m.group(1)))

# --- 5. constantes top-level (no gigantes) ---
consts = []
for i, l in enumerate(lines):
    if len(l) > 3000: continue
    m = re.match(r'^const\s+([A-Z][A-Z_0-9]{2,})\s*=\s*(.{0,60})', l)
    if m:
        consts.append((i+1, m.group(1), m.group(2).rstrip()))

# --- rangos de secciones top ---
sections = []
for idx, (ln, _, name) in enumerate(top):
    end = top[idx+1][0]-1 if idx+1 < len(top) else N
    kids = [s for s in sub if ln < s[0] < end]
    fns  = [f for f in funcs if ln < f[0] < end]
    sections.append({'line': ln, 'end': end, 'name': name, 'subs': kids, 'funcs': fns})

json.dump({'N':N,'big':big_names,'sections':[{k:v for k,v in s.items()} for s in sections],
           'views':views,'consts':consts,'nfuncs':len(funcs)},
          open('mapdata.json','w'), ensure_ascii=False)
print('lineas:', N, '| secciones top:', len(top), '| subs:', len(sub), '| funcs:', len(funcs), '| views:', len(views), '| consts:', len(consts))
print('blobs gigantes:', [(n, ln, f'{sz//1024}KB') for ln, sz, n in big_names])
