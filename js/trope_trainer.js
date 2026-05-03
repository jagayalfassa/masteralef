// ╔═══════════════════════════════════════════════════════════════╗
// ║  AlefMaster — trope_trainer.js                               ║
// ║  Entrenador de Cantilación de la Torá — Ta'amei HaMikrá     ║
// ║  Emula la funcionalidad de tropetrainer.com                  ║
// ╚═══════════════════════════════════════════════════════════════╝
//
// DEPENDENCIAS: showView, showToast (definidas en index.html)
//

/* globals showView, showToast */

// ── Frecuencias de notas (A4 = 440 Hz) ───────────────────────
const _TT_HZ = {
  C4:261.63, D4:293.66, E4:329.63, F4:349.23, Fs4:369.99,
  G4:392.00, Gs4:415.30, A4:440.00, As4:466.16, B4:493.88,
  C5:523.25, Cs5:554.37, D5:587.33, E5:659.25
};
const _H = _TT_HZ;

// ── 25 Ta'amei HaMikrá (sistema tiberiano, Torah) ─────────────
//
// melody: [[freq, durMs], ...]  → contorno melódico aproximado
//   (tradición ashkenazí estilizada para uso educativo)
//
const TT_TROPES = [
  // ════════════════════════════════════════════
  //  DISYUNTIVOS  (מְלָכִים — "reyes")
  //  Crean pausas; dividen el versículo en frases
  // ════════════════════════════════════════════
  {
    id:'siluk',        type:'disjunctive', level:1,
    heb:'סִלּוּק',    heb_plain:'סלוק',      esp:'Siluk',
    desc:'Marca el fin del versículo. Siempre aparece junto al sof pasuk (׃). La cadencia final de cada verso de la Torá.',
    char:'ֽ',
    position:'below',  color:'#C0392B',
    melody:[[_H.E4,200],[_H.D4,200],[_H.C4,450]],
    example:'הָאָֽרֶץ׃'
  },
  {
    id:'etnachta',     type:'disjunctive', level:1,
    heb:'אֶתְנַחְתָּא', heb_plain:'אתנחתא',  esp:'Etnajta',
    desc:'La pausa mayor dentro del versículo. Funciona como un "punto y coma" que divide el verso en dos mitades.',
    char:'֑',
    position:'below',  color:'#E74C3C',
    melody:[[_H.E4,120],[_H.G4,250],[_H.Fs4,150],[_H.E4,380]],
    example:'אֱלֹהִ֑ים'
  },
  {
    id:'zakef_katan',  type:'disjunctive', level:2,
    heb:'זָקֵף קָטָן', heb_plain:'זקף קטן',  esp:'Zakef Katán',
    desc:'Pausa secundaria, tercer nivel jerárquico. Uno de los signos más frecuentes en la Torá.',
    char:'֔',
    position:'above',  color:'#E67E22',
    melody:[[_H.G4,180],[_H.A4,150],[_H.G4,420]],
    example:'תֹ֔הוּ'
  },
  {
    id:'zakef_gadol',  type:'disjunctive', level:2,
    heb:'זָקֵף גָּדוֹל', heb_plain:'זקף גדול', esp:'Zakef Gadol',
    desc:'Variante del Zakef Katán, más enfática. Aparece raramente.',
    char:'֕',
    position:'above',  color:'#D35400',
    melody:[[_H.G4,150],[_H.A4,150],[_H.B4,280],[_H.A4,370]],
    example:'וַיְהִ֕י'
  },
  {
    id:'tipeha',       type:'disjunctive', level:2,
    heb:'טִפְחָא',    heb_plain:'טפחא',      esp:'Tifjá',
    desc:'También llamado Tarjá o Tarsa. Pausa de tercer nivel, muy común antes de la Etnajta y el Siluk.',
    char:'֖',
    position:'below',  color:'#F39C12',
    melody:[[_H.E4,150],[_H.F4,130],[_H.G4,150],[_H.E4,370]],
    example:'בְּרֵאשִׁ֖ית'
  },
  {
    id:'segol',        type:'disjunctive', level:2,
    heb:'סֶגּוֹל',    heb_plain:'סגול',      esp:'Segol (acento)',
    desc:'No confundir con la vocal segol. Este acento disyuntivo aparece en posición de cláusula final.',
    char:'֒',
    position:'above',  color:'#8E44AD',
    melody:[[_H.G4,200],[_H.E4,180],[_H.G4,420]],
    example:'לֵאמֹ֒ר'
  },
  {
    id:'shalshelet',   type:'disjunctive', level:1,
    heb:'שַׁלְשֶׁלֶת', heb_plain:'שלשלת',   esp:'Shalshélet',
    desc:'La "cadena". Melodía larga y oscilante. Muy raro: aparece solo 4 veces en toda la Torá, en momentos de gran dramatismo.',
    char:'֓',
    position:'above',  color:'#9B59B6',
    melody:[[_H.E4,75],[_H.G4,75],[_H.E4,75],[_H.G4,75],[_H.E4,75],[_H.G4,75],[_H.A4,420]],
    example:'וַיִּשְׁחָ֓ט'
  },
  {
    id:'revii',        type:'disjunctive', level:3,
    heb:'רְבִיעִי',   heb_plain:'רביעי',     esp:'Revi\'i',
    desc:'Cuarto nivel disyuntivo. Tiene forma de diamante sobre la palabra.',
    char:'֗',
    position:'above',  color:'#27AE60',
    melody:[[_H.G4,260],[_H.Fs4,200],[_H.E4,440]],
    example:'וְהָאָ֗רֶץ'
  },
  {
    id:'zarqa',        type:'disjunctive', level:3,
    heb:'זַרְקָא',    heb_plain:'זרקא',      esp:'Zarká',
    desc:'También llamado Tsinor. Siempre precede al Segol en la frase.',
    char:'֘',
    position:'above',  color:'#1ABC9C',
    melody:[[_H.A4,200],[_H.C5,190],[_H.B4,360]],
    example:'הָאֹ֘הֶל'
  },
  {
    id:'pashta',       type:'disjunctive', level:3,
    heb:'פַּשְׁטָא',  heb_plain:'פשטא',      esp:'Pashtá',
    desc:'Cuarto nivel disyuntivo. Normalmente lleva a Kadmá antes como su sirviente.',
    char:'֙',
    position:'above',  color:'#16A085',
    melody:[[_H.E4,140],[_H.G4,140],[_H.A4,140],[_H.G4,360]],
    example:'תֹ֙הוּ֙'
  },
  {
    id:'yetiv',        type:'disjunctive', level:3,
    heb:'יְתִיב',     heb_plain:'יתיב',      esp:'Yetiv',
    desc:'Prepositive: se escribe encima de la primera letra de la palabra (no de la letra tónica).',
    char:'֚',
    position:'below',  color:'#2980B9',
    melody:[[_H.D4,200],[_H.E4,140],[_H.G4,360]],
    example:'בַּ֚יּוֹם'
  },
  {
    id:'tevir',        type:'disjunctive', level:3,
    heb:'תְּבִיר',    heb_plain:'תביר',      esp:'Tevir',
    desc:'Significa "roto". Su melodía desciende, creando sensación de suspensión.',
    char:'֛',
    position:'below',  color:'#2471A3',
    melody:[[_H.D4,190],[_H.E4,190],[_H.D4,140],[_H.C4,420]],
    example:'אֱלֹהִ֛ים'
  },
  {
    id:'geresh',       type:'disjunctive', level:4,
    heb:'גֵּרֵשׁ',    heb_plain:'גרש',       esp:'Geresh',
    desc:'También llamado Azlá Gereshá. Quinto nivel disyuntivo.',
    char:'֜',
    position:'above',  color:'#1F618D',
    melody:[[_H.G4,150],[_H.A4,140],[_H.G4,140],[_H.E4,370]],
    example:'וַיֹּ֜אמֶר'
  },
  {
    id:'gershayim',    type:'disjunctive', level:4,
    heb:'גֵּרְשַׁיִם', heb_plain:'גרשיים',   esp:'Gershayim',
    desc:'Doble Geresh. Versión reforzada del Geresh, igual de raro.',
    char:'֞',
    position:'above',  color:'#154360',
    melody:[[_H.G4,90],[_H.A4,90],[_H.G4,90],[_H.A4,90],[_H.E4,420]],
    example:'הָֽ֞עָם'
  },
  {
    id:'pazer',        type:'disjunctive', level:4,
    heb:'פָּזֵר',     heb_plain:'פזר',       esp:'Pazer',
    desc:'Disjuntivo largo, para versículos con muchas cláusulas. Melodía ascendente y elaborada.',
    char:'֡',
    position:'above',  color:'#117A65',
    melody:[[_H.G4,140],[_H.A4,140],[_H.B4,200],[_H.A4,140],[_H.G4,360]],
    example:'וַֽיִּגְּשׁ֡וּ'
  },
  {
    id:'telisha_gedola', type:'disjunctive', level:4,
    heb:'תְּלִישָׁה גְּדוֹלָה', heb_plain:'תלישה גדולה', esp:'Telishá Gedolá',
    desc:'Prepositive: se escribe al comienzo de la palabra. Forma un arco hacia la derecha.',
    char:'֠',
    position:'above',  color:'#0E6655',
    melody:[[_H.A4,200],[_H.G4,190],[_H.E4,460]],
    example:'כָּ֠ל'
  },
  // ════════════════════════════════════════════
  //  CONJUNTIVOS  (מְשָׁרְתִים — "sirvientes")
  //  Conectan palabras hasta el próximo disyuntivo
  // ════════════════════════════════════════════
  {
    id:'munach',       type:'conjunctive', level:0,
    heb:'מֻנַּח',     heb_plain:'מונח',      esp:'Munaj',
    desc:'El más frecuente de todos los signos. Sirve a la mayoría de los disyuntivos. Significa "quieto".',
    char:'֣',
    position:'below',  color:'#566573',
    melody:[[_H.E4,200],[_H.D4,430]],
    example:'בָּרָ֣א'
  },
  {
    id:'mahapakh',     type:'conjunctive', level:0,
    heb:'מַהְפַּךְ',  heb_plain:'מהפך',      esp:'Mahpaj',
    desc:'Significa "invertido". Sirve principalmente al Pashtá.',
    char:'֤',
    position:'below',  color:'#626567',
    melody:[[_H.G4,200],[_H.A4,380]],
    example:'וַיֹּאמֶ֤ר'
  },
  {
    id:'meircha',      type:'conjunctive', level:0,
    heb:'מֵרְכָא',    heb_plain:'מרכא',      esp:'Meirjá',
    desc:'Conjuntivo muy frecuente. Sirve al Tifjá, al Siluk y al Etnajta. Significa "prolongado".',
    char:'֥',
    position:'below',  color:'#717D7E',
    melody:[[_H.D4,150],[_H.E4,420]],
    example:'הַשָּׁמַ֥יִם'
  },
  {
    id:'meircha_kefula', type:'conjunctive', level:0,
    heb:'מֵרְכָא כְפוּלָה', heb_plain:'מרכא כפולה', esp:'Meirjá Kefulá',
    desc:'Doble Meirjá. Extremadamente raro, menos de 10 veces en la Biblia.',
    char:'֦',
    position:'below',  color:'#808B96',
    melody:[[_H.D4,90],[_H.E4,90],[_H.D4,90],[_H.E4,420]],
    example:'וְשָׁפַ֦ט'
  },
  {
    id:'darga',        type:'conjunctive', level:0,
    heb:'דַּרְגָּא',  heb_plain:'דרגא',      esp:'Dargá',
    desc:'Significa "grado/escalón". Sirve exclusivamente al Tevir.',
    char:'֧',
    position:'below',  color:'#839192',
    melody:[[_H.E4,150],[_H.F4,140],[_H.G4,370]],
    example:'וַיַּ֧רְא'
  },
  {
    id:'kadma',        type:'conjunctive', level:0,
    heb:'קַדְמָא',    heb_plain:'קדמא',      esp:'Kadmá',
    desc:'También llamado Azlá. Sirve al Geresh y al Pashtá. Significa "adelante".',
    char:'֨',
    position:'above',  color:'#7F8C8D',
    melody:[[_H.A4,200],[_H.G4,420]],
    example:'וַיַּ֨רְא'
  },
  {
    id:'telisha_ketana', type:'conjunctive', level:0,
    heb:'תְּלִישָׁה קְטַנָּה', heb_plain:'תלישה קטנה', esp:'Telishá Ketaná',
    desc:'Postpositive: se escribe al final de la palabra (sobre la última letra).',
    char:'֩',
    position:'above',  color:'#85929E',
    melody:[[_H.G4,190],[_H.A4,390]],
    example:'שָׁלֹ֩ם'
  },
  {
    id:'yerah_ben_yomo', type:'conjunctive', level:0,
    heb:'יֵרַח בֶּן יוֹמוֹ', heb_plain:'ירח בן יומו', esp:'Yeraj Ben Yomó',
    desc:'El "joven de un día". Extremadamente raro, menos de 10 apariciones en la Biblia.',
    char:'֪',
    position:'below',  color:'#909497',
    melody:[[_H.E4,140],[_H.D4,140],[_H.C4,180],[_H.D4,370]],
    example:'שְׁבִי֪עִי'
  },
  {
    id:'ole',          type:'conjunctive', level:0,
    heb:'עוֹלֶה',     heb_plain:'עולה',      esp:'Olé',
    desc:'Siempre aparece junto al Iluy formando el par "Olé ve-Yored" (sube y baja).',
    char:'֫',
    position:'above',  color:'#95A5A6',
    melody:[[_H.E4,150],[_H.G4,140],[_H.A4,380]],
    example:'כֵּ֫ן'
  },
];

