/* ══════════════════════════════════════════════════════════════
   WORKOUT LOGGER
══════════════════════════════════════════════════════════════ */
function toggleWorkoutLogger(cid, dayId) {
  const logger = document.getElementById('wl-' + cid + '-' + dayId);
  const btn = document.getElementById('wl-toggle-' + cid + '-' + dayId);
  if (!logger) return;
  const isOpen = logger.classList.toggle('open');
  btn.classList.toggle('active', isOpen);
}

function getWlData(cid, dayId) {
  return getLS('wl_' + cid + '_' + dayId, null) || { exercises: {} };
}
function saveWlData(cid, dayId, data) {
  localStorage.setItem('wl_' + cid + '_' + dayId, JSON.stringify(data));
}

function wlUpdate(cid, dayId, exIdx, setIdx, field, value) {
  const data = getWlData(cid, dayId);
  if (exIdx === -1) {
    // Top-level session field (e.g. sessionNotes)
    data[field] = value;
  } else {
    if (!data.exercises[exIdx]) data.exercises[exIdx] = { sets: [] };
    if (!data.exercises[exIdx].sets[setIdx]) data.exercises[exIdx].sets[setIdx] = {};
    data.exercises[exIdx].sets[setIdx][field] = value;
  }
  saveWlData(cid, dayId, data);
  sbAutoSync(cid);
  // Style input
  const input = event.target;
  input.classList.toggle('completed', !!value.trim());
}

function wlToggleDone(cid, dayId, exIdx, setIdx) {
  const data = getWlData(cid, dayId);
  if (!data.exercises[exIdx]) data.exercises[exIdx] = { sets: [] };
  if (!data.exercises[exIdx].sets[setIdx]) data.exercises[exIdx].sets[setIdx] = {};
  const current = data.exercises[exIdx].sets[setIdx].done;
  const nowDone = !current;
  data.exercises[exIdx].sets[setIdx].done = nowDone;
  saveWlData(cid, dayId, data);
  const btn = document.querySelector(`#wl-set-${cid}-${dayId}-${exIdx}-${setIdx} .wl-set-check`);
  if (btn) { btn.classList.toggle('done', nowDone); btn.textContent = nowDone ? '✓' : ''; }

  if (nowDone) {
    // Get exercise name from DOM
    const exNameEl = document.getElementById('wl-ex-name-' + cid + '-' + dayId + '-' + exIdx);
    const exName = (exNameEl?.firstChild?.textContent || exNameEl?.textContent || '').replace(/\(alt\)/g,'').trim();

    // Get weight from the set row inputs
    const rowEl = document.getElementById('wl-set-' + cid + '-' + dayId + '-' + exIdx + '-' + setIdx);
    const inputs = rowEl?.querySelectorAll('input');
    const weightVal = parseFloat(inputs?.[0]?.value);

    // PR detection
    if (exName && weightVal > 0) {
      const prs = getPRs(cid);
      const prevBest = prs[exName]?.weight || 0;
      if (weightVal > prevBest) {
        prs[exName] = { weight: weightVal, date: new Date().toISOString() };
        savePRs(cid, prs);
        setTimeout(() => showPRCelebration(exName, weightVal), 150);
      }
    }

    // Rest timer — 1) saved pref, 2) prescribed rest field, 3) default 90s
    const prescribedEl = rowEl?.closest('.wl-ex-block')?.querySelector('.wl-ex-prescribed');
    const prescribedRest = parseRestSecs(prescribedEl?.textContent || '');
    const restPrefs = getLS('rest_prefs_' + cid, {});
    const restSecs = (exName && restPrefs[exName]) ? restPrefs[exName] : (prescribedRest || 90);
    setTimeout(() => startRestTimer(restSecs, exName || 'Next set', cid), 250);
  }

  // Update progress bar
  wlUpdateProgress(cid, dayId);
}

