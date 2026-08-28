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
| **2115** | `ALL_DATA` | 21 KB |
| **2120** | `DATE_PARASHA_MAP` | 57 KB |
| **2122** | `AUDIO_ALIYOT_MAP` | 228 KB |

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
| 28–160 | `<style id="tw-minimal">` | utilidades tipo Tailwind |
| 162–166 | CDNs (canvas-confetti, supabase-js) | |
| 171–828 | `<style>` principal | ~650 líneas de CSS |
| 837–2057 | `<body>` — HTML de todas las views | ver índice de views |
| **2058–19761** | `<script>` — **todo el JS** | ver índice de secciones |
| 19765 | `<script src="./js/teacher.js" defer>` | módulo aparte (86 KB) |

**Ancla de extracción JS** (para scripts de patch en Python):

```python
m = re.search(r'<script>\n// ── Error handling', content)   # línea 2058
start = content.index('\n', m.start()) + 1
end   = content.find('</script>', start)   # find, NUNCA rindex
```

---

## Views HTML

| Línea | ID |
|---|---|
| 993 | `view-onboarding` |
| 1146 | `view-sidur` |
| 1206 | `view-tefilot` |
| 1215 | `view-tefila-read` |
| 1240 | `view-lectura` |
| 1329 | `view-shop` |
| 1351 | `view-welcome` |
| 1379 | `view-home` |
| 1386 | `view-intro` |
| 1418 | `view-letra-quiz` |
| 1438 | `view-vowel-present` |
| 1448 | `view-pre-training` |
| 1457 | `view-training` |
| 1490 | `view-game` |
| 1621 | `view-speed-read` |
| 1645 | `view-celebration` |
| 1711 | `view-parasha-select` |
| 1724 | `view-aliyah-select` |
| 1743 | `view-parasha-read` |
| 1810 | `view-teacher` |
| 1884 | `view-no-institution` |
| 1919 | `view-auth` |

---

## Índice de secciones JS

153 secciones top-level. Formato: `rango` · nombre · (nº de funciones).