// ── Motor de audio Web Audio API ─────────────────────────────
let _ttAudioCtx = null;

function _ttGetCtx() {
  if (!_ttAudioCtx) {
    try {
      _ttAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch(e) { return null; }
  }
  if (_ttAudioCtx.state === 'suspended') _ttAudioCtx.resume();
  return _ttAudioCtx;
}

function ttPlayMelody(trope, onEnd) {
  const ctx = _ttGetCtx();
  if (!ctx) { if (onEnd) onEnd(); return; }

  let t = ctx.currentTime + 0.05;
  trope.melody.forEach(([freq, durMs]) => {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    const d = durMs / 1000;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.38, t + 0.02);
    gain.gain.setValueAtTime(0.38, t + d - 0.06);
    gain.gain.linearRampToValueAtTime(0, t + d);
    osc.start(t);
    osc.stop(t + d);
    t += d;
  });
  if (onEnd) {
    const totalMs = trope.melody.reduce((s,[,d]) => s + d, 0) + 120;
    setTimeout(onEnd, totalMs);
  }
}

// ── Estado global ─────────────────────────────────────────────
let _ttMode        = 'learn'; // 'learn' | 'quiz' | 'read'
let _ttQuizSub     = 'see';   // 'see' | 'hear'
let _ttQuizScore   = 0;
let _ttQuizTotal   = 0;
let _ttQuizStreak  = 0;
let _ttQuizCurrent = null;
let _ttShowLabels  = true;

