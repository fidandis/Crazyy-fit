/* ══════════════════════════════════════════════════════════════
   FITNESS LOG
══════════════════════════════════════════════════════════════ */

// Zone colors
const ZONE_COLORS = ['#2ecc71','#27ae60','#f1c40f','#3B9EFF','#e74c3c'];
const ZONE_NAMES  = ['Zone 1','Zone 2','Zone 3','Zone 4','Zone 5'];

function getFitnessLogs(cid) {
  try { return getLS('fit_logs_' + cid, []); } catch { return []; }
}

function getCalorieIntakeLogs(cid) {
  try { return getLS('cal_intake_' + cid, []); } catch { return []; }
}

function saveCalorieIntake(cid, calories, protein, carbs, fat, date) {
  const logs = getCalorieIntakeLogs(cid);
  const targetDate = date || new Date().toISOString().slice(0, 10);
  const existingIdx = logs.findIndex(l => l.date === targetDate);
  const entry = { date: targetDate, calories: parseInt(calories) || 0, protein: parseInt(protein) || 0, carbs: parseInt(carbs) || 0, fat: parseInt(fat) || 0 };
  if (existingIdx >= 0) logs[existingIdx] = entry;
  else logs.push(entry);
  localStorage.setItem('cal_intake_' + cid, JSON.stringify(logs));
  if (typeof haptic === 'function') haptic('light');
  showFitToast('Intake saved!');
  // Refresh nutrition panel if visible
  const panel = document.getElementById('panel-nutrition');
  const clients = getAllClients();
  const c = clients.find(cl => cl.id === cid) || AppState.currentClient;
  if (panel && c) {
    panel.innerHTML = renderNutrition(c.data.nutrition, c);
    // Restore date selection if not today
    const today = new Date().toISOString().slice(0, 10);
    if (targetDate !== today) {
      const dateInput = document.getElementById('ci-date-' + cid);
      if (dateInput) { dateInput.value = targetDate; loadIntakeForDate(cid, targetDate); }
    }
  }
}

function loadIntakeForDate(cid, date) {
  const logs = getCalorieIntakeLogs(cid);
  const entry = logs.find(l => l.date === date);
  const calEl   = document.getElementById('ci-cal-'  + cid);
  const protEl  = document.getElementById('ci-prot-' + cid);
  const carbEl  = document.getElementById('ci-carb-' + cid);
  const fatEl   = document.getElementById('ci-fat-'  + cid);
  if (calEl)  calEl.value  = entry?.calories || '';
  if (protEl) protEl.value = entry?.protein  || '';
  if (carbEl) carbEl.value = entry?.carbs    || '';
  if (fatEl)  fatEl.value  = entry?.fat      || '';
}
function saveFitnessLogs(cid, logs) {
  localStorage.setItem('fit_logs_' + cid, JSON.stringify(logs));
}

