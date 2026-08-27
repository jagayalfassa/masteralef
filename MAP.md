# MAP.md — Mapa del monolito AlefMaster

> Índice de `index.html` (18.368 líneas / 1,2 MB). **Generado automáticamente desde los 263 anchors del archivo.**
> Regenerar tras cambios grandes con `genmap.py`.

---

## ⚠️ REGLA DE LECTURA (leer esto primero)

**Nunca leer `index.html` entero.** Son ~300k tokens: consume la ventana completa en una sola lectura.

Procedimiento obligatorio antes de tocar código:

1. Buscar la sección en el índice de abajo → obtener rango `L_inicio–L_fin`
2. Leer **solo** ese rango (`view` con `view_range`, o `sed -n 'X,Yp'`)
3. Si no aparece en el índice: `grep -n "nombreFuncion" index.html` y leer ±40 líneas

### 🚫 Líneas prohibidas (blobs de datos en una sola línea)

Estas 3 líneas concentran **306 KB** — el 26% del archivo. Leerlas revienta el contexto:

| Línea | Constante | Tamaño |
|---|---|---|
| **2041** | `ALL_DATA` | 21 KB |
| **2046** | `DATE_PARASHA_MAP` | 57 KB |
| **2048** | `AUDIO_ALIYOT_MAP` | 228 KB |

Para inspeccionarlas usar consultas puntuales, nunca lectura directa:

```bash
# ver solo las claves de ALL_DATA
sed -n '2041p' index.html | grep -o '"[A-Z0-9+]*":{"type"' 
# ver una parashá puntual de AUDIO_ALIYOT_MAP
sed -n '2048p' index.html | python3 -c "import sys,re,json; ..."
```

---

## Zonas macro

| Líneas | Contenido | Notas |
|---|---|---|
| 1–27 | `<head>`, meta, manifest | |
| 28–159 | `<style id="tw-minimal">` | utilidades tipo Tailwind |
| 160–169 | CDNs (confetti, supabase-js) | |
| 170–765 | `<style>` principal | ~600 líneas de CSS |
| 774–1983 | `<body>` — HTML de todas las views | ver índice de views |
| **1984–18361** | `<script>` — **todo el JS** | ver índice de secciones |
| 18365 | `<script src="./js/teacher.js">` | módulo aparte (1.287 líneas) |

**Ancla de extracción JS** (para scripts de patch en Python):

```python
m = re.search(r'<script>\n// ── Error handling', content)   # línea 1984
start = content.index('\n', m.start()) + 1
end   = content.find('</script>', start)   # find, NUNCA rindex
```

---

## Views HTML

| Línea | ID |
|---|---|
| 930 | `view-onboarding` |
| 1083 | `view-sidur` |
| 1143 | `view-tefilot` |
| 1152 | `view-tefila-read` |
| 1177 | `view-lectura` |
| 1266 | `view-shop` |
| 1288 | `view-welcome` |
| 1316 | `view-home` |
| 1323 | `view-intro` |
| 1355 | `view-letra-quiz` |
| 1375 | `view-vowel-present` |
| 1385 | `view-pre-training` |
| 1394 | `view-training` |
| 1427 | `view-game` |
| 1558 | `view-speed-read` |
| 1582 | `view-celebration` |
| 1648 | `view-parasha-select` |
| 1661 | `view-aliyah-select` |
| 1680 | `view-parasha-read` |
| 1742 | `view-teacher` |
| 1816 | `view-no-institution` |
| 1851 | `view-auth` |

---

## Índice de secciones JS

153 secciones top-level. Formato: `rango` · nombre · (nº de funciones).