// ── Punto de entrada ──────────────────────────────────────────
function openTropeTrainer() {
  showView('trope-trainer');
  _ttMode = 'learn';
  _ttRenderMode();
}

// ── Cambio de pestaña ─────────────────────────────────────────
function ttSwitchMode(m) {
  _ttMode = m;
  _ttRenderMode();
}

function _ttRenderMode() {
  // Actualizar estilos de tabs
  ['learn','quiz','read'].forEach(id => {
    const btn = document.getElementById('tt-tab-' + id);
    if (!btn) return;
    const active = id === _ttMode;
    btn.style.background    = active ? 'white' : 'transparent';
    btn.style.color         = active ? 'var(--navy-800)' : 'var(--sand-500)';
    btn.style.borderBottom  = active ? '2.5px solid var(--navy-800)' : '2.5px solid transparent';
    btn.style.fontWeight    = active ? '800' : '600';
  });

  if (_ttMode === 'learn') _ttRenderLearn();
  else if (_ttMode === 'quiz') _ttRenderQuiz();
  else _ttRenderRead();
}

// ══════════════════════════════════════════════════════════════
//  MODO APRENDER
// ══════════════════════════════════════════════════════════════
function _ttRenderLearn() {
  const c = document.getElementById('tt-content');
  if (!c) return;

  const disj = TT_TROPES.filter(t => t.type === 'disjunctive');
  const conj  = TT_TROPES.filter(t => t.type === 'conjunctive');

  c.innerHTML = `
    <div style="padding:14px 16px 32px;overflow-y:auto;flex:1;">
      <p style="font-size:12px;color:var(--sand-500);line-height:1.65;margin-bottom:18px;">
        Los <strong style="color:var(--navy-800);">ta'amei hamikrá</strong>
        <span style="font-family:'Noto Serif Hebrew',serif;direction:rtl;">טַעֲמֵי הַמִּקְרָא</span>
        son los signos de cantilación de la Torá.<br>
        Tocá cada signo para conocer su nombre y melodía.
      </p>

      <div style="font-size:10px;font-weight:800;color:var(--sand-500);
                  text-transform:uppercase;letter-spacing:0.12em;margin-bottom:10px;">
        ⏸ Disyuntivos — pausas (מְלָכִים)
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:22px;">
        ${disj.map(_ttCard).join('')}
      </div>

      <div style="font-size:10px;font-weight:800;color:var(--sand-500);
                  text-transform:uppercase;letter-spacing:0.12em;margin-bottom:10px;">
        ⏭ Conjuntivos — conectores (מְשָׁרְתִים)
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
        ${conj.map(_ttCard).join('')}
      </div>
    </div>`;
}

