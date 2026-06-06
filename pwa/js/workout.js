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
  _setItem('wl_' + cid + '_' + dayId, JSON.stringify(data));
}
// Quota-safe write (safeSetItem lives in core.js, loaded first). Fall back to a
// plain write only if the helper somehow isn't defined yet.
function _setItem(k, v) {
  if (typeof safeSetItem === 'function') return safeSetItem(k, v);
  try { localStorage.setItem(k, v); return true; } catch (_) { return false; }
}

// Archive a day's LIVE session (its logged weights/reps) into history, then
// blank the live key. Idempotent — won't double-archive the same session.
// Returns true if it archived (or the live key was already empty), false on
// error. This is the SAME logic buildWorkoutLogger uses for stale-session
// cleanup; extracted so the program-change clear can preserve logged data.
function _wlArchiveLiveSession(cid, dayId) {
  try {
    const saved = getLS('wl_' + cid + '_' + dayId, null);
    if (!saved || !saved.exercises || !Object.keys(saved.exercises).length) return true;
    // Only archive if there is real logged data (any weight/reps/done), not an
    // empty scaffold.
    const hasData = Object.values(saved.exercises).some(ex =>
      ex && Array.isArray(ex.sets) && ex.sets.some(s => s && (s.weight || s.reps || s.done)));
    if (!hasData) { saveWlData(cid, dayId, { exercises: {} }); return true; }

    const sessionDay = saved._countedDate
      || (saved.savedAt ? new Date(saved.savedAt).toDateString() : '')
      || saved._lastEdit || '';
    const archiveIso = saved.savedAt
      || (sessionDay ? new Date(sessionDay).toISOString() : new Date().toISOString());
    const hist = getWlHistory(cid, dayId);
    const already = hist.some(h =>
      (saved.savedAt && h?.date === saved.savedAt)
      || (saved._countedDate && h?._countedDate === saved._countedDate)
      || (!saved.savedAt && !saved._countedDate && h?.date === archiveIso));
    if (!already) {
      hist.unshift({
        date: archiveIso,
        _countedDate: saved._countedDate || sessionDay,
        exercises: saved.exercises,
        sessionNotes: saved.sessionNotes || '',
      });
      if (hist.length > 12) hist.length = 12;
      saveWlHistory(cid, dayId, hist);
    }
    saveWlData(cid, dayId, { exercises: {} });
    return true;
  } catch (_) { return false; }
}

// Reset a client's per-day workout LIVE state on a program/split change.
// Workout day ids are weekday-based (mon/tue/...) and REUSED by every program
// template, so the live key `wl_<cid>_mon`, its swap overrides (`alt_N`), and
// the repeat plan `wl_repeat_<cid>_mon` all carry the OLD program's data onto
// the NEW program's same-weekday day — old weights prefill under unrelated new
// exercises, stale swaps override new slots, and an old repeat plan auto-fills
// old movements.
//
// CRITICAL: the live key holds the client's MOST RECENT logged session (their
// real weights/reps) until day-rollover archives it. So we ARCHIVE each live
// session into history FIRST, then blank it — the client's logged weights/reps
// are preserved (and still surface via the name-matched "Last:" hint). Only the
// now-redundant live working copy + the repeat plan are removed. `wl_hist_` is
// always preserved.
function clearWorkoutLiveStateForClient(cid) {
  if (!cid) return;
  try {
    const livePrefix   = 'wl_' + cid + '_';
    const histPrefix   = 'wl_hist_' + cid + '_';
    const repeatPrefix = 'wl_repeat_' + cid + '_';
    const liveKeys = [];
    const repeatKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      const isLive = k.startsWith(livePrefix) && !k.startsWith(histPrefix) && !k.startsWith(repeatPrefix);
      if (isLive) liveKeys.push(k);
      else if (k.startsWith(repeatPrefix)) repeatKeys.push(k);
    }
    // Archive each live session's logged data to history, then remove the live key.
    liveKeys.forEach(k => {
      const dayId = k.slice(livePrefix.length);
      _wlArchiveLiveSession(cid, dayId); // preserves weights/reps into wl_hist_
      localStorage.removeItem(k);
    });
    // Repeat plans carry no logged data — safe to drop outright.
    repeatKeys.forEach(k => localStorage.removeItem(k));
  } catch (_) {}
}

