# AlefMaster

PWA educativa para aprender a leer hebreo con nikudot. Público: alumnos de Bar/Bat Mitzvá (11–14) y adultos sin conocimientos previos, en comunidades hispanohablantes (Argentina, México, España, USA). Posicionamiento B2B (escuelas y sinagogas).

**Ventaja competitiva:** fecha de ceremonia real + parashá real + audio de jazán real. Ningún competidor tiene esto.

---

## Método pedagógico

- Basado en **sonidos**, no en nombres de letras
- Nikudot desde el inicio
- Progresión: letras → sílabas → palabras → lectura real (Tefilá / Torá)

Reglas de contenido que ya se decidieron y no se rediscuten:

- **Shin (שׁ) es la primera letra** del onboarding — Alef es muda
- **Iud (י) suena "i"**, nunca Y consonántica
- Ejemplos de letras sofit muestran la letra resaltada **al final** de la palabra
- Shva se muestra con `:` (visualmente idéntico a U+05B0, sin problemas de posicionamiento)

---

## Stack y archivos

| | |
|---|---|
| Arquitectura | Monolito: `index.html` (19.768 líneas / 1,27 MB) |
| Frontend | HTML + CSS + JS vanilla. **Sin frameworks.** |
| Backend | Supabase — proyecto `gxofwhomnjjffhmoffgl` |
| Deploy | GitHub Pages, repo `jagayalfassa/masteralef`, branch `main` |
| Módulos aparte | `js/teacher.js` (86 KB), `sw.js` |
| Datos Torá | 54 JSON en `data/torah/` + `kriyah_data.json` |
| Observabilidad | Sentry vía CDN (sin npm) |

**Bajar la versión viva** (no usar `raw.githubusercontent.com`, devuelve 404):

```
https://codeload.github.com/jagayalfassa/masteralef/tar.gz/refs/heads/main
```

**Navegar el código:** ver `MAP.md`. Nunca leer `index.html` entero (~300k tokens). Nunca leer las líneas **2115 / 2120 / 2122** (blobs de datos, 306 KB entre las tres).

---

## Módulos

| Módulo | Dónde |
|---|---|
| Sistema educativo (22 series A1–E1+, SRS, dificultad) | `ALL_DATA` (2115), secciones SRS y difficulty en MAP |
| Coach inteligente (reglas + analytics local, sin IA externa) | ver MAP |
| Gamificación (shekels, rachas, logros, tienda, misiones, ranking) | ver MAP |
| Torá (parashot, aliyot, ciclo trienal, weekday, karaoke, autograbación) | ver MAP |
| Panel docente (multi-clase, co-docentes, mensajería, asignaciones) | `js/teacher.js` |
| Onboarding V2 + coachmarks Rashi | ~19269 en adelante |

**Feature flags** — patrón: constante top-level que apaga la feature entera sin tocar nada más. Estado actual (todos activos):

| Flag | Línea |
|---|---|
| `FRASEO_MODE` | 4768 |
| `BM_PATH_NODES` | 5995 (local, dentro de función) |
| `READ_LISTEN_MODE` | 7069 |
| `SELF_RECORD` | 7073 |
| `RASHI_GUIDES_MODE` | 19271 |
| `LESSON_INTERSTITIAL_MODE` | 19674 |

Toda feature nueva se agrega con este patrón.

---

## Contratos que se rompen fácil

Errores que ya se cometieron. Verificados en la versión viva:

- **`save()` (2163)** — nunca `saveProgress()`, que pisa IndexedDB mal
- **`trackError(wordIdx)` (2774)** es un **contador SRS de errores por palabra**, NO un logger. Para loguear: `dbg()` (2096) + `trackEvent()` (15851)
- **`heb_streak`** guarda un objeto `{last, count}`. Siempre leer con **`getStreak()` (2496)**, nunca el valor crudo como número
- **Claves de `ALL_DATA`**: `A1`, `A2`, `B1`… y MIX como `A2+B2`, `A2+B2+C1+D1+E1`. Nunca abreviar a `A+B`
- **`esc()` (2098)** para todo render de texto de usuario (XSS)
- Audio: **una sola fuente a la vez** (`stopAudio()`, 12766). Permiso de micrófono solo en el primer tap del usuario
- iOS Safari es requisito duro: `audio/mp4` prioritario con fallback `audio/webm`; velocidad con `preservesPitch` / `webkitPreservesPitch`
- Globales a reutilizar antes de crear nada: `showView()` (4679), `showToast()` (4706), `save()`, `esc()`, `dbg()`, `trackEvent()`
- Delegación de eventos, no handlers inline
- `sw.js`: subir `CACHE_VERSION` secuencialmente en cada deploy