function renderFitnessLog(c) {
  const logs = getFitnessLogs(c.id);
  const last = logs[logs.length - 1];
  const accent = c.accent;

  // Summary stats (from last workout)
  const calTotal  = logs.slice(-7).reduce((s,l) => s + (l.calories||0), 0);
  const sessions7 = logs.slice(-7).filter(l => l.calories > 0).length;
  const avgHR     = last?.avgHR || '—';
  const lastCal   = last?.calories || '—';

  // Zone distribution from all logs
  const zoneTotal = [0,0,0,0,0];
  logs.forEach(l => { if (l.zones) l.zones.forEach((z,i) => zoneTotal[i] += z); });
  const ztSum = zoneTotal.reduce((a,b)=>a+b,0) || 1;

  // Calorie bar chart (last 7 sessions)
  const last7 = logs.slice(-7);
  const maxCal = Math.max(...last7.map(l=>l.calories||0), 1);
  const chartBars = last7.map(l => {
    const h = Math.round(((l.calories||0)/maxCal)*72);
    const d = l.date ? new Date(l.date).toLocaleDateString('en',{weekday:'short'}) : '—';
    return `<div class="fit-bar-col">
      <div class="fit-bar" style="height:${h}px;background:${accent}"></div>
      <div class="fit-bar-day">${d}</div>
    </div>`;
  }).join('');

  // Zone bars
  const zoneBars = ZONE_NAMES.map((n,i) => {
    const pct = Math.round((zoneTotal[i]/ztSum)*100);
    return `<div class="zone-bar-row">
      <div class="zone-bar-name">${n}</div>
      <div class="zone-bar-track"><div class="zone-bar-fill" style="width:${pct}%;background:${ZONE_COLORS[i]}"></div></div>
      <div class="zone-bar-pct">${pct}%</div>
    </div>`;
  }).join('');

  // History list
  const reversed = [...logs].reverse();
  const historyHtml = logs.length === 0
    ? `<div class="fit-empty">// No workouts logged yet<br>Use the form below or the Apple Shortcut</div>`
    : reversed.map((l, i) => {
        const realIdx = logs.length - 1 - i;
        return `<div class="fit-entry" data-longpress="fitlog:${c.id}:${i}">
        <div>
          <div class="fit-entry-date">${l.date ? new Date(l.date).toLocaleDateString('en',{weekday:'long',month:'short',day:'numeric'}) : 'Unknown date'}</div>
          <div class="fit-entry-type">${l.type || 'Workout'}</div>
          <div class="fit-entry-stats">
            ${l.calories ? `<span class="fit-entry-badge fit-cal-badge">🔥 ${l.calories} kcal</span>` : ''}
            ${l.duration ? `<span class="fit-entry-badge fit-dur-badge">⏱ ${l.duration} min</span>` : ''}
            ${l.avgHR    ? `<span class="fit-entry-badge fit-hr-badge">❤️ ${l.avgHR} bpm avg</span>` : ''}
            ${l.maxHR    ? `<span class="fit-entry-badge fit-hr-badge">↑ ${l.maxHR} bpm max</span>` : ''}
            ${l.zone     ? `<span class="fit-entry-badge fit-zone-badge">${l.zone}</span>` : ''}
          </div>
          ${l.notes ? `<div class="fit-entry-notes">"${esc(l.notes)}"</div>` : ''}
        </div>
        <button class="fit-entry-del" onclick="deleteFitLog('${c.id}',${realIdx})">✕</button>
      </div>`;
      }).join('');

  return `
    <div class="panel-title">Fitness Log</div>
    <p class="panel-desc">Workout data from Apple Watch — via Apple Shortcuts or manual entry.</p>

    <!-- Shortcut setup banner -->
    <div class="fit-shortcut-banner">
      <div class="fit-shortcut-icon">⌚</div>
      <div>
        <div class="fit-shortcut-title">Apple Shortcut Setup</div>
        <div class="fit-shortcut-desc">After each workout, run the MyCoach shortcut — it reads your Apple Watch data and logs it here automatically.</div>
        <ul class="fit-shortcut-steps">
          <li data-n="1">Open the <strong>Shortcuts</strong> app on your iPhone</li>
          <li data-n="2">Tap <strong>+</strong> → Search "Find Health Samples"</li>
          <li data-n="3">Set type to <strong>Workouts</strong>, limit to <strong>1</strong>, sort by <strong>Most Recent</strong></li>
          <li data-n="4">Add action: <strong>Get Details of Workout</strong> → get Active Energy, Duration, Avg HR, Max HR, Workout Type</li>
          <li data-n="5">Add action: <strong>Open URLs</strong> → paste your app URL + parameters below</li>
          <li data-n="6">Run the shortcut right after finishing a workout in the Fitness app</li>
        </ul>
        <div style="margin-top:10px;background:var(--surface2);border-radius:6px;padding:10px 12px;font-family:'Geist Mono',monospace;font-size:10px;color:var(--muted);word-break:break-all;line-height:1.8;">
          <span style="color:var(--accent)">YOUR-APP-URL</span>/?client=<span style="color:var(--accent)">${c.id}</span>&cal=<span style="color:#ffb347">[Active Energy]</span>&dur=<span style="color:#ffb347">[Duration in Minutes]</span>&avghr=<span style="color:#e74c3c">[Average Heart Rate]</span>&maxhr=<span style="color:#e74c3c">[Maximum Heart Rate]</span>&type=<span style="color:#aaa">[Workout Type]</span>
        </div>
        <div style="margin-top:6px;font-size:11px;color:var(--muted);font-weight:300;">Replace <em>YOUR-APP-URL</em> with your Netlify URL. The bracketed values are Shortcut variables — tap each to select from Shortcut output.</div>
      </div>
    </div>

    <!-- Stats summary -->
    <div class="fit-stat-grid">
      <div class="fit-stat">
        <div class="fit-stat-val">${lastCal === '—' ? '—' : lastCal}<span class="fit-stat-unit">${lastCal === '—' ? '' : ' kcal'}</span></div>
        <div class="fit-stat-lbl">Last Session</div>
      </div>
      <div class="fit-stat">
        <div class="fit-stat-val">${sessions7}</div>
        <div class="fit-stat-lbl">Sessions (7 days)</div>
      </div>
      <div class="fit-stat">
        <div class="fit-stat-val">${calTotal.toLocaleString()}<span class="fit-stat-unit"> kcal</span></div>
        <div class="fit-stat-lbl">Burned (7 days)</div>
      </div>
      <div class="fit-stat">
        <div class="fit-stat-val">${avgHR === '—' ? '—' : avgHR}<span class="fit-stat-unit">${avgHR === '—' ? '' : ' bpm'}</span></div>
        <div class="fit-stat-lbl">Last Avg HR</div>
      </div>
    </div>

    <!-- Calorie chart -->
    ${last7.length > 0 ? `<div class="fit-chart-wrap"><div class="fit-chart-lbl">Calories Burned — Last ${last7.length} Sessions</div><div class="fit-chart">${chartBars}</div></div>` : ''}

    <!-- Zone distribution -->
    ${logs.length > 0 && logs.some(l => l.zone) ? `<div class="card"><div class="card-block"><div class="zone-bar-lbl">Heart Rate Zone Distribution (All Sessions)</div><div class="zone-bars">${zoneBars}</div></div></div>` : ''}

    <!-- Manual log form -->
    <div class="fit-log-form">
      <div class="fit-log-form-header">
        <h3>Log a Workout Manually</h3>
        <p>Or use the Apple Shortcut above to log automatically after each session.</p>
      </div>
      <div class="fit-form-grid">
        <div class="fit-form-field">
          <label class="fit-form-lbl">Calories Burned</label>
          <input class="fit-form-input" id="fi-cal-${c.id}" type="number" placeholder="e.g. 420">
        </div>
        <div class="fit-form-field">
          <label class="fit-form-lbl">Duration (min)</label>
          <input class="fit-form-input" id="fi-dur-${c.id}" type="number" placeholder="e.g. 55">
        </div>
        <div class="fit-form-field">
          <label class="fit-form-lbl">Avg Heart Rate</label>
          <input class="fit-form-input" id="fi-ahr-${c.id}" type="number" placeholder="e.g. 142">
        </div>
        <div class="fit-form-field">
          <label class="fit-form-lbl">Max Heart Rate</label>
          <input class="fit-form-input" id="fi-mhr-${c.id}" type="number" placeholder="e.g. 178">
        </div>
        <div class="fit-form-field full">
          <label class="fit-form-lbl">Workout Type</label>
          <select class="fit-form-select" id="fi-type-${c.id}">
            <option value="Strength Training">Strength Training</option>
            <option value="Running">Running</option>
            <option value="Cycling">Cycling</option>
            <option value="HIIT">HIIT</option>
            <option value="Walk">Walk</option>
            <option value="Mixed">Mixed / Other</option>
          </select>
        </div>
      </div>
      <div class="fit-form-actions">
        <button class="fit-log-btn" onclick="manualLogFitness('${c.id}')">Log Workout</button>
      </div>
    </div>

    <!-- History -->
    <div class="fit-history">
      <div class="fit-history-header">
        <div class="fit-history-title">Workout History</div>
        ${logs.length > 0 ? `<button class="fit-clear-btn" onclick="clearFitLogs('${c.id}')">Clear All</button>` : ''}
      </div>
      ${historyHtml}
    </div>`;
}

