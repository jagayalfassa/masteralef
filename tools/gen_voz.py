#!/usr/bin/env python3
"""
gen_voz.py — genera los audios de voz (ElevenLabs) para coach, Rashi y tutoriales.

Se corre OFFLINE en tu máquina. La API key nunca entra al repo ni a la app.

USO (desde la raíz del repo, donde está index.html):
  export ELEVEN_API_KEY=xxxxx
  python3 tools/gen_voz.py --dry-run     # lista los textos, no llama a la API
  python3 tools/gen_voz.py               # genera solo los que faltan
  python3 tools/gen_voz.py --force       # regenera todo

Qué hace:
  1. Extrae del index.html: COACH_MSGS (menos diff_up/diff_down, que van por toast),
     RASHI_GUIDES (menos 'demo') y TUTORIAL_TEXTS (título + cuerpo).
  2. Por cada texto calcula FNV-1a 32 bits sobre el texto EXACTO que usa la app
     (mismo algoritmo que _voiceHash() en index.html) → audios/voz/<hash>.mp3
  3. Limpia emojis/símbolos solo para lo que se manda a TTS (no cambia el hash).
  4. Escribe audios/voz/manifest.json con los hashes disponibles.

Si editás un texto en index.html y no regenerás, ese mensaje queda sin voz
(nunca suena un audio que no coincide con lo escrito).

Requiere: Python 3.8+ y node (para leer los objetos JS tal cual).
"""

import argparse
import json
import os
import re
import subprocess
import sys
import time
import unicodedata
import urllib.error
import urllib.request
from pathlib import Path

INDEX = Path('index.html')
OUT_DIR = Path('audios/voz')
DEFAULT_VOICE_ID = '6Jq3XJ9putvRGLuqYYRX'   # clon Professional de Jagay
MODEL_ID = 'eleven_multilingual_v2'
OUTPUT_FORMAT = 'mp3_44100_64'   # ~8 KB/s, sobra para voz
VOICE_SETTINGS = {
    'stability': 0.5,
    'similarity_boost': 0.85,
    'style': 0.15,
    'use_speaker_boost': True,
}
COACH_SKIP = {'diff_up', 'diff_down'}
RASHI_SKIP = {'demo'}


# ── Hash: tiene que ser idéntico a _voiceHash() del index.html ────────────
def voice_hash(text):
    h = 0x811c9dc5
    b = text.encode('utf-16-le')
    for i in range(0, len(b), 2):
        h ^= b[i] | (b[i + 1] << 8)
        h = (h * 0x01000193) & 0xFFFFFFFF
    return format(h, '08x')


# ── Extraer un literal de objeto JS por brace-matching (respeta strings) ──
def extract_object(src, decl):
    start = src.find(decl)
    if start < 0 or src.find(decl, start + 1) >= 0:
        sys.exit('No encontré (o hay más de uno) "' + decl + '" en index.html')
    i = src.index('{', start)
    depth, quote, esc = 0, None, False
    for j in range(i, len(src)):
        c = src[j]
        if quote:
            if esc:
                esc = False
            elif c == '\\':
                esc = True
            elif c == quote:
                quote = None
            continue
        if c in ('"', "'", '`'):
            quote = c
        elif c == '{':
            depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0:
                return src[i:j + 1]
    sys.exit('Objeto sin cerrar: ' + decl)


def js_eval(obj_src):
    code = ("let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{"
            "process.stdout.write(JSON.stringify(eval('('+s+')')))})")
    r = subprocess.run(['node', '-e', code], input=obj_src.encode('utf-8'),
                       capture_output=True)
    if r.returncode != 0:
        sys.exit('node no pudo evaluar el objeto:\n' + r.stderr.decode('utf-8'))
    return json.loads(r.stdout.decode('utf-8'))


