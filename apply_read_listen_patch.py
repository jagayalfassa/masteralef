#!/usr/bin/env python3
"""
Patch: modo "Leer + Escuchar" a nivel versículo para AlefMaster.

USO:
  1. Poné este script en la misma carpeta que tu index.html actual.
  2. Editá TARGET_FILE abajo si el nombre/ruta difiere.
  3. Ejecutá: python3 apply_read_listen_patch.py
  4. El script:
     - hace backup en backups/index_YYYYMMDD_HHMMSS.html
     - aplica 6 reemplazos aditivos (no borra nada del karaoke existente)
     - valida el resultado con `node --check`
     - si algo falla, NO sobreescribe tu archivo original

Cambios (todos aditivos, gateados por READ_LISTEN_MODE):
  1. HTML: nuevo bloque <audio> nativo en la vista parasha-read
  2. JS:   constante READ_LISTEN_MODE + objeto VERSE_TIMINGS (vacío + 1 ejemplo comentado)
  3. JS:   nueva función renderReadListenAudio(parashaId, aliyah)
  4. JS:   contador de verseIdx en renderParashaRead (versesEl.innerHTML = '')
  5. JS:   dataset.verseIdx + id en cada verseCard
  6. JS:   invocación de renderReadListenAudio al final de renderParashaRead
  + CSS:  clase .verse-active (resaltado con variables --sand-*/--gold-*)

Comportamiento acordado:
  - aliyah=null ("Todas las aliyot"): NO se muestra el reproductor Read+Listen
    (el audio es por aliyá individual). Solo texto, como hoy.
  - Sin audio disponible para la aliyá: reproductor oculto, solo texto. Sin errores.
  - Sin timestamps en VERSE_TIMINGS: se muestra el audio nativo, SIN resaltado
    (degradación silenciosa).
  - El karaoke viejo (botón "Leer con guía") queda visible como opción secundaria,
    sin tocar su HTML/CSS/JS existente.
"""

import re
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path

TARGET_FILE = "index.html"  # <-- ajustá si tu archivo tiene otro nombre/ruta

def fail(msg):
    print(f"\n❌ ERROR: {msg}")
    sys.exit(1)

