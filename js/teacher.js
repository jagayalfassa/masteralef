// ╔═══════════════════════════════════════════════════════════════╗
// ║  AlefMaster — teacher.js                                      ║
// ║  Panel del docente — cargado con defer después del main       ║
// ╚═══════════════════════════════════════════════════════════════╝
//
// DEPENDENCIAS GLOBALES REQUERIDAS (definidas en index.html):
//   _sb, _authUser, _authProfile, _requireInstitution
//   ALL_DATA, showToast, showView, dbg, trackEvent
//   document (DOM ya disponible porque usa defer)
//

/* globals _sb, _authUser, _authProfile, _requireInstitution, ALL_DATA,
           showToast, showView, dbg, trackEvent */

// ╔═══════════════════════════════════════════════════════════╗
// ║  TEACHER DASHBOARD — Sistema completo                     ║
// ╚═══════════════════════════════════════════════════════════╝

let _tdStudents  = [];   // cache de alumnos cargados
let _tdClassData = null; // datos de la clase
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
    // Cargar clase del teacher
    const { data: cls } = await _sb
      .from('classes')
      .select('*')
      .eq('teacher_id', _authUser.id)
      .maybeSingle();
    _tdClassData = cls;

    const nameEl = document.getElementById('td-class-name');
    const instLabel = _authProfile?._institution?.name;
    if(nameEl) nameEl.textContent = cls?.name || (instLabel ? instLabel : 'Mi clase');

    // Cargar alumnos vinculados a esta clase
    let students = [];
    if(cls){
      const { data: members } = await _sb
        .from('class_members')
        .select('student_id, profiles!inner(id, email, name)')
        .eq('class_id', cls.id);
      students = (members || []).map(m => m.profiles);
    } else {
      // Sin clase creada: mostrar alumnos de la misma institución
      const instId = _authProfile?.institution_id;
      let query = _sb.from('profiles').select('*').eq('role','student');
      if(instId) query = query.eq('institution_id', instId);
      const { data } = await query;
      students = data || [];
    }

    // Cargar progreso de cada alumno
    const ids = students.map(s => s.id);
    let progressMap = {};
    if(ids.length){
      const { data: progs } = await _sb
        .from('user_progress')
        .select('user_id, progress, shekels, updated_at')
        .in('user_id', ids);
      (progs || []).forEach(p => { progressMap[p.user_id] = p; });
    }

    _tdStudents = students.map(s => ({
      ...s,
      prog: progressMap[s.id] || null,
    }));

    tdRenderSummary();
    tdSwitchTab(_tdTab);

  } catch(e){
    dbg('[Teacher] loadDashboard error:', e.message);
    document.getElementById('td-content').innerHTML =
      '<div style="text-align:center;padding:32px;color:var(--sand-400);">Error al cargar datos.<br>Verificá la conexión.</div>';
  }
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
  const progress = student.prog?.progress || {};
  if(!Object.keys(progress).length) return 0;
  let total = 0, mastered = 0;
  Object.values(ALL_DATA).forEach(serie => {
    if(serie.type !== 'BASE') return;
    (serie.words || []).forEach(w => {
      total++;
      const ws = progress[w.fon];
      if(ws && ws.correct >= 3) mastered++;
    });
  });
  return total > 0 ? Math.round(mastered / total * 100) : 0;
}

// ── Tabs ──────────────────────────────────────────────────────
function tdSwitchTab(tab){
  _tdTab = tab;
  const tabs = { students: 'td-tab-students', class: 'td-tab-class' };
  Object.entries(tabs).forEach(([key, id]) => {
    const btn = document.getElementById(id);
    if(!btn) return;
    const active = key === tab;
    btn.style.background     = active ? 'white' : 'transparent';
    btn.style.color           = active ? 'var(--navy-800)' : 'var(--sand-500)';
    btn.style.borderBottom    = active ? '2.5px solid var(--navy-800)' : '2.5px solid transparent';
  });
  if(tab === 'students') tdRenderStudentList();
  else                   tdRenderClassSettings();
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

  // Ordenar: inactivos primero (los que más necesitan atención)
  const sorted = [..._tdStudents].sort((a, b) => {
    const order = { inactive: 0, warning: 1, active: 2 };
    return order[tdActivityStatus(a)] - order[tdActivityStatus(b)];
  });

  container.innerHTML = sorted.map(s => {
    const status   = tdActivityStatus(s);
    const cfg      = STATUS_CONFIG[status];
    const pct      = tdCalcProgress(s);
    const name     = s.name || s.email?.split('@')[0] || 'Alumno';
    const lastDate = s.prog?.updated_at
      ? new Date(s.prog.updated_at).toLocaleDateString('es', { day:'numeric', month:'short' })
      : 'Nunca';

    return `
      <div onclick="tdOpenStudent('${s.id}')"
        style="background:white;border:1.5px solid var(--sand-300);border-radius:14px;
               padding:14px 16px;cursor:pointer;transition:box-shadow .15s;display:flex;align-items:center;gap:12px;"
        onmouseenter="this.style.boxShadow='var(--shadow-2)'"
        onmouseleave="this.style.boxShadow=''">
        <!-- Avatar -->
        <div style="width:40px;height:40px;border-radius:50%;background:${cfg.bg};
                    display:flex;align-items:center;justify-content:center;
                    font-size:1.1rem;flex-shrink:0;">${cfg.icon}</div>
        <!-- Info -->
        <div style="flex:1;min-width:0;">
          <div style="font-weight:700;color:var(--navy-800);font-size:14px;
                      white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${name}</div>
          <div style="font-size:11px;color:var(--sand-500);margin-top:2px;">
            Última sesión: ${lastDate}
          </div>
          <!-- Barra de progreso -->
          <div style="margin-top:6px;background:var(--sand-200);height:5px;border-radius:99px;overflow:hidden;">
            <div style="height:100%;width:${pct}%;background:${pct >= 70 ? 'var(--success)' : pct >= 30 ? 'var(--gold-500)' : 'var(--sand-400)'};border-radius:99px;transition:width .4s;"></div>
          </div>
        </div>
        <!-- % y estado -->
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-size:1rem;font-weight:900;color:var(--navy-800);font-family:'Fraunces',serif;">${pct}%</div>
          <div style="font-size:10px;font-weight:700;color:${cfg.color};
                      background:${cfg.bg};padding:2px 7px;border-radius:99px;margin-top:3px;">${cfg.label}</div>
        </div>
      </div>`;
  }).join('');
}