def collect_texts(src):
    items = []  # (origen, texto exacto)
    coach = js_eval(extract_object(src, 'const COACH_MSGS = {'))
    for k, msgs in coach.items():
        if k in COACH_SKIP:
            continue
        for m in msgs:
            items.append(('coach.' + k, m))
    rashi = js_eval(extract_object(src, 'const RASHI_GUIDES = {'))
    for k, g in rashi.items():
        if k in RASHI_SKIP or not g.get('text'):
            continue
        items.append(('rashi.' + k, g['text']))
    tuts = js_eval(extract_object(src, 'const TUTORIAL_TEXTS = {'))
    for k, t in tuts.items():
        # Debe coincidir con playVoice(t.title + ' ' + t.body) en showTutorialIfNeeded
        items.append(('tutorial.' + k, t['title'] + ' ' + t['body']))
    # dedupe por texto exacto
    seen, out = set(), []
    for origin, text in items:
        text = text.strip()
        if text and text not in seen:
            seen.add(text)
            out.append((origin, text))
    return out


# ── Texto que se manda a TTS: sin emojis ni flechas ───────────────────────
def tts_clean(text):
    out = []
    for ch in text:
        cat = unicodedata.category(ch)
        if ch in ('️', '‍'):
            continue
        if cat in ('So', 'Sk', 'Cs'):
            out.append('\x00')  # marcador de emoji
            continue
        out.append(ch)
    t = ''.join(out)
    # Emoji entre dos frases ("Soy Rashi 👋 Si te...") → pausa con punto
    t = re.sub(r'(?<=[^\s.!?,:;\x00])\s*\x00+\s*(?=[A-ZÁÉÍÓÚÑ¿¡])', '. ', t)
    t = t.replace('\x00', '')
    t = t.replace(' — ', ', ').replace('—', ', ')
    t = re.sub(r'\s+', ' ', t).strip()
    return t


def synth(text, voice_id, api_key):
    url = ('https://api.elevenlabs.io/v1/text-to-speech/' + voice_id +
           '?output_format=' + OUTPUT_FORMAT)
    body = json.dumps({'text': text, 'model_id': MODEL_ID,
                       'voice_settings': VOICE_SETTINGS}).encode('utf-8')
    req = urllib.request.Request(url, data=body, method='POST', headers={
        'xi-api-key': api_key,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
    })
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < 3:
                time.sleep(5 * (attempt + 1))
                continue
            sys.exit('ElevenLabs HTTP ' + str(e.code) + ': ' +
                     e.read().decode('utf-8', 'replace')[:300])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--force', action='store_true')
    args = ap.parse_args()

    if not INDEX.exists():
        sys.exit('Corré esto desde la raíz del repo (no encuentro index.html)')
    src = INDEX.read_text(encoding='utf-8')
    items = collect_texts(src)

    if args.dry_run:
        for origin, text in items:
            print(voice_hash(text), origin.ljust(24), '|', tts_clean(text))
        print('\n' + str(len(items)) + ' textos')
        return

    api_key = os.environ.get('ELEVEN_API_KEY')
    voice_id = os.environ.get('ELEVEN_VOICE_ID') or DEFAULT_VOICE_ID
    if not api_key or not voice_id:
        sys.exit('Falta ELEVEN_API_KEY en el entorno')

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    hashes, made = [], 0
    for origin, text in items:
        h = voice_hash(text)
        hashes.append(h)
        f = OUT_DIR / (h + '.mp3')
        if f.exists() and not args.force:
            continue
        print('→', origin, '|', tts_clean(text))
        f.write_bytes(synth(tts_clean(text), voice_id, api_key))
        made += 1
        time.sleep(0.4)

    (OUT_DIR / 'manifest.json').write_text(
        json.dumps({'v': 1, 'files': sorted(set(hashes))}, ensure_ascii=False),
        encoding='utf-8')

    orphans = [p.name for p in OUT_DIR.glob('*.mp3') if p.stem not in set(hashes)]
    print('\nGenerados: ' + str(made) + ' · total en manifest: ' + str(len(set(hashes))))
    if orphans:
        print('Huérfanos (textos que ya no existen, podés borrarlos): ' + ', '.join(orphans))


if __name__ == '__main__':
    main()