| Rango | Sección | Fns |
|---|---|---|
| `2059–2092` | **Error handling global** |  |
| `2093–2192` | **DEBUG FLAG** | 4 |
| `2193–2466` | **SHEKELS SYSTEM** | 11 |
| `2467–2504` | **STREAK** | 2 |
| `2505–2554` | **STREAK FREEZE** | 4 |
| `2555–2699` | **FEEDBACK SENSORIAL (Sonidos + Vibracion)** | 14 |
| `2700–2772` | **SPACED REPETITION SYSTEM (SRS)** | 5 |
| `2773–2806` | **ERROR TRACKING** | 2 |
| `2807–2840` | **3 NIVELES DE DOMINIO POR PALABRA** | 3 |
| `2841–3010` | **DIFFICULTY SCORE** | 7 |
| `3011–3022` | **LESSON STATS** |  |
| `3023–3180` | **LOGROS / ACHIEVEMENTS** | 4 |
| `3181–3228` | **NEAR MISS EFFECT** | 2 |
| `3229–3262` | **PALABRA DOMINADA FEEDBACK** | 1 |
| `3263–3272` | **PERFECT LESSON BONUS** | 1 |
| `3273–3340` | **CONTADORES GLOBALES** | 4 |
| `3341–3404` | **PARASHA CATALOG** |  |
| `3405–3453` | **PARASHA PROGRESS STORAGE** | 6 |
| `3454–3462` | **DECODE VERSE** | 1 |
| `3463–3484` | **KNOWN LETTERS** | 1 |
| `3485–3495` | **CAN READ WORD** | 1 |
| `3496–3503` | **EXTRACT WORDS** | 1 |
| `3504–3511` | **FILTER BY LEARNED LETTERS** | 1 |
| `3512–3563` | **BUILD PARASHA INDEX** | 1 |
| `3564–3608` | **GET ALIYAH WORD POOL** | 1 |
| `3609–3626` | **CONVERT PARASHA WORDS TO EXERCISE FORMAT** | 1 |
| `3627–3655` | **LOAD PARASHA** | 1 |
| `3656–3931` | **PARASHA SESSION STATE** | 10 |
| `3932–4215` | **SEFARIA HYBRID LAYER** | 7 |
| `4216–4225` | **CARGAR DICCIONARIO DE TORÁ** | 1 |
| `4226–4454` | **LOOKUP FONÉTICA Y TRADUCCIÓN** | 3 |
| `4455–4466` | **IS PARASHA UNLOCKED** | 2 |
| `4467–4490` | **INVALIDATE PARASHA CACHE** | 2 |
| `4491–4560` | **START PARASHA SESSION** | 1 |
| `4561–4593` | **GET MIXED LESSON WORDS** | 1 |
| `4594–4763` | **PARASHA VERSE READER** | 14 |
| `4764–4924` | **Modo Fraseo — ta'amei ha-mikrá como ayuda visual** | 11 |
| `4925–5114` | **CALCULAR PRÓXIMO PASO** | 5 |
| `5115–5240` | **UI: ACHIEVEMENTS DRAWER** | 4 |
| `5241–6790` | **UI: HOME** | 5 |
| `6791–6890` | **PERSONALIZACIÓN BAR MITZVÁ** | 1 |
| `6891–6988` | **KARAOKE TIMESTAMPS** | 3 |
| `6989–6991` | **KARAOKE: obtener audio de aliyá** |  |
| `6992–7204` | **AUDIO_ALIYOT_MAP helpers** | 4 |
| `7205–7225` | **READ + LISTEN: setup del audio nativo + resaltado por versículo** | 1 |
| `7226–7697` | **SELF RECORD: grabate y comparar (SELF_RECORD, PROMPT I2)** | 14 |
| `7698–7706` | **PREPARAR SPANS** | 1 |
| `7707–7885` | **START / PAUSE / RESUME** | 12 |
| `7886–8081` | **INICIAR MODO MI ALIYÁ** | 2 |
| `8082–8306` | **ALIYAH SELECT** | 2 |
| `8307–8657` | **PARASHA READ** | 1 |
| `8658–8770` | **PARASHA PRACTICE** | 1 |
| `8771–8920` | **TUTORIAL FIRST-RUN** | 4 |
| `8921–8963` | **GENERACIÓN DIARIA** | 1 |
| `8964–8983` | **LOAD / SAVE** | 2 |
| `8984–9029` | **TRACKING** | 1 |
| `9030–9055` | **BONUS ANIMATION** | 1 |
| `9056–9149` | **RENDER TARJETA HOME** | 1 |
| `9150–9189` | **REFRESH EN HOME** | 1 |
| `9190–9291` | **BUILD QUESTION POOL** | 1 |
| `9292–9349` | **START FLASH** | 3 |
| `9350–9411` | **MODAL UI** | 1 |
| `9412–9492` | **RENDER PREGUNTA** | 1 |
| `9493–9544` | **RESPUESTA** | 1 |
| `9545–9688` | **FINISH** | 1 |
| `9689–9713` | **COINS** | 6 |
| `9714–9730` | **INVENTORY** | 15 |
| `9731–9777` | **COMPRA & COFRES** | 3 |
| `9778–9797` | **AVATAR / PET RENDER HELPERS** | 3 |
| `9798–10143` | **TIENDA UI** | 13 |
| `10144–10553` | **MICRO-CHECK ACTIVO DE VOCALES (P4)** | 5 |
| `10554–10578` | **UI: INTRO SLIDES** | 1 |
| `10579–10632` | **DATA: INTRO MAP** | 3 |
| `10633–10665` | **LETRA QUIZ** | 3 |
| `10666–10733` | **PHASE STEPPER** | 3 |
| `10734–10747` | **ENGINE: LETRA QUIZ** | 1 |
| `10748–10757` | **Show intro slides for a letter sub-group** | 1 |
| `10758–10776` | **8 quiz questions for a sub-group** | 1 |
| `10777–10793` | **Full consonant review (all letters, 8 questions)** | 1 |
| `10794–10795` | **PHASE 2 / 4: present vowels** |  |
| `10796–10923` | **UI: VOWEL PRESENTATION** | 3 |
| `10924–10926` | **PHASE 4: present O/U** | 1 |
| `10927–10942` | **PHASE 5: 6 O/U questions** | 1 |
| `10943–11097` | **PHASE 6: 15 mixed alternating questions** | 7 |
| `11098–11101` | **─** |  |
| `11102–11154` | **UI: TRAINING SCREEN** | 2 |
| `11155–11657` | **UI: TRAINING RENDER** | 16 |
| `11658–11713` | **FUNCIÓN PRINCIPAL** | 1 |
| `11714–11744` | **REINSERCIÓN DE ERRORES** | 1 |
| `11745–12211` | **ENGINE: MISSION / GAME LOOP** | 12 |
| `12212–12692` | **UI: GAME CHALLENGE RENDER** | 11 |
| `12693–13036` | **ENGINE: CHECK ANSWERS** | 11 |
| `13037–13126` | **UI: COMPLETE MODE** | 1 |
| `13127–13296` | **UI: DETECT MODE** | 6 |
| `13297–13336` | **UI: ERROR / SUCCESS PANELS** | 3 |
| `13337–13484` | **ENGINE: HANDLE SUCCESS** | 5 |
| `13485–13486` | **ONBOARDING** |  |
| `13487–13489` | **ONBOARDING** |  |
| `13490–13601` | **ONBOARDING STATE** | 7 |
| `13602–13637` | **LIMPIEZA AUTOMÁTICA DE localStorage** | 1 |
| `13638–13810` | **EXPORT / IMPORT DE PROGRESO** | 3 |
| `13811–14204` | **MILESTONE SEMANAL** | 10 |
| `14205–14238` | **Panel unificado de desafíos (misiones del día + semana)** | 3 |
| `14239–14446` | **DAILY QUEST PANEL TOGGLE** | 8 |
| `14447–14580` | **TEXTOS DEL SIDUR EMBEBIDOS** |  |
| `14581–14624` | **DICCIONARIO MAESTRO DEL EXPLORADOR** | 2 |
| `14625–14680` | **STRIP NIKUDOT — para práctica de lectura sin vocales** | 4 |
| `14681–14861` | **RENDERIZADO DEL EXPLORADOR** | 2 |
| `14862–15686` | **LECTURA CORRIDA DESDE SIDUR** | 26 |
| `15687–15732` | **Permiso de notificaciones con contexto (Rashi)** | 1 |
| `15733–16098` | **Guía de instalación de la PWA** | 10 |
| `16099–16118` | **Completar con tu proyecto de Supabase** |  |
| `16119–16144` | **getProfile() — cache + race condition safe** | 1 |
| `16145–16153` | **Guard: acción requiere institución** | 1 |
| `16154–16162` | **Obtener usuario actual** | 1 |
| `16163–16172` | **Login** | 1 |
| `16173–16201` | **Signup** | 1 |
| `16202–16239` | **Crear institución nueva** | 1 |
| `16240–16252` | **Buscar institución por código/nombre** | 1 |
| `16253–16264` | **Logout** | 1 |
| `16265–16284` | **Cargar perfil del usuario** | 1 |
| `16285–16323` | **Guardar progreso en Supabase (reemplaza syncProgress cuando hay auth)** | 1 |
| `16324–16522` | **Cargar progreso desde Supabase** | 11 |
| `16523–16657` | **Inicializar sesión al arrancar** | 4 |
| `16658–16761` | **Alumno → moré: sheet para escribir una consulta** | 3 |
| `16762–16809` | **Unirse a clase por código** | 1 |
| `16810–16866` | **Sheet "Unirse a una clase" — único punto de entrada de código** | 1 |
| `16867–16878` | **Reintento de membership pendiente (localStorage → Supabase)** | 1 |
| `16879–17115` | **UI del header — mostrar usuario o botón login** | 7 |
| `17116–17179` | **Recuperación de contraseña** | 2 |
| `17180–17192` | **Memoria persistente del coach** | 1 |
| `17193–17199` | **Nivel de usuario (1-10, persistido)** | 1 |
| `17200–17279` | **getUserContext — contexto completo** | 1 |
| `17280–17321` | **Mensajes con variación — evita repetición** | 2 |
| `17322–17384` | **Motor de decisión** | 2 |
| `17385–17418` | **Dificultad dinámica** | 2 |
| `17419–17438` | **Nivel de usuario** | 1 |
| `17439–17511` | **Sistema de misiones diarias** | 3 |
| `17512–17633` | **showCoach() — flujo unificado** | 4 |
| `17634–17686` | **Construir mensaje contextual según estado del usuario** | 1 |
| `17687–17691` | **Guardar timestamp de última actividad** | 1 |
| `17692–17699` | **Verificar cooldown** | 1 |
| `17700–17718` | **Enviar notificación local** | 1 |
| `17719–17749` | **Verificar y enviar notificación según contexto** | 2 |
| `17750–17788` | **Modal amigable antes de pedir permiso** | 1 |
| `17789–17838` | **Verificación periódica (cada 30 min si la app está abierta)** | 3 |
| `17839–17898` | **Performance logging (solo en desarrollo)** |  |
| `17899–17905` | **Normalizador único V1/V2 de estado de onboarding** | 1 |
| `17906–17912` | **Las 3 letras del onboarding** |  |
| `17913–17918` | **Estado** |  |
| `17919–18016` | **Styles (inyectados una vez)** |  |
| `18017–18064` | **Entry point** | 2 |
| `18065–18088` | **DOM root** | 4 |
| `18089–18239` | **Utilidades** | 5 |
| `18240–18331` | **Tap handler** | 2 |
| `18332–18477` | **Feedback incorrecto** | 3 |
| `18478–18520` | **Cerrar overlay** | 3 |
| `18521–18552` | **Racha en ejercicio — HUD visual** | 1 |
| `18553–18602` | **Prompt de cuenta estilo Duolingo** | 1 |
| `18603–19267` | **APP INIT** | 4 |
| `19268–19670` | **RASHI GUIDES — motor de coachmarks "Rashi te muestra"** | 7 |
| `19671–19768` | **LESSON INTERSTITIAL — tarjeta de contexto entre lecciones (P5-A)** | 2 |

---

## Detalle por sección (funciones y sub-bloques)

### `2093–2192` DEBUG FLAG

Funciones: `dbg`(2096), `esc`(2098), `save`(2163), `loadProgressSafe`(2176)

### `2193–2466` SHEKELS SYSTEM

Sub-bloques: `2332` Error feedback diferenciado