function _ttCard(t) {
  return `
    <button onclick="ttOpenDetail('${t.id}')"
      style="background:white;border:1.5px solid var(--sand-300);border-radius:14px;
             padding:12px 6px;display:flex;flex-direction:column;align-items:center;
             gap:5px;cursor:pointer;box-shadow:var(--shadow-1);
             transition:transform .1s ease;">
      <div style="font-family:'Noto Serif Hebrew',serif;font-size:1.55rem;line-height:1.3;
                  color:${t.color};direction:rtl;letter-spacing:0.04em;">
        אֵ${t.char}ל
      </div>
      <div style="font-size:10px;font-weight:700;color:var(--navy-800);
                  text-align:center;line-height:1.3;">${t.esp}</div>
      <div style="font-size:9px;color:var(--sand-500);
                  background:${t.type === 'disjunctive' ? '#FEF3C7' : '#DBEAFE'};
                  padding:2px 7px;border-radius:99px;font-weight:600;">
        ${t.type === 'disjunctive' ? 'pausa' : 'conector'}
      </div>
    </button>`;
}

// ── Panel de detalle ──────────────────────────────────────────
function ttOpenDetail(id) {
  const t   = TT_TROPES.find(x => x.id === id);
  if (!t) return;
  const idx  = TT_TROPES.indexOf(t);
  const prev = TT_TROPES[idx - 1];
  const next = TT_TROPES[idx + 1];

  const existing = document.getElementById('tt-detail-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'tt-detail-overlay';
  overlay.style.cssText = `
    position:fixed;inset:0;background:rgba(13,31,53,0.55);
    z-index:3000;display:flex;align-items:flex-end;justify-content:center;`;
  overlay.innerHTML = `
    <div id="tt-detail-sheet" style="
      background:var(--sand-100);border-radius:24px 24px 0 0;
      width:100%;max-width:480px;padding:24px 20px 36px;
      max-height:88vh;overflow-y:auto;
      animation:ob-fadein .22s ease;">

      <!-- Header -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;">
        <div>
          <div style="font-size:10px;font-weight:800;color:${t.color};
                      text-transform:uppercase;letter-spacing:0.12em;margin-bottom:4px;">
            ${t.type === 'disjunctive' ? '⏸ Disyuntivo' : '⏭ Conjuntivo'}
          </div>
          <h2 style="font-family:'Fraunces',serif;font-size:1.45rem;font-weight:900;
                     color:var(--navy-900);margin:0 0 2px;">${t.esp}</h2>
          <div style="font-family:'Noto Serif Hebrew',serif;font-size:1rem;
                      color:var(--sand-500);direction:rtl;">${t.heb}</div>
        </div>
        <button onclick="document.getElementById('tt-detail-overlay').remove()"
          style="width:36px;height:36px;border-radius:50%;background:var(--sand-200);
                 border:none;cursor:pointer;font-size:16px;flex-shrink:0;
                 display:flex;align-items:center;justify-content:center;">✕</button>
      </div>

      <!-- Palabra de ejemplo con el tropo -->
      <div style="background:white;border:2px solid ${t.color}44;border-radius:18px;
                  padding:22px 16px;text-align:center;margin-bottom:18px;">
        <div style="font-size:10px;font-weight:700;color:var(--sand-400);
                    text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px;">
          Ejemplo
        </div>
        <div style="font-family:'Noto Serif Hebrew',serif;font-size:3rem;font-weight:900;
                    color:var(--navy-900);direction:rtl;line-height:1.5;">
          ${t.example || ('אֵ' + t.char + 'ל')}
        </div>
        <div style="font-size:10px;color:var(--sand-400);margin-top:6px;">
          Signo ${t.position === 'above' ? 'encima' : 'debajo'} de la palabra
          &nbsp;·&nbsp;
          Unicode <code style="font-size:10px;background:var(--sand-200);
            padding:1px 5px;border-radius:4px;">
            U+${t.char.codePointAt(0).toString(16).toUpperCase().padStart(4,'0')}
          </code>
        </div>
      </div>

      <!-- Descripción -->
      <div style="background:var(--sand-200);border-radius:14px;
                  padding:14px 16px;margin-bottom:20px;">
        <p style="font-size:14px;color:var(--navy-800);line-height:1.65;margin:0;">
          ${t.desc}
        </p>
      </div>

      <!-- Botón escuchar melodía -->
      <button id="tt-play-detail"
        onclick="ttDetailPlay('${t.id}')"
        style="width:100%;padding:16px;border-radius:16px;
               background:${t.color};color:white;
               font-size:15px;font-weight:700;border:none;cursor:pointer;
               box-shadow:0 4px 0 ${t.color}88;
               display:flex;align-items:center;justify-content:center;gap:8px;
               margin-bottom:12px;transition:opacity .2s;">
        <span style="font-size:1.3rem;">🎵</span> Escuchar melodía
      </button>

      <!-- Prev / Next -->
      <div style="display:flex;gap:8px;">
        ${prev
          ? `<button onclick="document.getElementById('tt-detail-overlay').remove();ttOpenDetail('${prev.id}')"
               style="flex:1;padding:13px 8px;border-radius:14px;background:white;
                      border:1.5px solid var(--sand-300);color:var(--navy-700);
                      font-size:12px;font-weight:700;cursor:pointer;text-align:center;">
               ← ${prev.esp}</button>`
          : `<div style="flex:1"></div>`}
        ${next
          ? `<button onclick="document.getElementById('tt-detail-overlay').remove();ttOpenDetail('${next.id}')"
               style="flex:1;padding:13px 8px;border-radius:14px;background:white;
                      border:1.5px solid var(--sand-300);color:var(--navy-700);
                      font-size:12px;font-weight:700;cursor:pointer;text-align:center;">
               ${next.esp} →</button>`
          : `<div style="flex:1"></div>`}
      </div>
    </div>`;

  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.remove();
  });
  document.body.appendChild(overlay);
}