| Rango | Sección | Fns |
|---|---|---|
| `1985–2018` | **Error handling global** |  |
| `2019–2117` | **DEBUG FLAG** | 4 |
| `2118–2391` | **SHEKELS SYSTEM** | 11 |
| `2392–2429` | **STREAK** | 2 |
| `2430–2479` | **STREAK FREEZE** | 4 |
| `2480–2624` | **FEEDBACK SENSORIAL (Sonidos + Vibracion)** | 14 |
| `2625–2697` | **SPACED REPETITION SYSTEM (SRS)** | 5 |
| `2698–2731` | **ERROR TRACKING** | 2 |
| `2732–2765` | **3 NIVELES DE DOMINIO POR PALABRA** | 3 |
| `2766–2887` | **DIFFICULTY SCORE** | 7 |
| `2888–2899` | **LESSON STATS** |  |
| `2900–3057` | **LOGROS / ACHIEVEMENTS** | 4 |
| `3058–3105` | **NEAR MISS EFFECT** | 2 |
| `3106–3139` | **PALABRA DOMINADA FEEDBACK** | 1 |
| `3140–3149` | **PERFECT LESSON BONUS** | 1 |
| `3150–3217` | **CONTADORES GLOBALES** | 4 |
| `3218–3281` | **PARASHA CATALOG** |  |
| `3282–3330` | **PARASHA PROGRESS STORAGE** | 6 |
| `3331–3339` | **DECODE VERSE** | 1 |
| `3340–3361` | **KNOWN LETTERS** | 1 |
| `3362–3372` | **CAN READ WORD** | 1 |
| `3373–3380` | **EXTRACT WORDS** | 1 |
| `3381–3388` | **FILTER BY LEARNED LETTERS** | 1 |
| `3389–3440` | **BUILD PARASHA INDEX** | 1 |
| `3441–3485` | **GET ALIYAH WORD POOL** | 1 |
| `3486–3503` | **CONVERT PARASHA WORDS TO EXERCISE FORMAT** | 1 |
| `3504–3532` | **LOAD PARASHA** | 1 |
| `3533–3808` | **PARASHA SESSION STATE** | 10 |
| `3809–4092` | **SEFARIA HYBRID LAYER** | 7 |
| `4093–4102` | **CARGAR DICCIONARIO DE TORÁ** | 1 |
| `4103–4331` | **LOOKUP FONÉTICA Y TRADUCCIÓN** | 3 |
| `4332–4343` | **IS PARASHA UNLOCKED** | 2 |
| `4344–4354` | **INVALIDATE PARASHA CACHE** | 1 |
| `4355–4424` | **START PARASHA SESSION** | 1 |
| `4425–4457` | **GET MIXED LESSON WORDS** | 1 |
| `4458–4688` | **PARASHA VERSE READER** | 20 |
| `4689–4878` | **CALCULAR PRÓXIMO PASO** | 5 |
| `4879–5004` | **UI: ACHIEVEMENTS DRAWER** | 4 |
| `5005–6511` | **UI: HOME** | 5 |
| `6512–6611` | **PERSONALIZACIÓN BAR MITZVÁ** | 1 |
| `6612–6709` | **KARAOKE TIMESTAMPS** | 3 |
| `6710–6712` | **KARAOKE: obtener audio de aliyá** |  |
| `6713–6925` | **AUDIO_ALIYOT_MAP helpers** | 4 |
| `6926–6946` | **READ + LISTEN: setup del audio nativo + resaltado por versículo** | 1 |
| `6947–7418` | **SELF RECORD: grabate y comparar (SELF_RECORD, PROMPT I2)** | 14 |
| `7419–7427` | **PREPARAR SPANS** | 1 |
| `7428–7606` | **START / PAUSE / RESUME** | 12 |
| `7607–7802` | **INICIAR MODO MI ALIYÁ** | 2 |
| `7803–8027` | **ALIYAH SELECT** | 2 |
| `8028–8349` | **PARASHA READ** | 1 |
| `8350–8462` | **PARASHA PRACTICE** | 1 |
| `8463–8606` | **TUTORIAL FIRST-RUN** | 4 |
| `8607–8649` | **GENERACIÓN DIARIA** | 1 |
| `8650–8669` | **LOAD / SAVE** | 2 |
| `8670–8715` | **TRACKING** | 1 |
| `8716–8741` | **BONUS ANIMATION** | 1 |
| `8742–8835` | **RENDER TARJETA HOME** | 1 |
| `8836–8875` | **REFRESH EN HOME** | 1 |
| `8876–8977` | **BUILD QUESTION POOL** | 1 |
| `8978–9035` | **START FLASH** | 3 |
| `9036–9097` | **MODAL UI** | 1 |
| `9098–9178` | **RENDER PREGUNTA** | 1 |
| `9179–9230` | **RESPUESTA** | 1 |
| `9231–9374` | **FINISH** | 1 |
| `9375–9399` | **COINS** | 6 |
| `9400–9416` | **INVENTORY** | 15 |
| `9417–9463` | **COMPRA & COFRES** | 3 |
| `9464–9483` | **AVATAR / PET RENDER HELPERS** | 3 |
| `9484–10110` | **TIENDA UI** | 15 |
| `10111–10135` | **UI: INTRO SLIDES** | 1 |
| `10136–10189` | **DATA: INTRO MAP** | 3 |
| `10190–10222` | **LETRA QUIZ** | 3 |
| `10223–10290` | **PHASE STEPPER** | 3 |
| `10291–10304` | **ENGINE: LETRA QUIZ** | 1 |
| `10305–10314` | **Show intro slides for a letter sub-group** | 1 |
| `10315–10333` | **8 quiz questions for a sub-group** | 1 |
| `10334–10350` | **Full consonant review (all letters, 8 questions)** | 1 |
| `10351–10352` | **PHASE 2 / 4: present vowels** |  |
| `10353–10480` | **UI: VOWEL PRESENTATION** | 3 |
| `10481–10483` | **PHASE 4: present O/U** | 1 |
| `10484–10499` | **PHASE 5: 6 O/U questions** | 1 |
| `10500–10654` | **PHASE 6: 15 mixed alternating questions** | 7 |
| `10655–10658` | **─** |  |
| `10659–10711` | **UI: TRAINING SCREEN** | 2 |
| `10712–11214` | **UI: TRAINING RENDER** | 16 |
| `11215–11270` | **FUNCIÓN PRINCIPAL** | 1 |
| `11271–11301` | **REINSERCIÓN DE ERRORES** | 1 |
| `11302–11737` | **ENGINE: MISSION / GAME LOOP** | 12 |
| `11738–12209` | **UI: GAME CHALLENGE RENDER** | 11 |
| `12210–12541` | **ENGINE: CHECK ANSWERS** | 10 |
| `12542–12631` | **UI: COMPLETE MODE** | 1 |
| `12632–12801` | **UI: DETECT MODE** | 6 |
| `12802–12841` | **UI: ERROR / SUCCESS PANELS** | 3 |
| `12842–12988` | **ENGINE: HANDLE SUCCESS** | 5 |
| `12989–12990` | **ONBOARDING** |  |
| `12991–12993` | **ONBOARDING** |  |
| `12994–13105` | **ONBOARDING STATE** | 7 |
| `13106–13141` | **LIMPIEZA AUTOMÁTICA DE localStorage** | 1 |
| `13142–13314` | **EXPORT / IMPORT DE PROGRESO** | 3 |
| `13315–13705` | **MILESTONE SEMANAL** | 10 |
| `13706–13739` | **Panel unificado de desafíos (misiones del día + semana)** | 3 |
| `13740–13947` | **DAILY QUEST PANEL TOGGLE** | 8 |
| `13948–14081` | **TEXTOS DEL SIDUR EMBEBIDOS** |  |
| `14082–14125` | **DICCIONARIO MAESTRO DEL EXPLORADOR** | 2 |
| `14126–14181` | **STRIP NIKUDOT — para práctica de lectura sin vocales** | 4 |
| `14182–14362` | **RENDERIZADO DEL EXPLORADOR** | 2 |
| `14363–15464` | **LECTURA CORRIDA DESDE SIDUR** | 32 |
| `15465–15484` | **Completar con tu proyecto de Supabase** |  |
| `15485–15510` | **getProfile() — cache + race condition safe** | 1 |
| `15511–15519` | **Guard: acción requiere institución** | 1 |
| `15520–15528` | **Obtener usuario actual** | 1 |
| `15529–15538` | **Login** | 1 |
| `15539–15560` | **Signup** | 1 |
| `15561–15598` | **Crear institución nueva** | 1 |
| `15599–15611` | **Buscar institución por código/nombre** | 1 |
| `15612–15623` | **Logout** | 1 |
| `15624–15643` | **Cargar perfil del usuario** | 1 |
| `15644–15681` | **Guardar progreso en Supabase (reemplaza syncProgress cuando hay auth)** | 1 |
| `15682–15880` | **Cargar progreso desde Supabase** | 11 |
| `15881–16051` | **Inicializar sesión al arrancar** | 6 |
| `16052–16113` | **Unirse a clase por código** | 1 |
| `16114–16125` | **Reintento de membership pendiente (localStorage → Supabase)** | 1 |
| `16126–16314` | **UI del header — mostrar usuario o botón login** | 7 |
| `16315–16327` | **Memoria persistente del coach** | 1 |
| `16328–16334` | **Nivel de usuario (1-10, persistido)** | 1 |
| `16335–16414` | **getUserContext — contexto completo** | 1 |
| `16415–16456` | **Mensajes con variación — evita repetición** | 2 |
| `16457–16519` | **Motor de decisión** | 2 |
| `16520–16553` | **Dificultad dinámica** | 2 |
| `16554–16573` | **Nivel de usuario** | 1 |
| `16574–16646` | **Sistema de misiones diarias** | 3 |
| `16647–16768` | **showCoach() — flujo unificado** | 4 |
| `16769–16821` | **Construir mensaje contextual según estado del usuario** | 1 |
| `16822–16826` | **Guardar timestamp de última actividad** | 1 |
| `16827–16834` | **Verificar cooldown** | 1 |
| `16835–16853` | **Enviar notificación local** | 1 |
| `16854–16884` | **Verificar y enviar notificación según contexto** | 2 |
| `16885–16923` | **Modal amigable antes de pedir permiso** | 1 |
| `16924–16973` | **Verificación periódica (cada 30 min si la app está abierta)** | 3 |
| `16974–17033` | **Performance logging (solo en desarrollo)** |  |
| `17034–17040` | **Normalizador único V1/V2 de estado de onboarding** | 1 |
| `17041–17047` | **Las 3 letras del onboarding** |  |
| `17048–17053` | **Estado** |  |
| `17054–17151` | **Styles (inyectados una vez)** |  |
| `17152–17166` | **Entry point** | 1 |
| `17167–17190` | **DOM root** | 4 |
| `17191–17341` | **Utilidades** | 5 |
| `17342–17433` | **Tap handler** | 2 |
| `17434–17579` | **Feedback incorrecto** | 3 |
| `17580–17616` | **Cerrar overlay** | 3 |
| `17617–17648` | **Racha en ejercicio — HUD visual** | 1 |
| `17649–17697` | **Prompt de cuenta estilo Duolingo** | 1 |
| `17698–18368` | **APP INIT** | 4 |