Funciones: `getLevel`(2206), `getNextLevel`(2211), `addShekels`(2216), `showLevelUp`(2231), `showShekelFlash`(2270), `onCorrectAnswer`(2294), `onWrongAnswer`(2322), `_showErrorTip`(2352), `onLessonComplete`(2389), `onSeriesComplete`(2409), `updateHudShekels`(2446)

### `2467–2504` STREAK

Funciones: `checkWeeklyStreakGift`(2476), `getStreak`(2496)

### `2505–2554` STREAK FREEZE

Funciones: `getStreakShields`(2510), `addStreakShield`(2511), `useStreakShield`(2515), `updateStreak`(2521)

### `2555–2699` FEEDBACK SENSORIAL (Sonidos + Vibracion)

Funciones: `initAudioContext`(2565), `playTone`(2575), `playSuccessSound`(2596), `playErrorSound`(2607), `playClickSound`(2615), `playCelebrationSound`(2623), `vibrate`(2634), `vibrateSuccess`(2640), `vibrateError`(2644), `vibrateClick`(2648), `feedbackSuccess`(2653), `feedbackError`(2678), `feedbackClick`(2687), `feedbackCelebration`(2692)

### `2700–2772` SPACED REPETITION SYSTEM (SRS)

Funciones: `getSRSData`(2711), `saveSRSData`(2715), `markSeriesReviewed`(2720), `needsReview`(2738), `getMemoryStrength`(2755)

### `2773–2806` ERROR TRACKING

Funciones: `trackError`(2774), `getHardWords`(2782)

### `2807–2840` 3 NIVELES DE DOMINIO POR PALABRA

Funciones: `getDecodingLevel`(2812), `updateDecodingLevel`(2817), `getDecodingLevelLabel`(2834)

### `2841–3010` DIFFICULTY SCORE

Funciones: `getDifficultyScore`(2845), `getAllWordStates`(2868), `wordStateKey`(2921), `getWordState`(2926), `recordWordCorrect`(2938), `recordWordIncorrect`(2973), `getLessonWordStates`(3003)

### `3023–3180` LOGROS / ACHIEVEMENTS

Sub-bloques: `3027` PRIMEROS PASOS (5) · `3052` SERIES BASE (6) · `3062` SERIES MIX (3) · `3069` PALABRAS DOMINADAS (5) · `3076` PERSEVERANCIA / RACHAS DIARIAS (4) · `3084` LITÚRGICOS / SIDUR (4) · `3094` TORÁ / PARASHÁ (3) · `3104` MAESTRÍA (3)

Funciones: `getUnlockedAchievements`(3114), `saveAchievement`(3118), `checkAchievements`(3129), `showAchievementUnlocked`(3144)

### `3181–3228` NEAR MISS EFFECT

Funciones: `checkNearMiss`(3183), `showNearMissToast`(3193)

### `3229–3262` PALABRA DOMINADA FEEDBACK

Funciones: `showWordMasteredFeedback`(3231)

### `3263–3272` PERFECT LESSON BONUS

Funciones: `applyPerfectLessonBonus`(3265)

### `3273–3340` CONTADORES GLOBALES

Funciones: `countMasteredWords`(3274), `getTotalWordStats`(3279), `getUrgentWords`(3288), `getAdaptiveStats`(3307)

### `3341–3404` PARASHA CATALOG

Sub-bloques: `3344` GÉNESIS · `3357` ÉXODO · `3369` LEVÍTICO · `3380` NÚMEROS · `3391` DEUTERONOMIO

### `3405–3453` PARASHA PROGRESS STORAGE

Funciones: `getParashaProgress`(3408), `saveParashaProgress`(3412), `getWordParashaState`(3416), `recordParashaWordCorrect`(3421), `recordParashaWordIncorrect`(3436), `getParashaCompletionPct`(3446)

### `3454–3462` DECODE VERSE

Funciones: `decodeVerse`(3458)

### `3463–3484` KNOWN LETTERS

Funciones: `getKnownLetters`(3466)

### `3485–3495` CAN READ WORD

Funciones: `canReadWord`(3487)

### `3496–3503` EXTRACT WORDS

Funciones: `extractParashaWords`(3499)

### `3504–3511` FILTER BY LEARNED LETTERS

Funciones: `filterByLearnedLetters`(3507)

### `3512–3563` BUILD PARASHA INDEX

Funciones: `buildParashaIndex`(3518)

### `3564–3608` GET ALIYAH WORD POOL

Funciones: `getAliyahWordPool`(3568)

### `3609–3626` CONVERT PARASHA WORDS TO EXERCISE FORMAT

Funciones: `parashaWordsToExerciseFormat`(3612)

### `3627–3655` LOAD PARASHA

Funciones: `loadParasha`(3630)

### `3656–3931` PARASHA SESSION STATE

Funciones: `getReadingType`(3686), `setReadingType`(3694), `loadKriyahData`(3707), `getKriyahAliyot`(3729), `_cleanWord`(3792), `buildVerseMap`(3801), `parseReadingRange`(3835), `buildAliyotFromKriyah`(3854), `buildRefsFromRange`(3885), `getVerseByRef`(3919)

### `3932–4215` SEFARIA HYBRID LAYER

Sub-bloques: `4066` Cache: Map<parashaId, normalizedData> · `4069` Detectar tipo de aliyah a partir del key crudo · `4083` Parsear un string de referencia bíblica con posible | · `4110` Normalizar una entrada [key, value] del JSON · `4128` Normalizar array de entries de lectura (full o trienal) · `4137` Normalizar entrada completa de una parashá · `4182` Wrapper público con cache y fallback · `4204` Invalidar cache (llamar si kriyahData se recarga) · `4209` Exponer al scope global

Funciones: `_loadVerseCache`(3940), `_saveVerseCache`(3954), `_sefariaFetchChapter`(3962), `fetchAndCacheParasha`(4012), `detectTriennialYear`(4031), `getTriennialYear`(4046), `setTriennialYear`(4052)

### `4216–4225` CARGAR DICCIONARIO DE TORÁ

Funciones: `loadTorahDict`(4221)

### `4226–4454` LOOKUP FONÉTICA Y TRADUCCIÓN

Sub-bloques: `4230` Tetragrámaton → siempre "Adonai" · `4244` Lookup normal · `4256` Puntos de referencia · `4267` Mapa consonántico · `4307` Mapa vocálico (nikud) · `4345` Trope / cantilación U+0591–U+05AF → saltar · `4348` Espacio / puntuación · `4353` CASO ESPECIAL: vav + dagesh (shuruk ּו) = vocal 'u' · `4359` CASO ESPECIAL: vav + holam (וֹ) = vocal 'o' · `4366` CASO ESPECIAL: yod — mater lectionis · `4379` CASO ESPECIAL: he final sin vocal = silenciosa · `4388` CONSONANTE HEBREA · `4422` NIKUD / VOCALES

Funciones: `getTorahWordInfo`(4229), `_generateBasicTranslit`(4255), `ord_cp`(4453)

### `4455–4466` IS PARASHA UNLOCKED

Funciones: `isParashaUnlocked`(4458), `isParashaPreviewAvailable`(4461)

### `4467–4490` INVALIDATE PARASHA CACHE

Funciones: `invalidateParashaCache`(4469), `openBMParasha`(4480)