function ttDetailPlay(id) {
  const t = TT_TROPES.find(x => x.id === id);
  if (!t) return;
  const btn = document.getElementById('tt-play-detail');
  if (btn) {
    btn.innerHTML = '<span style="font-size:1.3rem;">🎶</span> Reproduciendo...';
    btn.style.opacity = '0.7';
    btn.disabled = true;
  }
  ttPlayMelody(t, () => {
    if (btn) {
      btn.innerHTML = '<span style="font-size:1.3rem;">🎵</span> Escuchar melodía';
      btn.style.opacity = '1';
      btn.disabled = false;
    }
  });
}

// ══════════════════════════════════════════════════════════════
//  MODO QUIZ
// ══════════════════════════════════════════════════════════════
function _ttRenderQuiz() {
  const c = document.getElementById('tt-content');
  if (!c) return;

  const accuracy = _ttQuizTotal > 0
    ? Math.round(_ttQuizScore / _ttQuizTotal * 100)
    : 0;

  c.innerHTML = `
    <div style="padding:14px 16px 32px;overflow-y:auto;flex:1;
                display:flex;flex-direction:column;gap:12px;">

      <!-- Sub-modo: Ver / Escuchar -->
      <div style="display:flex;gap:8px;">
        <button id="tt-qs-see" onclick="ttQuizSubMode('see')"
          style="flex:1;padding:10px;border-radius:12px;
                 border:1.5px solid var(--sand-300);
                 background:${_ttQuizSub==='see'?'var(--navy-800)':'white'};
                 color:${_ttQuizSub==='see'?'white':'var(--navy-700)'};
                 font-size:12px;font-weight:700;cursor:pointer;">
          👁 Ver → Nombrar
        </button>
        <button id="tt-qs-hear" onclick="ttQuizSubMode('hear')"
          style="flex:1;padding:10px;border-radius:12px;
                 border:1.5px solid var(--sand-300);
                 background:${_ttQuizSub==='hear'?'var(--navy-800)':'white'};
                 color:${_ttQuizSub==='hear'?'white':'var(--navy-700)'};
                 font-size:12px;font-weight:700;cursor:pointer;">
          🎵 Escuchar → Identificar
        </button>
      </div>

      <!-- Marcador -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
        <div style="background:white;border-radius:12px;padding:10px;
                    text-align:center;border:1.5px solid var(--sand-200);">
          <div style="font-size:1.5rem;font-weight:900;color:var(--success);">${_ttQuizScore}</div>
          <div style="font-size:10px;color:var(--sand-500);font-weight:600;">Correctas</div>
        </div>
        <div style="background:white;border-radius:12px;padding:10px;
                    text-align:center;border:1.5px solid var(--sand-200);">
          <div style="font-size:1.5rem;font-weight:900;color:var(--navy-800);">${accuracy}%</div>
          <div style="font-size:10px;color:var(--sand-500);font-weight:600;">Precisión</div>
        </div>
        <div style="background:white;border-radius:12px;padding:10px;
                    text-align:center;border:1.5px solid var(--sand-200);">
          <div style="font-size:1.5rem;font-weight:900;color:var(--gold-500);">
            ${_ttQuizStreak > 0 ? '🔥' : ''}${_ttQuizStreak}
          </div>
          <div style="font-size:10px;color:var(--sand-500);font-weight:600;">Racha</div>
        </div>
      </div>

      <!-- Pregunta -->
      <div id="tt-quiz-q" style="flex:1;display:flex;flex-direction:column;gap:10px;"></div>

      <!-- Reset -->
      <button onclick="ttQuizReset()"
        style="padding:10px;border-radius:12px;background:none;
               border:1.5px solid var(--sand-300);color:var(--sand-500);
               font-size:12px;font-weight:600;cursor:pointer;">
        ↺ Reiniciar puntuación
      </button>
    </div>`;

  _ttNextQuestion();
}