---

## Detalle por sección (funciones y sub-bloques)

### `2019–2117` DEBUG FLAG

Funciones: `dbg`(2022), `esc`(2024), `save`(2089), `loadProgressSafe`(2101)

### `2118–2391` SHEKELS SYSTEM

Sub-bloques: `2257` Error feedback diferenciado

Funciones: `getLevel`(2131), `getNextLevel`(2136), `addShekels`(2141), `showLevelUp`(2156), `showShekelFlash`(2195), `onCorrectAnswer`(2219), `onWrongAnswer`(2247), `_showErrorTip`(2277), `onLessonComplete`(2314), `onSeriesComplete`(2334), `updateHudShekels`(2371)

### `2392–2429` STREAK

Funciones: `checkWeeklyStreakGift`(2401), `getStreak`(2421)

### `2430–2479` STREAK FREEZE

Funciones: `getStreakShields`(2435), `addStreakShield`(2436), `useStreakShield`(2440), `updateStreak`(2446)

### `2480–2624` FEEDBACK SENSORIAL (Sonidos + Vibracion)

Funciones: `initAudioContext`(2490), `playTone`(2500), `playSuccessSound`(2521), `playErrorSound`(2532), `playClickSound`(2540), `playCelebrationSound`(2548), `vibrate`(2559), `vibrateSuccess`(2565), `vibrateError`(2569), `vibrateClick`(2573), `feedbackSuccess`(2578), `feedbackError`(2603), `feedbackClick`(2612), `feedbackCelebration`(2617)

### `2625–2697` SPACED REPETITION SYSTEM (SRS)

Funciones: `getSRSData`(2636), `saveSRSData`(2640), `markSeriesReviewed`(2645), `needsReview`(2663), `getMemoryStrength`(2680)

### `2698–2731` ERROR TRACKING

Funciones: `trackError`(2699), `getHardWords`(2707)

### `2732–2765` 3 NIVELES DE DOMINIO POR PALABRA

Funciones: `getDecodingLevel`(2737), `updateDecodingLevel`(2742), `getDecodingLevelLabel`(2759)

### `2766–2887` DIFFICULTY SCORE

Funciones: `getDifficultyScore`(2770), `getAllWordStates`(2793), `wordStateKey`(2798), `getWordState`(2803), `recordWordCorrect`(2815), `recordWordIncorrect`(2850), `getLessonWordStates`(2880)

### `2900–3057` LOGROS / ACHIEVEMENTS

Sub-bloques: `2904` PRIMEROS PASOS (5) · `2929` SERIES BASE (6) · `2939` SERIES MIX (3) · `2946` PALABRAS DOMINADAS (5) · `2953` PERSEVERANCIA / RACHAS DIARIAS (4) · `2961` LITÚRGICOS / SIDUR (4) · `2971` TORÁ / PARASHÁ (3) · `2981` MAESTRÍA (3)

Funciones: `getUnlockedAchievements`(2991), `saveAchievement`(2995), `checkAchievements`(3006), `showAchievementUnlocked`(3021)

### `3058–3105` NEAR MISS EFFECT

Funciones: `checkNearMiss`(3060), `showNearMissToast`(3070)

### `3106–3139` PALABRA DOMINADA FEEDBACK

Funciones: `showWordMasteredFeedback`(3108)

### `3140–3149` PERFECT LESSON BONUS

Funciones: `applyPerfectLessonBonus`(3142)

### `3150–3217` CONTADORES GLOBALES

Funciones: `countMasteredWords`(3151), `getTotalWordStats`(3156), `getUrgentWords`(3165), `getAdaptiveStats`(3184)

### `3218–3281` PARASHA CATALOG

Sub-bloques: `3221` GÉNESIS · `3234` ÉXODO · `3246` LEVÍTICO · `3257` NÚMEROS · `3268` DEUTERONOMIO

### `3282–3330` PARASHA PROGRESS STORAGE

Funciones: `getParashaProgress`(3285), `saveParashaProgress`(3289), `getWordParashaState`(3293), `recordParashaWordCorrect`(3298), `recordParashaWordIncorrect`(3313), `getParashaCompletionPct`(3323)

### `3331–3339` DECODE VERSE

Funciones: `decodeVerse`(3335)

### `3340–3361` KNOWN LETTERS

Funciones: `getKnownLetters`(3343)

### `3362–3372` CAN READ WORD

Funciones: `canReadWord`(3364)

### `3373–3380` EXTRACT WORDS

Funciones: `extractParashaWords`(3376)

### `3381–3388` FILTER BY LEARNED LETTERS

Funciones: `filterByLearnedLetters`(3384)

### `3389–3440` BUILD PARASHA INDEX

Funciones: `buildParashaIndex`(3395)

### `3441–3485` GET ALIYAH WORD POOL

Funciones: `getAliyahWordPool`(3445)

### `3486–3503` CONVERT PARASHA WORDS TO EXERCISE FORMAT

Funciones: `parashaWordsToExerciseFormat`(3489)

### `3504–3532` LOAD PARASHA

Funciones: `loadParasha`(3507)

### `3533–3808` PARASHA SESSION STATE

Funciones: `getReadingType`(3563), `setReadingType`(3571), `loadKriyahData`(3584), `getKriyahAliyot`(3606), `_cleanWord`(3669), `buildVerseMap`(3678), `parseReadingRange`(3712), `buildAliyotFromKriyah`(3731), `buildRefsFromRange`(3762), `getVerseByRef`(3796)

### `3809–4092` SEFARIA HYBRID LAYER

Sub-bloques: `3943` Cache: Map<parashaId, normalizedData> · `3946` Detectar tipo de aliyah a partir del key crudo · `3960` Parsear un string de referencia bíblica con posible | · `3987` Normalizar una entrada [key, value] del JSON · `4005` Normalizar array de entries de lectura (full o trienal) · `4014` Normalizar entrada completa de una parashá · `4059` Wrapper público con cache y fallback · `4081` Invalidar cache (llamar si kriyahData se recarga) · `4086` Exponer al scope global

Funciones: `_loadVerseCache`(3817), `_saveVerseCache`(3831), `_sefariaFetchChapter`(3839), `fetchAndCacheParasha`(3889), `detectTriennialYear`(3908), `getTriennialYear`(3923), `setTriennialYear`(3929)