// ── Detalle de alumno ─────────────────────────────────────────
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
  content.innerHTML = `
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
      <div style="font-size:12px;font-weight:700;color:var(--navy-700);margin-bottom:8px;">📩 Enviar mensaje a ${name}</div>
      <textarea id="td-msg-student-${studentId}" placeholder="Escribe un mensaje de aliento..."
        style="width:100%;padding:10px;border:1.5px solid var(--sand-300);border-radius:10px;
               font-size:13px;min-height:72px;resize:none;font-family:inherit;color:var(--navy-800);outline:none;box-sizing:border-box;"></textarea>
      <button onclick="tdSendToStudent('${studentId}', '${name.replace(/'/g,"\\'")}', document.getElementById('td-msg-student-${studentId}').value)"
        style="margin-top:8px;width:100%;padding:10px;border-radius:10px;border:none;
               background:var(--navy-800);color:white;font-size:13px;font-weight:700;cursor:pointer;">
        Enviar mensaje
      </button>
    </div>`;

  detail.style.display = 'block';
}

// ── Configuración de la clase ─────────────────────────────────
function tdRenderClassSettings(){
  const container = document.getElementById('td-content');
  if(!container) return;

  const cls  = _tdClassData;
  const code = cls?.code || '—';

  container.innerHTML = `
    ${cls ? `
    <!-- Clase existente -->
    <div style="background:white;border:1.5px solid var(--sand-300);border-radius:14px;padding:16px;">
      <div style="font-size:11px;font-weight:700;color:var(--sand-500);text-transform:uppercase;margin-bottom:4px;">Clase activa</div>
      <div style="font-family:'Fraunces',serif;font-size:1.2rem;font-weight:900;color:var(--navy-800);margin-bottom:12px;">${cls.name}</div>
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
}

// ── Crear clase ───────────────────────────────────────────────
async function tdCreateClass(){
  if(!_sb || !_authUser) return;
  if(!_requireInstitution('crear clase')) return;
  const nameInput = document.getElementById('td-new-class-name');
  const name = nameInput?.value.trim();
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

// ── Enviar a toda la clase (reemplaza sendTeacherMessage viejo) ──
async function sendTeacherMessage(target){
  if(!_sb || !_authUser || _authProfile?.role !== 'teacher') return;
  if(!_requireInstitution('enviar mensajes')) return;

  const title  = (document.getElementById('td-broadcast-title') || document.getElementById('tp-title'))?.value.trim();
  const body   = (document.getElementById('td-broadcast-body')  || document.getElementById('tp-body'))?.value.trim();
  const status = document.getElementById('td-broadcast-status') || document.getElementById('tp-status');

  if(!title || !body){ if(status) status.textContent = 'Completá título y mensaje'; return; }
  if(status) status.textContent = 'Enviando...';

  try {
    // Filtrar alumnos por institución del docente (aislamiento de datos)
    const instId = _authProfile?.institution_id;
    let studQ = _sb.from('profiles').select('id').eq('role','student');
    if(instId) studQ = studQ.eq('institution_id', instId);
    const { data: students } = await studQ;
    if(!students?.length){ if(status) status.textContent = 'No hay alumnos registrados'; return; }

    const rows = students.map(s => ({
      user_id: s.id, title, body, type: 'teacher', read: false,
      created_at: new Date().toISOString(),
    }));
    const { error } = await _sb.from('notifications').insert(rows);

    if(error){ if(status) status.textContent = 'Error: ' + error.message; return; }
    if(status) status.textContent = `✓ Enviado a ${students.length} alumno${students.length > 1 ? 's' : ''}`;
    trackEvent('teacher_message_sent', { count: students.length, target: 'all' });
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