function ttQuizSubMode(sub) {
  _ttQuizSub = sub;
  _ttRenderQuiz();
}

function ttQuizReset() {
  _ttQuizScore = 0;
  _ttQuizTotal = 0;
  _ttQuizStreak = 0;
  _ttRenderQuiz();
}

function _ttNextQuestion() {
  const qEl = document.getElementById('tt-quiz-q');
  if (!qEl) return;

  // Elegir respuesta correcta aleatoria
  const answer = TT_TROPES[Math.floor(Math.random() * TT_TROPES.length)];
  _ttQuizCurrent = answer;

  // 3 distractores del mismo tipo si es posible
  const sameType = TT_TROPES.filter(t => t.id !== answer.id && t.type === answer.type);
  const other    = TT_TROPES.filter(t => t.id !== answer.id && t.type !== answer.type);
  const pool     = (sameType.length >= 3 ? sameType : [...sameType, ...other])
                     .sort(() => Math.random() - 0.5).slice(0, 3);
  const opts     = [...pool, answer].sort(() => Math.random() - 0.5);

  if (_ttQuizSub === 'see') {
    // Mostrar el signo, elegir el nombre
    qEl.innerHTML = `
      <div style="background:white;border:2px solid var(--sand-300);border-radius:18px;
                  padding:24px 16px;text-align:center;">
        <div style="font-size:10px;font-weight:700;color:var(--sand-400);
                    text-transform:uppercase;letter-spacing:0.1em;margin-bottom:14px;">
          ¿Qué signo de cantilación es este?
        </div>
        <div style="font-family:'Noto Serif Hebrew',serif;font-size:3rem;font-weight:900;
                    color:var(--navy-900);direction:rtl;line-height:1.5;">
          שָׁלֹ${answer.char}ם
        </div>
        <div style="font-size:10px;color:var(--sand-400);margin-top:8px;">
          ${answer.type === 'disjunctive' ? 'Disyuntivo · pausa' : 'Conjuntivo · conector'}
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        ${opts.map(o => `
          <button id="tt-opt-${o.id}" onclick="ttAnswer('${o.id}','${answer.id}')"
            style="padding:14px 8px;border-radius:14px;background:white;
                   border:1.5px solid var(--sand-300);font-size:13px;font-weight:700;
                   color:var(--navy-800);cursor:pointer;min-height:52px;line-height:1.3;">
            ${o.esp}
          </button>`).join('')}
      </div>`;
  } else {
    // Escuchar melodía, elegir el signo
    qEl.innerHTML = `
      <div style="background:white;border:2px solid var(--sand-300);border-radius:18px;
                  padding:28px 16px;text-align:center;">
        <div style="font-size:10px;font-weight:700;color:var(--sand-400);
                    text-transform:uppercase;letter-spacing:0.1em;margin-bottom:16px;">
          Escuchá la melodía
        </div>
        <button id="tt-play-q" onclick="ttQuizPlayMelody()"
          style="width:76px;height:76px;border-radius:50%;
                 background:var(--navy-800);color:white;border:none;
                 font-size:1.8rem;cursor:pointer;
                 box-shadow:0 4px 0 var(--navy-900);
                 display:flex;align-items:center;justify-content:center;
                 margin:0 auto;">▶</button>
        <div style="font-size:12px;color:var(--sand-400);margin-top:14px;">
          ¿A qué signo pertenece esta melodía?
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        ${opts.map(o => `
          <button id="tt-opt-${o.id}" onclick="ttAnswer('${o.id}','${answer.id}')"
            style="padding:14px 8px;border-radius:14px;background:white;
                   border:1.5px solid var(--sand-300);cursor:pointer;min-height:60px;
                   display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;">
            <span style="font-family:'Noto Serif Hebrew',serif;font-size:1.7rem;
                         color:${o.color};direction:rtl;">שׁ${o.char}</span>
            <span style="font-size:10px;font-weight:700;color:var(--navy-800);">${o.esp}</span>
          </button>`).join('')}
      </div>`;

    // Auto-play después de un instante
    setTimeout(() => ttPlayMelody(answer), 450);
  }
}