### `4093–4102` CARGAR DICCIONARIO DE TORÁ

Funciones: `loadTorahDict`(4098)

### `4103–4331` LOOKUP FONÉTICA Y TRADUCCIÓN

Sub-bloques: `4107` Tetragrámaton → siempre "Adonai" · `4121` Lookup normal · `4133` Puntos de referencia · `4144` Mapa consonántico · `4184` Mapa vocálico (nikud) · `4222` Trope / cantilación U+0591–U+05AF → saltar · `4225` Espacio / puntuación · `4230` CASO ESPECIAL: vav + dagesh (shuruk ּו) = vocal 'u' · `4236` CASO ESPECIAL: vav + holam (וֹ) = vocal 'o' · `4243` CASO ESPECIAL: yod — mater lectionis · `4256` CASO ESPECIAL: he final sin vocal = silenciosa · `4265` CONSONANTE HEBREA · `4299` NIKUD / VOCALES

Funciones: `getTorahWordInfo`(4106), `_generateBasicTranslit`(4132), `ord_cp`(4330)

### `4332–4343` IS PARASHA UNLOCKED

Funciones: `isParashaUnlocked`(4335), `isParashaPreviewAvailable`(4338)

### `4344–4354` INVALIDATE PARASHA CACHE

Funciones: `invalidateParashaCache`(4346)

### `4355–4424` START PARASHA SESSION

Funciones: `startParashaSession`(4358)

### `4425–4457` GET MIXED LESSON WORDS

Funciones: `getMixedLessonWords`(4428)

### `4458–4688` PARASHA VERSE READER

Funciones: `getAliyahVerses`(4460), `getLessons`(4478), `lessonKey`(4491), `seriesDone`(4492), `getEverDone`(4501), `markSeriesEverDone`(4504), `seriesEverDone`(4508), `lessonDone`(4511), `invalidateLessonPoolCache`(4534), `setLessonPoolSize`(4539), `showView`(4543), `showToast`(4570), `cleanHebrew`(4587), `cleanTorahText`(4616), `isSilentShva`(4631), `renderHebrewWithShva`(4647), `getCurrentWord`(4662), `shuffle`(4672), `getSeriesSeed`(4673), `getCurrentLetters`(4676)

### `4689–4878` CALCULAR PRÓXIMO PASO

Funciones: `getSRSDueCount`(4693), `getNextStep`(4708), `toggleGameVowels`(4792), `renderLettersBand`(4802), `renderTrainingHelpers`(4848)

### `4879–5004` UI: ACHIEVEMENTS DRAWER

Funciones: `toggleAchievements`(4880), `renderAchievementsDrawer`(4891), `updateAchievementsBadge`(4983), `markAchievementsSeen`(4999)

### `5005–6511` UI: HOME

Sub-bloques: `5125` SVG coin images (base64 inline) · `5162` HEADER · `5247` SALUDO CON AVATAR Y MASCOTA · `5320` TARJETA "CONTINUAR HOY" · `5330` PRE-CÓMPUTO BM (solo activo cuando isPar=true) · `5367` ─ · `5517` COUNTDOWN DASHBOARD — BAR/BAT MITZVÁ · `5528` Cálculos de progreso · `5651` BOTÓN "EDITAR BAR MITZVÁ" si no hay fecha guardada · `5702` COIN PATH MAP · `5734` EXTENSIÓN "Camino al Bar Mitzvá": 2 monedas más al final del mismo camino · `5803` Banner above series coin (only for active/started series) · `5843` Moneda final del camino: aliá del alumno / Bar-Bat Mitzvá · `5927` Decorative figures · `5978` MIX SERIES · `6013` SECCIÓN PARASHÁ EN HOME · `6073` BOTONES AL FINAL: TEFILOT + TORÁ · `6077` Banner único: Sidur + Tefilot + Torá · `6279` HEADER COMPACTO + BOTÓN "MÁS" (drawer) · `6343` CONSTRUCCIÓN DEL CAMINO (nodos) · `6398` RENDER de nodos (vertical, transforms/opacity, sin libs) · `6446` Delegación de eventos (sin onclick inline) · `6502` Scroll al nodo actual

Funciones: `buildLevelWidget`(5007), `showSeriesPopup`(5027), `renderHome`(5107), `_phEscape`(6247), `renderPathHome`(6253)

### `6512–6611` PERSONALIZACIÓN BAR MITZVÁ

Funciones: `showBMSettingsModal`(6514)

### `6612–6709` KARAOKE TIMESTAMPS

Funciones: `loadKaraokeTimestamps`(6617), `getKaraokeTimestampKey`(6629), `startKaraokeAudio`(6634)

### `6713–6925` AUDIO_ALIYOT_MAP helpers

Funciones: `getAliyahAudio`(6717), `getAliyahMeta`(6740), `getFirstAliyahMilestone`(6806), `_markFirstAliyahComplete`(6813)

### `6926–6946` READ + LISTEN: setup del audio nativo + resaltado por versículo

Funciones: `_resolveAliyahAudioKey`(6932)

### `6947–7418` SELF RECORD: grabate y comparar (SELF_RECORD, PROMPT I2)

Sub-bloques: `7261` Overlay ceremonia (pantalla completa, tono kavaná — no arcade) · `7298` Certificado (canvas)

Funciones: `_selfRecordSupported`(6962), `_selfRecordMimeType`(6966), `_teardownSelfRecordStream`(6973), `_uploadSelfRecording`(6981), `_selfRecordTeardown`(7005), `_renderSelfRecordUI`(7026), `_toggleSelfRecord`(7053), `_stopSelfRecord`(7096), `_toggleSelfRecordCompare`(7103), `renderReadListenAudio`(7121), `showFirstAliyahCeremony`(7236), `_downloadFirstAliyahCert`(7330), `_drawFirstAliyahCertificate`(7346), `getKaraokeMs`(7415)

### `7419–7427` PREPARAR SPANS

Funciones: `_buildKaraokeWordList`(7421)

### `7428–7606` START / PAUSE / RESUME

Funciones: `startKaraoke`(7429), `pauseKaraoke`(7455), `resumeKaraoke`(7464), `stopKaraoke`(7474), `_karaokeHighlightWord`(7496), `_karaokeAdvance`(7517), `_highlightWord`(7548), `_clearWordHighlight`(7557), `_updateKaraokeUI`(7570), `cycleKaraokeSpeed`(7582), `getMiAliyaTimes`(7600), `saveMiAliyaTimes`(7603)

### `7607–7802` INICIAR MODO MI ALIYÁ

Funciones: `startMiAliya`(7609), `_renderMiAliyaModal`(7625)

### `7803–8027` ALIYAH SELECT

Sub-bloques: `7900` READING TYPE SELECTOR · `7931` TRIENNIAL YEAR SELECTOR (only when triennial is active) · `7965` Info del tipo de lectura activo · `7976` Build aliyah list from kriyah_data (single source of truth)

Funciones: `showAliyahActionSheet`(7806), `showAliyahSelect`(7868)