const _lastLogTime = {};
function manualLogFitness(cid) {
  const now = Date.now();
  if (_lastLogTime[cid] && now - _lastLogTime[cid] < 5000) {
    showFitToast('Already logged — wait a moment');
    return;
  }
  _lastLogTime[cid] = now;
  try {
    const cal  = parseInt(safeGetElement('fi-cal-' + cid)?.value) || 0;
    const dur  = parseInt(safeGetElement('fi-dur-' + cid)?.value) || 0;
    const ahr  = parseInt(safeGetElement('fi-ahr-' + cid)?.value) || 0;
    const mhr  = parseInt(safeGetElement('fi-mhr-' + cid)?.value) || 0;
    const type = safeGetElement('fi-type-' + cid)?.value || 'Workout';

    if (!cal && !dur) { 
      showFitToast('Enter at least calories or duration');
      return;
    }

    // Validate inputs
    if (cal && !validateCalories(cal)) {
      showFitToast('Calories must be 0-10000');
      return;
    }
    if (dur && (isNaN(dur) || dur < 0 || dur > 600)) {
      showFitToast('Duration must be 0-600 minutes');
      return;
    }
    if (ahr && !validateHR(ahr)) {
      showFitToast('Avg HR must be 30-250 bpm');
      return;
    }
    if (mhr && !validateHR(mhr)) {
      showFitToast('Max HR must be 30-250 bpm');
      return;
    }

    const zone = ahr ? getZoneFromHR(ahr) : '';
    const entry = { 
      date: new Date().toISOString(), 
      calories: cal, 
      duration: dur, 
      avgHR: ahr || null, 
      maxHR: mhr || null, 
      type, 
      zone 
    };
    const logs = getFitnessLogs(cid);
    logs.push(entry);
    saveFitnessLogs(cid, logs.map(({_new, ...rest}) => rest));

    // Clear form
    ['fi-cal-','fi-dur-','fi-ahr-','fi-mhr-'].forEach(id => {
      const el = safeGetElement(id + cid);
      if (el) el.value = '';
    });
    if (typeof haptic === 'function') haptic('success');
    showFitToast('✓ Workout logged');
    refreshFitnessTab(cid);
    if (AppState.currentClient) checkMilestones(AppState.currentClient);
  } catch (e) {
    console.error('Error logging fitness:', e);
    showFitToast('Error logging workout');
  }
}

