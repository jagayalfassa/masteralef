// ╔═══════════════════════════════════════════════════════════════╗
// ║  AlefMaster — teacher.js                                      ║
// ║  Panel del docente — cargado con defer después del main       ║
// ╚═══════════════════════════════════════════════════════════════╝
//
// DEPENDENCIAS GLOBALES REQUERIDAS (definidas en index.html):
//   _sb, _authUser, _authProfile, _requireInstitution
//   ALL_DATA, PARASHA_CATALOG, showToast, showView, dbg, trackEvent, esc
//   document (DOM ya disponible porque usa defer)
//

/* globals _sb, _authUser, _authProfile, _requireInstitution, ALL_DATA,
           PARASHA_CATALOG, showToast, showView, dbg, trackEvent, esc */

// ╔═══════════════════════════════════════════════════════════╗
// ║  TEACHER DASHBOARD — Sistema completo                     ║
// ╚═══════════════════════════════════════════════════════════╝

let _tdStudents  = [];   // cache de alumnos cargados
let _tdClassData = null; // clase activa
let _tdAllClasses = [];  // todas las clases del docente (multi-clase)
let _tdTab       = 'students';

// ── Abrir el panel del docente ────────────────────────────────
function openTeacherPanel(){
  if(_authProfile?.role !== 'teacher'){
    showToast('Solo disponible para profesores', 'warn'); return;
  }
  if(!_requireInstitution('panel docente')) return;
  showView('teacher');
  loadTeacherDashboard();
}

// ── Carga principal del dashboard ────────────────────────────
async function loadTeacherDashboard(){
  if(!_sb || !_authUser) return;
  try {
    // Cargar TODAS las clases del teacher (antes: .maybeSingle() rompía
    // silenciosamente con 2+ clases -> mostraba alumnos de toda la institución)
    const { data: classesData, error: classesErr } = await _sb
      .from('classes')
      .select('*')
      .eq('teacher_id', _authUser.id)
      .order('created_at', { ascending: true });

    if(classesErr){
      dbg('[Teacher] loadDashboard classes error:', classesErr.message);
      trackEvent('teacher_dashboard_error', { context: 'classes', message: classesErr.message });
      document.getElementById('td-content').innerHTML =
        '<div style="text-align:center;padding:32px;color:var(--sand-400);">Error de conexión al cargar tu clase.<br>Verificá tu conexión e intentá de nuevo.</div>';
      return;
    }

    _tdAllClasses = classesData || [];
    // Mantener la clase activa si sigue en la lista; si no, tomar la primera
    const keepId = _tdClassData?.id;
    _tdClassData = (keepId && _tdAllClasses.find(c => c.id === keepId)) || _tdAllClasses[0] || null;

    const nameEl = document.getElementById('td-class-name');
    const instLabel = _authProfile?._institution?.name;
    if(nameEl) nameEl.textContent = _tdClassData?.name || (instLabel ? instLabel : 'Mi clase');
    tdRenderClassSwitcher();

    await tdLoadStudentsForActiveClass();

  } catch(e){
    dbg('[Teacher] loadDashboard error:', e.message);
    trackEvent('teacher_dashboard_error', { context: 'loadTeacherDashboard', message: e.message });
    document.getElementById('td-content').innerHTML =
      '<div style="text-align:center;padding:32px;color:var(--sand-400);">Error al cargar datos.<br>Verificá la conexión.</div>';
  }
}

// ── Selector de clase (solo se muestra si el docente tiene 2+ clases) ──
function tdRenderClassSwitcher(){
  const nameEl = document.getElementById('td-class-name');
  if(!nameEl || !nameEl.parentNode) return;
  let sw = document.getElementById('td-class-switcher');
  if(!sw){
    sw = document.createElement('div');
    sw.id = 'td-class-switcher';
    sw.style.cssText = 'display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;';
    nameEl.parentNode.appendChild(sw);
  }
  // Siempre visible (aunque haya 1 sola clase) para que el multi-clase sea descubrible
  sw.innerHTML = _tdAllClasses.map(c => {
    const active = c.id === _tdClassData?.id;
    return '<button onclick="tdSelectClass(\'' + c.id + '\')" ' +
      'style="padding:5px 12px;border-radius:8px;border:none;font-size:11.5px;font-weight:700;cursor:pointer;' +
      'background:' + (active ? 'var(--navy-800)' : 'var(--sand-200)') + ';' +
      'color:' + (active ? 'white' : 'var(--navy-700)') + ';">' +
      esc(c.name || 'Clase') + '</button>';
  }).join('') +
  '<button onclick="tdPromptNewClass()" title="Crear otra clase" ' +
    'style="padding:5px 12px;border-radius:8px;border:1.5px dashed var(--sand-400);font-size:11.5px;' +
    'font-weight:700;cursor:pointer;background:white;color:var(--navy-700);">＋ Nueva clase</button>';
}

async function tdSelectClass(classId){
  const cls = _tdAllClasses.find(c => c.id === classId);
  if(!cls || cls.id === _tdClassData?.id) return;
  _tdClassData = cls;
  const nameEl = document.getElementById('td-class-name');
  if(nameEl) nameEl.textContent = cls.name || 'Mi clase';
  tdRenderClassSwitcher();
  await tdLoadStudentsForActiveClass();
}

// ── Carga de alumnos + progreso para la clase activa (o institución si no hay clase) ──
async function tdLoadStudentsForActiveClass(){
  const cls = _tdClassData;
  let students = [];

  if(cls){
    const { data: members, error: membersErr } = await _sb
      .from('class_members')
      .select('student_id, profiles!inner(id, email, name)')
      .eq('class_id', cls.id);

    if(membersErr){
      // Fallback en 2 pasos: si el join falla por RLS, no dejar el panel vacío
      dbg('[Teacher] join profiles!inner falló, aplicando fallback:', membersErr.message);
      trackEvent('teacher_dashboard_error', { context: 'class_members_join', message: membersErr.message });

      const { data: memberIds, error: idsErr } = await _sb
        .from('class_members')
        .select('student_id')
        .eq('class_id', cls.id);

      if(idsErr){
        dbg('[Teacher] fallback class_members error:', idsErr.message);
        trackEvent('teacher_dashboard_error', { context: 'class_members_ids', message: idsErr.message });
        document.getElementById('td-content').innerHTML =
          '<div style="text-align:center;padding:32px;color:var(--sand-400);">Error de permisos al cargar alumnos.<br>Contactá soporte si persiste.</div>';
        return;
      }
      const ids = (memberIds || []).map(m => m.student_id);
      if(ids.length){
        const { data: profs, error: profsErr } = await _sb.from('profiles').select('*').in('id', ids);
        if(profsErr){
          dbg('[Teacher] fallback profiles error:', profsErr.message);
          trackEvent('teacher_dashboard_error', { context: 'profiles_fallback', message: profsErr.message });
        }
        students = profs || [];
      }
    } else {
      students = (members || []).map(m => m.profiles);
    }
  } else {
    // Sin clase creada: mostrar alumnos de la misma institución
    const instId = _authProfile?.institution_id;
    let query = _sb.from('profiles').select('*').eq('role','student');
    if(instId) query = query.eq('institution_id', instId);
    const { data, error } = await query;
    if(error){
      dbg('[Teacher] loadDashboard institution error:', error.message);
      trackEvent('teacher_dashboard_error', { context: 'institution_students', message: error.message });
      document.getElementById('td-content').innerHTML =
        '<div style="text-align:center;padding:32px;color:var(--sand-400);">Error de conexión al cargar alumnos.<br>Verificá tu conexión e intentá de nuevo.</div>';
      return;
    }
    students = data || [];
  }

  // Cargar progreso de cada alumno
  const ids = students.map(s => s.id);
  let progressMap = {};
  if(ids.length){
    const { data: progs, error: progsErr } = await _sb
      .from('user_progress')
      .select('user_id, progress, shekels, extra_data, updated_at, bm_date, created_at')
      .in('user_id', ids);
    if(progsErr){
      dbg('[Teacher] loadDashboard progress error:', progsErr.message);
      trackEvent('teacher_dashboard_error', { context: 'user_progress', message: progsErr.message });
    }
    (progs || []).forEach(p => { progressMap[p.user_id] = p; });
  }

  _tdStudents = students.map(s => ({
    ...s,
    prog: progressMap[s.id] || null,
  }));

  tdRenderSummary();
  tdSwitchTab(_tdTab);
}

// ── Resumen rápido (tarjetas numéricas) ───────────────────────
function tdRenderSummary(){
  const total    = _tdStudents.length;
  const active   = _tdStudents.filter(s => tdActivityStatus(s) === 'active').length;
  const warning  = _tdStudents.filter(s => tdActivityStatus(s) === 'warning').length;
  const inactive = _tdStudents.filter(s => tdActivityStatus(s) === 'inactive').length;

  const summary = document.getElementById('td-summary');
  if(!summary) return;
  summary.innerHTML = [
    { n: total,    label: 'alumnos',  bg: 'var(--sand-200)', color: 'var(--navy-800)' },
    { n: active,   label: 'activos',  bg: '#D1FAE5',         color: '#065F46' },
    { n: warning,  label: 'alertas',  bg: '#FEF3C7',         color: '#92400E' },
    { n: inactive, label: 'inactivos',bg: '#FEE2E2',         color: '#991B1B' },
  ].map(x => `
    <div style="flex:1;background:${x.bg};border-radius:10px;padding:8px 6px;text-align:center;">
      <div style="font-size:1.3rem;font-weight:900;color:${x.color};font-family:'Fraunces',serif;">${x.n}</div>
      <div style="font-size:10px;font-weight:700;color:${x.color};opacity:0.8;text-transform:uppercase;">${x.label}</div>
    </div>`).join('');
}