### `4491–4560` START PARASHA SESSION

Funciones: `startParashaSession`(4494)

### `4561–4593` GET MIXED LESSON WORDS

Funciones: `getMixedLessonWords`(4564)

### `4594–4763` PARASHA VERSE READER

Funciones: `getAliyahVerses`(4596), `getLessons`(4614), `lessonKey`(4627), `seriesDone`(4628), `getEverDone`(4637), `markSeriesEverDone`(4640), `seriesEverDone`(4644), `lessonDone`(4647), `invalidateLessonPoolCache`(4670), `setLessonPoolSize`(4675), `showView`(4679), `showToast`(4706), `cleanHebrew`(4723), `cleanTorahText`(4755)

### `4764–4924` Modo Fraseo — ta'amei ha-mikrá como ayuda visual

Funciones: `_wordEndsFraseoUnit`(4774), `_wordHasMajorPause`(4782), `segmentVerseUnits`(4791), `applyFraseoToVerseArea`(4804), `_setFraseoState`(4849), `isSilentShva`(4867), `renderHebrewWithShva`(4883), `getCurrentWord`(4898), `shuffle`(4908), `getSeriesSeed`(4909), `getCurrentLetters`(4912)

### `4925–5114` CALCULAR PRÓXIMO PASO

Funciones: `getSRSDueCount`(4929), `getNextStep`(4944), `toggleGameVowels`(5028), `renderLettersBand`(5038), `renderTrainingHelpers`(5084)

### `5115–5240` UI: ACHIEVEMENTS DRAWER

Funciones: `toggleAchievements`(5116), `renderAchievementsDrawer`(5127), `updateAchievementsBadge`(5219), `markAchievementsSeen`(5235)

### `5241–6790` UI: HOME

Sub-bloques: `5361` SVG coin images (base64 inline) · `5398` HEADER · `5483` SALUDO CON AVATAR Y MASCOTA · `5556` TARJETA "CONTINUAR HOY" · `5566` PRE-CÓMPUTO BM (solo activo cuando isPar=true) · `5603` ─ · `5753` COUNTDOWN DASHBOARD — BAR/BAT MITZVÁ · `5764` Cálculos de progreso · `5910` BOTÓN "EDITAR BAR MITZVÁ" si no hay fecha guardada · `5961` COIN PATH MAP · `5993` EXTENSIÓN "Camino al Bar Mitzvá": 2 monedas más al final del mismo camino · `6062` Banner above series coin (only for active/started series) · `6102` Moneda final del camino: aliá del alumno / Bar-Bat Mitzvá · `6186` Decorative figures · `6206` Línea de tiempo completa: Bereshit → historia, paso uniforme · `6257` MIX SERIES · `6292` SECCIÓN PARASHÁ EN HOME · `6352` BOTONES AL FINAL: TEFILOT + TORÁ · `6356` Banner único: Sidur + Tefilot + Torá · `6558` HEADER COMPACTO + BOTÓN "MÁS" (drawer) · `6622` CONSTRUCCIÓN DEL CAMINO (nodos) · `6677` RENDER de nodos (vertical, transforms/opacity, sin libs) · `6725` Delegación de eventos (sin onclick inline) · `6781` Scroll al nodo actual

Funciones: `buildLevelWidget`(5243), `showSeriesPopup`(5263), `renderHome`(5343), `_phEscape`(6526), `renderPathHome`(6532)

### `6791–6890` PERSONALIZACIÓN BAR MITZVÁ

Funciones: `showBMSettingsModal`(6793)

### `6891–6988` KARAOKE TIMESTAMPS

Funciones: `loadKaraokeTimestamps`(6896), `getKaraokeTimestampKey`(6908), `startKaraokeAudio`(6913)

### `6992–7204` AUDIO_ALIYOT_MAP helpers

Funciones: `getAliyahAudio`(6996), `getAliyahMeta`(7019), `getFirstAliyahMilestone`(7085), `_markFirstAliyahComplete`(7092)

### `7205–7225` READ + LISTEN: setup del audio nativo + resaltado por versículo

Funciones: `_resolveAliyahAudioKey`(7211)

### `7226–7697` SELF RECORD: grabate y comparar (SELF_RECORD, PROMPT I2)

Sub-bloques: `7540` Overlay ceremonia (pantalla completa, tono kavaná — no arcade) · `7577` Certificado (canvas)

Funciones: `_selfRecordSupported`(7241), `_selfRecordMimeType`(7245), `_teardownSelfRecordStream`(7252), `_uploadSelfRecording`(7260), `_selfRecordTeardown`(7284), `_renderSelfRecordUI`(7305), `_toggleSelfRecord`(7332), `_stopSelfRecord`(7375), `_toggleSelfRecordCompare`(7382), `renderReadListenAudio`(7400), `showFirstAliyahCeremony`(7515), `_downloadFirstAliyahCert`(7609), `_drawFirstAliyahCertificate`(7625), `getKaraokeMs`(7694)

### `7698–7706` PREPARAR SPANS

Funciones: `_buildKaraokeWordList`(7700)

### `7707–7885` START / PAUSE / RESUME

Funciones: `startKaraoke`(7708), `pauseKaraoke`(7734), `resumeKaraoke`(7743), `stopKaraoke`(7753), `_karaokeHighlightWord`(7775), `_karaokeAdvance`(7796), `_highlightWord`(7827), `_clearWordHighlight`(7836), `_updateKaraokeUI`(7849), `cycleKaraokeSpeed`(7861), `getMiAliyaTimes`(7879), `saveMiAliyaTimes`(7882)

### `7886–8081` INICIAR MODO MI ALIYÁ

Funciones: `startMiAliya`(7888), `_renderMiAliyaModal`(7904)

### `8082–8306` ALIYAH SELECT

Sub-bloques: `8179` READING TYPE SELECTOR · `8210` TRIENNIAL YEAR SELECTOR (only when triennial is active) · `8244` Info del tipo de lectura activo · `8255` Build aliyah list from kriyah_data (single source of truth)

Funciones: `showAliyahActionSheet`(8085), `showAliyahSelect`(8147)

### `8307–8657` PARASHA READ

Sub-bloques: `8343` TABS DE NAVEGACIÓN POR ALIYÁ · `8372` RENDER VERSES FROM KRIYAH_DATA (single source of truth) · `8645` P5: coachmarks Rashi de la vista de lectura

Funciones: `renderParashaRead`(8309)

### `8658–8770` PARASHA PRACTICE

Funciones: `startParashaPractice`(8662)

### `8771–8920` TUTORIAL FIRST-RUN

Funciones: `getTutorialsSeen`(8776), `markTutorialSeen`(8779), `isTutorialSeen`(8786), `showTutorialIfNeeded`(8799)

### `8921–8963` GENERACIÓN DIARIA

Funciones: `_generateDailyQuests`(8922)

### `8964–8983` LOAD / SAVE

Funciones: `getDailyQuests`(8965), `saveDailyQuests`(8979)

### `8984–9029` TRACKING

Funciones: `trackDailyQuestEvent`(8988)

### `9030–9055` BONUS ANIMATION

Funciones: `showDailyBonusAnimation`(9031)

### `9056–9149` RENDER TARJETA HOME

Funciones: `renderDailyQuestCard`(9057)

### `9150–9189` REFRESH EN HOME