def main():
    target = Path(TARGET_FILE)
    if not target.exists():
        fail(f"No encuentro {TARGET_FILE} en esta carpeta. Ajustá TARGET_FILE en el script.")

    content = target.read_text(encoding="utf-8")
    original_content = content

    replacements = []  # (label, old, new)

    # ─────────────────────────────────────────────────────────────
    # 1) HTML — nuevo bloque de audio nativo, después de karaoke-progress-wrap
    # ─────────────────────────────────────────────────────────────
    old_html = '''    <!-- Progreso karaoke -->
    <div id="karaoke-progress-wrap" style="display:none;margin-top:8px;">
      <div style="height:3px;background:var(--sand-200);border-radius:99px;overflow:hidden;">
        <div id="karaoke-progress-fill" style="height:100%;width:0%;background:var(--navy-700);
          border-radius:99px;transition:width .3s ease;"></div>
      </div>
      <div id="karaoke-current-word" style="font-family:'Noto Serif Hebrew',serif;
        font-size:1.6rem;font-weight:900;color:var(--navy-800);text-align:center;
        margin-top:6px;direction:rtl;min-height:2rem;"></div>
    </div>
  </div>
  <div id="parasha-aliyah-tabs" style="display:flex;gap:6px;overflow-x:auto;padding:8px 18px;'''

    new_html = '''    <!-- Progreso karaoke -->
    <div id="karaoke-progress-wrap" style="display:none;margin-top:8px;">
      <div style="height:3px;background:var(--sand-200);border-radius:99px;overflow:hidden;">
        <div id="karaoke-progress-fill" style="height:100%;width:0%;background:var(--navy-700);
          border-radius:99px;transition:width .3s ease;"></div>
      </div>
      <div id="karaoke-current-word" style="font-family:'Noto Serif Hebrew',serif;
        font-size:1.6rem;font-weight:900;color:var(--navy-800);text-align:center;
        margin-top:6px;direction:rtl;min-height:2rem;"></div>
    </div>
    <!-- Read + Listen: audio nativo a nivel versículo (READ_LISTEN_MODE) -->
    <div id="read-listen-wrap" style="display:none;margin-top:8px;">
      <audio id="read-listen-audio" controls style="width:100%;height:36px;"></audio>
    </div>
  </div>
  <div id="parasha-aliyah-tabs" style="display:flex;gap:6px;overflow-x:auto;padding:8px 18px;'''

    replacements.append(("HTML: bloque read-listen-wrap", old_html, new_html))

    # ─────────────────────────────────────────────────────────────
    # 2) JS — constante READ_LISTEN_MODE + VERSE_TIMINGS + CSS .verse-active
    #    Se inserta justo antes de "function getKaraokeMs(){"
    # ─────────────────────────────────────────────────────────────
    old_const = '''function getKaraokeMs(){
  return KARAOKE_SPEEDS[_karaokeSpeedIdx].ms;
}'''

    new_const = '''// ╔═══════════════════════════════════════════════════════════════╗
// ║  READ + LISTEN — modo verso-a-verso (reemplaza karaoke palabra ║
// ║  por palabra como modo principal; karaoke queda como opción    ║
// ║  secundaria, código intacto).                                 ║
// ╚═══════════════════════════════════════════════════════════════╝
const READ_LISTEN_MODE = true;

// VERSE_TIMINGS[parashaId][aliyah] = [{ verse: 1, start: 0.0 }, ...]
// "verse" = posición 1-based del versículo dentro de ESA aliyá (no global).
// "start" = segundos desde el inicio del mp3 de esa aliyá.
// Completar a mano por aliyá. Si una aliyá no tiene entrada, el audio
// se muestra igual pero SIN resaltado (degradación silenciosa).
const VERSE_TIMINGS = {
  // Ejemplo (completar y descomentar):
  // "bereshit": {
  //   "1": [
  //     { verse: 1, start: 0.0 },
  //     { verse: 2, start: 4.8 },
  //     { verse: 3, start: 9.6 }
  //   ]
  // }
};

// Inyecta el CSS de resaltado una sola vez (usa variables --sand-*/--gold-* existentes)
(function _injectReadListenStyles(){
  if(document.getElementById('read-listen-style')) return;
  const style = document.createElement('style');
  style.id = 'read-listen-style';
  style.textContent = '.verse-active{border-color:var(--gold-500) !important;' +
    'background:rgba(196,150,60,0.08) !important;' +
    'box-shadow:0 2px 8px rgba(196,150,60,0.18) !important;}';
  document.head.appendChild(style);
})();

// ── READ + LISTEN: setup del audio nativo + resaltado por versículo ──
// Reutiliza getAliyahAudio() existente. No duplica lógica de karaoke.
function renderReadListenAudio(parashaId, aliyah){
  const wrap    = document.getElementById('read-listen-wrap');
  const audioEl = document.getElementById('read-listen-audio');
  if(!wrap || !audioEl) return;

  // Limpiar resaltado y listener previos (evita duplicados en re-render)
  if(audioEl._readListenHandler){
    audioEl.removeEventListener('timeupdate', audioEl._readListenHandler);
    audioEl._readListenHandler = null;
  }
  document.querySelectorAll('#read-verses [data-verse-idx].verse-active')
    .forEach(function(el){ el.classList.remove('verse-active'); });

  // Solo aplica con una aliyá específica seleccionada (el audio es por aliyá)
  if(!aliyah){ wrap.style.display = 'none'; return; }

  const trienalYear = parashaState.trienalYear || 1;
  const audioUrl = getAliyahAudio(parashaId, aliyah, trienalYear);
  if(!audioUrl){ wrap.style.display = 'none'; return; }

  wrap.style.display = 'block';
  if(audioEl.dataset.src !== audioUrl){
    audioEl.pause();
    audioEl.src = audioUrl;
    audioEl.dataset.src = audioUrl;
  }

  const pMap    = VERSE_TIMINGS[parashaId];
  const timings = pMap ? pMap[String(aliyah)] : null;
  if(!timings || !timings.length) return; // sin timestamps → audio sin resaltado

  const sorted = timings.slice().sort(function(a,b){ return a.start - b.start; });

  const handler = function(){
    const t = audioEl.currentTime;
    let activeVerse = null;
    for(let i = 0; i < sorted.length; i++){
      if(t >= sorted[i].start) activeVerse = sorted[i].verse; else break;
    }
    document.querySelectorAll('#read-verses [data-verse-idx].verse-active').forEach(function(el){
      if(String(el.dataset.verseIdx) !== String(activeVerse)) el.classList.remove('verse-active');
    });
    if(activeVerse != null){
      const card = document.querySelector('#read-verses [data-verse-idx="' + activeVerse + '"]');
      if(card && !card.classList.contains('verse-active')) card.classList.add('verse-active');
    }
  };
  audioEl._readListenHandler = handler;
  audioEl.addEventListener('timeupdate', handler);

  // Click-to-seek en cada verso (solo tiene sentido si hay timestamps)
  document.querySelectorAll('#read-verses [data-verse-idx]').forEach(function(card){
    if(card._readListenSeek) card.removeEventListener('click', card._readListenSeek);
    const seek = function(){
      const v = card.dataset.verseIdx;
      const entry = sorted.find(function(s){ return String(s.verse) === String(v); });
      if(entry) audioEl.currentTime = entry.start;
    };
    card._readListenSeek = seek;
    card.style.cursor = 'pointer';
    card.addEventListener('click', seek);
  });
}

function getKaraokeMs(){
  return KARAOKE_SPEEDS[_karaokeSpeedIdx].ms;
}'''

    replacements.append(("JS: constantes + renderReadListenAudio", old_const, new_const))

    # ─────────────────────────────────────────────────────────────
    # 3) JS — contador de verseIdx (reset por render)
    # ─────────────────────────────────────────────────────────────
    old_counter = '''  versesEl.innerHTML = '';

  const krAliyot = buildAliyotFromKriyah(parashaId);'''

    new_counter = '''  versesEl.innerHTML = '';
  let _rlVerseCounter = 0; // Read+Listen: índice 1-based del versículo dentro de la aliyá

  const krAliyot = buildAliyotFromKriyah(parashaId);'''

    replacements.append(("JS: contador _rlVerseCounter", old_counter, new_counter))

    # ─────────────────────────────────────────────────────────────
    # 4) JS — dataset.verseIdx + id en cada verseCard
    # ─────────────────────────────────────────────────────────────
    old_card = '''      const verseCard = document.createElement('div');
      verseCard.style.cssText = [
        'background:white;border:1.5px solid var(--sand-300);border-radius:14px;padding:14px 16px',
        'box-shadow:0 2px 8px rgba(13,31,53,0.04)'
      ].join(';');'''

    new_card = '''      const verseCard = document.createElement('div');
      verseCard.style.cssText = [
        'background:white;border:1.5px solid var(--sand-300);border-radius:14px;padding:14px 16px',
        'box-shadow:0 2px 8px rgba(13,31,53,0.04)'
      ].join(';');
      _rlVerseCounter++;
      verseCard.dataset.verseIdx = _rlVerseCounter;
      verseCard.id = 'verse-card-' + _rlVerseCounter;'''

    replacements.append(("JS: dataset.verseIdx en verseCard", old_card, new_card))

    # ─────────────────────────────────────────────────────────────
    # 5) JS — invocar renderReadListenAudio al final de renderParashaRead
    # ─────────────────────────────────────────────────────────────
    old_end = '''  // Resetear estado del karaoke al abrir nueva lectura
  stopKaraoke();
}'''

    new_end = '''  // Resetear estado del karaoke al abrir nueva lectura
  stopKaraoke();

  // Read + Listen: audio nativo a nivel versículo (no afecta karaoke arriba)
  if(typeof READ_LISTEN_MODE !== 'undefined' && READ_LISTEN_MODE){
    renderReadListenAudio(parashaId, aliyah);
  }
}'''

    replacements.append(("JS: invocación renderReadListenAudio", old_end, new_end))

    # ─────────────────────────────────────────────────────────────
    # Aplicar reemplazos, validando unicidad
    # ─────────────────────────────────────────────────────────────
    for label, old, new in replacements:
        count = content.count(old)
        if count == 0:
            fail(f"No encontré el bloque para '{label}'. El archivo puede haber cambiado respecto al analizado.")
        if count > 1:
            fail(f"El bloque para '{label}' aparece {count} veces (debería ser único). Abortando para evitar reemplazos incorrectos.")
        content = content.replace(old, new)
        print(f"✅ Aplicado: {label}")

    if content == original_content:
        fail("No se aplicó ningún cambio (inesperado).")

    # ─────────────────────────────────────────────────────────────
    # Backup + escritura
    # ─────────────────────────────────────────────────────────────
    backups_dir = Path("backups")
    backups_dir.mkdir(exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = backups_dir / f"index_{stamp}.html"
    shutil.copy2(target, backup_path)
    print(f"📦 Backup guardado en {backup_path}")

    tmp_path = Path(f"{TARGET_FILE}.tmp_patch")
    tmp_path.write_text(content, encoding="utf-8")

    # ─────────────────────────────────────────────────────────────
    # Validación: extraer <script> y correr node --check
    # ─────────────────────────────────────────────────────────────
    match = re.search(r'<script>\n// ── Error handling', content)
    if not match:
        print("⚠️  No encontré el ancla de extracción de JS ('// ── Error handling'). "
              "Validando el archivo completo como fallback (menos preciso).")
        js_start = content.find('<script>')
    else:
        js_start = match.start()

    script_end = content.find('</script>', js_start)
    if script_end == -1:
        fail("No pude ubicar el cierre </script> del bloque principal.")
    js_code = content[js_start:script_end]
    js_code = re.sub(r'^\s*<script[^>]*>', '', js_code)

    js_tmp_path = Path("_read_listen_patch_check.js")
    js_tmp_path.write_text(js_code, encoding="utf-8")

    try:
        result = subprocess.run(
            ["node", "--check", str(js_tmp_path)],
            capture_output=True, text=True, timeout=30
        )
    except FileNotFoundError:
        tmp_path.unlink(missing_ok=True)
        js_tmp_path.unlink(missing_ok=True)
        fail("No encontré 'node' en este entorno para validar. Instalá Node.js o validá manualmente antes de aplicar.")

    js_tmp_path.unlink(missing_ok=True)

    if result.returncode != 0:
        tmp_path.unlink(missing_ok=True)
        fail(f"node --check falló, el archivo original NO fue modificado:\n{result.stderr}")

    print("✅ node --check: sintaxis válida")

    # Todo OK: reemplazar el archivo real
    tmp_path.replace(target)
    print(f"\n🎉 Patch aplicado con éxito sobre {TARGET_FILE}")
    print("   Recordá: READ_LISTEN_MODE = true está activo por defecto.")
    print("   Completá VERSE_TIMINGS por parashá/aliyá para habilitar el resaltado.")

if __name__ == "__main__":
    main()