### `8028–8349` PARASHA READ

Sub-bloques: `8064` TABS DE NAVEGACIÓN POR ALIYÁ · `8093` RENDER VERSES FROM KRIYAH_DATA (single source of truth)

Funciones: `renderParashaRead`(8030)

### `8350–8462` PARASHA PRACTICE

Funciones: `startParashaPractice`(8354)

### `8463–8606` TUTORIAL FIRST-RUN

Funciones: `getTutorialsSeen`(8468), `markTutorialSeen`(8471), `isTutorialSeen`(8478), `showTutorialIfNeeded`(8491)

### `8607–8649` GENERACIÓN DIARIA

Funciones: `_generateDailyQuests`(8608)

### `8650–8669` LOAD / SAVE

Funciones: `getDailyQuests`(8651), `saveDailyQuests`(8665)

### `8670–8715` TRACKING

Funciones: `trackDailyQuestEvent`(8674)

### `8716–8741` BONUS ANIMATION

Funciones: `showDailyBonusAnimation`(8717)

### `8742–8835` RENDER TARJETA HOME

Funciones: `renderDailyQuestCard`(8743)

### `8836–8875` REFRESH EN HOME

Funciones: `_refreshQuestCard`(8837)

### `8876–8977` BUILD QUESTION POOL

Funciones: `_buildFlashQuestions`(8877)

### `8978–9035` START FLASH

Funciones: `startFlashRecall`(8979), `startSpeedMode`(8993), `_buildSpeedOptions`(9026)

### `9036–9097` MODAL UI

Funciones: `_showFlashModal`(9037)

### `9098–9178` RENDER PREGUNTA

Funciones: `_renderFlashQuestion`(9099)

### `9179–9230` RESPUESTA

Funciones: `_answerFlash`(9180)

### `9231–9374` FINISH

Funciones: `_finishFlash`(9232)

### `9375–9399` COINS

Funciones: `getCoins`(9376), `setCoins`(9377), `addCoins`(9378), `spendCoins`(9384), `updateCoinDisplay`(9385), `showCoinFlash`(9393)

### `9400–9416` INVENTORY

Funciones: `getInventory`(9401), `saveInventory`(9402), `addToInventory`(9403), `hasInInventory`(9404), `getActiveAvatar`(9405), `getActiveFrame`(9406), `getActivePet`(9407), `setActiveAvatar`(9408), `setActiveFrame`(9409), `setActivePet`(9410), `getPowerupCount`(9411), `addPowerup`(9412), `usePowerup`(9413), `isPowerupActive`(9414), `activatePowerup`(9415)

### `9417–9463` COMPRA & COFRES

Funciones: `buyItem`(9418), `openChest`(9432), `initShopInventory`(9447)

### `9464–9483` AVATAR / PET RENDER HELPERS

Funciones: `avatarImgHtml`(9465), `getActiveAvatarItem`(9475), `getActivePetItem`(9480)

### `9484–10110` TIENDA UI

Funciones: `rarityStyle`(9485), `makeShopCard`(9494), `showShopView`(9526), `renderShopTab`(9541), `renderShopAvatars`(9552), `renderShopFrames`(9562), `renderShopPets`(9572), `renderShopPowerups`(9590), `renderShopChests`(9601), `startSeries`(9637), `_markIntroSeen`(9705), `_showAnchorsIfNeeded`(9712), `_showVowelsIntro2`(9769), `_showVowelsIntro3`(9890), `_showVowelsIntro`(10012)

### `10111–10135` UI: INTRO SLIDES

Funciones: `renderIntroSlide`(10112)

### `10136–10189` DATA: INTRO MAP

Funciones: `playIntroAudio`(10171), `introNext`(10173), `skipIntro`(10180)

### `10190–10222` LETRA QUIZ

Funciones: `vowelsForSounds`(10203), `vowelDisplay`(10211), `vowelOnMem`(10221)

### `10223–10290` PHASE STEPPER

Funciones: `buildLqPhases`(10226), `getLetterGroups`(10244), `renderLqStepper`(10270)

### `10291–10304` ENGINE: LETRA QUIZ

Funciones: `startLetraQuiz`(10293)

### `10305–10314` Show intro slides for a letter sub-group

Funciones: `runLqGroupIntro`(10306)

### `10315–10333` 8 quiz questions for a sub-group

Funciones: `runLqGroupQuiz`(10316)

### `10334–10350` Full consonant review (all letters, 8 questions)

Funciones: `runLqPhase1`(10335)

### `10353–10480` UI: VOWEL PRESENTATION

Funciones: `runVowelPresent`(10354), `continueVowelPresent`(10462), `runLqPhase3`(10466)

### `10481–10483` PHASE 4: present O/U

Funciones: `runLqPhase4`(10482)

### `10484–10499` PHASE 5: 6 O/U questions

Funciones: `runLqPhase5`(10485)

### `10500–10654` PHASE 6: 15 mixed alternating questions

Funciones: `runLqPhase6`(10501), `buildQuizPool`(10528), `renderLetraQuizSlide`(10536), `handleLqAnswer`(10597), `advanceLqPhase`(10620), `finishLetraQuiz`(10646), `skipLetraQuiz`(10651)

### `10659–10711` UI: TRAINING SCREEN

Funciones: `renderColoredSyllable`(10660), `toggleTrainingRef`(10701)

### `10712–11214` UI: TRAINING RENDER

Sub-bloques: `10785` SELECT · `10797` LISTEN · `10809` WRITE · `10821` ARRANGE · `10839` COMPLETE · `10856` DETECT

Funciones: `renderTraining`(10713), `skipTraining`(10758), `getAvailableTemplates`(10871), `generateExercise`(10884), `pickTemplate`(10894), `getConfusiblePairs`(10951), `getConfusibleLetters`(10962), `wordHasVisualConfusion`(10972), `getVisualConfusionBoost`(10980), `pickChallengeType`(10988), `classifyWordsByState`(11048), `selectAdaptiveWordMix`(11080), `getCarryoverWords`(11135), `getSrsOverdueWords`(11159), `challengesForWord`(11186), `orderChallenges`(11199)

### `11215–11270` FUNCIÓN PRINCIPAL

Funciones: `generateLessonPool`(11218)

### `11271–11301` REINSERCIÓN DE ERRORES

Funciones: `reinsertErrorChallenge`(11274)

### `11302–11737` ENGINE: MISSION / GAME LOOP

Sub-bloques: `11315` Generador dinámico de lección · `11489` Modo rápido: no mostrar celebración, avanzar directamente · `11550` CELEBRACIÓN VISUAL · `11635` Sidur context hint: show where these words appear in real prayers

Funciones: `startMission`(11304), `updateGameUI`(11338), `nextChallenge`(11358), `startSpeedRead`(11380), `srShowCard`(11401), `srReveal`(11429), `srAnswer`(11441), `srNext`(11452), `srSkip`(11461), `srFinish`(11465), `showCelebration`(11476), `_runCelebration`(11508)

### `11738–12209` UI: GAME CHALLENGE RENDER