function ttQuizPlayMelody() {
  if (!_ttQuizCurrent) return;
  const btn = document.getElementById('tt-play-q');
  if (btn) { btn.textContent = '♪'; btn.style.opacity = '0.65'; btn.disabled = true; }
  ttPlayMelody(_ttQuizCurrent, () => {
    if (btn) { btn.innerHTML = '▶'; btn.style.opacity = '1'; btn.disabled = false; }
  });
}

function ttAnswer(selId, ansId) {
  _ttQuizTotal++;
  const ok = selId === ansId;
  if (ok) { _ttQuizScore++; _ttQuizStreak++; }
  else    { _ttQuizStreak = 0; }

  // Colorear opciones
  const selBtn = document.getElementById('tt-opt-' + selId);
  const ansBtn = document.getElementById('tt-opt-' + ansId);
  if (selBtn) {
    selBtn.style.background   = ok ? '#D1FAE5' : '#FEE2E2';
    selBtn.style.borderColor  = ok ? '#10B981' : '#EF4444';
    selBtn.style.color        = ok ? '#065F46' : '#991B1B';
  }
  if (!ok && ansBtn) {
    ansBtn.style.background  = '#D1FAE5';
    ansBtn.style.borderColor = '#10B981';
    ansBtn.style.color       = '#065F46';
  }

  // Deshabilitar todos los botones
  document.querySelectorAll('[id^="tt-opt-"]').forEach(b => { b.disabled = true; });

  // Siguiente pregunta
  setTimeout(() => _ttRenderQuiz(), 1300);
}

// ══════════════════════════════════════════════════════════════
//  MODO LECTURA CON TROPOS
// ══════════════════════════════════════════════════════════════

// Génesis 1:1–4 con tropos anotados manualmente
const _TT_VERSES = [
  {
    ref: 'Génesis 1:1',
    words: [
      { text:'בְּרֵאשִׁ֖ית', tid:'tipeha'      },
      { text:'בָּרָ֣א',      tid:'munach'      },
      { text:'אֱלֹהִ֑ים',    tid:'etnachta'    },
      { text:'אֵ֥ת',         tid:'meircha'     },
      { text:'הַשָּׁמַ֖יִם', tid:'tipeha'      },
      { text:'וְאֵ֥ת',       tid:'meircha'     },
      { text:'הָאָֽרֶץ׃',   tid:'siluk'       },
    ]
  },
  {
    ref: 'Génesis 1:2',
    words: [
      { text:'וְהָאָ֗רֶץ',   tid:'revii'       },
      { text:'הָיְתָ֥ה',     tid:'meircha'     },
      { text:'תֹ֙הוּ֙',      tid:'pashta'      },
      { text:'וָבֹ֔הוּ',     tid:'zakef_katan' },
      { text:'וְחֹ֖שֶׁךְ',   tid:'tipeha'      },
      { text:'עַל־פְּנֵ֣י',  tid:'munach'      },
      { text:'תְהֹ֑ום',      tid:'etnachta'    },
      { text:'וְר֣וּחַ',     tid:'munach'      },
      { text:'אֱלֹהִ֔ים',    tid:'zakef_katan' },
      { text:'מְרַחֶ֖פֶת',   tid:'tipeha'      },
      { text:'עַל־פְּנֵ֥י',  tid:'meircha'     },
      { text:'הַמָּֽיִם׃',   tid:'siluk'       },
    ]
  },
  {
    ref: 'Génesis 1:3',
    words: [
      { text:'וַיֹּ֥אמֶר',   tid:'meircha'     },
      { text:'אֱלֹהִ֖ים',    tid:'tipeha'      },
      { text:'יְהִ֣י',       tid:'munach'      },
      { text:'אֹ֑ור',        tid:'etnachta'    },
      { text:'וַֽיְהִי',     tid:'meircha'     },
      { text:'אֹֽור׃',       tid:'siluk'       },
    ]
  },
  {
    ref: 'Génesis 1:4',
    words: [
      { text:'וַיַּ֧רְא',    tid:'darga'       },
      { text:'אֱלֹהִ֛ים',    tid:'tevir'       },
      { text:'אֶת־הָאֹ֖ור',  tid:'tipeha'      },
      { text:'כִּי־טֹ֑וב',   tid:'etnachta'    },
      { text:'וַיַּבְדֵּ֣ל', tid:'munach'      },
      { text:'אֱלֹהִ֔ים',    tid:'zakef_katan' },
      { text:'בֵּ֥ין',       tid:'meircha'     },
      { text:'הָאֹ֖ור',      tid:'tipeha'      },
      { text:'וּבֵ֥ין',      tid:'meircha'     },
      { text:'הַחֹֽשֶׁךְ׃',  tid:'siluk'       },
    ]
  },
];