/* ── DROP SET FUNCTIONS ── */
function wlAddDrop(cid, dayId, exIdx, setIdx) {
  const data = getWlData(cid, dayId);
  if (!data.exercises[exIdx]) data.exercises[exIdx] = { sets: [] };
  if (!data.exercises[exIdx].sets[setIdx]) data.exercises[exIdx].sets[setIdx] = {};
  if (!data.exercises[exIdx].sets[setIdx].drops) data.exercises[exIdx].sets[setIdx].drops = [];
  const dropIdx = data.exercises[exIdx].sets[setIdx].drops.length;
  data.exercises[exIdx].sets[setIdx].drops.push({ weight: '', reps: '', done: false });
  saveWlData(cid, dayId, data);

  const container = document.getElementById('wl-drops-' + cid + '-' + dayId + '-' + exIdx + '-' + setIdx);
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'wl-drop-row';
  row.id = 'wl-drop-' + cid + '-' + dayId + '-' + exIdx + '-' + setIdx + '-' + dropIdx;
  row.innerHTML = `
    <div class="wl-drop-num">↓${dropIdx+1}</div>
    <input class="wl-drop-input" type="text" inputmode="decimal" placeholder="lbs/kg"
      oninput="wlUpdateDrop('${cid}','${dayId}',${exIdx},${setIdx},${dropIdx},'weight',this.value)">
    <input class="wl-drop-input" type="text" inputmode="numeric" placeholder="reps"
      oninput="wlUpdateDrop('${cid}','${dayId}',${exIdx},${setIdx},${dropIdx},'reps',this.value)">
    <button class="wl-drop-check"
      onclick="wlToggleDropDone('${cid}','${dayId}',${exIdx},${setIdx},${dropIdx})"></button>`;
  container.appendChild(row);
  row.querySelector('input')?.focus();
  showFitToast('Drop set added');
}

function wlUpdateDrop(cid, dayId, exIdx, setIdx, dropIdx, field, value) {
  const data = getWlData(cid, dayId);
  if (!data.exercises[exIdx]) data.exercises[exIdx] = { sets: [] };
  if (!data.exercises[exIdx].sets[setIdx]) data.exercises[exIdx].sets[setIdx] = {};
  if (!data.exercises[exIdx].sets[setIdx].drops) data.exercises[exIdx].sets[setIdx].drops = [];
  if (!data.exercises[exIdx].sets[setIdx].drops[dropIdx]) data.exercises[exIdx].sets[setIdx].drops[dropIdx] = {};
  data.exercises[exIdx].sets[setIdx].drops[dropIdx][field] = value;
  saveWlData(cid, dayId, data);
  const input = event.target;
  input.classList.toggle('completed', !!value.trim());
}

function wlToggleDropDone(cid, dayId, exIdx, setIdx, dropIdx) {
  const data = getWlData(cid, dayId);
  const drop = data.exercises?.[exIdx]?.sets?.[setIdx]?.drops?.[dropIdx];
  if (!drop) return;
  drop.done = !drop.done;
  saveWlData(cid, dayId, data);
  const btn = document.querySelector('#wl-drop-' + cid + '-' + dayId + '-' + exIdx + '-' + setIdx + '-' + dropIdx + ' .wl-drop-check');
  if (btn) { btn.classList.toggle('done', drop.done); btn.textContent = drop.done ? '✓' : ''; }
  wlUpdateProgress(cid, dayId);
}

function wlAddSet(cid, dayId, exIdx, totalEx) {
  const data = getWlData(cid, dayId);
  if (!data.exercises[exIdx]) data.exercises[exIdx] = { sets: [] };
  const setIdx = data.exercises[exIdx].sets.length;
  data.exercises[exIdx].sets.push({ weight: '', reps: '', done: false });
  saveWlData(cid, dayId, data);

  const grid = document.getElementById('wl-grid-' + cid + '-' + dayId + '-' + exIdx);
  if (!grid) return;
  const row = document.createElement('div');
  row.className = 'wl-set-row';
  row.id = 'wl-set-' + cid + '-' + dayId + '-' + exIdx + '-' + setIdx;
  row.innerHTML = `
    <div class="wl-set-num">S${setIdx+1}</div>
    <input class="wl-set-input" type="text" inputmode="decimal" placeholder="lbs / kg"
      oninput="wlUpdate('${cid}','${dayId}',${exIdx},${setIdx},'weight',this.value)">
    <input class="wl-set-input" type="text" inputmode="numeric" placeholder="reps"
      oninput="wlUpdate('${cid}','${dayId}',${exIdx},${setIdx},'reps',this.value)">
    <button class="wl-set-check" onclick="wlToggleDone('${cid}','${dayId}',${exIdx},${setIdx})"></button>
    <button class="wl-drop-set-btn" onclick="wlAddDrop('${cid}','${dayId}',${exIdx},${setIdx})" title="Add drop set">↓</button>`;
  const dropsEl = document.createElement('div');
  dropsEl.className = 'wl-drops-wrap';
  dropsEl.id = 'wl-drops-' + cid + '-' + dayId + '-' + exIdx + '-' + setIdx;
  grid.appendChild(row);
  grid.appendChild(dropsEl);
  row.querySelector('input').focus();
}