Sub-bloques: `11910` Generar distractores coherentes

Funciones: `getFadingDuration`(11754), `showTranslitFading`(11770), `hideTranslitFading`(11805), `renderGameChallenge`(11816), `renderSelectMode`(11905), `renderWriteMode`(11972), `renderListenMode`(11986), `wordSimilarityScore`(12048), `getDistractorPool`(12080), `buildFoneticaDistractors`(12102), `buildHebrewDistractors`(12159)

### `12210–12541` ENGINE: CHECK ANSWERS

Funciones: `checkWrite`(12212), `stopAudio`(12283), `startQuickPractice`(12303), `_renderQuickHUD`(12325), `_endQuickMode`(12358), `_speakHebrew`(12416), `playCurrentWordAudio`(12439), `splitHebBlocks`(12477), `_getConFon`(12494), `mapBlocksToFon`(12505)

### `12542–12631` UI: COMPLETE MODE

Funciones: `renderCompleteMode`(12544)

### `12632–12801` UI: DETECT MODE

Funciones: `renderDetectMode`(12634), `renderArrangeMode`(12710), `renderArrangeTiles`(12723), `arrangePick`(12783), `arrangePop`(12789), `arrangeUndo`(12795)

### `12802–12841` UI: ERROR / SUCCESS PANELS

Funciones: `showErrorPanel`(12803), `hideErrorPanel`(12815), `showWordIntroFromError`(12820)

### `12842–12988` ENGINE: HANDLE SUCCESS

Funciones: `handleSuccess`(12843), `toggleHelp`(12908), `exitGame`(12919), `goNextLesson`(12943), `startReview`(12951)

### `12994–13105` ONBOARDING STATE

Funciones: `startOnboarding`(13002), `_obPopulateParashaSelect`(13014), `_obShowSlide`(13041), `onboardNext`(13080), `getPlayerName`(13087), `_obSavePersonalization`(13089), `finishOnboarding`(13098)

### `13106–13141` LIMPIEZA AUTOMÁTICA DE localStorage

Funciones: `cleanupLocalStorage`(13108)

### `13142–13314` EXPORT / IMPORT DE PROGRESO

Funciones: `exportProgress`(13146), `importProgress`(13174), `showExportModal`(13209)

### `13315–13705` MILESTONE SEMANAL

Funciones: `checkWeeklyMilestone`(13321), `_updateWeeklyBtnLabel`(13389), `_getWeekId`(13395), `getWeeklyChallenges`(13401), `saveWeeklyChallenges`(13411), `trackWeeklyEvent`(13415), `renderWeeklyChallengesCard`(13431), `_fetchClassRanking`(13495), `toggleRankingPanel`(13581), `_renderRankingPanel`(13596)

### `13706–13739` Panel unificado de desafíos (misiones del día + semana)

Funciones: `toggleChallengesPanel`(13707), `_updateChallengesBtnLabel`(13722), `_updateQuestBtnLabel`(13737)

### `13740–13947` DAILY QUEST PANEL TOGGLE

Funciones: `toggleDailyQuestPanel`(13742), `getParashaForDate`(13744), `getServiciosForDate`(13749), `getTefilaProgress`(13828), `saveTefilaProgress`(13833), `recordTefilaWordCorrect`(13837), `loadTefila`(13848), `showTefilotView`(13863)

### `14082–14125` DICCIONARIO MAESTRO DEL EXPLORADOR

Funciones: `buildSidurDictionary`(14085), `normalizeSidurWord`(14117)

### `14126–14181` STRIP NIKUDOT — para práctica de lectura sin vocales

Funciones: `stripNikudot`(14128), `tokenizeSidurVerse`(14135), `calcSidurTextStats`(14140), `getSidurStats`(14163)

### `14182–14362` RENDERIZADO DEL EXPLORADOR

Sub-bloques: `14211` Toggle "sin nikudot" en Sidur · `14350` Botón "Lectura corrida" — practica palabra por palabra en voz alta

Funciones: `showSidurExplorer`(14186), `renderSidurText`(14240)

### `14363–15464` LECTURA CORRIDA DESDE SIDUR

Sub-bloques: `14971` Opción C: REST propio · `14977` Sin backend: solo garantizar guardado local robusto

Funciones: `startSidurLectura`(14366), `loadAndShowTefila`(14414), `renderTefilaRead`(14424), `startTefilaKaraoke`(14564), `extractLecturaWords`(14588), `startTefilaPractice`(14632), `lecturaRenderWord`(14666), `lecturaTapWord`(14716), `lecturaAnswer`(14727), `lecturaShowResult`(14759), `lecturaClose`(14832), `openIDB`(14847), `saveProgress`(14861), `loadProgress`(14885), `syncProgress`(14948), `_flushSyncQueue`(15041), `_syncToREST`(15048), `_enqueueSyncItem`(15059), `_getSyncQueue`(15074), `_clearSyncQueue`(15079), `_getSyncUserId`(15084), `saveWithIDB`(15096), `subscribeUserToPush`(15124), `subscribeAndSave`(15157), `urlBase64ToUint8Array`(15165), `scheduleDailyReminder`(15176), `trackEvent`(15217), `flushAnalytics`(15236), `getAnalyticsData`(15250), `renderAnalyticsDashboard`(15306), `openAnalyticsDashboard`(15437), `closeAnalyticsDashboard`(15446)

### `15485–15510` getProfile() — cache + race condition safe

Funciones: `getProfile`(15486)

### `15511–15519` Guard: acción requiere institución

Funciones: `_requireInstitution`(15512)

### `15520–15528` Obtener usuario actual

Funciones: `getAuthUser`(15521)

### `15529–15538` Login

Funciones: `authLogin`(15530)

### `15539–15560` Signup

Funciones: `authSignup`(15540)

### `15561–15598` Crear institución nueva

Funciones: `createInstitution`(15562)

### `15599–15611` Buscar institución por código/nombre

Funciones: `findInstitution`(15600)

### `15612–15623` Logout

Funciones: `authLogout`(15613)

### `15624–15643` Cargar perfil del usuario

Funciones: `_loadProfile`(15625)

### `15644–15681` Guardar progreso en Supabase (reemplaza syncProgress cuando hay auth)

Funciones: `syncProgressToSupabase`(15652)

### `15682–15880` Cargar progreso desde Supabase

Funciones: `loadProgressFromSupabase`(15683), `loadActiveAssignments`(15704), `assignmentTitle`(15728), `renderAssignmentCard`(15744), `goToAssignmentTarget`(15770), `completeAssignmentIfMatch`(15790), `insertAssignmentProgress`(15798), `queueAssignmentProgress`(15816), `flushPendingAssignmentProgress`(15826), `renderAliyahAssignmentButton`(15845), `_isLocalProgressEmpty`(15872)

### `15881–16051` Inicializar sesión al arrancar

Funciones: `initAuth`(15882), `fetchNotifications`(15957), `markNotificationRead`(15976), `showBackendNotifications`(15988), `_showTeacherMessage`(16013), `savePushSubscription`(16038)