function _ttRenderRead() {
  const c = document.getElementById('tt-content');
  if (!c) return;

  c.innerHTML = `
    <div style="padding:14px 16px 32px;overflow-y:auto;flex:1;">

      <!-- Controles -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <div>
          <div style="font-family:'Noto Serif Hebrew',serif;font-size:1.1rem;
                      font-weight:900;color:var(--navy-800);direction:rtl;">בְּרֵאשִׁית</div>
          <div style="font-size:11px;color:var(--sand-500);">Génesis 1:1–4 · Primera aliyá</div>
        </div>
        <button onclick="ttToggleLabels()"
          style="padding:8px 12px;border-radius:10px;
                 background:${_ttShowLabels ? 'var(--navy-800)' : 'var(--sand-200)'};
                 color:${_ttShowLabels ? 'white' : 'var(--navy-700)'};
                 border:1.5px solid var(--sand-300);
                 font-size:11px;font-weight:700;cursor:pointer;">
          🏷 ${_ttShowLabels ? 'Nombres visibles' : 'Mostrar nombres'}
        </button>
      </div>

      <!-- Hint -->
      <div style="background:var(--sand-200);border-radius:12px;padding:10px 14px;
                  margin-bottom:16px;font-size:12px;color:var(--navy-700);
                  display:flex;align-items:flex-start;gap:8px;">
        <span style="font-size:1rem;flex-shrink:0;">💡</span>
        <span>Tocá cualquier palabra para escuchar la melodía de su cantilación.
              Los colores indican la función de cada signo.</span>
      </div>

      <!-- Versículos -->
      <div style="background:white;border-radius:16px;padding:16px;
                  border:1.5px solid var(--sand-300);margin-bottom:16px;">
        ${_TT_VERSES.map(_ttVerseHTML).join('')}
      </div>

      <!-- Leyenda de colores -->
      <div style="background:white;border-radius:14px;padding:14px 16px;
                  border:1.5px solid var(--sand-200);">
        <div style="font-size:10px;font-weight:800;color:var(--sand-500);
                    text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px;">
          Leyenda
        </div>
        <div style="display:flex;flex-direction:column;gap:7px;">
          ${[
            ['#C0392B', 'Siluk', 'fin de versículo'],
            ['#E74C3C', 'Etnajta', 'pausa mayor interna'],
            ['#E67E22', 'Zakef / Segol / Pashta', 'pausa secundaria'],
            ['#F39C12', 'Tifjá / Revii / Tevir', 'pausa terciaria'],
            ['#566573', 'Munaj / Meirjá / Dargá', 'conjuntivos (conectores)'],
          ].map(([col,name,desc]) => `
            <div style="display:flex;align-items:center;gap:8px;">
              <div style="width:11px;height:11px;border-radius:50%;
                          background:${col};flex-shrink:0;"></div>
              <span style="font-size:12px;font-weight:700;color:var(--navy-800);">${name}</span>
              <span style="font-size:11px;color:var(--sand-500);">— ${desc}</span>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
}

function _ttVerseHTML(v) {
  return `
    <div style="margin-bottom:20px;">
      <div style="font-size:10px;font-weight:700;color:var(--sand-400);
                  text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px;">
        ${v.ref}
      </div>
      <div style="direction:rtl;line-height:${_ttShowLabels ? '3.2' : '2.2'};
                  display:flex;flex-wrap:wrap;gap:4px 14px;justify-content:flex-end;
                  align-items:flex-end;">
        ${v.words.map(w => {
          const t = TT_TROPES.find(x => x.id === w.tid);
          if (!t) return `<span style="font-family:'Noto Serif Hebrew',serif;
                                       font-size:1.4rem;color:var(--navy-900);">${w.text}</span>`;
          return `
            <button onclick="ttTapWord('${w.tid}')"
              title="${t.esp}"
              style="background:none;border:none;cursor:pointer;padding:0 2px;
                     display:inline-flex;flex-direction:column;align-items:center;
                     touch-action:manipulation;-webkit-tap-highlight-color:transparent;">
              ${_ttShowLabels ? `
                <span style="font-size:9px;font-weight:700;color:${t.color};
                             background:${t.color}18;border-radius:4px;
                             padding:1px 5px;margin-bottom:2px;white-space:nowrap;
                             direction:ltr;">${t.esp}</span>` : ''}
              <span style="font-family:'Noto Serif Hebrew',serif;font-size:1.45rem;
                           color:${t.color};font-weight:700;line-height:1.35;">
                ${w.text}
              </span>
            </button>`;
        }).join('')}
      </div>
    </div>`;
}

function ttTapWord(tropeId) {
  const t = TT_TROPES.find(x => x.id === tropeId);
  if (!t) return;
  ttPlayMelody(t);
  if (typeof showToast === 'function') {
    showToast(`🎵 ${t.esp} — ${t.heb}`, 'warm');
  }
}

function ttToggleLabels() {
  _ttShowLabels = !_ttShowLabels;
  _ttRenderRead();
}

// ── Exposición global ─────────────────────────────────────────
window.openTropeTrainer  = openTropeTrainer;
window.ttSwitchMode      = ttSwitchMode;
window.ttOpenDetail      = ttOpenDetail;
window.ttDetailPlay      = ttDetailPlay;
window.ttQuizSubMode     = ttQuizSubMode;
window.ttQuizReset       = ttQuizReset;
window.ttQuizPlayMelody  = ttQuizPlayMelody;
window.ttAnswer          = ttAnswer;
window.ttTapWord         = ttTapWord;
window.ttToggleLabels    = ttToggleLabels;