function getZoneFromHR(hr) {
  if (hr < 115) return 'Zone 1';
  if (hr < 135) return 'Zone 2';
  if (hr < 155) return 'Zone 3';
  if (hr < 170) return 'Zone 4';
  return 'Zone 5';
}

function deleteFitLog(cid, idx) {
  const logs = getFitnessLogs(cid);
  const realIdx = logs.length - 1 - idx;
  const removed = logs[realIdx];
  if (!removed) return;
  logs.splice(realIdx, 1);
  saveFitnessLogs(cid, logs);
  refreshFitnessTab(cid);
  showUndoToast('Log deleted', () => {
    const cur = getFitnessLogs(cid);
    cur.splice(realIdx, 0, removed);
    saveFitnessLogs(cid, cur);
    refreshFitnessTab(cid);
  });
}

function duplicateFitLog(cid, idx) {
  const logs = getFitnessLogs(cid);
  const realIdx = logs.length - 1 - idx;
  const src = logs[realIdx];
  if (!src) return;
  const copy = Object.assign({}, src, { date: new Date().toISOString() });
  delete copy._fromLogger;
  logs.push(copy);
  saveFitnessLogs(cid, logs);
  if (typeof haptic === 'function') haptic('success');
  showFitToast('✓ Duplicated to today');
  refreshFitnessTab(cid);
}

function clearFitLogs(cid) {
  if (!confirm('Clear all workout history for this client?')) return;
  saveFitnessLogs(cid, []);
  refreshFitnessTab(cid);
}

function refreshFitnessTab(cid) {
  const panel = document.getElementById('panel-fitness');
  if (!panel) return;
  const c = getAllClients().find(cl => cl.id === cid);
  if (c) panel.innerHTML = renderFitnessLog(c);
}

function showFitToast(msg) {
  let t = document.getElementById('fitToast');
  if (!t) { t = document.createElement('div'); t.id='fitToast'; t.className='fit-toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

let _undoToastT = null;
function showUndoToast(msg, undoFn, duration) {
  duration = duration || 5000;
  let t = document.getElementById('undoToast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'undoToast';
    t.className = 'fit-toast fit-toast-undo';
    document.body.appendChild(t);
  }
  t.innerHTML = '';
  const label = document.createElement('span');
  label.textContent = msg;
  const btn = document.createElement('button');
  btn.className = 'fit-toast-undo-btn';
  btn.textContent = 'UNDO';
  btn.onclick = () => {
    clearTimeout(_undoToastT);
    t.classList.remove('show');
    try { undoFn(); } catch (e) { console.error(e); }
  };
  t.appendChild(label);
  t.appendChild(btn);
  t.classList.add('show');
  clearTimeout(_undoToastT);
  _undoToastT = setTimeout(() => t.classList.remove('show'), duration);
}