### `16052–16113` Unirse a clase por código

Funciones: `joinClassByCode`(16053)

### `16114–16125` Reintento de membership pendiente (localStorage → Supabase)

Funciones: `_retryPendingMemberships`(16115)

### `16126–16314` UI del header — mostrar usuario o botón login

Funciones: `_updateAuthHeader`(16127), `authSwitchTab`(16162), `authSelectRole`(16186), `authInstMode`(16212), `_authShowError`(16228), `authSubmit`(16235), `authSkip`(16306)

### `16315–16327` Memoria persistente del coach

Funciones: `_saveCoachMemory`(16324)

### `16328–16334` Nivel de usuario (1-10, persistido)

Funciones: `_saveUserLevel`(16331)

### `16335–16414` getUserContext — contexto completo

Sub-bloques: `16367` Señales predictivas — últimos 10 eventos de respuesta · `16379` Estado emocional derivado · `16386` Progreso de misión actual

Funciones: `getUserContext`(16336)

### `16415–16456` Mensajes con variación — evita repetición

Funciones: `_pickMsgWithMood`(16441), `_pickMsg`(16452)

### `16457–16519` Motor de decisión

Sub-bloques: `16482` 1. Señales predictivas (máxima prioridad) · `16486` 2. Errores consecutivos (reacción inmediata) · `16490` 3. Estado emocional + métricas combinados · `16500` 4. Integración con misión activa · `16507` 5. Positivos — verificar coherencia (no celebrar si hay errores)

Funciones: `getPredictiveSignals`(16461), `getCoachDecision`(16479)

### `16520–16553` Dificultad dinámica

Funciones: `getDynamicDifficulty`(16523), `getDistractorCount`(16546)

### `16554–16573` Nivel de usuario

Funciones: `updateUserLevel`(16555)

### `16574–16646` Sistema de misiones diarias

Funciones: `_getActiveMission`(16586), `updateMissionProgress`(16597), `renderMissionBadge`(16626)

### `16647–16768` showCoach() — flujo unificado

Funciones: `showCoach`(16648), `showCoachMessage`(16745), `runCoachCheck`(16746), `analyzeUserBehavior`(16759)

### `16769–16821` Construir mensaje contextual según estado del usuario

Sub-bloques: `16794` Mensajes según contexto

Funciones: `getSmartNotification`(16770)

### `16822–16826` Guardar timestamp de última actividad

Funciones: `updateLastActivity`(16823)

### `16827–16834` Verificar cooldown

Funciones: `canSendNotification`(16828)

### `16835–16853` Enviar notificación local

Funciones: `sendLocalNotification`(16836)

### `16854–16884` Verificar y enviar notificación según contexto

Funciones: `checkAndNotify`(16855), `requestNotifPermission`(16862)

### `16885–16923` Modal amigable antes de pedir permiso

Funciones: `showNotifPrompt`(16886)

### `16924–16973` Verificación periódica (cada 30 min si la app está abierta)

Funciones: `startNotifScheduler`(16926), `throttleRAF`(16952), `debounce`(16966)

### `17034–17040` Normalizador único V1/V2 de estado de onboarding

Funciones: `isOnboardingDone`(17037)

### `17152–17166` Entry point

Funciones: `startOnboardingFlow`(17153)

### `17167–17190` DOM root

Funciones: `_obMount`(17168), `_obRender`(17175), `_obClearTimers`(17180), `_obDelay`(17185)

### `17191–17341` Utilidades

Funciones: `_obSpeak`(17192), `_obProgressHTML`(17207), `_obShekelHUD`(17222), `_obPhase_intro`(17237), `_obPhase_quiz`(17289)

### `17342–17433` Tap handler

Funciones: `_obHandleTap`(17343), `_obPhase_feedback_correct`(17378)

### `17434–17579` Feedback incorrecto

Funciones: `_obPhase_feedback_wrong`(17435), `_obPhase_next_letter`(17477), `_obPhase_save_prompt`(17511)

### `17580–17616` Cerrar overlay

Funciones: `_obClose`(17581), `_obFinish`(17592), `resetOnboarding`(17605)

### `17617–17648` Racha en ejercicio — HUD visual

Funciones: `_updateStreakHUD`(17618)

### `17649–17697` Prompt de cuenta estilo Duolingo

Funciones: `_showAuthPrompt`(17651)

### `17698–18368` APP INIT

Sub-bloques: `17759` Navigation · `17853` Welcome / Onboarding · `17859` Mini-ejercicio slide 3 · `17883` Slide 4: cuenta regresiva al elegir fecha · `17973` Intro slides · `17977` Letra Quiz · `17982` Pre-training · `17986` Training ref toggle · `17989` Game · `17997` Celebration · `18002` Parasha buttons · `18013` SERVICE WORKER · `18090` SPLASH SCREEN — ocultar tras render real + mínimo 600ms · `18252` 1. PARPADEO IRREGULAR · `18273` 2. FOLLOW CURSOR / TOUCH (máx 5px, solo en desktop) · `18324` 3. MICRO DELAY EN REACCIONES

Funciones: `startApp`(17699), `setMascotState`(18155), `celebrate`(18204), `restoreMascot`(18226)

---

## Constantes / feature flags top-level