Funciones: `_refreshQuestCard`(9151)

### `9190–9291` BUILD QUESTION POOL

Funciones: `_buildFlashQuestions`(9191)

### `9292–9349` START FLASH

Funciones: `startFlashRecall`(9293), `startSpeedMode`(9307), `_buildSpeedOptions`(9340)

### `9350–9411` MODAL UI

Funciones: `_showFlashModal`(9351)

### `9412–9492` RENDER PREGUNTA

Funciones: `_renderFlashQuestion`(9413)

### `9493–9544` RESPUESTA

Funciones: `_answerFlash`(9494)

### `9545–9688` FINISH

Funciones: `_finishFlash`(9546)

### `9689–9713` COINS

Funciones: `getCoins`(9690), `setCoins`(9691), `addCoins`(9692), `spendCoins`(9698), `updateCoinDisplay`(9699), `showCoinFlash`(9707)

### `9714–9730` INVENTORY

Funciones: `getInventory`(9715), `saveInventory`(9716), `addToInventory`(9717), `hasInInventory`(9718), `getActiveAvatar`(9719), `getActiveFrame`(9720), `getActivePet`(9721), `setActiveAvatar`(9722), `setActiveFrame`(9723), `setActivePet`(9724), `getPowerupCount`(9725), `addPowerup`(9726), `usePowerup`(9727), `isPowerupActive`(9728), `activatePowerup`(9729)

### `9731–9777` COMPRA & COFRES

Funciones: `buyItem`(9732), `openChest`(9746), `initShopInventory`(9761)

### `9778–9797` AVATAR / PET RENDER HELPERS

Funciones: `avatarImgHtml`(9779), `getActiveAvatarItem`(9789), `getActivePetItem`(9794)

### `9798–10143` TIENDA UI

Funciones: `rarityStyle`(9799), `makeShopCard`(9808), `showShopView`(9840), `renderShopTab`(9855), `renderShopAvatars`(9866), `renderShopFrames`(9876), `renderShopPets`(9886), `renderShopPowerups`(9904), `renderShopChests`(9915), `startSeries`(9951), `_markIntroSeen`(10037), `_deferVowelsIntro`(10041), `_showAnchorsIfNeeded`(10059)

### `10144–10553` MICRO-CHECK ACTIVO DE VOCALES (P4)

Funciones: `_pickVowelDistractors`(10149), `_runVowelsMicroCheck`(10156), `_showVowelsIntro2`(10243), `_showVowelsIntro3`(10361), `_showVowelsIntro`(10462)

### `10554–10578` UI: INTRO SLIDES

Funciones: `renderIntroSlide`(10555)

### `10579–10632` DATA: INTRO MAP

Funciones: `playIntroAudio`(10614), `introNext`(10616), `skipIntro`(10623)

### `10633–10665` LETRA QUIZ

Funciones: `vowelsForSounds`(10646), `vowelDisplay`(10654), `vowelOnMem`(10664)

### `10666–10733` PHASE STEPPER

Funciones: `buildLqPhases`(10669), `getLetterGroups`(10687), `renderLqStepper`(10713)

### `10734–10747` ENGINE: LETRA QUIZ

Funciones: `startLetraQuiz`(10736)

### `10748–10757` Show intro slides for a letter sub-group

Funciones: `runLqGroupIntro`(10749)

### `10758–10776` 8 quiz questions for a sub-group

Funciones: `runLqGroupQuiz`(10759)

### `10777–10793` Full consonant review (all letters, 8 questions)

Funciones: `runLqPhase1`(10778)

### `10796–10923` UI: VOWEL PRESENTATION

Funciones: `runVowelPresent`(10797), `continueVowelPresent`(10905), `runLqPhase3`(10909)

### `10924–10926` PHASE 4: present O/U

Funciones: `runLqPhase4`(10925)

### `10927–10942` PHASE 5: 6 O/U questions

Funciones: `runLqPhase5`(10928)

### `10943–11097` PHASE 6: 15 mixed alternating questions

Funciones: `runLqPhase6`(10944), `buildQuizPool`(10971), `renderLetraQuizSlide`(10979), `handleLqAnswer`(11040), `advanceLqPhase`(11063), `finishLetraQuiz`(11089), `skipLetraQuiz`(11094)

### `11102–11154` UI: TRAINING SCREEN

Funciones: `renderColoredSyllable`(11103), `toggleTrainingRef`(11144)

### `11155–11657` UI: TRAINING RENDER

Sub-bloques: `11228` SELECT · `11240` LISTEN · `11252` WRITE · `11264` ARRANGE · `11282` COMPLETE · `11299` DETECT

Funciones: `renderTraining`(11156), `skipTraining`(11201), `getAvailableTemplates`(11314), `generateExercise`(11327), `pickTemplate`(11337), `getConfusiblePairs`(11394), `getConfusibleLetters`(11405), `wordHasVisualConfusion`(11415), `getVisualConfusionBoost`(11423), `pickChallengeType`(11431), `classifyWordsByState`(11491), `selectAdaptiveWordMix`(11523), `getCarryoverWords`(11578), `getSrsOverdueWords`(11602), `challengesForWord`(11629), `orderChallenges`(11642)

### `11658–11713` FUNCIÓN PRINCIPAL

Funciones: `generateLessonPool`(11661)

### `11714–11744` REINSERCIÓN DE ERRORES

Funciones: `reinsertErrorChallenge`(11717)

### `11745–12211` ENGINE: MISSION / GAME LOOP

Sub-bloques: `11758` Generador dinámico de lección · `11944` Modo rápido: no mostrar celebración, avanzar directamente · `12013` CELEBRACIÓN VISUAL · `12109` Sidur context hint: show where these words appear in real prayers

Funciones: `startMission`(11747), `updateGameUI`(11782), `nextChallenge`(11802), `startSpeedRead`(11825), `srShowCard`(11846), `srReveal`(11874), `srAnswer`(11896), `srNext`(11907), `srSkip`(11916), `srFinish`(11920), `showCelebration`(11931), `_runCelebration`(11963)

### `12212–12692` UI: GAME CHALLENGE RENDER

Sub-bloques: `12385` Generar distractores coherentes

Funciones: `getFadingDuration`(12228), `showTranslitFading`(12244), `hideTranslitFading`(12279), `renderGameChallenge`(12290), `renderSelectMode`(12380), `renderWriteMode`(12447), `renderListenMode`(12461), `wordSimilarityScore`(12531), `getDistractorPool`(12563), `buildFoneticaDistractors`(12585), `buildHebrewDistractors`(12642)

### `12693–13036` ENGINE: CHECK ANSWERS

Funciones: `checkWrite`(12695), `stopAudio`(12766), `playAudio`(12776), `startQuickPractice`(12798), `_renderQuickHUD`(12820), `_endQuickMode`(12853), `_speakHebrew`(12911), `playCurrentWordAudio`(12934), `splitHebBlocks`(12972), `_getConFon`(12989), `mapBlocksToFon`(13000)

### `13037–13126` UI: COMPLETE MODE

Funciones: `renderCompleteMode`(13039)

### `13127–13296` UI: DETECT MODE

Funciones: `renderDetectMode`(13129), `renderArrangeMode`(13205), `renderArrangeTiles`(13218), `arrangePick`(13278), `arrangePop`(13284), `arrangeUndo`(13290)