function getWlHistory(cid, dayId) { return getLS('wl_hist_' + cid + '_' + dayId, []); }
function saveWlHistory(cid, dayId, hist) { localStorage.setItem('wl_hist_' + cid + '_' + dayId, JSON.stringify(hist)); }

function wlUpdateProgress(cid, dayId) {
  const setChecks  = document.querySelectorAll(`[id^="wl-set-${cid}-${dayId}-"] .wl-set-check`);
  const dropChecks = document.querySelectorAll(`[id^="wl-drop-${cid}-${dayId}-"] .wl-drop-check`);
  const total = setChecks.length + dropChecks.length;
  let done = 0;
  setChecks.forEach(b  => { if (b.classList.contains('done')) done++; });
  dropChecks.forEach(b => { if (b.classList.contains('done')) done++; });
  const pct = total > 0 ? Math.round(done / total * 100) : 0;
  const lblEl  = document.getElementById('wl-prog-lbl-' + cid + '-' + dayId);
  const pctEl  = document.getElementById('wl-prog-pct-' + cid + '-' + dayId);
  const fillEl = document.getElementById('wl-prog-fill-' + cid + '-' + dayId);
  if (lblEl)  lblEl.textContent  = done + ' / ' + total + ' sets done';
  if (pctEl)  pctEl.textContent  = pct + '%';
  if (fillEl) fillEl.style.width = pct + '%';
}

function wlSaveWorkout(cid, dayId, totalEx) {
  const data = getWlData(cid, dayId);
  data.savedAt = new Date().toISOString();

  // Archive previous session to history when starting a new day
  const todayStr = new Date().toDateString();
  if (data._countedDate !== todayStr) {
    // Archive the previous session before overwriting
    if (data.exercises && Object.keys(data.exercises).length) {
      const hist = getWlHistory(cid, dayId);
      hist.unshift({ date: data.savedAt || new Date().toISOString(), exercises: data.exercises, sessionNotes: data.sessionNotes || '' });
      if (hist.length > 12) hist.length = 12;
      saveWlHistory(cid, dayId, hist);
    }
    data._countedDate = todayStr;
    const logs = getFitnessLogs(cid);
    logs.push({ date: new Date().toISOString(), calories: 0, duration: 0, avgHR: null, maxHR: null, type: 'Workout', zone: '', _fromLogger: true });
    saveFitnessLogs(cid, logs);
    if (AppState.currentClient) checkMilestones(AppState.currentClient);
    awardXP(cid, 'workout');
  }

  saveWlData(cid, dayId, data);

  // Check progression rules after saving
  setTimeout(() => checkProgressionRules(cid), 300);

  // Update toggle button label
  const btn = document.getElementById('wl-toggle-' + cid + '-' + dayId);
  if (btn) btn.innerHTML = '<span class="wl-icon">📝</span> View / Edit Workout Log';
  btn?.classList.add('active');

  // Show saved badge
  const badge = document.getElementById('wl-saved-' + cid + '-' + dayId);
  if (badge) { badge.classList.add('show'); setTimeout(() => badge.classList.remove('show'), 2000); }

  sbAutoSync(cid);
  showFitToast('Workout saved!');
}