// ── Estado de actividad de un alumno ─────────────────────────
function tdActivityStatus(student){
  const lastRaw = student.prog?.updated_at;
  if(!lastRaw) return 'inactive';
  const hours = (Date.now() - new Date(lastRaw).getTime()) / 3600000;
  if(hours < 28)  return 'active';
  if(hours < 96)  return 'warning';
  return 'inactive';
}

// ── Calcular % de progreso ────────────────────────────────────
function tdCalcProgress(student){
  const wordStates = student.prog?.extra_data?.word_states;
  if(!wordStates || !Object.keys(wordStates).length) return 0;
  let total = 0, mastered = 0;
  Object.entries(ALL_DATA).forEach(([seriesKey, serie]) => {
    if(serie.type !== 'BASE') return;
    (serie.words || []).forEach((w, wordIdx) => {
      total++;
      const ws = wordStates[seriesKey + '_' + wordIdx];
      if(ws && ws.status === 'mastered') mastered++;
    });
  });
  return total > 0 ? Math.round(mastered / total * 100) : 0;
}

// ── Tabs ──────────────────────────────────────────────────────
function tdSwitchTab(tab){
  _tdTab = tab;
  const tabs = { students: 'td-tab-students', class: 'td-tab-class', week: 'td-tab-week' };
  Object.entries(tabs).forEach(([key, id]) => {
    const btn = document.getElementById(id);
    if(!btn) return;
    const active = key === tab;
    btn.style.background     = active ? 'white' : 'transparent';
    btn.style.color           = active ? 'var(--navy-800)' : 'var(--sand-500)';
    btn.style.borderBottom    = active ? '2.5px solid var(--navy-800)' : '2.5px solid transparent';
  });
  if(tab === 'students')    tdRenderStudentList();
  else if(tab === 'week')   tdRenderWeeklyReport();
  else                      tdRenderClassSettings();
}

// ── Lista de alumnos ──────────────────────────────────────────
function tdRenderStudentList(){
  const container = document.getElementById('td-content');
  if(!container) return;

  // Skeleton mientras carga — reemplazado por lista real
  if(container.textContent.trim() === '' || container.querySelector('#td-skeleton')){
    container.innerHTML = `
      <div id="td-skeleton" style="display:flex;flex-direction:column;gap:10px;">
        ${[1,2,3].map(()=>`
        <div style="background:white;border:1.5px solid var(--sand-200);border-radius:14px;
                    padding:14px 16px;display:flex;align-items:center;gap:12px;">
          <div class="sk-pulse" style="width:40px;height:40px;border-radius:50%;"></div>
          <div style="flex:1;display:flex;flex-direction:column;gap:6px;">
            <div class="sk-pulse" style="height:13px;border-radius:6px;width:60%;"></div>
            <div class="sk-pulse" style="height:5px;border-radius:99px;width:85%;"></div>
          </div>
        </div>`).join('')}
      </div>`;
  }

  if(!_tdStudents.length){
    container.innerHTML = `
      <div style="text-align:center;padding:40px 20px;">
        <div style="font-size:2.5rem;margin-bottom:12px;">👥</div>
        <div style="font-size:14px;color:var(--navy-700);font-weight:700;margin-bottom:6px;">Sin alumnos todavía</div>
        <div style="font-size:12px;color:var(--sand-500);">Creá una clase y compartí el código para que se unan.</div>
      </div>`;
    return;
  }

  const STATUS_CONFIG = {
    active:   { icon:'✅', label:'Activo hoy',  color:'#065F46', bg:'#D1FAE5' },
    warning:  { icon:'⚠️', label:'2-3 días',    color:'#92400E', bg:'#FEF3C7' },
    inactive: { icon:'❌', label:'+5 días',      color:'#991B1B', bg:'#FEE2E2' },
  };
  // Fallback honesto: sin prog no sabemos si está inactivo o si nunca sincronizó
  const NOSYNC_CONFIG = { icon:'📡', label:'Sin sincronizar', color:'#6B7280', bg:'#F3F4F6' };

  // Ordenar: inactivos primero (los que más necesitan atención)
  const sorted = [..._tdStudents].sort((a, b) => {
    const order = { inactive: 0, warning: 1, active: 2 };
    return order[tdActivityStatus(a)] - order[tdActivityStatus(b)];
  });

  container.innerHTML = sorted.map(s => {
    const status   = tdActivityStatus(s);
    const cfg      = s.prog ? STATUS_CONFIG[status] : NOSYNC_CONFIG;
    const pct      = tdCalcProgress(s);
    const name     = s.name || s.email?.split('@')[0] || 'Alumno';
    const lastDate = s.prog?.updated_at
      ? new Date(s.prog.updated_at).toLocaleDateString('es', { day:'numeric', month:'short' })
      : 'Nunca';

    // Prediction badge
    const pred = tdGetPrediction(s);
    var predBadge = '';
    if(pred && pred.status !== 'today'){
      var predCfg = {
        on_track: { icon:'✅', label: pred.daysLeft + 'd · OK', color:'#065F46', bg:'#D1FAE5' },
        at_risk:  { icon:'⚠️', label: pred.daysLeft + 'd · ' + pred.recoSessions + 'x/sem', color:'#92400E', bg:'#FEF3C7' },
        behind:   { icon:'🔴', label: pred.daysLeft + 'd · urgente', color:'#991B1B', bg:'#FEE2E2' },
      }[pred.status];
      if(predCfg){
        predBadge = '<div style="font-size:9px;font-weight:700;color:' + predCfg.color + ';' +
          'background:' + predCfg.bg + ';padding:2px 7px;border-radius:99px;margin-top:2px;">' +
          '✡️ ' + predBadge + predCfg.label + '</div>';
      }
    }

    return '<div onclick="tdOpenStudent(\'' + s.id + '\')"' +
      ' style="background:white;border:1.5px solid var(--sand-300);border-radius:14px;' +
      'padding:14px 16px;cursor:pointer;transition:box-shadow .15s;display:flex;align-items:center;gap:12px;"' +
      ' onmouseenter="this.style.boxShadow=\'var(--shadow-2)\'"' +
      ' onmouseleave="this.style.boxShadow=\'\'">' +
        '<div style="width:40px;height:40px;border-radius:50%;background:' + cfg.bg + ';' +
          'display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;">' + cfg.icon + '</div>' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="font-weight:700;color:var(--navy-800);font-size:14px;' +
            'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(name) + '</div>' +
          '<div style="font-size:11px;color:var(--sand-500);margin-top:2px;">Última sesión: ' + lastDate + '</div>' +
          '<div style="margin-top:6px;background:var(--sand-200);height:5px;border-radius:99px;overflow:hidden;">' +
            '<div style="height:100%;width:' + pct + '%;background:' + (pct >= 70 ? 'var(--success)' : pct >= 30 ? 'var(--gold-500)' : 'var(--sand-400)') + ';border-radius:99px;transition:width .4s;"></div>' +
          '</div>' +
        '</div>' +
        '<div style="text-align:right;flex-shrink:0;">' +
          '<div style="font-size:1rem;font-weight:900;color:var(--navy-800);font-family:\'Fraunces\',serif;">' + pct + '%</div>' +
          '<div style="font-size:10px;font-weight:700;color:' + cfg.color + ';background:' + cfg.bg + ';padding:2px 7px;border-radius:99px;margin-top:3px;">' + cfg.label + '</div>' +
          predBadge +
        '</div>' +
      '</div>';
  }).join('');
}

// ── Detalle de alumno ─────────────────────────────────────────

// ╔═══════════════════════════════════════════════════════════════╗
// ║  PROYECCIÓN PREDICTIVA                                        ║
// ║  Estima si el alumno llegará preparado a su Bar/Bat Mitzvá.  ║
// ║  Basado en: progreso actual, velocidad de aprendizaje,       ║
// ║  días restantes hasta la fecha del evento.                   ║
// ╚═══════════════════════════════════════════════════════════════╝

function tdGetPrediction(student){
  const progress = student.prog?.progress || {};
  const pct      = tdCalcProgress(student);

  // Fecha del BM del alumno (guardada en su perfil o progress)
  const bmDateStr = student.bm_date || student.prog?.bm_date;
  if(!bmDateStr) return null;

  const bm      = new Date(bmDateStr + 'T00:00:00');
  const now     = new Date();
  const daysLeft = Math.max(0, Math.round((bm - now) / (1000 * 60 * 60 * 24)));
  const weeksLeft = Math.ceil(daysLeft / 7);

  if(daysLeft === 0) return { daysLeft: 0, weeksLeft: 0, status: 'today', pct, projected: pct, GOAL: 80 };

  // Velocidad de aprendizaje: progreso / días desde primera actividad
  const firstSeen = student.prog?.created_at
    ? Math.round((now - new Date(student.prog.created_at)) / (1000 * 60 * 60 * 24))
    : 30; // asumir 30 días si no hay dato
  const daysSinceStart = Math.max(1, firstSeen);
  const pctPerDay = pct / daysSinceStart;

  // Proyección: ¿cuánto progreso tendrá en `daysLeft` días?
  const projected = Math.min(100, Math.round(pct + (pctPerDay * daysLeft)));

  // Meta: 80% para estar listo
  const GOAL = 80;
  const status = projected >= GOAL  ? 'on_track'
               : projected >= 60   ? 'at_risk'
               : 'behind';

  // Días necesarios para llegar al 80% al ritmo actual
  const pctNeeded = Math.max(0, GOAL - pct);
  const daysNeeded = pctPerDay > 0 ? Math.ceil(pctNeeded / pctPerDay) : 999;

  // Recomendación de sesiones por semana
  var recoSessions = 3;
  if(status === 'behind')        recoSessions = 7;
  else if(status === 'at_risk')  recoSessions = 5;
  else if(daysLeft <= 30)        recoSessions = 5;
  else if(daysLeft <= 60)        recoSessions = 4;

  // Ritmo actual estimado (sesiones/semana basado en updated_at history)
  var currentPace = daysSinceStart > 0 ? Math.round((pct / 4) / (daysSinceStart / 7) * 10) / 10 : 0;

  return { daysLeft, weeksLeft, projected, status, pct,
           pctPerDay: pctPerDay.toFixed(1), daysNeeded, GOAL,
           recoSessions, currentPace };
}