---

## Supabase / RLS

Patrones que costaron sesiones de debug:

- **Nunca joins circulares en RLS.** El patrón que funciona: funciones `SECURITY DEFINER` en schema `private` (`private.is_class_teacher()`, `private.is_class_member()`) con `set search_path = ''` y grants explícitos a `anon` y `authenticated`
- **RLS con subquery sobre la misma tabla falla con `INSERT ... RETURNING`** — la fila recién insertada no es visible para el snapshot del subquery. Solución: evaluar la propiedad directo sobre la fila (`teacher_id = auth.uid()`)
- **Storage RLS:** `(storage.foldername(name))[1] = auth.uid()::text` para scope por usuario. Las políticas de docente usan subquery correlacionado sobre `profiles`, para evitar la referencia circular institutions↔profiles
- Las políticas **no tienen upsert** — hay que dropearlas explícitamente para recrearlas. Chequear `pg_policies` antes de aplicar una migración
- **Tests de fallo esperado en RLS: una llamada `execute_sql` por test.** Un multi-statement aborta toda la transacción en el primer error
- Simular RLS: `set local role authenticated` + `set_config('request.jwt.claims', ...)` dentro de `BEGIN/ROLLBACK`
- Si `execute_sql` da timeout, usar `apply_migration` (rutea distinto). Una migración = una transacción, con `name` en snake_case

---

## Disciplina de cambios

Los cambios se entregan como **scripts de patch en Python** con reemplazo de strings. Todo script debe:

1. Afirmar que cada `old_str` matchea **exactamente una vez**; si no, abortar
2. Hacer backup con timestamp en `backups/`
3. Validar el JS extraído con `node --check`

**Ancla de extracción del JS:**

```python
m = re.search(r'<script>\n// ── Error handling', content)
start = content.index('\n', m.start()) + 1
end   = content.find('</script>', start)   # find, NUNCA rindex
```

Los cambios son **100% aditivos y quirúrgicos**. Se reutilizan los globales existentes.

**Restricción de entorno:** la Mac corre macOS 10.13.6 — demasiado vieja para Homebrew o Node moderno. Cuando `node --check` no está disponible, se valida en la consola de DevTools del navegador. No hay git local: el deploy se hace subiendo por la interfaz web de GitHub.

---

## Pipeline de datos de Torá

1. Reparar con `repair_torah.py`
2. Bajar faltantes con `fetch_missing.py`
3. Validar → tiene que dar 54/54 PASS

- Estructura de cada JSON: `parasha`, `id`, `book`, `aliyot[7]`, `dictionary`
- Fuente: Sefaria, edición MAM. **Requiere `context=0&pad=0`** o devuelve capítulos enteros
- **Nunca reparar automáticamente la fragmentación a nivel de carácter** en el texto de Torá
- Precisión del texto es crítica: cualquier fix tiene que funcionar para las 54 parashot, no para una

---

## UX

Lo que no es obvio y por eso se escribe:

- El usuario tiene que saber qué hacer en **menos de 2 segundos**. Siempre un CTA claro: Empezar / Continuar / Practicar
- **El coach no satura.** Nada de banners múltiples ni mensajes fuera de contexto. Nunca felicitar cuando el alumno falla
- Progreso siempre visible (barras, niveles, misiones)
- Mobile-first: botones grandes, tap fácil
- Feedback inmediato: visual, más sonido/vibración opcionales
- **Las features nuevas se integran con los patrones visuales existentes** — no se agregan al lado ni los reemplazan

---

## Estado actual

**Pendiente:**

- Módulo Torá incompleto: faltan año 1 / año 2 / año 3 del ciclo trienal completos, y weekday con las 54 parashot
- Ajuste fino del coach
- Performance en mobile
- Rediseño del onboarding guiado ("Rashi te muestra") — 5 coachmarks secuenciales preparados

**Deuda técnica identificada:** `AUDIO_ALIYOT_MAP` (228 KB) y `DATE_PARASHA_MAP` (57 KB) están embebidos en `index.html`. Moverlos a `data/*.json` con fetch bajaría el archivo de 1,27 MB a ~980 KB y mejoraría el arranque en mobile.

**Monetización:** todavía sin activar. No hay flag de pricing en el código.

**Outreach:** contacto con docentes de otras instituciones para beta testing. Tono de los mensajes: castellano rioplatense, informal, tipo WhatsApp, breve.