### `13297–13336` UI: ERROR / SUCCESS PANELS

Funciones: `showErrorPanel`(13298), `hideErrorPanel`(13310), `showWordIntroFromError`(13315)

### `13337–13484` ENGINE: HANDLE SUCCESS

Funciones: `handleSuccess`(13338), `toggleHelp`(13404), `exitGame`(13415), `goNextLesson`(13439), `startReview`(13447)

### `13490–13601` ONBOARDING STATE

Funciones: `startOnboarding`(13498), `_obPopulateParashaSelect`(13510), `_obShowSlide`(13537), `onboardNext`(13576), `getPlayerName`(13583), `_obSavePersonalization`(13585), `finishOnboarding`(13594)

### `13602–13637` LIMPIEZA AUTOMÁTICA DE localStorage

Funciones: `cleanupLocalStorage`(13604)

### `13638–13810` EXPORT / IMPORT DE PROGRESO

Funciones: `exportProgress`(13642), `importProgress`(13670), `showExportModal`(13705)

### `13811–14204` MILESTONE SEMANAL

Funciones: `checkWeeklyMilestone`(13817), `_updateWeeklyBtnLabel`(13885), `_getWeekId`(13891), `getWeeklyChallenges`(13897), `saveWeeklyChallenges`(13907), `trackWeeklyEvent`(13911), `renderWeeklyChallengesCard`(13927), `_fetchClassRanking`(13991), `toggleRankingPanel`(14077), `_renderRankingPanel`(14092)

### `14205–14238` Panel unificado de desafíos (misiones del día + semana)

Funciones: `toggleChallengesPanel`(14206), `_updateChallengesBtnLabel`(14221), `_updateQuestBtnLabel`(14236)

### `14239–14446` DAILY QUEST PANEL TOGGLE

Funciones: `toggleDailyQuestPanel`(14241), `getParashaForDate`(14243), `getServiciosForDate`(14248), `getTefilaProgress`(14327), `saveTefilaProgress`(14332), `recordTefilaWordCorrect`(14336), `loadTefila`(14347), `showTefilotView`(14362)

### `14581–14624` DICCIONARIO MAESTRO DEL EXPLORADOR

Funciones: `buildSidurDictionary`(14584), `normalizeSidurWord`(14616)

### `14625–14680` STRIP NIKUDOT — para práctica de lectura sin vocales

Funciones: `stripNikudot`(14627), `tokenizeSidurVerse`(14634), `calcSidurTextStats`(14639), `getSidurStats`(14662)

### `14681–14861` RENDERIZADO DEL EXPLORADOR

Sub-bloques: `14710` Toggle "sin nikudot" en Sidur · `14849` Botón "Lectura corrida" — practica palabra por palabra en voz alta

Funciones: `showSidurExplorer`(14685), `renderSidurText`(14739)

### `14862–15686` LECTURA CORRIDA DESDE SIDUR

Sub-bloques: `15470` Opción C: REST propio · `15476` Sin backend: solo garantizar guardado local robusto

Funciones: `startSidurLectura`(14865), `loadAndShowTefila`(14913), `renderTefilaRead`(14923), `startTefilaKaraoke`(15063), `extractLecturaWords`(15087), `startTefilaPractice`(15131), `lecturaRenderWord`(15165), `lecturaTapWord`(15215), `lecturaAnswer`(15226), `lecturaShowResult`(15258), `lecturaClose`(15331), `openIDB`(15346), `saveProgress`(15360), `loadProgress`(15384), `syncProgress`(15447), `_flushSyncQueue`(15540), `_syncToREST`(15547), `_enqueueSyncItem`(15558), `_getSyncQueue`(15573), `_clearSyncQueue`(15578), `_getSyncUserId`(15583), `saveWithIDB`(15595), `subscribeUserToPush`(15623), `subscribeAndSave`(15656), `urlBase64ToUint8Array`(15664), `savePushSubscription`(15672)

### `15687–15732` Permiso de notificaciones con contexto (Rashi)

Funciones: `_maybeAskPushPermission`(15689)

### `15733–16098` Guía de instalación de la PWA

Funciones: `_isStandalone`(15737), `showInstallGuide`(15741), `_maybeOfferInstall`(15794), `scheduleDailyReminder`(15810), `trackEvent`(15851), `flushAnalytics`(15870), `getAnalyticsData`(15884), `renderAnalyticsDashboard`(15940), `openAnalyticsDashboard`(16071), `closeAnalyticsDashboard`(16080)

### `16119–16144` getProfile() — cache + race condition safe

Funciones: `getProfile`(16120)

### `16145–16153` Guard: acción requiere institución

Funciones: `_requireInstitution`(16146)

### `16154–16162` Obtener usuario actual

Funciones: `getAuthUser`(16155)

### `16163–16172` Login

Funciones: `authLogin`(16164)

### `16173–16201` Signup

Funciones: `authSignup`(16174)

### `16202–16239` Crear institución nueva

Funciones: `createInstitution`(16203)

### `16240–16252` Buscar institución por código/nombre

Funciones: `findInstitution`(16241)

### `16253–16264` Logout

Funciones: `authLogout`(16254)

### `16265–16284` Cargar perfil del usuario

Funciones: `_loadProfile`(16266)

### `16285–16323` Guardar progreso en Supabase (reemplaza syncProgress cuando hay auth)

Funciones: `syncProgressToSupabase`(16293)

### `16324–16522` Cargar progreso desde Supabase

Funciones: `loadProgressFromSupabase`(16325), `loadActiveAssignments`(16346), `assignmentTitle`(16370), `renderAssignmentCard`(16386), `goToAssignmentTarget`(16412), `completeAssignmentIfMatch`(16432), `insertAssignmentProgress`(16440), `queueAssignmentProgress`(16458), `flushPendingAssignmentProgress`(16468), `renderAliyahAssignmentButton`(16487), `_isLocalProgressEmpty`(16514)

### `16523–16657` Inicializar sesión al arrancar

Funciones: `initAuth`(16524), `fetchNotifications`(16603), `markNotificationRead`(16622), `showBackendNotifications`(16634)

### `16658–16761` Alumno → moré: sheet para escribir una consulta

Funciones: `showMessageTeacherSheet`(16659), `_showTeacherMessage`(16718), `savePushSubscription`(16748)

### `16762–16809` Unirse a clase por código

Funciones: `joinClassByCode`(16763)

### `16810–16866` Sheet "Unirse a una clase" — único punto de entrada de código

Funciones: `showJoinClassSheet`(16812)

### `16867–16878` Reintento de membership pendiente (localStorage → Supabase)

Funciones: `_retryPendingMemberships`(16868)

### `16879–17115` UI del header — mostrar usuario o botón login

Funciones: `_updateAuthHeader`(16880), `authSwitchTab`(16953), `authSelectRole`(16977), `authInstMode`(17003), `_authShowError`(17019), `authSubmit`(17026), `authSkip`(17111)

### `17116–17179` Recuperación de contraseña

Funciones: `authForgotPassword`(17117), `_showNewPasswordSheet`(17136)

### `17180–17192` Memoria persistente del coach

Funciones: `_saveCoachMemory`(17189)

### `17193–17199` Nivel de usuario (1-10, persistido)

Funciones: `_saveUserLevel`(17196)

### `17200–17279` getUserContext — contexto completo