function tdRenderPrediction(pred){
  if(!pred) return '';
  const { daysLeft, weeksLeft, projected, status, pct, daysNeeded, GOAL, recoSessions } = pred;

  const statusConfig = {
    on_track: { icon:'✅', color:'#065F46', bg:'#D1FAE5', label:'Va en camino', msg:'Proyectamos ' + projected + '% para la ceremonia.' },
    at_risk:  { icon:'⚠️', color:'#92400E', bg:'#FEF3C7', label:'Necesita refuerzo', msg:'Con este ritmo llegará al ' + projected + '%. Recomendación: ' + recoSessions + ' sesiones/semana.' },
    behind:   { icon:'🔴', color:'#991B1B', bg:'#FEE2E2', label:'Atención urgente', msg:'Solo llegaría al ' + projected + '%. Necesita practicar todos los días.' },
    today:    { icon:'🎉', color:'#1B3A5C', bg:'#EFF6FF', label:'Hoy es el día', msg:'¡Hoy es la ceremonia! 🎉' },
  };
  var cfg = statusConfig[status];

  // Recomendación accionable
  var recoHtml = '';
  if(status === 'at_risk' || status === 'behind'){
    recoHtml = '<div style="margin-top:8px;padding:8px 10px;background:white;border-radius:8px;' +
      'font-size:11px;color:' + cfg.color + ';font-weight:600;display:flex;align-items:center;gap:6px;">' +
      '<span style="font-size:1rem;">💡</span>' +
      '<span>Recomendación: practicar <b>' + recoSessions + ' veces por semana</b> ' +
      (weeksLeft ? '(' + weeksLeft + ' semanas restantes)' : '') + '</span></div>';
  }

  return '<div style="background:' + cfg.bg + ';border:1.5px solid ' + cfg.color + '40;border-radius:12px;padding:12px 14px;">' +
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
      '<span style="font-size:1.2rem;">' + cfg.icon + '</span>' +
      '<div>' +
        '<div style="font-size:12px;font-weight:900;color:' + cfg.color + ';">' + cfg.label + '</div>' +
        '<div style="font-size:10px;color:' + cfg.color + '80;">' + daysLeft + ' días · ' + (weeksLeft || 0) + ' semanas</div>' +
      '</div>' +
    '</div>' +
    '<div style="font-size:12px;color:' + cfg.color + ';line-height:1.5;">' + cfg.msg + '</div>' +
    '<div style="margin-top:8px;height:6px;background:rgba(0,0,0,0.08);border-radius:99px;overflow:hidden;position:relative;">' +
      '<div style="height:100%;width:' + Math.min(100,pct) + '%;background:' + cfg.color + ';border-radius:99px;"></div>' +
      '<div style="position:absolute;top:0;left:' + GOAL + '%;width:2px;height:100%;background:' + cfg.color + ';opacity:0.4;"></div>' +
    '</div>' +
    '<div style="display:flex;justify-content:space-between;margin-top:4px;">' +
      '<span style="font-size:10px;color:' + cfg.color + '80;">Actual: ' + pct + '%</span>' +
      '<span style="font-size:10px;color:' + cfg.color + '80;">Meta: ' + GOAL + '%</span>' +
      '<span style="font-size:10px;color:' + cfg.color + '80;">Proyección: ' + projected + '%</span>' +
    '</div>' +
    recoHtml +
  '</div>';
}