function buildWlHistoryHtml(cid, dayId, skipFirst) {
  const hist = getWlHistory(cid, dayId);
  const startFrom = skipFirst ? 1 : 0;
  if (hist.length <= startFrom) return '';
  const entries = hist.slice(startFrom, startFrom + 8).map(entry => {
    const dateStr = new Date(entry.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' });
    const exRows = Object.entries(entry.exercises || {}).map(([exIdx, exData]) => {
      if (!exData?.sets?.length) return '';
      const doneSets = exData.sets.filter(s => s.done || s.weight || s.reps);
      if (!doneSets.length) return '';
      const setsStr = doneSets.map(s => [s.weight, s.reps].filter(Boolean).join(' × ')).filter(Boolean).join(' · ');
      return setsStr ? `<div class="wl-hist-row">${setsStr}</div>` : '';
    }).filter(Boolean).join('');
    if (!exRows) return '';
    const totalSets = Object.values(entry.exercises || {}).reduce((n, ex) => n + (ex?.sets?.filter(s => s.done || s.weight)?.length || 0), 0);
    return `<div class="wl-hist-entry">
      <div class="wl-hist-entry-header">
        <div class="wl-hist-date">${dateStr}</div>
        <div class="wl-hist-sets">${totalSets} sets</div>
      </div>
      ${exRows}
      ${entry.sessionNotes ? `<div class="wl-hist-notes">${esc(entry.sessionNotes)}</div>` : ''}
    </div>`;
  }).filter(Boolean).join('');
  if (!entries) return '';
  return `<div class="wl-hist-section">
    <div class="wl-hist-title">Previous Sessions</div>
    ${entries}
  </div>`;
}

/* ══════════════════════════════════════════════════════════════
   XP + LEVELING SYSTEM
══════════════════════════════════════════════════════════════ */
const XP_LEVELS = [
  { level:1,  xp:0,    tier:'Rookie',   color:'#888888' },
  { level:2,  xp:200,  tier:'Rookie',   color:'#aaaaaa' },
  { level:3,  xp:450,  tier:'Grinder',  color:'#ff6b35' },
  { level:4,  xp:750,  tier:'Grinder',  color:'#ff8c00' },
  { level:5,  xp:1100, tier:'Athlete',  color:'#e8ff47' },
  { level:6,  xp:1500, tier:'Athlete',  color:'#c8e020' },
  { level:7,  xp:2000, tier:'Beast',    color:'#00d4ff' },
  { level:8,  xp:2600, tier:'Beast',    color:'#00aadd' },
  { level:9,  xp:3300, tier:'Elite',    color:'#ff00aa' },
  { level:10, xp:4200, tier:'Legend',   color:'#ffd700' },
];

function getLevelData(xp) {
  let current = XP_LEVELS[0];
  for (const lvl of XP_LEVELS) {
    if (xp >= lvl.xp) current = lvl; else break;
  }
  const nextIdx = XP_LEVELS.indexOf(current) + 1;
  const next = XP_LEVELS[nextIdx] || null;
  const xpIntoLevel = next ? xp - current.xp : 0;
  const xpNeeded    = next ? next.xp - current.xp : 1;
  const pct         = next ? Math.round((xpIntoLevel / xpNeeded) * 100) : 100;
  return { current, next, xpIntoLevel, xpNeeded, pct };
}

function getXP(cid) {
  return parseInt(localStorage.getItem('xp_' + cid) || '0');
}

function awardXP(cid, type) {
  const gains = { workout:100, tabata:25, milestone:200 };
  const gain = gains[type] || 50;
  const prev = getXP(cid);
  const next = prev + gain;
  localStorage.setItem('xp_' + cid, next);
  const lvlPrev = getLevelData(prev);
  const lvlNext = getLevelData(next);
  // Show XP toast
  showXPToast('+' + gain + ' XP');
  // Level up?
  if (lvlNext.current.level > lvlPrev.current.level) {
    setTimeout(() => showFitToast('🎉 Level Up! ' + lvlNext.current.tier + ' Lv.' + lvlNext.current.level), 600);
    const av = document.getElementById('xp-avatar-' + cid);
    if (av) av.classList.add('levelup');
  }
  // Refresh XP widget if visible
  const xpWrap = document.getElementById('xp-widget-' + cid);
  if (xpWrap && currentClient && currentClient.id === cid) {
    xpWrap.outerHTML = buildXPWidget(cid, currentClient.name, currentClient.accent);
  }
}

function showXPToast(msg) {
  let t = document.getElementById('xpToast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'xpToast';
    t.className = 'xp-toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 1800);
}

function buildXPWidget(cid, name, accent) {
  const xp  = getXP(cid);
  const lvl = getLevelData(xp);
  const col = lvl.current.color;
  return `<div class="xp-widget" id="xp-widget-${cid}" style="--accent-color:${col}">
    <div class="xp-top">
      <div class="xp-avatar-wrap">
        <div class="xp-avatar" id="xp-avatar-${cid}" style="border-color:${col};font-size:22px">
          ${lvl.current.level >= 9 ? '👑' : lvl.current.level >= 7 ? '🔥' : lvl.current.level >= 5 ? '⚡' : lvl.current.level >= 3 ? '💪' : '🥚'}
        </div>
        <div class="xp-level-badge" style="background:${col}">${lvl.current.tier} Lv.${lvl.current.level}</div>
      </div>
      <div class="xp-info">
        <div class="xp-name">${name}</div>
        <div class="xp-tier">${lvl.current.tier}</div>
        <div class="xp-count">${xp.toLocaleString()} XP total</div>
      </div>
    </div>
    <div class="xp-bar-wrap">
      <div class="xp-bar-fill" style="width:${lvl.pct}%;background:${col}"></div>
    </div>
    <div class="xp-bar-label">
      <span>${lvl.xpIntoLevel} / ${lvl.xpNeeded} XP to next level</span>
      <span style="color:${col}">${lvl.current.tier}</span>
    </div>
  </div>`;
}