Sub-bloques: `17232` Señales predictivas — últimos 10 eventos de respuesta · `17244` Estado emocional derivado · `17251` Progreso de misión actual

Funciones: `getUserContext`(17201)

### `17280–17321` Mensajes con variación — evita repetición

Funciones: `_pickMsgWithMood`(17306), `_pickMsg`(17317)

### `17322–17384` Motor de decisión

Sub-bloques: `17347` 1. Señales predictivas (máxima prioridad) · `17351` 2. Errores consecutivos (reacción inmediata) · `17355` 3. Estado emocional + métricas combinados · `17365` 4. Integración con misión activa · `17372` 5. Positivos — verificar coherencia (no celebrar si hay errores)

Funciones: `getPredictiveSignals`(17326), `getCoachDecision`(17344)

### `17385–17418` Dificultad dinámica

Funciones: `getDynamicDifficulty`(17388), `getDistractorCount`(17411)

### `17419–17438` Nivel de usuario

Funciones: `updateUserLevel`(17420)

### `17439–17511` Sistema de misiones diarias

Funciones: `_getActiveMission`(17451), `updateMissionProgress`(17462), `renderMissionBadge`(17491)

### `17512–17633` showCoach() — flujo unificado

Funciones: `showCoach`(17513), `showCoachMessage`(17610), `runCoachCheck`(17611), `analyzeUserBehavior`(17624)

### `17634–17686` Construir mensaje contextual según estado del usuario

Sub-bloques: `17659` Mensajes según contexto

Funciones: `getSmartNotification`(17635)

### `17687–17691` Guardar timestamp de última actividad

Funciones: `updateLastActivity`(17688)

### `17692–17699` Verificar cooldown

Funciones: `canSendNotification`(17693)

### `17700–17718` Enviar notificación local

Funciones: `sendLocalNotification`(17701)

### `17719–17749` Verificar y enviar notificación según contexto

Funciones: `checkAndNotify`(17720), `requestNotifPermission`(17727)

### `17750–17788` Modal amigable antes de pedir permiso

Funciones: `showNotifPrompt`(17751)

### `17789–17838` Verificación periódica (cada 30 min si la app está abierta)

Funciones: `startNotifScheduler`(17791), `throttleRAF`(17817), `debounce`(17831)

### `17899–17905` Normalizador único V1/V2 de estado de onboarding

Funciones: `isOnboardingDone`(17902)

### `18017–18064` Entry point

Funciones: `startOnboardingFlow`(18018), `_obPhase_welcome`(18033)

### `18065–18088` DOM root

Funciones: `_obMount`(18066), `_obRender`(18073), `_obClearTimers`(18078), `_obDelay`(18083)

### `18089–18239` Utilidades

Funciones: `_obSpeak`(18090), `_obProgressHTML`(18105), `_obShekelHUD`(18120), `_obPhase_intro`(18135), `_obPhase_quiz`(18187)

### `18240–18331` Tap handler

Funciones: `_obHandleTap`(18241), `_obPhase_feedback_correct`(18276)

### `18332–18477` Feedback incorrecto

Funciones: `_obPhase_feedback_wrong`(18333), `_obPhase_next_letter`(18375), `_obPhase_save_prompt`(18409)

### `18478–18520` Cerrar overlay

Funciones: `_obClose`(18479), `_obFinish`(18490), `resetOnboarding`(18509)

### `18521–18552` Racha en ejercicio — HUD visual

Funciones: `_updateStreakHUD`(18522)

### `18553–18602` Prompt de cuenta estilo Duolingo

Funciones: `_showAuthPrompt`(18555)

### `18603–19267` APP INIT

Sub-bloques: `18664` Navigation · `18758` Welcome / Onboarding · `18764` Mini-ejercicio slide 3 · `18788` Slide 4: cuenta regresiva al elegir fecha · `18878` Intro slides · `18882` Letra Quiz · `18887` Pre-training · `18891` Training ref toggle · `18894` Game · `18902` Celebration · `18907` Parasha buttons · `18918` SERVICE WORKER · `18995` SPLASH SCREEN — ocultar tras render real + mínimo 600ms · `19157` 1. PARPADEO IRREGULAR · `19178` 2. FOLLOW CURSOR / TOUCH (máx 5px, solo en desktop) · `19229` 3. MICRO DELAY EN REACCIONES

Funciones: `startApp`(18604), `setMascotState`(19060), `celebrate`(19109), `restoreMascot`(19131)

### `19268–19670` RASHI GUIDES — motor de coachmarks "Rashi te muestra"

Sub-bloques: `19289` P5: coachmarks de la vista de lectura de Torá

Funciones: `_rashiGuideKey`(19326), `rashiGuide`(19328), `_rashiGuideRender`(19355), `_rashiGuideClose`(19494), `_ensureRashiHelpBtn`(19528), `_rashiHelpVowelsHtml`(19558), `_openRashiHelpSheet`(19580)

### `19671–19768` LESSON INTERSTITIAL — tarjeta de contexto entre lecciones (P5-A)

Funciones: `_lessonInterstitialContent`(19678), `_showLessonInterstitial`(19687)

---

## Constantes / feature flags top-level