| Línea | Constante | Valor (inicio) |
|---|---|---|
| 2021 | `DEBUG` | `false;` |
| 2036 | `FULL_ALEF_BET` | `[{"h": "א", "p": "Muda"}, {"h": "ב", "p": "B"}, {"…` |
| 2038 | `LETTER_FON_MAP` | `Object.fromEntries(FULL_ALEF_BET.map(x => [x.h, x.…` |
| 2040 | `FULL_VOWELS` | `[{"h": "ָ", "p": "A"}, {"h": "ַ", "p": "A"}, {"h":…` |
| 2042 | `NIKUDOT_BLOCKS` | `{"block1":{"name":"Vocales básicas","series_trigge…` |
| 2056 | `STORAGE_KEY` | `"heb_pro_v19_shekels";` |
| 2119 | `SHEKEL_LEVELS` | `[` |
| 2399 | `STREAK_WEEKLY_KEY` | `'heb_streak_weekly_gift';` |
| 2433 | `STREAK_SHIELD_KEY` | `'heb_streak_shield';` |
| 2633 | `SRS_KEY` | `"heb_srs_reviews";` |
| 2634 | `SRS_INTERVALS` | `[1, 3, 7, 14, 30]; // dias entre repasos` |
| 2723 | `WORD_STATE_KEY` | `"heb_word_states_v1";` |
| 2726 | `WORD_THRESHOLDS` | `{` |
| 2903 | `ACHIEVEMENTS` | `[` |
| 2989 | `ACHIEVEMENTS_KEY` | `"heb_achievements_v1";` |
| 3220 | `PARASHA_CATALOG` | `[` |
| 3283 | `PARASHA_PROGRESS_KEY` | `"heb_parasha_progress_v1";` |
| 4477 | `LESSON_SIZE` | `7;` |
| 4500 | `EVER_DONE_KEY` | `'heb_series_ever_done';` |
| 4628 | `SHVA` | `'\u05B0'; // ְ` |
| 4629 | `LONG_VOWELS` | `new Set(['\u05B8','\u05B5','\u05B4','\u05B9','\u05…` |
| 5106 | `PATH_HOME` | `false;` |
| 6765 | `KARAOKE_SPEEDS` | `[` |
| 6790 | `READ_LISTEN_MODE` | `true;` |
| 6794 | `SELF_RECORD` | `true;` |
| 6795 | `SELF_RECORD_UPLOAD` | `true; // bucket + RLS ya aplicados (self_record_up…` |
| 6803 | `FIRST_ALIYAH_CEREMONY` | `true;` |
| 6804 | `FIRST_ALIYAH_KEY` | `'heb_milestone_first_aliyah';` |
| 6834 | `VERSE_TIMINGS` | `{` |
| 7234 | `FIRST_ALIYAH_BLESSING_AUDIO` | `'';` |
| 7598 | `MI_ALIYA_KEY` | `'heb_mi_aliya_times'; // {parashaId_aliyah_verseId…` |
| 8466 | `TUTORIAL_KEY` | `'heb_tutorials_seen';` |
| 8482 | `TUTORIAL_TEXTS` | `{` |
| 8565 | `DQ_KEY` | `'heb_daily_quests';` |
| 8566 | `DQ_DATE_KEY` | `'heb_daily_quest_date';` |
| 8568 | `DQ_XP_PER_QUEST` | `5;` |
| 8569 | `DQ_SHEKELS_QUEST` | `2;` |
| 8570 | `DQ_XP_BONUS` | `15;` |
| 8571 | `DQ_SHEKELS_BONUS` | `5;` |
| 8574 | `QUEST_TYPES` | `{` |
| 8859 | `FLASH_QUESTIONS` | `3;      // preguntas por micro-loop` |
| 8860 | `FLASH_TIMEOUT_MS` | `3000;   // ms por pregunta` |
| 8861 | `FLASH_XP_BASE` | `5;` |
| 8862 | `FLASH_XP_BONUS` | `3;` |
| 8863 | `FLASH_SHEKELS` | `1;` |
| 9302 | `COINS_KEY` | `'heb_coins';` |
| 9303 | `INVENTORY_KEY` | `'heb_inventory';` |
| 9305 | `AVATARS` | `[` |
| 9322 | `FRAMES` | `[` |
| 9330 | `PETS` | `[` |
| 9344 | `POWERUPS` | `[` |
| 9350 | `CHESTS` | `[` |
| 9356 | `CHEST_REWARDS` | `{` |
| 10138 | `LETRA_INTRO_MAP` | `{` |
| 10200 | `VOW_AEI` | `['A','E','I'];` |
| 10201 | `VOW_OU` | `['O','U'];` |
| 10261 | `LQ_PHASES` | `[` |
| 10783 | `EXERCISE_TEMPLATES` | `{` |
| 10917 | `CHALLENGE_TYPES` | `[` |
| 10925 | `STATUS_ORDER` | `{ new: 0, learning: 1, review: 2, mastered: 3 };` |
| 10935 | `VISUAL_CONFUSIBLES` | `[` |
| 11041 | `ADAPTIVE_MIX` | `{ learning: 0.40, review: 0.30, new: 0.20, mastere…` |
| 11044 | `ERROR_REINSERTION_REPS` | `1;` |
| 11158 | `SRS_INLESSON_DAYS` | `7; // días sin practicar → entra al pool` |
| 11372 | `SR_MIN_WORDS` | `3; // mínimo de palabras para activar SPEED_READ` |
| 12294 | `QUICK_MODE_DURATION` | `5 * 60 * 1000; // 5 minutos en ms` |
| 12999 | `OB_BM_DATE_KEY` | `'heb_bm_date';     // fecha del Bar/Bat Mitzvá` |
| 13000 | `OB_PARASHA_KEY` | `'heb_bm_parasha';  // id de la parashá elegida` |
| 13085 | `OB_NAME_KEY` | `'heb_player_name';` |
| 13318 | `WEEKLY_KEY` | `'heb_weekly_challenges';` |
| 13319 | `WEEKLY_MILESTONE_KEY` | `'heb_weekly_milestone';` |
| 13493 | `RANKING_CACHE_TTL` | `60000; // 1 minuto` |
| 13787 | `WEEKLY_CHALLENGES` | `[` |
| 13798 | `TEFILA_CATALOG` | `[` |
| 13826 | `TEFILA_PROGRESS_KEY` | `'heb_tefila_progress_v1';` |
| 13951 | `SIDUR_TEXTS` | `[` |
| 14843 | `IDB_NAME` | `'alefmaster-db';` |
| 14844 | `IDB_VERSION` | `1;` |
| 14845 | `IDB_STORE` | `'progress';` |
| 14931 | `SYNC_QUEUE_KEY` | `'heb_sync_queue';` |
| 14946 | `SYNC_ENDPOINT` | `''; // URL del backend cuando esté listo` |
| 15122 | `VAPID_PUBLIC_KEY` | `''; // Completar con tu clave VAPID cuando tengas …` |
| 15207 | `ANALYTICS_KEY` | `'heb_analytics';` |
| 15208 | `ANALYTICS_MAX` | `500;   // máx eventos guardados localmente` |
| 15466 | `SUPABASE_URL` | `'https://gxofwhomnjjffhmoffgl.supabase.co';` |
| 15467 | `SUPABASE_ANON` | `'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJz…` |
| 15649 | `SUPABASE_SYNC_MIN_INTERVAL` | `60000; // no más de 1 sync real cada 60s` |
| 15701 | `PENDING_ASSIGNMENT_PROGRESS_KEY` | `'heb_pending_assignment_progress';` |
| 16416 | `COACH_MSGS` | `{` |
| 16575 | `MISSIONS` | `[` |
| 16764 | `NOTIF_COOLDOWN_KEY` | `'heb_last_notif';` |
| 16765 | `NOTIF_PERM_KEY` | `'heb_notif_asked';` |
| 16766 | `NOTIF_COOLDOWN_MS` | `4 * 60 * 60 * 1000; // 4 horas entre notificacione…` |
| 16767 | `NOTIF_INACTIVITY` | `22 * 60 * 60 * 1000; // 22 horas = "hace 1 día"` |
| 17031 | `OB_WELCOME_KEY` | `'welcome_seen';` |
| 17032 | `OB_DONE_KEY` | `'onboarding_done';` |
| 17042 | `OB_ROUNDS` | `[` |
| 18129 | `MASCOT_STATES` | `['idle','success','error','loading','happy','think…` |
| 18132 | `MASCOT_DURATIONS` | `{` |
| 18145 | `MASCOT_IMG_MAP` | `{` |

---

## Cómo regenerar

```bash
python3 genmap.py     # produce mapdata.json
python3 render.py     # produce MAP.md
```

Los anchors del código son la fuente de verdad. Al agregar una sección nueva, usar el mismo formato:

```js
// ── NOMBRE DE LA SECCION ──────────────────────────────
```