function tdOpenStudent(studentId){
  const student = _tdStudents.find(s => s.id === studentId);
  if(!student) return;

  const detail  = document.getElementById('td-student-detail');
  const nameEl  = document.getElementById('td-detail-name');
  const content = document.getElementById('td-detail-content');
  if(!detail || !content) return;

  const name     = student.name || student.email?.split('@')[0] || 'Alumno';
  const progress = student.prog?.progress || {};
  const pct      = tdCalcProgress(student);
  const status   = tdActivityStatus(student);
  const lastDate = student.prog?.updated_at
    ? new Date(student.prog.updated_at).toLocaleString('es', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })
    : 'Nunca';

  // Calcular errores frecuentes
  const errors = [];
  Object.entries(progress).forEach(([fon, data]) => {
    if((data.wrong || 0) >= 2 && data.wrong > (data.correct || 0)){
      errors.push({ fon, wrong: data.wrong, correct: data.correct || 0 });
    }
  });
  errors.sort((a,b) => b.wrong - a.wrong);

  // Lecciones completadas
  let lessonsOk = 0;
  Object.values(ALL_DATA).forEach(serie => {
    if(serie.type !== 'BASE') return;
    const done = (serie.words || []).filter(w => {
      const ws = progress[w.fon];
      return ws && ws.correct >= 3;
    }).length;
    if(done === serie.words?.length) lessonsOk++;
  });

  nameEl.textContent = name;
  // Proyección predictiva (si el alumno tiene fecha de BM)
  const pred    = tdGetPrediction(student);
  const predHtml = tdRenderPrediction(pred);

  content.innerHTML = `
    <!-- Proyección predictiva -->
    ${predHtml ? `<div style="margin-bottom:4px;">${predHtml}</div>` : ''}
    <!-- Métricas -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
      ${[
        { v: pct+'%',      l: 'Progreso' },
        { v: lessonsOk,    l: 'Series' },
        { v: status === 'active' ? 'Hoy' : lastDate.split(',')[0], l: 'Última sesión' },
      ].map(x => `
        <div style="background:var(--sand-100);border:1.5px solid var(--sand-200);border-radius:12px;padding:12px;text-align:center;">
          <div style="font-family:'Fraunces',serif;font-size:1.3rem;font-weight:900;color:var(--navy-800);">${x.v}</div>
          <div style="font-size:10px;color:var(--sand-500);text-transform:uppercase;font-weight:700;margin-top:2px;">${x.l}</div>
        </div>`).join('')}
    </div>

    <!-- Última sesión -->
    <div style="background:var(--sand-100);border-radius:12px;padding:12px 14px;font-size:13px;color:var(--navy-700);">
      🕐 Última actividad: <strong>${lastDate}</strong>
    </div>

    ${errors.length ? `
    <!-- Errores frecuentes -->
    <div style="background:#FEF2F2;border:1.5px solid #FECACA;border-radius:12px;padding:12px 14px;">
      <div style="font-size:12px;font-weight:700;color:#991B1B;margin-bottom:8px;">⚠️ Palabras con dificultad</div>
      ${errors.slice(0,5).map(e => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;
                    border-bottom:1px solid #FECACA;font-size:13px;">
          <span style="font-weight:600;color:var(--navy-800);">${e.fon}</span>
          <span style="font-size:11px;color:#991B1B;">${e.wrong} errores / ${e.correct} correctas</span>
        </div>`).join('')}
    </div>` : `
    <div style="background:#F0FDF4;border:1.5px solid #BBF7D0;border-radius:12px;padding:12px 14px;
                font-size:13px;color:#065F46;">
      ✅ Sin errores frecuentes — ¡va muy bien!
    </div>`}

    <!-- Acción: enviar mensaje -->
    <div style="background:white;border:1.5px solid var(--sand-300);border-radius:12px;padding:14px;">
      <div style="font-size:12px;font-weight:700;color:var(--navy-700);margin-bottom:8px;">📩 Enviar mensaje a ${esc(name)}</div>
      <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:8px;-webkit-overflow-scrolling:touch;">
        ${TD_MSG_TEMPLATES.map((t, i) => `
          <button onclick="tdApplyMsgTemplate('${studentId}', ${i})"
            style="flex:0 0 auto;padding:6px 10px;border-radius:999px;border:1.5px solid var(--sand-300);
                   background:var(--sand-100);color:var(--navy-700);font-size:11px;font-weight:700;
                   cursor:pointer;white-space:nowrap;">${t.label}</button>`).join('')}
      </div>
      <textarea id="td-msg-student-${studentId}" placeholder="Escribe un mensaje de aliento..."
        style="width:100%;padding:10px;border:1.5px solid var(--sand-300);border-radius:10px;
               font-size:13px;min-height:72px;resize:none;font-family:inherit;color:var(--navy-800);outline:none;box-sizing:border-box;"></textarea>
      <button id="td-send-msg-btn" data-student-id="${studentId}" data-student-name="${esc(name)}"
        style="margin-top:8px;width:100%;padding:10px;border-radius:10px;border:none;
               background:var(--navy-800);color:white;font-size:13px;font-weight:700;cursor:pointer;">
        Enviar mensaje
      </button>
    </div>

    <!-- Gestión del alumno -->
    <div style="display:flex;gap:8px;margin-top:10px;">
      <button id="td-rename-student-btn" data-student-id="${studentId}"
        style="flex:1;padding:10px;border-radius:10px;border:1.5px solid var(--sand-300);
               background:white;color:var(--navy-700);font-size:12px;font-weight:700;cursor:pointer;">
        ✏️ Cambiar nombre
      </button>
      <button id="td-remove-student-btn" data-student-id="${studentId}" data-student-name="${esc(name)}"
        style="flex:1;padding:10px;border-radius:10px;border:1.5px solid #FECACA;
               background:#FEF2F2;color:#991B1B;font-size:12px;font-weight:700;cursor:pointer;">
        🗑 Quitar de la clase
      </button>
    </div>`;

  detail.style.display = 'block';

  const renameBtn = document.getElementById('td-rename-student-btn');
  if(renameBtn) renameBtn.addEventListener('click', function(){ tdRenameStudent(this.dataset.studentId); });
  const removeBtn = document.getElementById('td-remove-student-btn');
  if(removeBtn) removeBtn.addEventListener('click', function(){
    tdRemoveStudentFromClass(this.dataset.studentId, this.dataset.studentName);
  });

  // data-attributes + addEventListener: evita interpolar el nombre del
  // alumno dentro de un onclick inline (riesgo de inyección / escape manual).
  const sendBtn = document.getElementById('td-send-msg-btn');
  if(sendBtn){
    sendBtn.addEventListener('click', function(){
      const sid   = this.dataset.studentId;
      const sname = this.dataset.studentName;
      const ta    = document.getElementById('td-msg-student-' + sid);
      tdSendToStudent(sid, sname, ta ? ta.value : '');
    });
  }
}


// ╔═══════════════════════════════════════════════════════════════╗
// ║  REPORTE SEMANAL DE CLASE                                     ║
// ║  Muestra en el dashboard del docente las métricas de         ║
// ║  actividad de la clase en los últimos 7 días.                ║
// ╚═══════════════════════════════════════════════════════════════╝

function tdRenderWeeklyReport(){
  const container = document.getElementById('td-content');
  if(!container) return;

  const now   = Date.now();
  const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

  // Calcular métricas de la semana
  const activeThisWeek  = _tdStudents.filter(s => {
    const last = s.prog?.updated_at ? new Date(s.prog.updated_at).getTime() : 0;
    return (now - last) <= ONE_WEEK;
  });

  const inactiveThisWeek = _tdStudents.filter(s => {
    const last = s.prog?.updated_at ? new Date(s.prog.updated_at).getTime() : 0;
    return last === 0 || (now - last) > ONE_WEEK;
  });

  // Progreso promedio
  const avgPct = _tdStudents.length
    ? Math.round(_tdStudents.reduce((s, st) => s + tdCalcProgress(st), 0) / _tdStudents.length)
    : 0;

  // ── REPORTE DE PREPARACIÓN: predicción por alumno ──
  var studentsWithBM = _tdStudents.filter(function(s){ return tdGetPrediction(s) !== null; });
  var onTrack = studentsWithBM.filter(function(s){ var p = tdGetPrediction(s); return p && p.status === 'on_track'; });
  var atRisk  = studentsWithBM.filter(function(s){ var p = tdGetPrediction(s); return p && p.status === 'at_risk'; });
  var behind  = studentsWithBM.filter(function(s){ var p = tdGetPrediction(s); return p && p.status === 'behind'; });

  // Top performers esta semana
  const topStudents = [...activeThisWeek]
    .sort((a, b) => tdCalcProgress(b) - tdCalcProgress(a))
    .slice(0, 3);

  var html = '<div style="display:flex;flex-direction:column;gap:12px;">';

  // ── Resumen de la semana ──
  html += '<div style="background:var(--navy-800);border-radius:16px;padding:16px;color:white;">' +
    '<div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px;">' +
      '📊 Resumen — últimos 7 días</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">' +
      [{ v: activeThisWeek.length, l: 'Activos', color: '#86efac' },
       { v: inactiveThisWeek.length, l: 'Inactivos', color: '#fca5a5' },
       { v: avgPct + '%', l: 'Promedio', color: '#fcd34d' }
      ].map(function(x){ return '<div style="text-align:center;">' +
        '<div style="font-family:\'Fraunces\',serif;font-size:1.6rem;font-weight:900;color:' + x.color + ';">' + x.v + '</div>' +
        '<div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.5);margin-top:2px;">' + x.l + '</div></div>'; }).join('') +
    '</div></div>';

  // ── Reporte de Preparación (nuevo) ──
  if(studentsWithBM.length > 0){
    html += '<div style="background:white;border:2px solid var(--navy-300);border-radius:16px;padding:16px;">' +
      '<div style="font-size:12px;font-weight:900;color:var(--navy-800);margin-bottom:12px;">✡️ Reporte de Preparación — Bar/Bat Mitzvá</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px;">' +
        '<div style="background:#D1FAE5;border-radius:10px;padding:10px;text-align:center;">' +
          '<div style="font-family:\'Fraunces\',serif;font-size:1.4rem;font-weight:900;color:#065F46;">' + onTrack.length + '</div>' +
          '<div style="font-size:9px;font-weight:700;color:#065F46;text-transform:uppercase;">En camino</div></div>' +
        '<div style="background:#FEF3C7;border-radius:10px;padding:10px;text-align:center;">' +
          '<div style="font-family:\'Fraunces\',serif;font-size:1.4rem;font-weight:900;color:#92400E;">' + atRisk.length + '</div>' +
          '<div style="font-size:9px;font-weight:700;color:#92400E;text-transform:uppercase;">Refuerzo</div></div>' +
        '<div style="background:#FEE2E2;border-radius:10px;padding:10px;text-align:center;">' +
          '<div style="font-family:\'Fraunces\',serif;font-size:1.4rem;font-weight:900;color:#991B1B;">' + behind.length + '</div>' +
          '<div style="font-size:9px;font-weight:700;color:#991B1B;text-transform:uppercase;">Urgente</div></div>' +
      '</div>';

    // Per-student prediction rows
    studentsWithBM.sort(function(a,b){
      var pa = tdGetPrediction(a), pb = tdGetPrediction(b);
      var order = { behind: 0, at_risk: 1, on_track: 2, today: 3 };
      return (order[pa?.status] || 3) - (order[pb?.status] || 3);
    });
    studentsWithBM.forEach(function(s){
      var pred = tdGetPrediction(s);
      if(!pred) return;
      var name = s.name || s.email?.split('@')[0] || 'Alumno';
      var pCfg = {
        on_track: { icon:'✅', color:'#065F46' },
        at_risk:  { icon:'⚠️', color:'#92400E' },
        behind:   { icon:'🔴', color:'#991B1B' },
        today:    { icon:'🎉', color:'#1B3A5C' },
      }[pred.status] || { icon:'', color:'var(--sand-500)' };
      html += '<div onclick="tdOpenStudent(\'' + s.id + '\')" style="display:flex;align-items:center;gap:10px;' +
        'padding:8px 0;border-top:1px solid var(--sand-200);cursor:pointer;">' +
        '<span style="font-size:1rem;">' + pCfg.icon + '</span>' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="font-size:13px;font-weight:600;color:var(--navy-800);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(name) + '</div>' +
          '<div style="font-size:10px;color:var(--sand-500);">' + pred.daysLeft + ' días · ' + pred.pct + '% → ' + pred.projected + '%</div>' +
        '</div>' +
        '<div style="text-align:right;flex-shrink:0;">' +
          '<div style="font-size:12px;font-weight:800;color:' + pCfg.color + ';">' + pred.projected + '%</div>' +
          (pred.recoSessions ? '<div style="font-size:9px;color:var(--sand-500);">' + pred.recoSessions + 'x/sem</div>' : '') +
        '</div></div>';
    });
    html += '</div>';
  }

  // ── Alumnos sin fecha de BM ──
  var withoutBM = _tdStudents.filter(function(s){ return tdGetPrediction(s) === null; });
  if(withoutBM.length > 0 && studentsWithBM.length > 0){
    html += '<div style="background:var(--sand-100);border:1.5px solid var(--sand-200);border-radius:12px;padding:12px 14px;">' +
      '<div style="font-size:11px;color:var(--sand-500);font-weight:600;">ℹ️ ' + withoutBM.length + ' alumno' +
      (withoutBM.length !== 1 ? 's' : '') + ' sin fecha de ceremonia — pediles que la carguen en la app para ver su proyección.</div></div>';
  }

  // ── Top de la semana ──
  if(topStudents.length){
    html += '<div style="background:white;border:1.5px solid var(--sand-300);border-radius:14px;padding:14px;">' +
      '<div style="font-size:12px;font-weight:900;color:var(--navy-700);margin-bottom:10px;">🏆 Más activos esta semana</div>';
    topStudents.forEach(function(s, i){
      var name = s.name || s.email?.split('@')[0] || 'Alumno';
      var pct  = tdCalcProgress(s);
      html += '<div onclick="tdOpenStudent(\'' + s.id + '\')" style="display:flex;align-items:center;gap:10px;' +
        'padding:8px 0;border-bottom:' + (i < topStudents.length - 1 ? '1px solid var(--sand-200)' : 'none') + ';cursor:pointer;">' +
        '<span style="font-size:1.2rem;">' + ['🥇','🥈','🥉'][i] + '</span>' +
        '<div style="flex:1;">' +
          '<div style="font-size:13px;font-weight:700;color:var(--navy-800);">' + esc(name) + '</div>' +
          '<div style="margin-top:4px;height:4px;background:var(--sand-200);border-radius:99px;overflow:hidden;">' +
            '<div style="height:100%;width:' + pct + '%;background:var(--gold-500);border-radius:99px;"></div></div>' +
        '</div>' +
        '<span style="font-size:13px;font-weight:900;color:var(--navy-800);font-family:\'Fraunces\',serif;">' + pct + '%</span>' +
      '</div>';
    });
    html += '</div>';
  }

  // ── Inactivos esta semana ──
  if(inactiveThisWeek.length){
    html += '<div style="background:white;border:1.5px solid var(--sand-300);border-radius:14px;padding:14px;">' +
      '<div style="font-size:12px;font-weight:700;color:var(--sand-500);margin-bottom:8px;">😴 Sin actividad esta semana (' + inactiveThisWeek.length + ')</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:6px;">';
    inactiveThisWeek.forEach(function(s){
      var name = s.name || s.email?.split('@')[0] || 'Alumno';
      html += '<span onclick="tdOpenStudent(\'' + s.id + '\')" style="font-size:11px;font-weight:700;color:var(--navy-700);' +
        'background:var(--sand-100);border:1.5px solid var(--sand-200);border-radius:99px;padding:4px 10px;cursor:pointer;">' + esc(name) + '</span>';
    });
    html += '</div></div>';
  }

  html += '</div>';
  container.innerHTML = html;
}

// ── Configuración de la clase ─────────────────────────────────
const TD_LEADERBOARD_KEY = 'td_leaderboard_enabled';

async function tdToggleLeaderboard(){
  if(!_sb || !_authUser || !_tdClassData) return;
  const current = _tdClassData.leaderboard_enabled !== false; // default true
  const newVal  = !current;
  // Persist to Supabase
  const { error } = await _sb
    .from('classes')
    .update({ leaderboard_enabled: newVal })
    .eq('id', _tdClassData.id);
  if(error){
    showToast('Error al guardar: ' + error.message, 'warn');
    return;
  }
  _tdClassData.leaderboard_enabled = newVal;
  // Also keep localStorage in sync for quick reads
  localStorage.setItem(TD_LEADERBOARD_KEY, String(newVal));
  tdRenderClassSettings();
  showToast(newVal ? '🏅 Ranking de clase activado' : '🔒 Ranking de clase desactivado', 'green');
}

function isLeaderboardEnabled(){
  if(_tdClassData) return _tdClassData.leaderboard_enabled !== false;
  return localStorage.getItem(TD_LEADERBOARD_KEY) !== 'false';
}

// ╔═══════════════════════════════════════════════════════════╗
// ║  ASIGNACIONES (I3) — crear tarea semanal + ver % completado ║
// ╚═══════════════════════════════════════════════════════════╝
let _tdAssignments = []; // cache de asignaciones de la clase activa

async function tdLoadAssignments(){
  _tdAssignments = [];
  if(!_sb || !_tdClassData) return;
  const { data, error } = await _sb
    .from('assignments')
    .select('id, type, target, due_date, created_at')
    .eq('class_id', _tdClassData.id)
    .order('created_at', { ascending: false });
  if(error){ dbg('[Assignments] tdLoadAssignments error:', error.message); return; }
  _tdAssignments = data || [];
  if(!_tdAssignments.length) return;

  const ids = _tdAssignments.map(a => a.id);
  const { data: prog, error: progErr } = await _sb
    .from('assignment_progress')
    .select('assignment_id')
    .in('assignment_id', ids);
  if(progErr){ dbg('[Assignments] progress error:', progErr.message); return; }
  const doneCounts = {};
  (prog || []).forEach(p => { doneCounts[p.assignment_id] = (doneCounts[p.assignment_id] || 0) + 1; });
  _tdAssignments.forEach(a => { a._doneCount = doneCounts[a.id] || 0; });
}

function tdAssignmentLabel(a){
  if(a.type === 'serie'){
    const meta = (typeof ALL_DATA !== 'undefined') ? ALL_DATA[a.target?.key] : null;
    return meta?.name || a.target?.key || 'Serie';
  }
  if(a.type === 'aliyah'){
    const pMeta   = (typeof PARASHA_CATALOG !== 'undefined') ? PARASHA_CATALOG.find(p => p.id === a.target?.parashaId) : null;
    const alLabel = a.target?.aliyah ? ('Aliyá ' + a.target.aliyah) : 'Completa';
    return (pMeta?.esp || a.target?.parashaId || 'Torá') + ' · ' + alLabel;
  }
  return 'Tarea';
}

function tdRenderAssignmentsSection(){
  const total = _tdStudents.length;
  const seriesOptions = (typeof ALL_DATA !== 'undefined' ? Object.keys(ALL_DATA) : [])
    .filter(k => ALL_DATA[k].type === 'BASE')
    .map(k => '<option value="' + k + '">' + k + '</option>').join('');
  const parashaOptions = (typeof PARASHA_CATALOG !== 'undefined' ? PARASHA_CATALOG : [])
    .map(p => '<option value="' + p.id + '">' + esc(p.esp) + '</option>').join('');

  const listHtml = _tdAssignments.length
    ? _tdAssignments.map(a => {
        const pct    = total ? Math.round((a._doneCount || 0) / total * 100) : 0;
        const dueTxt = a.due_date
          ? new Date(a.due_date + 'T00:00:00').toLocaleDateString('es', { day:'numeric', month:'short' })
          : 'Sin fecha';
        return '<div style="background:var(--sand-100);border-radius:10px;padding:10px 12px;margin-bottom:6px;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;">' +
            '<div style="font-size:12.5px;font-weight:700;color:var(--navy-800);">' + esc(tdAssignmentLabel(a)) + '</div>' +
            '<div style="font-size:11px;font-weight:700;color:var(--sand-500);">' + esc(dueTxt) + '</div>' +
          '</div>' +
          '<div style="margin-top:6px;background:var(--sand-200);height:5px;border-radius:99px;overflow:hidden;">' +
            '<div style="height:100%;width:' + pct + '%;background:var(--success);border-radius:99px;"></div>' +
          '</div>' +
          '<div style="font-size:10px;color:var(--sand-500);margin-top:3px;">' + (a._doneCount || 0) + '/' + total + ' completado — ' + pct + '%</div>' +
        '</div>';
      }).join('')
    : '<div style="font-size:12px;color:var(--sand-500);text-align:center;padding:10px 0;">Sin asignaciones todavía</div>';

  return `
    <div style="background:white;border:1.5px solid var(--sand-300);border-radius:14px;padding:16px;">
      <div style="font-size:12px;font-weight:700;color:var(--navy-700);margin-bottom:10px;">📌 Asignaciones de la clase</div>
      ${listHtml}
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--sand-200);">
        <select id="td-assign-type" style="width:100%;padding:9px 10px;border:1.5px solid var(--sand-300);border-radius:8px;font-size:12.5px;margin-bottom:6px;color:var(--navy-800);">
          <option value="serie">Serie (base)</option>
          <option value="aliyah">Aliyá de Torá</option>
        </select>
        <select id="td-assign-serie" style="width:100%;padding:9px 10px;border:1.5px solid var(--sand-300);border-radius:8px;font-size:12.5px;margin-bottom:6px;color:var(--navy-800);">
          ${seriesOptions}
        </select>
        <select id="td-assign-parasha" style="display:none;width:100%;padding:9px 10px;border:1.5px solid var(--sand-300);border-radius:8px;font-size:12.5px;margin-bottom:6px;color:var(--navy-800);">
          ${parashaOptions}
        </select>
        <input id="td-assign-aliyah" type="number" min="1" max="7" placeholder="N° de aliyá (vacío = parashá completa)"
          style="display:none;width:100%;padding:9px 10px;border:1.5px solid var(--sand-300);border-radius:8px;font-size:12.5px;margin-bottom:6px;box-sizing:border-box;color:var(--navy-800);">
        <input id="td-assign-due" type="date"
          style="width:100%;padding:9px 10px;border:1.5px solid var(--sand-300);border-radius:8px;font-size:12.5px;margin-bottom:8px;box-sizing:border-box;color:var(--navy-800);">
        <button id="td-assign-create-btn"
          style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--navy-800);color:white;font-size:13px;font-weight:700;cursor:pointer;">
          + Crear asignación
        </button>
        <div id="td-assign-status" style="font-size:11px;color:var(--sand-500);text-align:center;margin-top:6px;min-height:14px;"></div>
      </div>
    </div>`;
}

async function tdCreateAssignment(){
  if(!_sb || !_authUser || !_tdClassData) return;
  const status = document.getElementById('td-assign-status');
  const type    = document.getElementById('td-assign-type')?.value;
  const due     = document.getElementById('td-assign-due')?.value || null;

  let target = {};
  if(type === 'serie'){
    const key = document.getElementById('td-assign-serie')?.value;
    if(!key){ if(status) status.textContent = 'Elegí una serie'; return; }
    target = { key };
  } else {
    const parashaId = document.getElementById('td-assign-parasha')?.value;
    const aliyahRaw = document.getElementById('td-assign-aliyah')?.value;
    if(!parashaId){ if(status) status.textContent = 'Elegí una parashá'; return; }
    target = { parashaId };
    if(aliyahRaw) target.aliyah = parseInt(aliyahRaw, 10);
  }

  if(status) status.textContent = 'Creando...';
  try {
    const { error } = await _sb.from('assignments').insert({
      class_id:   _tdClassData.id,
      created_by: _authUser.id,
      type, target,
      due_date:   due,
    });
    if(error){ if(status) status.textContent = 'Error: ' + error.message; return; }
    showToast('✓ Asignación creada', 'green');
    trackEvent('assignment_created', { type });
    await tdRenderClassSettings(); // refetch + re-render (incluye la sección de asignaciones)
  } catch(e){ if(status) status.textContent = 'Error: ' + e.message; }
}

async function tdRenderClassSettings(){
  const container = document.getElementById('td-content');
  if(!container) return;

  const cls  = _tdClassData;
  const code = cls?.code || '—';

  if(cls && typeof tdLoadAssignments === 'function') await tdLoadAssignments();

  container.innerHTML = `
    ${cls ? `
    <!-- Clase existente -->
    <div style="background:white;border:1.5px solid var(--sand-300);border-radius:14px;padding:16px;">
      <div style="font-size:11px;font-weight:700;color:var(--sand-500);text-transform:uppercase;margin-bottom:4px;">Clase activa</div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <div style="font-family:'Fraunces',serif;font-size:1.2rem;font-weight:900;color:var(--navy-800);flex:1;">${esc(cls.name)}</div>
        <button onclick="tdRenameClass()" title="Renombrar clase"
          style="padding:8px 10px;border-radius:10px;border:1.5px solid var(--sand-300);background:white;
                 color:var(--navy-700);font-size:13px;cursor:pointer;">✏️</button>
        <button onclick="tdDeleteClass()" title="Eliminar clase"
          style="padding:8px 10px;border-radius:10px;border:1.5px solid #FECACA;background:#FEF2F2;
                 color:#991B1B;font-size:13px;cursor:pointer;">🗑</button>
      </div>
      <div style="font-size:12px;color:var(--sand-500);margin-bottom:6px;">Código para que se unan:</div>
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="flex:1;background:var(--sand-100);border:2px dashed var(--sand-400);border-radius:10px;
                    padding:12px;text-align:center;font-size:1.5rem;font-weight:900;
                    color:var(--navy-800);letter-spacing:0.15em;font-family:'Fraunces',serif;">${code}</div>
        <button onclick="navigator.clipboard?.writeText('${code}').then(()=>showToast('Código copiado','green'))"
          style="padding:12px 16px;border:none;border-radius:10px;background:var(--sand-200);
                 color:var(--navy-700);font-size:13px;font-weight:700;cursor:pointer;">
          Copiar
        </button>
      </div>
      <!-- Leaderboard toggle -->
      <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--sand-200);display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div style="font-size:12px;font-weight:700;color:var(--navy-700);">🏅 Ranking de clase</div>
          <div style="font-size:10px;color:var(--sand-500);margin-top:2px;">Los alumnos ven su posición entre compañeros</div>
        </div>
        <button onclick="tdToggleLeaderboard()"
          style="padding:8px 14px;border-radius:10px;border:1.5px solid ${cls?.leaderboard_enabled !== false ? 'var(--success)' : 'var(--sand-400)'};
                 background:${cls?.leaderboard_enabled !== false ? 'rgba(74,155,111,0.1)' : 'var(--sand-100)'};
                 color:${cls?.leaderboard_enabled !== false ? 'var(--success)' : 'var(--sand-500)'};
                 font-size:12px;font-weight:700;cursor:pointer;min-width:70px;">
          ${cls?.leaderboard_enabled !== false ? '✓ Activo' : 'Inactivo'}
        </button>
      </div>
    </div>` : `
    <!-- Sin clase — crear -->
    <div style="background:white;border:1.5px solid var(--sand-300);border-radius:14px;padding:16px;">
      <div style="font-size:14px;font-weight:700;color:var(--navy-800);margin-bottom:12px;">📋 Crear mi clase</div>
      <input id="td-new-class-name" type="text" placeholder="Nombre de la clase (ej: Bar Mitzvá 2026)"
        style="width:100%;padding:12px 14px;border:1.5px solid var(--sand-300);border-radius:10px;
               font-size:14px;color:var(--navy-800);outline:none;box-sizing:border-box;margin-bottom:10px;"
        onfocus="this.style.borderColor='var(--navy-600)'" onblur="this.style.borderColor='var(--sand-300)'">
      <button onclick="tdCreateClass()"
        style="width:100%;padding:12px;border-radius:10px;border:none;background:var(--navy-800);
               color:white;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 3px 0 var(--navy-900);">
        Crear clase
      </button>
    </div>`}

    <!-- ── Asignaciones (I3) — solo si ya hay clase creada ── -->
    ${cls && typeof tdRenderAssignmentsSection === 'function' ? tdRenderAssignmentsSection() : ''}

    <!-- ── Licencia institucional ───────────────────────── -->
    ${(function(){
      const tier = (typeof getInstitutionTier === 'function') ? getInstitutionTier() : 'free';
      const trialDays = (typeof getDaysLeftInTrial === 'function') ? getDaysLeftInTrial() : null;
      const isFree = tier === 'free';
      const isTrial = tier !== 'free' && trialDays !== null;

      if(!isFree && !isTrial) return `
        <div style="background:linear-gradient(135deg,#0f2744,#1a3a5c);border-radius:14px;
                    padding:14px 16px;display:flex;align-items:center;gap:12px;">
          <span style="font-size:1.4rem;">✡️</span>
          <div>
            <div style="font-size:11px;font-weight:700;color:#7ab8e8;text-transform:uppercase;letter-spacing:.05em;">
              AlefMaster ${tier === 'pro' ? 'Pro' : 'Básica'}
            </div>
            <div style="font-size:12px;color:#a8c8e8;margin-top:2px;">Licencia activa</div>
          </div>
        </div>`;

      if(isTrial) return `
        <div style="background:linear-gradient(135deg,#1a2e1a,#243824);border-radius:14px;
                    padding:14px 16px;border:1.5px solid #2a5a2a;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
            <div>
              <div style="font-size:11px;font-weight:700;color:#5aad6e;text-transform:uppercase;">
                Trial activo — ${tier === 'pro' ? 'Pro' : 'Básica'}
              </div>
              <div style="font-size:12px;color:#8aba8a;margin-top:2px;">
                ${trialDays} día${trialDays !== 1 ? 's' : ''} restante${trialDays !== 1 ? 's' : ''}
              </div>
            </div>
            <div style="font-size:1.2rem;">⏱️</div>
          </div>
          <div style="display:flex;gap:8px;">
            <button onclick="startCheckout('${tier}','stripe')"
              style="flex:1;padding:9px;border:none;border-radius:10px;
                     background:#2a6e3a;color:white;font-size:12px;font-weight:700;cursor:pointer;">
              💳 Stripe
            </button>
            <button onclick="startCheckout('${tier}','mercadopago')"
              style="flex:1;padding:9px;border:none;border-radius:10px;
                     background:#009ee3;color:white;font-size:12px;font-weight:700;cursor:pointer;">
              💙 MercadoPago
            </button>
          </div>
        </div>`;

      // Free — mostrar upgrade
      return `
        <div style="background:linear-gradient(135deg,#1c1408,#2a1e08);border-radius:14px;
                    padding:16px;border:1.5px solid #4a3800;">
          <div style="font-size:13px;font-weight:700;color:#e8b84a;margin-bottom:4px;">
            🚀 Activar licencia institucional
          </div>
          <div style="font-size:11px;color:#a88840;margin-bottom:12px;line-height:1.5;">
            Dashboard avanzado · Karaoke de Torá · Alumnos ilimitados
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
            <div style="background:#1a1408;border:1.5px solid #3a2a00;border-radius:10px;padding:10px;text-align:center;">
              <div style="font-size:10px;color:#7a6030;text-transform:uppercase;font-weight:700;">Básica</div>
              <div style="font-size:1.2rem;font-weight:900;color:#e8b84a;margin:4px 0;">$29</div>
              <div style="font-size:10px;color:#7a6030;">hasta 50 alumnos</div>
            </div>
            <div style="background:#1a1408;border:1.5px solid #5a4000;border-radius:10px;padding:10px;text-align:center;">
              <div style="font-size:10px;color:#a88040;text-transform:uppercase;font-weight:700;">Pro</div>
              <div style="font-size:1.2rem;font-weight:900;color:#f8d060;margin:4px 0;">$79</div>
              <div style="font-size:10px;color:#7a6030;">ilimitado + reportes</div>
            </div>
          </div>
          <!-- Trial sin tarjeta -->
          <button onclick="startCheckout('basic','trial')"
            style="width:100%;padding:10px;border:1.5px dashed #5a4800;border-radius:10px;
                   background:transparent;color:#c8a040;font-size:12px;font-weight:700;
                   cursor:pointer;margin-bottom:8px;">
            ✨ Probar 14 días gratis (sin tarjeta)
          </button>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <button onclick="_amShowCheckoutOptions('basic')"
              style="padding:9px;border:none;border-radius:10px;background:#4a3200;
                     color:#e8b84a;font-size:12px;font-weight:700;cursor:pointer;">
              Básica — pagar
            </button>
            <button onclick="_amShowCheckoutOptions('pro')"
              style="padding:9px;border:none;border-radius:10px;background:#5a4000;
                     color:#f8d060;font-size:12px;font-weight:700;cursor:pointer;">
              Pro — pagar
            </button>
          </div>
        </div>`;
    })()}

    <!-- Mensaje a toda la clase -->
    <div style="background:white;border:1.5px solid var(--sand-300);border-radius:14px;padding:16px;">
      <div style="font-size:12px;font-weight:700;color:var(--navy-700);margin-bottom:8px;">📢 Mensaje a toda la clase</div>
      <input id="td-broadcast-title" type="text" placeholder="Título del mensaje"
        style="width:100%;padding:10px 12px;border:1.5px solid var(--sand-300);border-radius:10px;
               font-size:13px;margin-bottom:8px;box-sizing:border-box;outline:none;color:var(--navy-800);"
        onfocus="this.style.borderColor='var(--navy-600)'" onblur="this.style.borderColor='var(--sand-300)'">
      <textarea id="td-broadcast-body" placeholder="Escribí el mensaje..."
        style="width:100%;padding:10px 12px;border:1.5px solid var(--sand-300);border-radius:10px;
               font-size:13px;min-height:80px;resize:none;font-family:inherit;box-sizing:border-box;
               outline:none;color:var(--navy-800);"
        onfocus="this.style.borderColor='var(--navy-600)'" onblur="this.style.borderColor='var(--sand-300)'"></textarea>
      <button onclick="sendTeacherMessage('all')"
        style="margin-top:8px;width:100%;padding:11px;border-radius:10px;border:none;
               background:var(--navy-800);color:white;font-size:14px;font-weight:700;cursor:pointer;">
        Enviar a todos los alumnos
      </button>
      <div id="td-broadcast-status" style="font-size:12px;color:var(--sand-500);text-align:center;min-height:16px;margin-top:6px;"></div>
    </div>`;

  // Wiring de la sección de asignaciones (si hay clase activa)
  if(cls){
    const typeSel = document.getElementById('td-assign-type');
    if(typeSel){
      typeSel.addEventListener('change', function(){
        const isAliyah = this.value === 'aliyah';
        const serieSel   = document.getElementById('td-assign-serie');
        const parashaSel = document.getElementById('td-assign-parasha');
        const aliyahIn   = document.getElementById('td-assign-aliyah');
        if(serieSel)   serieSel.style.display   = isAliyah ? 'none'  : 'block';
        if(parashaSel) parashaSel.style.display = isAliyah ? 'block' : 'none';
        if(aliyahIn)   aliyahIn.style.display   = isAliyah ? 'block' : 'none';
      });
    }
    document.getElementById('td-assign-create-btn')?.addEventListener('click', tdCreateAssignment);
  }
}

// ── Leaderboard toggle ───────────────────────────────────────
// Insertar toggle en el HTML de configuración de clase
// (se llama desde tdRenderClassSettings al construir el HTML)

// ── Crear clase ───────────────────────────────────────────────
async function tdCreateClass(){
  const nameInput = document.getElementById('td-new-class-name');
  await tdCreateClassNamed(nameInput?.value.trim());
}

// Crea una clase con el nombre dado (usada por el form y por "＋ Nueva clase")
async function tdCreateClassNamed(name){
  if(!_sb || !_authUser) return;
  if(!_requireInstitution('crear clase')) return;
  if(!name){ showToast('Escribí un nombre para la clase', 'warn'); return; }

  // Generar código único 6 caracteres
  const code = (Math.random().toString(36).substring(2,8)).toUpperCase();

  try {
    const { data, error } = await _sb.from('classes').insert({
      teacher_id:     _authUser.id,
      institution_id: _authProfile?.institution_id || null,
      name,
      code,
      created_at: new Date().toISOString(),
    }).select().single();

    if(error){ showToast('Error al crear: ' + error.message, 'warn'); return; }
    _tdClassData = data;
    showToast('✓ Clase creada — código: ' + code, 'green');
    tdSwitchTab('class');
    loadTeacherDashboard();
  } catch(e){ showToast('Error: ' + e.message, 'warn'); }
}

// "＋ Nueva clase" desde el switcher
function tdPromptNewClass(){
  const name = prompt('Nombre de la nueva clase (ej: Bar Mitzvá 2027):');
  if(name === null) return;
  tdCreateClassNamed(name.trim());
}

// ── Renombrar / eliminar clase activa ─────────────────────────
async function tdRenameClass(){
  if(!_sb || !_tdClassData) return;
  const nuevo = prompt('Nuevo nombre para la clase:', _tdClassData.name || '');
  if(nuevo === null) return;
  const name = nuevo.trim();
  if(!name){ showToast('El nombre no puede quedar vacío', 'warn'); return; }
  const { error } = await _sb.from('classes').update({ name }).eq('id', _tdClassData.id);
  if(error){ showToast('Error: ' + error.message, 'warn'); return; }
  _tdClassData.name = name;
  const c = _tdAllClasses.find(x => x.id === _tdClassData.id);
  if(c) c.name = name;
  const nameEl = document.getElementById('td-class-name');
  if(nameEl) nameEl.textContent = name;
  tdRenderClassSwitcher();
  tdRenderClassSettings();
  showToast('✓ Clase renombrada', 'green');
  trackEvent('teacher_class_renamed', {});
}

async function tdDeleteClass(){
  if(!_sb || !_tdClassData) return;
  const nm = _tdClassData.name || 'esta clase';
  if(!confirm('¿Eliminar la clase "' + nm + '"?\n\nLos alumnos quedarán desvinculados (no se borran sus cuentas ni su progreso).')) return;
  if(!confirm('Última confirmación: esta acción no se puede deshacer. ¿Eliminar "' + nm + '"?')) return;
  const { error } = await _sb.from('classes').delete().eq('id', _tdClassData.id);
  if(error){ showToast('Error: ' + error.message, 'warn'); return; }
  showToast('Clase eliminada', 'green');
  trackEvent('teacher_class_deleted', {});
  _tdClassData = null;
  loadTeacherDashboard();
}

// ── Renombrar alumno (RPC — valida que sea alumno del docente) ──
async function tdRenameStudent(studentId){
  if(!_sb) return;
  const st = _tdStudents.find(s => s.id === studentId);
  const nuevo = prompt('Nuevo nombre para el alumno:', st?.name || '');
  if(nuevo === null) return;
  const name = nuevo.trim();
  if(!name){ showToast('El nombre no puede quedar vacío', 'warn'); return; }
  const { data: res, error } = await _sb.rpc('teacher_rename_student', {
    p_student: studentId, p_name: name,
  });
  if(error || !res || res.ok !== true){
    showToast('No se pudo renombrar: ' + (error?.message || res?.reason || 'error'), 'warn');
    return;
  }
  if(st) st.name = res.name;
  tdRenderStudentList();
  tdOpenStudent(studentId);
  showToast('✓ Nombre actualizado', 'green');
  trackEvent('teacher_student_renamed', {});
}

// ── Quitar alumno de la clase activa (no borra su cuenta) ─────
async function tdRemoveStudentFromClass(studentId, studentName){
  if(!_sb || !_tdClassData) return;
  if(!confirm('¿Quitar a ' + studentName + ' de la clase "' + (_tdClassData.name || '') + '"?\n\nSu cuenta y su progreso NO se borran; puede volver a unirse con el código.')) return;
  const { error } = await _sb.from('class_members').delete()
    .eq('class_id', _tdClassData.id)
    .eq('student_id', studentId);
  if(error){ showToast('Error: ' + error.message, 'warn'); return; }
  const detail = document.getElementById('td-student-detail');
  if(detail) detail.style.display = 'none';
  showToast('✓ ' + studentName + ' fue quitado de la clase', 'green');
  trackEvent('teacher_student_removed', {});
  await tdLoadStudentsForActiveClass();
}

// ── Plantillas de mensajes para alumnos ───────────────────────
const TD_MSG_TEMPLATES = [
  { label: '👏 Felicitar',      body: '¡Kol hakavod! Esta semana avanzaste muchísimo 👏' },
  { label: '🔥 Racha',          body: 'Vi que practicaste hoy — ¡seguí así que vas muy bien!' },
  { label: '👋 Te extrañamos',  body: 'Hace unos días que no entrás a practicar. ¿Todo bien? Te espero 🙂' },
  { label: '🔤 Vocales',        body: 'Las vocales necesitan un repasito — tocá a Rashi en el juego y las ves todas juntas.' },
  { label: '🎧 Escuchar',       body: 'Probá el modo Escuchar y repetir con tu aliá — 10 minutos hoy hacen la diferencia.' },
  { label: '🏁 Casi lo lográs', body: '¡Ya casi terminás tu serie! Un empujoncito más y desbloqueás la siguiente.' },
  { label: '🤝 Repasamos',      body: 'Mañana repasamos juntos en clase lo que te costó — no te preocupes.' },
  { label: '♪ Fraseo',          body: 'Tu lectura de Torá viene muy bien — esta semana sumale el modo Fraseo ♪.' },
  { label: '⏱ 10 min/día',      body: 'Acordate: mejor 10 minutos por día que 1 hora el domingo 😉' },
  { label: '🎤 Tu ceremonia',   body: '¡Tu ceremonia se acerca! Practicá tu aliá con el karaoke todos los días.' },
];

function tdApplyMsgTemplate(studentId, idx){
  const t  = TD_MSG_TEMPLATES[idx];
  const ta = document.getElementById('td-msg-student-' + studentId);
  if(t && ta){ ta.value = t.body; ta.focus(); }
}

// ── Enviar mensaje a un alumno individual ─────────────────────
async function tdSendToStudent(studentId, studentName, body){
  if(!_sb || !_authUser || !body?.trim()){
    showToast('Escribí un mensaje', 'warn'); return;
  }
  try {
    const { error } = await _sb.from('notifications').insert({
      user_id:    studentId,
      title:      '📢 Mensaje de tu profesor',
      body:       body.trim(),
      type:       'teacher',
      read:       false,
      created_at: new Date().toISOString(),
    });
    if(error){ showToast('Error: ' + error.message, 'warn'); return; }
    showToast(`✓ Mensaje enviado a ${studentName}`, 'green');
    const textarea = document.getElementById(`td-msg-student-${studentId}`);
    if(textarea) textarea.value = '';
    trackEvent('teacher_message_sent', { target: 'individual' });
  } catch(e){ showToast('Error: ' + e.message, 'warn'); }
}

// ── Enviar a la clase activa, o institucional si no hay clase creada ──
async function sendTeacherMessage(target){
  if(!_sb || !_authUser || _authProfile?.role !== 'teacher') return;
  if(!_requireInstitution('enviar mensajes')) return;

  const title  = (document.getElementById('td-broadcast-title') || document.getElementById('tp-title'))?.value.trim();
  const body   = (document.getElementById('td-broadcast-body')  || document.getElementById('tp-body'))?.value.trim();
  const status = document.getElementById('td-broadcast-status') || document.getElementById('tp-status');

  if(!title || !body){ if(status) status.textContent = 'Completá título y mensaje'; return; }
  if(status) status.textContent = 'Enviando...';

  try {
    let studentIds;
    if(_tdClassData){
      // Aislamiento por clase: reusar _tdStudents ya cargados de ESTA clase,
      // sin re-consultar profiles de toda la institución.
      studentIds = _tdStudents.map(s => s.id);
      if(!studentIds.length){ if(status) status.textContent = 'No hay alumnos en esta clase'; return; }
    } else {
      // Sin clase creada: broadcast institucional (comportamiento previo)
      const instId = _authProfile?.institution_id;
      let studQ = _sb.from('profiles').select('id').eq('role','student');
      if(instId) studQ = studQ.eq('institution_id', instId);
      const { data: students, error: studErr } = await studQ;
      if(studErr){ if(status) status.textContent = 'Error: ' + studErr.message; return; }
      if(!students?.length){ if(status) status.textContent = 'No hay alumnos registrados'; return; }
      studentIds = students.map(s => s.id);
    }

    const rows = studentIds.map(id => ({
      user_id: id, title, body, type: 'teacher', read: false,
      created_at: new Date().toISOString(),
    }));
    const { error } = await _sb.from('notifications').insert(rows);

    if(error){ if(status) status.textContent = 'Error: ' + error.message; return; }
    if(status) status.textContent = `✓ Enviado a ${studentIds.length} alumno${studentIds.length > 1 ? 's' : ''}`;
    trackEvent('teacher_message_sent', { count: studentIds.length, target: _tdClassData ? 'class' : 'all' });
    ['td-broadcast-title','td-broadcast-body','tp-title','tp-body'].forEach(id => {
      const el = document.getElementById(id); if(el) el.value = '';
    });
  } catch(e){ if(status) status.textContent = 'Error: ' + e.message; }
}

// ╔═══════════════════════════════════════════════════════════╗
// ║  FLUJO SIN INSTITUCIÓN — crear o unirse                   ║
// ╚═══════════════════════════════════════════════════════════╝

async function showNoInstFlow(mode){
  const form        = document.getElementById('no-inst-form');
  const formContent = document.getElementById('no-inst-form-content');
  if(!form || !formContent) return;

  form.style.display = 'block';
  if(typeof setMascotState === 'function') setMascotState('thinking');

  if(mode === 'create'){
    formContent.innerHTML = `
      <div style="font-size:13px;font-weight:700;color:var(--navy-700);margin-bottom:10px;">
        Nombre de tu institución
      </div>
      <input id="ni-name" type="text" placeholder="ej: Colegio Hacoaj"
        style="width:100%;padding:11px 14px;border:1.5px solid var(--sand-300);border-radius:10px;
               font-size:14px;color:var(--navy-800);outline:none;box-sizing:border-box;margin-bottom:10px;"
        onfocus="this.style.borderColor='var(--navy-600)'" onblur="this.style.borderColor='var(--sand-300)'">
      <button onclick="noInstCreate()"
        style="width:100%;padding:11px;border-radius:10px;border:none;
               background:var(--navy-800);color:white;font-size:14px;font-weight:700;cursor:pointer;">
        Crear →
      </button>
      <div id="ni-status" style="font-size:12px;color:var(--sand-500);text-align:center;margin-top:8px;min-height:16px;"></div>`;
  } else {
    // Cargar lista de instituciones existentes
    formContent.innerHTML = `<div style="font-size:12px;color:var(--sand-400);text-align:center;">Cargando instituciones...</div>`;
    const insts = await fetchInstitutionList();
    if(!insts.length){
      formContent.innerHTML = `
        <div style="font-size:13px;color:var(--sand-500);text-align:center;margin-bottom:10px;">
          No hay instituciones aún.<br>¿Querés crear la primera?
        </div>
        <button onclick="showNoInstFlow('create')"
          style="width:100%;padding:11px;border-radius:10px;border:none;
                 background:var(--navy-800);color:white;font-size:14px;font-weight:700;cursor:pointer;">
          Crear institución
        </button>`;
      return;
    }
    formContent.innerHTML = `
      <div style="font-size:13px;font-weight:700;color:var(--navy-700);margin-bottom:10px;">
        Seleccioná tu institución
      </div>
      <select id="ni-inst-select"
        style="width:100%;padding:11px 14px;border:1.5px solid var(--sand-300);border-radius:10px;
               font-size:14px;color:var(--navy-800);background:white;margin-bottom:10px;
               box-sizing:border-box;outline:none;">
        ${insts.map(i => `<option value="${i.id}">${i.name}</option>`).join('')}
      </select>
      <button onclick="noInstJoin()"
        style="width:100%;padding:11px;border-radius:10px;border:none;
               background:var(--navy-800);color:white;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:8px;">
        Unirme →
      </button>
      <button onclick="showNoInstFlow('create')"
        style="width:100%;padding:10px;border-radius:10px;border:1.5px solid var(--sand-300);
               background:white;color:var(--navy-700);font-size:13px;font-weight:700;cursor:pointer;">
        + Crear nueva institución
      </button>
      <div id="ni-status" style="font-size:12px;color:var(--sand-500);text-align:center;margin-top:8px;min-height:16px;"></div>`;
  }
}

async function fetchInstitutionList(){
  if(!_sb) return [];
  try {
    const { data } = await _sb.from('institutions')
      .select('id, name')
      .eq('active', true)
      .order('name');
    return data || [];
  } catch(e){ return []; }
}

async function noInstCreate(){
  const name   = document.getElementById('ni-name')?.value.trim();
  const status = document.getElementById('ni-status');
  if(!name){ if(status) status.textContent = 'Escribí un nombre'; return; }
  if(status) status.textContent = 'Creando...';
  if(typeof setMascotState === 'function') setMascotState('loading');

  const inst = await createInstitution(name);
  if(inst){
    if(typeof setMascotState === 'function') setMascotState('happy', 2000);
    showToast(`✓ Institución "${inst.name}" creada`, 'green');
    _authProfileCache = null; // invalidar cache
    await _loadProfile(_authUser?.id);
    showView('teacher');
    loadTeacherDashboard();
  } else {
    if(status) status.textContent = 'Error al crear. Intentá de nuevo.';
    if(typeof setMascotState === 'function') setMascotState('error', 1500);
  }
}

async function noInstJoin(){
  const select = document.getElementById('ni-inst-select');
  const instId = select?.value;
  const status = document.getElementById('ni-status');
  if(!instId){ if(status) status.textContent = 'Seleccioná una institución'; return; }
  if(status) status.textContent = 'Uniéndose...';
  if(typeof setMascotState === 'function') setMascotState('loading');

  try {
    await _sb.from('profiles').update({ institution_id: instId }).eq('id', _authUser.id);
    if(_authProfile) _authProfile.institution_id = instId;
    _authProfileCache = null;
    await _loadProfile(_authUser?.id);
    if(typeof setMascotState === 'function') setMascotState('happy', 2000);
    showToast('✓ Te uniste a la institución', 'green');
    showView('teacher');
    loadTeacherDashboard();
  } catch(e){
    if(status) status.textContent = 'Error: ' + e.message;
    if(typeof setMascotState === 'function') setMascotState('error', 1500);
  }
}

// ── Checkout options: elegir proveedor ───────────────────────
function _amShowCheckoutOptions(tier) {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  const isLATAM = /America\/(Argentina|Mexico|Buenos_Aires|Bogota|Santiago|Lima|Caracas|Montevideo)/.test(tz);
  if(isLATAM) {
    const price = tier === 'pro' ? '$79' : '$29';
    const msg = 'Elegir medio de pago ' + price + '/mes:\n\nOK = MercadoPago (pesos)\nCancelar = Stripe (USD)';
    if(confirm(msg)) {
      startCheckout(tier, 'mercadopago');
    } else {
      startCheckout(tier, 'stripe');
    }
  } else {
    startCheckout(tier, 'stripe');
  }
}