// Resolve TODAY's workout day id from the client's schedule + program.
// Matches the schedule day for today's weekday to a workout day by name
// (title, then tag), then falls back to a weekday-keyed id/label. Returns
// the workout day's id (or label) so callers can select the right panel.
// Returns null on a rest day or when nothing matches. Shared by the Workouts
// tab default selection and the home "today" card so they always agree.
function getTodayWorkoutDayId(c) {
  try {
    const days7 = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const tl = days7[new Date().getDay()];
    const sched = c && c.data && c.data.schedule && c.data.schedule.days ? c.data.schedule.days : [];
    const today = sched.find(s => s.label === tl);
    if (!today || today.tag === 'Rest') return null;
    const wds = c && c.data && c.data.workouts && c.data.workouts.days ? c.data.workouts.days : [];
    if (!wds.length) return null;
    const nameOf = wd => {
      const lbl = (wd.label || wd.title || '').toLowerCase();
      const sep = lbl.indexOf(' — ');
      return (sep >= 0 ? lbl.slice(sep + 3) : lbl).trim();
    };
    const title = (today.title || '').trim().toLowerCase();
    const tag   = (today.tag || '').trim().toLowerCase();
    const low   = tl.toLowerCase();
    const wd = (title && wds.find(w => nameOf(w) === title))
            || (tag && wds.find(w => nameOf(w) === tag))
            || wds.find(w => (w.id && w.id.toLowerCase() === low) || (w.label || '').toLowerCase().startsWith(low + ' '))
            || null;
    return wd ? (wd.id || wd.label) : null;
  } catch (_) { return null; }
}

function _wlExName(cid, dayId, exIdx) {
  // Prefer a saved swap (alt) override, then the live DOM label, then fall back
  // to the program's prescribed movement for this slot. The DOM-only lookup
  // returned '' whenever the element wasn't mounted yet (or for a slot rendered
  // off-screen) — which then saved a NAMELESS exercise, so the next session's
  // "Last: w × r" hint (matched by name) could never find it. Falling back to
  // the program data guarantees a name is always stamped.
  const live = getWlData(cid, dayId);
  const alt = live?.['alt_' + exIdx];
  if (alt) return String(alt).trim();
  const el = document.getElementById('wl-ex-name-' + cid + '-' + dayId + '-' + exIdx);
  const fromDom = (el?.firstChild?.textContent || el?.textContent || '').replace(/\(alt\)/g,'').trim();
  if (fromDom) return fromDom;
  try {
    const prog = _wlDayExercises(cid, dayId);
    const name = prog?.[exIdx]?.name;
    if (name) return String(name).trim();
  } catch (_) {}
  return '';
}

// Ensure data.exercises[exIdx] exists and carries the CURRENT slot's name.
// Cross-program safety: day ids are weekday-based and reused across templates,
// so a leftover entry from a PREVIOUS program may sit at this index under a
// DIFFERENT exercise name. If the current slot resolves to a different
// movement, reset the entry rather than mutating the old movement's sets (which
// would mis-stamp the logged data). Returns the (possibly new) exercise object.
function _wlEnsureExercise(data, cid, dayId, exIdx) {
  const curName = _wlExName(cid, dayId, exIdx);
  if (!data.exercises[exIdx]) data.exercises[exIdx] = { sets: [], name: curName };
  const storedName = (data.exercises[exIdx].name || '').trim().toLowerCase();
  if (curName && storedName && storedName !== curName.trim().toLowerCase()) {
    data.exercises[exIdx] = { sets: [], name: curName };
  }
  if (!data.exercises[exIdx].name) data.exercises[exIdx].name = curName;
  return data.exercises[exIdx];
}

function wlUpdate(cid, dayId, exIdx, setIdx, field, value) {
  const data = getWlData(cid, dayId);
  if (exIdx === -1) {
    // Top-level session field (e.g. sessionNotes)
    data[field] = value;
  } else {
    const ex = _wlEnsureExercise(data, cid, dayId, exIdx);
    if (!ex.sets[setIdx]) ex.sets[setIdx] = {};
    ex.sets[setIdx][field] = value;
  }
  // Stamp the day this session was last touched so a session left in the live
  // key without ever being checked/saved is still recognised as a *previous*
  // session next time (otherwise its weights x reps never surface as a hint).
  data._lastEdit = new Date().toDateString();
  saveWlData(cid, dayId, data);
  sbAutoSync(cid);
  // Style input
  const input = event.target;
  input.classList.toggle('completed', !!value.trim());
}

// Tap +/- to nudge a set's weight without typing (the #1 phone-logging
// friction). Starts from the typed value, or seeds from the placeholder
// (last session's weight) so the first tap on a blank field becomes "last
// week ± step". Keeps one decimal for plate-fraction work; clamps at 0.
function wlStepWeight(cid, dayId, exIdx, setIdx, delta) {
  const id = 'wlw-' + cid + '-' + dayId + '-' + exIdx + '-' + setIdx;
  const input = document.getElementById(id);
  if (!input) return;
  const seed = (input.value || '').trim() || (input.getAttribute('placeholder') || '');
  let base = parseFloat(seed);
  if (!isFinite(base)) base = 0;
  let next = base + delta;
  if (next < 0) next = 0;
  // Trim trailing .0 so whole numbers stay clean (e.g. 135 not 135.0).
  const val = (Math.round(next * 10) / 10).toString();
  input.value = val;
  input.classList.add('completed');
  const data = getWlData(cid, dayId);
  const ex = _wlEnsureExercise(data, cid, dayId, exIdx);
  if (!ex.sets[setIdx]) ex.sets[setIdx] = {};
  ex.sets[setIdx].weight = val;
  data._lastEdit = new Date().toDateString();
  saveWlData(cid, dayId, data);
  sbAutoSync(cid);
  if (typeof haptic === 'function') haptic('light');
}