| Línea | Constante | Valor (inicio) |
|---|---|---|
| 2095 | `DEBUG` | `false;` |
| 2110 | `FULL_ALEF_BET` | `[{"h": "א", "p": "Muda"}, {"h": "ב", "p": "B"}, {"…` |
| 2112 | `LETTER_FON_MAP` | `Object.fromEntries(FULL_ALEF_BET.map(x => [x.h, x.…` |
| 2114 | `FULL_VOWELS` | `[{"h": "ָ", "p": "A"}, {"h": "ַ", "p": "A"}, {"h":…` |
| 2116 | `NIKUDOT_BLOCKS` | `{"block1":{"name":"Vocales básicas","series_trigge…` |
| 2130 | `STORAGE_KEY` | `"heb_pro_v19_shekels";` |
| 2194 | `SHEKEL_LEVELS` | `[` |
| 2474 | `STREAK_WEEKLY_KEY` | `'heb_streak_weekly_gift';` |
| 2508 | `STREAK_SHIELD_KEY` | `'heb_streak_shield';` |
| 2708 | `SRS_KEY` | `"heb_srs_reviews";` |
| 2709 | `SRS_INTERVALS` | `[1, 3, 7, 14, 30]; // dias entre repasos` |
| 2798 | `WORD_STATE_KEY` | `"heb_word_states_v1";` |
| 2801 | `WORD_THRESHOLDS` | `{` |
| 3026 | `ACHIEVEMENTS` | `[` |
| 3112 | `ACHIEVEMENTS_KEY` | `"heb_achievements_v1";` |
| 3343 | `PARASHA_CATALOG` | `[` |
| 3406 | `PARASHA_PROGRESS_KEY` | `"heb_parasha_progress_v1";` |
| 4613 | `LESSON_SIZE` | `7;` |
| 4636 | `EVER_DONE_KEY` | `'heb_series_ever_done';` |
| 4768 | `FRASEO_MODE` | `true;` |
| 4770 | `FRASEO_DISJUNCTIVES` | `[0x0591,0x0592,0x0594,0x0595,0x0596,0x0597,0x059B]…` |
| 4864 | `SHVA` | `'\u05B0'; // ְ` |
| 4865 | `LONG_VOWELS` | `new Set(['\u05B8','\u05B5','\u05B4','\u05B9','\u05…` |
| 5342 | `PATH_HOME` | `false;` |
| 7044 | `KARAOKE_SPEEDS` | `[` |
| 7069 | `READ_LISTEN_MODE` | `true;` |
| 7073 | `SELF_RECORD` | `true;` |
| 7074 | `SELF_RECORD_UPLOAD` | `true; // bucket + RLS ya aplicados (self_record_up…` |
| 7082 | `FIRST_ALIYAH_CEREMONY` | `true;` |
| 7083 | `FIRST_ALIYAH_KEY` | `'heb_milestone_first_aliyah';` |
| 7113 | `VERSE_TIMINGS` | `{` |
| 7513 | `FIRST_ALIYAH_BLESSING_AUDIO` | `'';` |
| 7877 | `MI_ALIYA_KEY` | `'heb_mi_aliya_times'; // {parashaId_aliyah_verseId…` |
| 8774 | `TUTORIAL_KEY` | `'heb_tutorials_seen';` |
| 8790 | `TUTORIAL_TEXTS` | `{` |
| 8879 | `DQ_KEY` | `'heb_daily_quests';` |
| 8880 | `DQ_DATE_KEY` | `'heb_daily_quest_date';` |
| 8882 | `DQ_XP_PER_QUEST` | `5;` |
| 8883 | `DQ_SHEKELS_QUEST` | `2;` |
| 8884 | `DQ_XP_BONUS` | `15;` |
| 8885 | `DQ_SHEKELS_BONUS` | `5;` |
| 8888 | `QUEST_TYPES` | `{` |
| 9173 | `FLASH_QUESTIONS` | `3;      // preguntas por micro-loop` |
| 9174 | `FLASH_TIMEOUT_MS` | `3000;   // ms por pregunta` |
| 9175 | `FLASH_XP_BASE` | `5;` |
| 9176 | `FLASH_XP_BONUS` | `3;` |
| 9177 | `FLASH_SHEKELS` | `1;` |
| 9616 | `COINS_KEY` | `'heb_coins';` |
| 9617 | `INVENTORY_KEY` | `'heb_inventory';` |
| 9619 | `AVATARS` | `[` |
| 9636 | `FRAMES` | `[` |
| 9644 | `PETS` | `[` |
| 9658 | `POWERUPS` | `[` |
| 9664 | `CHESTS` | `[` |
| 9670 | `CHEST_REWARDS` | `{` |
| 10116 | `VOWELS_BLOCK2` | `[` |
| 10334 | `VOWELS_BLOCK3` | `[` |
| 10453 | `VOWELS_BLOCK1` | `[` |
| 10581 | `LETRA_INTRO_MAP` | `{` |
| 10643 | `VOW_AEI` | `['A','E','I'];` |
| 10644 | `VOW_OU` | `['O','U'];` |
| 10704 | `LQ_PHASES` | `[` |
| 11226 | `EXERCISE_TEMPLATES` | `{` |
| 11360 | `CHALLENGE_TYPES` | `[` |
| 11368 | `STATUS_ORDER` | `{ new: 0, learning: 1, review: 2, mastered: 3 };` |
| 11378 | `VISUAL_CONFUSIBLES` | `[` |
| 11484 | `ADAPTIVE_MIX` | `{ learning: 0.40, review: 0.30, new: 0.20, mastere…` |
| 11487 | `ERROR_REINSERTION_REPS` | `1;` |
| 11601 | `SRS_INLESSON_DAYS` | `7; // días sin practicar → entra al pool` |
| 11817 | `SR_MIN_WORDS` | `3; // mínimo de palabras para activar SPEED_READ` |
| 12789 | `QUICK_MODE_DURATION` | `5 * 60 * 1000; // 5 minutos en ms` |
| 13495 | `OB_BM_DATE_KEY` | `'heb_bm_date';     // fecha del Bar/Bat Mitzvá` |
| 13496 | `OB_PARASHA_KEY` | `'heb_bm_parasha';  // id de la parashá elegida` |
| 13581 | `OB_NAME_KEY` | `'heb_player_name';` |
| 13814 | `WEEKLY_KEY` | `'heb_weekly_challenges';` |
| 13815 | `WEEKLY_MILESTONE_KEY` | `'heb_weekly_milestone';` |
| 13989 | `RANKING_CACHE_TTL` | `60000; // 1 minuto` |
| 14286 | `WEEKLY_CHALLENGES` | `[` |
| 14297 | `TEFILA_CATALOG` | `[` |
| 14325 | `TEFILA_PROGRESS_KEY` | `'heb_tefila_progress_v1';` |
| 14450 | `SIDUR_TEXTS` | `[` |
| 15342 | `IDB_NAME` | `'alefmaster-db';` |
| 15343 | `IDB_VERSION` | `1;` |
| 15344 | `IDB_STORE` | `'progress';` |
| 15430 | `SYNC_QUEUE_KEY` | `'heb_sync_queue';` |
| 15445 | `SYNC_ENDPOINT` | `''; // URL del backend cuando esté listo` |
| 15621 | `VAPID_PUBLIC_KEY` | `'BI7KLgkhiDFGOH6LGgUwVTwtCT_7O2MW5UtiXxS2WJ3ZTb-an…` |
| 15841 | `ANALYTICS_KEY` | `'heb_analytics';` |
| 15842 | `ANALYTICS_MAX` | `500;   // máx eventos guardados localmente` |
| 16100 | `SUPABASE_URL` | `'https://gxofwhomnjjffhmoffgl.supabase.co';` |
| 16101 | `SUPABASE_ANON` | `'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJz…` |
| 16290 | `SUPABASE_SYNC_MIN_INTERVAL` | `60000; // no más de 1 sync real cada 60s` |
| 16343 | `PENDING_ASSIGNMENT_PROGRESS_KEY` | `'heb_pending_assignment_progress';` |
| 17281 | `COACH_MSGS` | `{` |
| 17440 | `MISSIONS` | `[` |
| 17629 | `NOTIF_COOLDOWN_KEY` | `'heb_last_notif';` |
| 17630 | `NOTIF_PERM_KEY` | `'heb_notif_asked';` |
| 17631 | `NOTIF_COOLDOWN_MS` | `4 * 60 * 60 * 1000; // 4 horas entre notificacione…` |
| 17632 | `NOTIF_INACTIVITY` | `22 * 60 * 60 * 1000; // 22 horas = "hace 1 día"` |
| 17896 | `OB_WELCOME_KEY` | `'welcome_seen';` |
| 17897 | `OB_DONE_KEY` | `'onboarding_done';` |
| 17907 | `OB_ROUNDS` | `[` |
| 19034 | `MASCOT_STATES` | `['idle','success','error','loading','happy','think…` |
| 19037 | `MASCOT_DURATIONS` | `{` |
| 19050 | `MASCOT_IMG_MAP` | `{` |
| 19271 | `RASHI_GUIDES_MODE` | `true;` |
| 19273 | `RASHI_GUIDES` | `{` |
| 19316 | `RASHI_GUIDE_MASCOT_IMG` | `{` |
| 19522 | `RASHI_HELP_VOWEL_BLOCKS` | `[` |
| 19674 | `LESSON_INTERSTITIAL_MODE` | `true;` |

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