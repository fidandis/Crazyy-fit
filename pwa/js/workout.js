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

function _wlExName(cid, dayId, exIdx) {
  const el = document.getElementById('wl-ex-name-' + cid + '-' + dayId + '-' + exIdx);
  return (el?.firstChild?.textContent || el?.textContent || '').replace(/\(alt\)/g,'').trim();
}

function wlUpdate(cid, dayId, exIdx, setIdx, field, value) {
  const data = getWlData(cid, dayId);
  if (exIdx === -1) {
    // Top-level session field (e.g. sessionNotes)
    data[field] = value;
  } else {
    if (!data.exercises[exIdx]) data.exercises[exIdx] = { sets: [], name: _wlExName(cid, dayId, exIdx) };
    if (!data.exercises[exIdx].name) data.exercises[exIdx].name = _wlExName(cid, dayId, exIdx);
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
  if (!data.exercises[exIdx]) data.exercises[exIdx] = { sets: [], name: _wlExName(cid, dayId, exIdx) };
  if (!data.exercises[exIdx].name) data.exercises[exIdx].name = _wlExName(cid, dayId, exIdx);
  if (!data.exercises[exIdx].sets[setIdx]) data.exercises[exIdx].sets[setIdx] = {};
  const current = data.exercises[exIdx].sets[setIdx].done;
  const nowDone = !current;
  data.exercises[exIdx].sets[setIdx].done = nowDone;
  if (nowDone) _wlAutoLog(cid, dayId, data);
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

    // PR detection — only celebrate if there is a genuine previous best to beat
    if (exName && weightVal > 0) {
      const prs = getPRs(cid);
      const prevEntry = prs[exName];
      if (prevEntry && prevEntry.weight && weightVal > prevEntry.weight) {
        prs[exName] = { weight: weightVal, date: new Date().toISOString() };
        savePRs(cid, prs);
        setTimeout(() => showPRCelebration(exName, weightVal), 150);
      } else if (!prevEntry) {
        // First time logging this exercise — record it silently, no celebration
        prs[exName] = { weight: weightVal, date: new Date().toISOString() };
        savePRs(cid, prs);
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
  if (!data.exercises[exIdx]) data.exercises[exIdx] = { sets: [], name: _wlExName(cid, dayId, exIdx) };
  if (!data.exercises[exIdx].name) data.exercises[exIdx].name = _wlExName(cid, dayId, exIdx);
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
    <div class="wl-drop-num">&darr;${dropIdx+1}</div>
    <input class="wl-drop-input" type="text" inputmode="decimal" placeholder="lbs/kg"
      oninput="wlUpdateDrop('${cid}','${dayId}',${exIdx},${setIdx},${dropIdx},'weight',this.value)">
    <input class="wl-drop-input" type="text" inputmode="numeric" placeholder="reps"
      oninput="wlUpdateDrop('${cid}','${dayId}',${exIdx},${setIdx},${dropIdx},'reps',this.value)">
    <button class="wl-drop-check"
      onclick="wlToggleDropDone('${cid}','${dayId}',${exIdx},${setIdx},${dropIdx})"></button>
    <button class="wl-mini-btn wl-del-mini" onclick="wlDeleteDrop('${cid}','${dayId}',${exIdx},${setIdx},${dropIdx})" title="Remove drop set">&times;</button>`;
  container.appendChild(row);
  row.querySelector('input')?.focus();
  showFitToast('Drop set added');
}

function wlUpdateDrop(cid, dayId, exIdx, setIdx, dropIdx, field, value) {
  const data = getWlData(cid, dayId);
  if (!data.exercises[exIdx]) data.exercises[exIdx] = { sets: [], name: _wlExName(cid, dayId, exIdx) };
  if (!data.exercises[exIdx].name) data.exercises[exIdx].name = _wlExName(cid, dayId, exIdx);
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

function wlDeleteSet(cid, dayId, exIdx, setIdx) {
  const data = getWlData(cid, dayId);
  const ex = data.exercises?.[exIdx];
  if (!ex || !ex.sets || !ex.sets[setIdx]) return;
  ex.sets.splice(setIdx, 1);
  saveWlData(cid, dayId, data);
  sbAutoSync(cid);
  // Remove the row + its drop-wrap from the DOM and renumber subsequent set rows.
  const row     = document.getElementById('wl-set-' + cid + '-' + dayId + '-' + exIdx + '-' + setIdx);
  const dropsEl = document.getElementById('wl-drops-' + cid + '-' + dayId + '-' + exIdx + '-' + setIdx);
  const prevHint = row?.nextElementSibling?.classList?.contains('wl-prev-hint') ? row.nextElementSibling : null;
  prevHint?.remove();
  dropsEl?.remove();
  row?.remove();
  // Renumber remaining set rows so their ids and S<n> labels match new indexes.
  const grid = document.getElementById('wl-grid-' + cid + '-' + dayId + '-' + exIdx);
  if (grid) {
    const rows = grid.querySelectorAll('.wl-set-row');
    rows.forEach((r, newIdx) => {
      r.id = 'wl-set-' + cid + '-' + dayId + '-' + exIdx + '-' + newIdx;
      const numEl = r.querySelector('.wl-set-num');
      if (numEl) numEl.textContent = 'S' + (newIdx + 1);
      // Rewire inline handlers that captured the old setIdx
      r.querySelectorAll('[data-setidx]').forEach(el => el.setAttribute('data-setidx', String(newIdx)));
    });
  }
  wlUpdateProgress(cid, dayId);
  showFitToast('Set removed');
}

function wlDeleteDrop(cid, dayId, exIdx, setIdx, dropIdx) {
  const data = getWlData(cid, dayId);
  const drops = data.exercises?.[exIdx]?.sets?.[setIdx]?.drops;
  if (!drops || !drops[dropIdx]) return;
  drops.splice(dropIdx, 1);
  saveWlData(cid, dayId, data);
  sbAutoSync(cid);
  const container = document.getElementById('wl-drops-' + cid + '-' + dayId + '-' + exIdx + '-' + setIdx);
  const row = document.getElementById('wl-drop-' + cid + '-' + dayId + '-' + exIdx + '-' + setIdx + '-' + dropIdx);
  row?.remove();
  // Renumber remaining drop rows
  if (container) {
    const rows = container.querySelectorAll('.wl-drop-row');
    rows.forEach((r, newIdx) => {
      r.id = 'wl-drop-' + cid + '-' + dayId + '-' + exIdx + '-' + setIdx + '-' + newIdx;
      const numEl = r.querySelector('.wl-drop-num');
      if (numEl) numEl.textContent = '↓' + (newIdx + 1);
    });
  }
  wlUpdateProgress(cid, dayId);
}

function wlAddSet(cid, dayId, exIdx, totalEx) {
  const data = getWlData(cid, dayId);
  if (!data.exercises[exIdx]) data.exercises[exIdx] = { sets: [], name: _wlExName(cid, dayId, exIdx) };
  if (!data.exercises[exIdx].name) data.exercises[exIdx].name = _wlExName(cid, dayId, exIdx);
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
    <div class="wl-row-actions">
      <button class="wl-mini-btn wl-drop-mini" onclick="wlAddDrop('${cid}','${dayId}',${exIdx},${setIdx})" title="Add drop set">&darr;</button>
      <button class="wl-mini-btn wl-del-mini" onclick="wlDeleteSet('${cid}','${dayId}',${exIdx},${setIdx})" title="Remove set">&times;</button>
    </div>`;
  const dropsEl = document.createElement('div');
  dropsEl.className = 'wl-drops-wrap';
  dropsEl.id = 'wl-drops-' + cid + '-' + dayId + '-' + exIdx + '-' + setIdx;
  grid.appendChild(row);
  grid.appendChild(dropsEl);
  row.querySelector('input').focus();
}

function getWlHistory(cid, dayId) { return getLS('wl_hist_' + cid + '_' + dayId, []); }
function saveWlHistory(cid, dayId, hist) { localStorage.setItem('wl_hist_' + cid + '_' + dayId, JSON.stringify(hist)); }

/* ══════════════════════════════════════════════════════════════
   REPEAT LAST WEEK
   Carry every movement (incl. swaps/added exercises) + its weights
   and reps forward into upcoming sessions, for a chosen number of
   calendar weeks. Client- or coach-driven; plan syncs via the data
   blob so it propagates across devices.
══════════════════════════════════════════════════════════════ */
const WK_MS = 7 * 24 * 60 * 60 * 1000;

function getWlRepeat(cid, dayId) { return getLS('wl_repeat_' + cid + '_' + dayId, null); }
function saveWlRepeat(cid, dayId, plan) {
  const key = 'wl_repeat_' + cid + '_' + dayId;
  if (plan) localStorage.setItem(key, JSON.stringify(plan));
  else localStorage.removeItem(key);
}
// A plan is live until its expiry date passes.
function wlRepeatActive(plan) {
  return !!(plan && plan.template && plan.expiresAt && Date.now() < new Date(plan.expiresAt).getTime());
}

// The most recent completed session for a day — history first, then the live
// (possibly previous-day) session sitting in the working key.
function _wlLastSession(cid, dayId) {
  const hist = getWlHistory(cid, dayId);
  if (hist && hist[0]?.exercises && Object.keys(hist[0].exercises).length) return hist[0];
  const saved = getWlData(cid, dayId);
  if (saved?.exercises && Object.keys(saved.exercises).length) return saved;
  return null;
}

// Flat list of a day's prescribed exercises (across all blocks), in render order.
function _wlDayExercises(cid, dayId) {
  const c = getAllClients().find(cl => cl.id === cid);
  const days = c?.data?.workouts?.days || [];
  const d = days.find(x => x.id === dayId || x.label === dayId);
  if (!d?.blocks) return [];
  return d.blocks.reduce((acc, b) => b.exercises ? acc.concat(b.exercises) : acc, []);
}

// Distil a logged session into a repeat template: the MOVEMENT LIST only — each
// slot's exercise name (incl. any swap). Weights/reps are intentionally dropped
// so the upcoming sessions start blank.
function _wlBuildTemplate(session) {
  if (!session?.exercises) return null;
  const exercises = {};
  Object.entries(session.exercises).forEach(([idx, ex]) => {
    if (ex && ex.name) exercises[idx] = { name: ex.name };
  });
  return Object.keys(exercises).length ? { exercises } : null;
}

// Apply a template's movement list to a day's live session. Only swaps and
// added movements are written (as alt overrides with blank sets); prescribed
// slots that match are left to the program. No weights/reps are filled.
function _wlApplyTemplate(cid, dayId, template, programExercises) {
  if (!template?.exercises) return;
  const data = getWlData(cid, dayId) || { exercises: {} };
  if (!data.exercises) data.exercises = {};
  Object.entries(template.exercises).forEach(([idx, tex]) => {
    const progName = programExercises?.[idx]?.name || '';
    const name = tex.name || progName || '';
    if (!name) return;
    if (progName && name !== progName) {
      // Swap from the prescribed movement — restore the alternate, blank sets.
      data['alt_' + idx] = name;
      data.exercises[idx] = { name, sets: [] };
    } else if (!progName) {
      // Movement beyond the prescribed list (added previously) — keep it, blank.
      data.exercises[idx] = { name, sets: [] };
    }
    // name === progName: nothing to do; the program already lists this movement.
  });
  saveWlData(cid, dayId, data);
}

// Re-render a single day panel in place (mirrors saveAddedExercise's refresh).
function _wlRefreshDayPanel(cid, dayId) {
  const c = getAllClients().find(cl => cl.id === cid);
  if (!c?.data?.workouts) return;
  const panel = document.getElementById('day-' + cid + '-' + dayId);
  if (!panel) return;
  const tmp = document.createElement('div');
  tmp.innerHTML = renderWorkouts(c.data.workouts, c);
  const fresh = tmp.querySelector('#day-' + cid + '-' + dayId);
  if (fresh) { panel.innerHTML = fresh.innerHTML; panel.style.display = ''; }
}

let _wlRepWeeks = 4;

// Open the "Repeat Last Week" sheet: preview the movements and pick a duration.
function wlRepeatLastWeek(cid, dayId) {
  const template = _wlBuildTemplate(_wlLastSession(cid, dayId));
  if (!template) { showFitToast('No previous workout to repeat yet'); return; }
  document.getElementById('wlRepeatModal')?.remove();
  _wlRepWeeks = 4;

  const prog = _wlDayExercises(cid, dayId);
  const rows = Object.entries(template.exercises).map(([idx, ex]) => {
    const progName = prog[idx]?.name || '';
    const swapped = progName && ex.name !== progName;
    const meta = prog[idx]
      ? `${prog[idx].sets || ''}${prog[idx].reps ? ' · ' + prog[idx].reps : ''}`.trim()
      : 'Added movement';
    const tag = swapped ? '<span class="wl-rep-swap">swap</span>' : '';
    return `<div class="wl-rep-row"><span class="wl-rep-ex">${esc(ex.name || 'Exercise')}${tag}</span><span class="wl-rep-sets">${esc(meta || '—')}</span></div>`;
  }).join('');

  const weekBtns = [1, 2, 4, 6, 8].map(w =>
    `<button class="wl-rep-week${w === _wlRepWeeks ? ' active' : ''}" onclick="_wlRepPickWeeks(this,${w})">${w} wk${w > 1 ? 's' : ''}</button>`
  ).join('');

  const modal = document.createElement('div');
  modal.id = 'wlRepeatModal';
  modal.className = 'app-overlay';
  modal.style.zIndex = '5000';
  modal.innerHTML = `
    <div class="wl-rep-sheet">
      <div class="wl-rep-head">
        <div>
          <div class="wl-rep-title">Repeat Last Week</div>
          <div class="wl-rep-sub">Same movement list (incl. swaps) — log fresh weights &amp; reps</div>
        </div>
        <button class="wl-rep-x" onclick="document.getElementById('wlRepeatModal').remove()">&times;</button>
      </div>
      <div class="wl-rep-list">${rows}</div>
      <div class="wl-rep-weeks-label">Repeat for how many weeks?</div>
      <div class="wl-rep-weeks" id="wlRepWeeks">${weekBtns}</div>
      <button class="wl-rep-apply" onclick="wlApplyRepeat('${esc(cid)}','${esc(dayId)}')">Apply</button>
    </div>`;
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}

function _wlRepPickWeeks(btn, w) {
  _wlRepWeeks = w;
  document.querySelectorAll('#wlRepWeeks .wl-rep-week').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

// Fill this session now and, for multi-week durations, store a dated plan that
// auto-fills future sessions until it expires.
function wlApplyRepeat(cid, dayId) {
  const weeks = _wlRepWeeks || 1;
  const template = _wlBuildTemplate(_wlLastSession(cid, dayId));
  if (!template) { showFitToast('Nothing to repeat'); return; }

  _wlApplyTemplate(cid, dayId, template, _wlDayExercises(cid, dayId));

  if (weeks >= 2) {
    const now = Date.now();
    saveWlRepeat(cid, dayId, {
      template,
      startedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + weeks * WK_MS).toISOString(),
      totalWeeks: weeks,
    });
  } else {
    saveWlRepeat(cid, dayId, null);
  }

  document.getElementById('wlRepeatModal')?.remove();
  sbAutoSync(cid);
  _wlRefreshDayPanel(cid, dayId);
  showFitToast(weeks >= 2 ? `Repeating movement list for ${weeks} weeks` : 'Movement list loaded');
}

function wlCancelRepeat(cid, dayId) {
  saveWlRepeat(cid, dayId, null);
  sbAutoSync(cid);
  _wlRefreshDayPanel(cid, dayId);
  showFitToast('Repeat plan cancelled');
}

function wlUpdateProgress(cid, dayId) {
  // Scope the query to this workout's logger container so the attribute-
  // prefix selectors don't scan the entire document.
  const root = document.getElementById('wl-' + cid + '-' + dayId);
  const setChecks  = root ? root.querySelectorAll('.wl-set-check')  : [];
  const dropChecks = root ? root.querySelectorAll('.wl-drop-check') : [];
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

// Idempotently stamps _countedDate=today and adds a fitness-log calendar entry.
// Mutates data in place; caller must saveWlData afterwards.
function _wlAutoLog(cid, dayId, data) {
  const todayStr = new Date().toDateString();
  if (data._countedDate === todayStr) return;
  data._countedDate = todayStr;
  const logs = getFitnessLogs(cid);
  if (!logs.some(l => new Date(l.date).toDateString() === todayStr)) {
    logs.push({ date: new Date().toISOString(), calories: 0, duration: 0, avgHR: null, maxHR: null, type: 'Workout', zone: '', _fromLogger: true });
    saveFitnessLogs(cid, logs);
  }
}

function wlSaveWorkout(cid, dayId, totalEx) {
  const data = getWlData(cid, dayId);
  data.savedAt = new Date().toISOString();
  const todayStr = new Date().toDateString();

  // Archive previous explicitly-saved session before starting today's
  if (data._countedDate && data._countedDate !== todayStr) {
    if (data.exercises && Object.keys(data.exercises).length) {
      const hist = getWlHistory(cid, dayId);
      hist.unshift({ date: data.savedAt, exercises: data.exercises, sessionNotes: data.sessionNotes || '' });
      if (hist.length > 12) hist.length = 12;
      saveWlHistory(cid, dayId, hist);
    }
  }

  // Ensure calendar entry exists for today (idempotent)
  _wlAutoLog(cid, dayId, data);

  // Award XP once per calendar day (separate from _countedDate so auto-log doesn't block it)
  if (data._xpAwardedDate !== todayStr) {
    data._xpAwardedDate = todayStr;
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
      const doneSets = exData.sets.filter(s => s && (s.done || s.weight || s.reps));
      if (!doneSets.length) return '';
      const setsStr = doneSets.map(s => [s.weight, s.reps].filter(Boolean).join(' × ')).filter(Boolean).join(' · ');
      const label = exData.name ? `<span class="wl-hist-ex-name">${esc(exData.name)}</span> ` : '';
      return setsStr ? `<div class="wl-hist-row">${label}${setsStr}</div>` : '';
    }).filter(Boolean).join('');
    if (!exRows) return '';
    const totalSets = Object.values(entry.exercises || {}).reduce((n, ex) => n + (ex?.sets?.filter(s => s && (s.done || s.weight))?.length || 0), 0);
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
  { level:3,  xp:450,  tier:'Grinder',  color:'#3B9EFF' },
  { level:4,  xp:750,  tier:'Grinder',  color:'#ff8c00' },
  { level:5,  xp:1100, tier:'Athlete',  color:'#3B9EFF' },
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