function wlToggleDone(cid, dayId, exIdx, setIdx) {
  const data = getWlData(cid, dayId);
  const ex = _wlEnsureExercise(data, cid, dayId, exIdx);
  if (!ex.sets[setIdx]) ex.sets[setIdx] = {};
  const current = ex.sets[setIdx].done;
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
  const ex = _wlEnsureExercise(data, cid, dayId, exIdx);
  if (!ex.sets[setIdx]) ex.sets[setIdx] = {};
  if (!ex.sets[setIdx].drops) ex.sets[setIdx].drops = [];
  const dropIdx = ex.sets[setIdx].drops.length;
  ex.sets[setIdx].drops.push({ weight: '', reps: '', done: false });
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
  data._lastEdit = new Date().toDateString();
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
function saveWlHistory(cid, dayId, hist) { _setItem('wl_hist_' + cid + '_' + dayId, JSON.stringify(hist)); }

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

// Most recent logged sets for a MOVEMENT BY NAME, searched across every day and
// program (all wl_hist_<cid>_* archives + all wl_<cid>_* live keys). This lets
// "last time" weight x reps follow the movement when the client switches
// programs / day ids — the per-day prevSession lookup only sees the same day.
//   excludeKey: the current live key to skip (so today's in-progress session is
//   never returned as its own "previous").
//   excludeDate: a session date (ISO/string) to skip, so we don't echo back the
//   very session already shown by the same-day lookup.
// Returns { sets, date } of the newest matching session, or null.
function _wlLastSetsForMovement(cid, exName, excludeKey, excludeDate) {
  if (!exName) return null;
  const target = String(exName).trim().toLowerCase();
  if (!target) return null;
  let best = null; // { sets, date, ts }
  // Resolve an exercise entry's name, falling back to the program's prescribed
  // movement for that slot. Legacy sessions (and any saved before name-stamping)
  // stored sets with no `name`, so a pure name match silently skipped them and
  // the "Last: w × r" hint never appeared. progNames is the day's prescribed
  // movement list (by index); idx is the entry's key in the exercises object.
  const nameOf = (entry, idx, progNames) => {
    const n = entry && entry.name ? String(entry.name).trim() : '';
    if (n) return n.toLowerCase();
    const pn = progNames && progNames[idx] ? String(progNames[idx]).trim() : '';
    return pn.toLowerCase();
  };
  const consider = (sessionDate, exercisesObj, progNames) => {
    if (!exercisesObj) return;
    const dateStr = sessionDate || '';
    if (excludeDate && dateStr && dateStr === excludeDate) return;
    const entry = Object.entries(exercisesObj).find(([idx, e]) =>
      e && nameOf(e, idx, progNames) === target);
    if (!entry) return;
    const ex = entry[1];
    const sets = (Array.isArray(ex.sets) ? ex.sets : []).filter(s => s && (s.weight || s.reps));
    if (!sets.length) return;
    const ts = dateStr ? new Date(dateStr).getTime() : 0;
    if (!best || ts > best.ts) best = { sets, date: dateStr, ts: ts || 0 };
  };
  // Cache prescribed-movement lists per dayId so we don't rebuild for each entry.
  const progCache = {};
  const progNamesFor = (dayId) => {
    if (!dayId) return null;
    if (progCache[dayId] === undefined) {
      try { progCache[dayId] = (_wlDayExercises(cid, dayId) || []).map(e => e?.name || ''); }
      catch (_) { progCache[dayId] = null; }
    }
    return progCache[dayId];
  };
  try {
    const histPrefix = 'wl_hist_' + cid + '_';
    const livePrefix = 'wl_' + cid + '_';
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k.startsWith(histPrefix)) {
        const dayId = k.slice(histPrefix.length);
        const progNames = progNamesFor(dayId);
        const arr = safeJSON(localStorage.getItem(k), []);
        if (Array.isArray(arr)) arr.forEach(entry => consider(entry?.date || entry?._countedDate || '', entry?.exercises, progNames));
      } else if (k.startsWith(livePrefix) && !k.startsWith(histPrefix)) {
        if (k === excludeKey) continue;
        const dayId = k.slice(livePrefix.length);
        const progNames = progNamesFor(dayId);
        const obj = safeJSON(localStorage.getItem(k), null);
        if (obj && obj.exercises) consider(obj.savedAt || obj._countedDate || obj._lastEdit || '', obj.exercises, progNames);
      }
    }
  } catch (_) {}
  return best ? { sets: best.sets, date: best.date } : null;
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

