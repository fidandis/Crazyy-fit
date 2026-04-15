/* ══════════════════════════════════════════════════════════════
   MORE MENU + FEATURE SCREENS
══════════════════════════════════════════════════════════════ */
function openMoreMenu() {
  document.getElementById('moreMenuBackdrop').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeMoreMenu() {
  document.getElementById('moreMenuBackdrop').classList.remove('open');
  document.body.style.overflow = '';
}
function openFeature(id) {
  closeMoreMenu();
  const el = document.getElementById('feature-' + id);
  if (!el) return;
  el.classList.add('open');
  document.body.style.overflow = 'hidden';
  if (id === 'compare') {
    const body = document.getElementById('feature-compare-body');
    if (body) body.innerHTML = renderComparison();
  } else if (currentClient) {
    renderFeature(id, currentClient);
  }
}
function closeFeature(id) {
  const el = document.getElementById('feature-' + id);
  if (el) el.classList.remove('open');
  document.body.style.overflow = '';
}
function renderFeature(id, c) {
  const body = document.getElementById('feature-' + id + '-body');
  if (!body) return;
  if (id === 'progress')     body.innerHTML = renderProgressCharts(c);
  if (id === 'measurements') body.innerHTML = renderMeasurements(c);
  if (id === 'strength')     body.innerHTML = renderStrength(c);
  if (id === 'meals')        body.innerHTML = renderMealPlan(c);
  if (id === 'checkin')      body.innerHTML = renderCheckin(c);
  if (id === 'calendar')     body.innerHTML = renderCalendar(c);
  if (id === 'compare')      body.innerHTML = renderComparison();
  if (id === 'photos')       body.innerHTML = renderPhotoGallery(c);
  if (id === 'habits')       body.innerHTML = renderHabitTracker(c);
  if (id === 'summary')      body.innerHTML = renderMonthlySummary(c);
  if (id === 'badges')       body.innerHTML = renderBadgesScreen(c);
}

/* ── STORAGE HELPERS ─────────────────────────────────────────── */
function getMeasurements(cid) { return getLS('meas_' + cid, []); }
function saveMeasurements(cid, d) { localStorage.setItem('meas_' + cid, JSON.stringify(d)); }
function getWtHistory(cid) { return getLS('wt_history_' + cid, []); }
function saveWtHistory(cid, d) { localStorage.setItem('wt_history_' + cid, JSON.stringify(d)); }
function logDailyWeight(cid) {
  const el = document.getElementById('wt-log-input-' + cid);
  const val = parseFloat(el?.value);
  if (!val || val < 50 || val > 700) { showFitToast('Enter a valid weight (lbs)'); return; }
  const history = getWtHistory(cid);
  const today = new Date().toISOString().slice(0, 10);
  // Replace today's entry if already logged
  const idx = history.findIndex(e => e.date.slice(0,10) === today);
  if (idx >= 0) history[idx] = { date: new Date().toISOString(), weight: val };
  else history.push({ date: new Date().toISOString(), weight: val });
  saveWtHistory(cid, history);
  localStorage.setItem('wt_current_' + cid, String(val));
  if (el) el.value = '';
  showFitToast('Weight logged: ' + val + ' lbs');
  if (currentClient && currentClient.id === cid) {
    const body = document.getElementById('acc-body-body');
    if (body) body.innerHTML = renderBodyStats(currentClient);
  }
  sbAutoSync(cid);
}
function renderBodyStats(c) {
  const history = getWtHistory(c.id);
  const current = parseFloat(localStorage.getItem('wt_current_' + c.id)) || null;
  const goal    = c.weightLoss?.goal || null;
  const recent  = history.slice(-7);
  // Mini sparkline
  let sparkHtml = '';
  if (recent.length >= 2) {
    const min = Math.min(...recent.map(w => w.weight));
    const max = Math.max(...recent.map(w => w.weight));
    const range = max - min || 1;
    sparkHtml = `<div style="display:flex;align-items:flex-end;gap:3px;height:48px;margin:8px 0 4px">` +
      recent.map(w => {
        const pct = Math.max(10, Math.round(((w.weight - min) / range) * 40 + 8));
        return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px">
          <div style="width:100%;background:${c.accent};border-radius:2px 2px 0 0;height:${pct}px"></div>
          <div style="font-family:'DM Mono',monospace;font-size:7px;color:var(--muted)">${w.weight}</div>
        </div>`;
      }).join('') + `</div>`;
  }
  let wtBadge = '';
  if (current && goal) {
    const diff = (current - goal).toFixed(1);
    const col  = diff <= 0 ? '#2ecc71' : '#f1c40f';
    wtBadge = `<span style="font-family:'DM Mono',monospace;font-size:10px;color:${col};margin-left:8px">${diff > 0 ? diff + ' lbs to go' : 'Goal reached! 🎉'}</span>`;
  }
  // Weight trend arrow vs 7 days ago
  let trendArrow = '';
  if (history.length >= 2) {
    const _latest = history[history.length-1].weight;
    const _weekAgo = history.length >= 7 ? history[history.length-7].weight : history[0].weight;
    const _diff = (_latest - _weekAgo).toFixed(1);
    if (_diff < 0) trendArrow = `<span class="wt-trend-down"> ↓ ${Math.abs(_diff)} lbs this week</span>`;
    else if (_diff > 0) trendArrow = `<span class="wt-trend-up"> ↑ ${_diff} lbs this week</span>`;
  }
  return `
    <div style="padding:0 0 8px">
      <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:1px;padding:4px 0 10px;text-transform:uppercase">Log Today's Weight</div>
      <div class="wt-log-strip">
        <input class="wt-log-input" type="number" id="wt-log-input-${c.id}" placeholder="${current || '175'}" step="0.1" min="50" max="700">
        <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted)">lbs</div>
        <button class="wt-log-btn" onclick="logDailyWeight('${c.id}')">Log</button>
      </div>
      ${current ? `<div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted);padding:0 0 6px">Current: <span style="color:${c.accent}">${current} lbs</span>${wtBadge}${trendArrow}</div>` : ''}
      ${sparkHtml}
      ${recent.length > 0 ? `<div class="wt-history-mini">${recent.slice().reverse().map(w => `<div class="wt-pill"><span>${w.weight}</span> · ${new Date(w.date).toLocaleDateString('en',{month:'short',day:'numeric'})}</div>`).join('')}</div>` : ''}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <button onclick="openFeature('measurements')" class="fit-log-btn" style="margin:0">📏 Measurements</button>
      <button onclick="openFeature('progress')" class="fit-log-btn" style="margin:0;background:var(--surface);color:var(--text);border:1px solid var(--border)">📈 Progress</button>
      <button onclick="openFeature('photos')" class="fit-log-btn" style="margin:0;background:var(--surface);color:var(--text);border:1px solid var(--border);grid-column:1/-1">📸 Photo Gallery</button>
    </div>`;
}
function getPRs(cid) { return getLS('prs_' + cid, {}); }
function savePRs(cid, d) { localStorage.setItem('prs_' + cid, JSON.stringify(d)); }
function getMealPlan(cid) { return getLS('meals_' + cid, null); }
function saveMealPlan(cid, d) { localStorage.setItem('meals_' + cid, JSON.stringify(d)); }
function getCheckins(cid) { return getLS('checkins_' + cid, []); }
function saveCheckins(cid, d) { localStorage.setItem('checkins_' + cid, JSON.stringify(d)); }

/* ── PHOTO GALLERY ─────────────────────────────────────────── */
function getPhotos(cid) { return getLS('progress_photos_' + cid, []); }
function savePhotos(cid, d) { localStorage.setItem('progress_photos_' + cid, JSON.stringify(d)); }
const _photoCache = {};
function renderPhotoGallery(c) {
  const standalone = getPhotos(c.id);
  const checkins   = getCheckins(c.id).filter(ci => ci.photo || ci.photoUrl).map(ci => ({ date: ci.date, src: ci.photo || ci.photoUrl, source: 'check-in' }));
  const all = [...standalone, ...checkins].sort((a,b) => new Date(b.date) - new Date(a.date));
  // Store full srcs in cache keyed by index so onclick doesn't embed huge b64
  all.forEach((p, i) => { _photoCache['p_'+i] = p; });
  let html = `<label class="photo-upload-btn">📷 Add Progress Photo
    <input type="file" accept="image/*" onchange="addProgressPhoto(this,'${c.id}')">
  </label>`;
  if (!all.length) {
    html += `<div class="photo-gallery-empty">No progress photos yet.<br>Add one above or submit a weekly check-in with a photo.</div>`;
  } else {
    // Before/after slider if 2+ photos
    if (all.length >= 2) {
      const oldest = all[all.length-1];
      const newest = all[0];
      _photoCache['ba_before'] = oldest.src;
      _photoCache['ba_after']  = newest.src;
      html += `<div style="margin:0 16px 16px">
        <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:1px;margin-bottom:8px;text-transform:uppercase">Before / After</div>
        <div class="ba-wrap" id="baWrap" onmousedown="baStart(event)" ontouchstart="baStart(event)">
          <img class="ba-img" src="${oldest.src}" decoding="async" alt="Before">
          <img class="ba-img ba-after" id="baAfter" src="${newest.src}" decoding="async" alt="After">
          <div class="ba-divider" id="baDivider"></div>
          <div class="ba-handle" id="baHandle">↔</div>
          <div class="ba-label ba-label-before">${new Date(oldest.date).toLocaleDateString('en',{month:'short',year:'numeric'})}</div>
          <div class="ba-label ba-label-after">${new Date(newest.date).toLocaleDateString('en',{month:'short',year:'numeric'})}</div>
        </div>
      </div>`;
    }
    html += `<div class="photo-gallery-grid">` + all.map((p, i) => {
      const dateStr = new Date(p.date).toLocaleDateString('en',{month:'short',day:'numeric',year:'numeric'});
      return `<div class="photo-gallery-item" onclick="_openLightbox(_photoCache['p_${i}'].src,_photoCache['p_${i}'].date)">
        <img src="${p.src}" loading="lazy" decoding="async" alt="${dateStr}">
        <div class="photo-gallery-date">${dateStr}${p.source ? ' · '+p.source : ''}</div>
      </div>`;
    }).join('') + `</div>`;
  }
  return html;
}
function addProgressPhoto(input, cid) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const MAX = 900, scale = img.width > MAX ? MAX/img.width : 1;
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width*scale); canvas.height = Math.round(img.height*scale);
      canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
      const b64 = canvas.toDataURL('image/jpeg',0.75);
      const photos = getPhotos(cid);
      photos.push({ date: new Date().toISOString(), src: b64 });
      savePhotos(cid, photos);
      showFitToast('Photo saved!');
      if (currentClient) renderFeature('photos', currentClient);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}
function _openLightbox(src, date) {
  const lb = document.getElementById('photoLightbox');
  if (!lb) return;
  document.getElementById('photoLightboxImg').src = src;
  document.getElementById('photoLightboxDate').textContent = new Date(date).toLocaleDateString('en',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  lb.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}
function closePhotoLightbox() {
  const lb = document.getElementById('photoLightbox');
  if (lb) lb.style.display = 'none';
  document.body.style.overflow = '';
}

/* ── HABIT TRACKER ─────────────────────────────────────────── */
const HABITS = [
  { id:'water',  icon:'💧', label:'Drink 8+ glasses of water' },
  { id:'steps',  icon:'👣', label:'Hit 7,000+ steps' },
  { id:'sleep',  icon:'😴', label:'Sleep 7+ hours' },
  { id:'supps',  icon:'💊', label:'Take supplements' },
  { id:'noJunk', icon:'🥗', label:'No junk food' },
  { id:'stretch',icon:'🧘', label:'5 min stretch or mobility' },
];
function getHabits(cid, dateKey) { return getLS('habits_' + cid + '_' + dateKey, {}); }
function saveHabits(cid, dateKey, d) { localStorage.setItem('habits_' + cid + '_' + dateKey, JSON.stringify(d)); }
function toggleHabit(cid, habitId) {
  const today = new Date().toISOString().slice(0,10);
  const habits = getHabits(cid, today);
  habits[habitId] = !habits[habitId];
  saveHabits(cid, today, habits);
  sbAutoSync(cid);
  if (currentClient) renderFeature('habits', currentClient);
}
function renderHabitTracker(c) {
  const today = new Date().toISOString().slice(0,10);
  const habits = getHabits(c.id, today);
  const done   = HABITS.filter(h => habits[h.id]).length;
  // Streak: count consecutive days with at least 4 habits done
  let streak = 0;
  for (let i = 1; i <= 60; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const dk = d.toISOString().slice(0,10);
    const dh = getHabits(c.id, dk);
    if (Object.values(dh).filter(Boolean).length >= 4) streak++;
    else break;
  }
  const pct = Math.round((done/HABITS.length)*100);
  let html = `<div class="chart-card" style="margin-bottom:12px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <div style="font-family:'Bebas Neue',sans-serif;font-size:20px">${new Date().toLocaleDateString('en',{weekday:'long',month:'short',day:'numeric'})}</div>
      <div style="font-family:'DM Mono',monospace;font-size:10px;color:${done===HABITS.length?c.accent:'var(--muted)'}">
        ${done}/${HABITS.length} done
      </div>
    </div>
    <div style="background:var(--surface2);border-radius:4px;height:6px;overflow:hidden">
      <div style="height:100%;width:${pct}%;background:${c.accent};border-radius:4px;transition:width .3s"></div>
    </div>
  </div>
  <div class="habit-card">
    <div class="habit-date-header">Today's Habits</div>`;
  HABITS.forEach(h => {
    html += `<div class="habit-row" onclick="toggleHabit('${c.id}','${h.id}')">
      <div class="habit-icon">${h.icon}</div>
      <div class="habit-label">${h.label}</div>
      <div class="habit-check${habits[h.id] ? ' done' : ''}">${habits[h.id] ? '✓' : ''}</div>
    </div>`;
  });
  html += `<div class="habit-streak">🔥 ${streak}-day streak (4+ habits/day)</div></div>`;
  return html;
}

/* ── FIRST-TIME CLIENT TUTORIAL ─────────────────────────────── */
const TUTORIAL_STEPS = [
  {
    icon: '👋',
    title: 'Welcome to CrazyyFit!',
    desc: "This is your personal training hub. Let's take <strong>30 seconds</strong> to show you around."
  },
  {
    icon: '🏠',
    title: 'Your Home Tab',
    desc: "See <strong>today's workout</strong>, your weekly stats, streak, and messages from your coach — all right here."
  },
  {
    icon: '💪',
    title: 'Log Your Workouts',
    desc: "Open any workout day and tap <strong>Log This Workout</strong>. Track sets, weights, and reps. <strong>Long-press</strong> an exercise name for form tips."
  },
  {
    icon: '📋',
    title: 'Weekly Check-In',
    desc: "Each week, complete your <strong>check-in</strong> — energy levels, sleep, adherence, and a progress photo. Your coach reviews every one."
  },
  {
    icon: '🔥',
    title: "You're All Set!",
    desc: "<strong>Swipe left/right</strong> to switch tabs, or use the nav bar below. Your coach is here if you need anything. Now let's get to work."
  }
];

let _tutStep = 0;

function showTutorial(cid) {
  if (localStorage.getItem('tut_done_' + cid) || AppState._isCoachView) return;
  _tutStep = 0;
  _renderTutStep(cid);
}

function _renderTutStep(cid) {
  let ov = document.getElementById('tutorialOverlay');
  if (!ov) {
    ov = document.createElement('div');
    ov.className = 'tutorial-overlay';
    ov.id = 'tutorialOverlay';
    // Tap backdrop (outside sheet) to skip
    ov.addEventListener('click', function(e) { if (e.target === ov) closeTutorial(cid); });
    document.body.appendChild(ov);
  }
  const step = TUTORIAL_STEPS[_tutStep];
  const total = TUTORIAL_STEPS.length;
  const isLast = _tutStep === total - 1;
  const dots = TUTORIAL_STEPS.map((_, i) =>
    `<div class="tutorial-dot${i === _tutStep ? ' active' : ''}"></div>`).join('');
  ov.innerHTML = `
    <div class="tutorial-sheet">
      <div class="tutorial-dots">${dots}</div>
      <div class="tutorial-icon">${step.icon}</div>
      <div class="tutorial-title">${step.title}</div>
      <div class="tutorial-desc">${step.desc}</div>
      <div class="tutorial-actions">
        <button class="tutorial-skip" onclick="closeTutorial('${cid}')">Skip</button>
        <button class="tutorial-next" onclick="${isLast ? `closeTutorial('${cid}')` : `_tutNext('${cid}')`}">
          ${isLast ? 'Get Started →' : 'Next →'}
        </button>
      </div>
    </div>`;
}

function _tutNext(cid) {
  _tutStep = Math.min(_tutStep + 1, TUTORIAL_STEPS.length - 1);
  _renderTutStep(cid);
}

function closeTutorial(cid) {
  const ov = document.getElementById('tutorialOverlay');
  if (ov) {
    ov.style.transition = 'opacity .25s';
    ov.style.opacity = '0';
    setTimeout(() => ov.remove(), 260);
  }
  localStorage.setItem('tut_done_' + cid, '1');
}

/* ── PR CELEBRATION ─────────────────────────────────────────── */
function showPRCelebration(exName, orm) {
  const overlay = document.getElementById('prCelebOverlay');
  const popup   = document.getElementById('prCelebPopup');
  const sub     = document.getElementById('prCelebSub');
  if (!overlay || !popup) return;
  if (sub) sub.textContent = exName + ' — ' + orm + ' lbs';
  overlay.style.display = 'block';
  popup.style.display   = 'block';
  popup.style.animation = 'none';
  setTimeout(() => { popup.style.animation = 'prPop .4s cubic-bezier(.34,1.56,.64,1) forwards'; }, 10);
  setTimeout(() => {
    popup.style.animation  = 'prFadeOut .5s ease forwards';
    overlay.style.animation = 'prFadeOut .5s ease forwards';
    setTimeout(() => {
      overlay.style.display = 'none'; popup.style.display = 'none';
      overlay.style.animation = ''; popup.style.animation = '';
    }, 500);
  }, 2800);
}

/* ── REST TIMER ──────────────────────────────────────────────── */
let _restTimerInterval = null;
let _restTimerCid = null;
let _restTimerExName = null;
let _restTimerTotal = 90;
let _restTimerRemaining = 0;

function parseRestSecs(text) {
  if (!text) return null;
  // Minutes: "2 min", "2m", "2:00"
  const minMatch = text.match(/(\d+)\s*(?:min|m\b)/i);
  if (minMatch) return parseInt(minMatch[1]) * 60;
  // Range: "60-90s", "60–90 sec" → upper end
  const rangeMatch = text.match(/\d+\s*[-–]\s*(\d+)\s*(?:s|sec)?/i);
  if (rangeMatch) return parseInt(rangeMatch[1]);
  // Plain seconds: "90s", "60 sec", "90"
  const secMatch = text.match(/(\d+)\s*(?:s\b|sec|$)/i);
  if (secMatch && parseInt(secMatch[1]) <= 600) return parseInt(secMatch[1]);
  return null;
}

function getRestPrefs(cid) { return getLS('rest_prefs_' + cid, {}); }
function saveRestPref(cid, exName, secs) {
  if (!cid || !exName) return;
  const prefs = getRestPrefs(cid);
  prefs[exName] = secs;
  localStorage.setItem('rest_prefs_' + cid, JSON.stringify(prefs));
}

function startRestTimer(secs, exName, cid) {
  stopRestTimer();
  _restTimerCid     = cid || null;
  _restTimerExName  = exName || '';
  _restTimerTotal   = secs;
  _restTimerRemaining = secs;
  if (typeof acquireWakeLock === 'function') acquireWakeLock('rest');

  let bar = document.getElementById('restTimerBar');
  if (bar && bar._removeT) { clearTimeout(bar._removeT); bar._removeT = null; }
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'restTimerBar';
    bar.className = 'rest-timer-bar';
    bar.innerHTML = `
      <div class="rest-timer-count" id="rtCount">${secs}</div>
      <div class="rest-timer-label">
        <div class="rest-timer-name" id="rtName"></div>
        <div class="rest-timer-sub" id="rtSub">REST</div>
      </div>
      <button class="rest-timer-adj" onclick="adjustRestTimer(-15)" title="-15s">−</button>
      <svg class="rest-timer-ring" viewBox="0 0 44 44" id="rtRing">
        <circle cx="22" cy="22" r="18" fill="none" stroke="var(--border)" stroke-width="3"/>
        <circle cx="22" cy="22" r="18" fill="none" stroke="var(--accent)" stroke-width="3"
          stroke-dasharray="113" stroke-dashoffset="113" stroke-linecap="round"
          style="transform-origin:center;transform:rotate(-90deg);transition:stroke-dashoffset .9s linear" id="rtCircle"/>
      </svg>
      <button class="rest-timer-adj" onclick="adjustRestTimer(15)" title="+15s">+</button>
      <button class="rest-timer-skip" onclick="stopRestTimer()">Skip</button>`;
    document.body.appendChild(bar);
  }
  const countEl  = document.getElementById('rtCount');
  const nameEl   = document.getElementById('rtName');
  const subEl    = document.getElementById('rtSub');
  const circleEl = document.getElementById('rtCircle');
  if (nameEl) nameEl.textContent = exName || '';

  const prefs = cid ? getRestPrefs(cid) : {};
  const isCustom = exName && prefs[exName] && prefs[exName] !== secs;
  if (subEl) subEl.textContent = isCustom ? 'REST · CUSTOM' : 'REST';

  const updateDisplay = () => {
    if (countEl) countEl.textContent = _restTimerRemaining;
    if (circleEl) {
      const pct = _restTimerTotal > 0 ? _restTimerRemaining / _restTimerTotal : 0;
      circleEl.setAttribute('stroke-dashoffset', String(Math.round(113 * (1 - pct))));
    }
  };
  updateDisplay();
  setTimeout(() => bar.classList.add('visible'), 10);
  _restTimerInterval = setInterval(() => {
    _restTimerRemaining--;
    updateDisplay();
    if (_restTimerRemaining <= 0) {
      stopRestTimer();
      if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
      showFitToast('Rest over — go!');
    }
  }, 1000);
}

function adjustRestTimer(delta) {
  const newRemaining = Math.max(5, _restTimerRemaining + delta);
  const newTotal = Math.max(5, _restTimerTotal + delta);
  _restTimerRemaining = newRemaining;
  _restTimerTotal = newTotal;
  // Save as custom pref
  if (_restTimerCid && _restTimerExName) saveRestPref(_restTimerCid, _restTimerExName, newTotal);
  // Update display
  const countEl = document.getElementById('rtCount');
  const subEl   = document.getElementById('rtSub');
  if (countEl) countEl.textContent = _restTimerRemaining;
  if (subEl) subEl.textContent = 'REST · CUSTOM';
  showFitToast((delta > 0 ? '+' : '') + delta + 's · ' + newTotal + 's saved');
}

function stopRestTimer() {
  if (_restTimerInterval) { clearInterval(_restTimerInterval); _restTimerInterval = null; }
  const bar = document.getElementById('restTimerBar');
  if (bar) {
    bar.classList.remove('visible');
    if (bar._removeT) clearTimeout(bar._removeT);
    bar._removeT = setTimeout(() => { bar.remove(); }, 350);
  }
  if (typeof releaseWakeLock === 'function') releaseWakeLock('rest');
}

/* ── QUICK HOME WEIGHT LOG ───────────────────────────────────── */
function homeLogWeight(cid) {
  const el = document.getElementById('home-wt-' + cid);
  const val = parseFloat(el?.value);
  if (!val || val < 50 || val > 700) { showFitToast('Enter a valid weight'); return; }
  const history = getWtHistory(cid);
  const today = new Date().toISOString().slice(0, 10);
  const idx = history.findIndex(e => e.date.slice(0, 10) === today);
  if (idx >= 0) history[idx] = { date: new Date().toISOString(), weight: val };
  else history.push({ date: new Date().toISOString(), weight: val });
  saveWtHistory(cid, history);
  localStorage.setItem('wt_current_' + cid, String(val));
  if (el) { el.value = ''; el.placeholder = String(val); }
  const lastEl = document.getElementById('home-wt-last-' + cid);
  if (lastEl) lastEl.textContent = val + ' lbs';
  showFitToast('Weight logged: ' + val + ' lbs');
  sbAutoSync(cid);
}

/* ── SKELETON LOADING ────────────────────────────────────────── */
function buildSkeleton() {
  return `<div style="padding:20px 20px 0;animation:skelPulse 1.4s ease-in-out infinite">
    <div class="skel skel-h"></div>
    <div class="skel-stat-grid">
      <div class="skel skel-stat"></div>
      <div class="skel skel-stat"></div>
      <div class="skel skel-stat"></div>
    </div>
    <div class="skel skel-card"></div>
    <div class="skel skel-row" style="width:88%"></div>
    <div class="skel skel-row" style="width:72%"></div>
    <div class="skel skel-row" style="width:80%"></div>
    <div class="skel skel-card" style="margin-top:10px"></div>
  </div>`;
}

/* ── WEEKLY SUMMARY CARD ─────────────────────────────────────── */
function buildWeeklySummaryCard(c) {
  const now = new Date();
  if (now.getDay() !== 1) return ''; // Mondays only
  const weekEnd = new Date(now);
  weekEnd.setHours(0, 0, 0, 0);
  const weekStart = new Date(weekEnd);
  weekStart.setDate(weekEnd.getDate() - 7);
  const logs = getFitnessLogs(c.id);
  const lastWeekLogs = logs.filter(l => {
    if (!l.date) return false;
    const d = new Date(l.date).getTime();
    return d >= weekStart.getTime() && d < weekEnd.getTime();
  });
  const sessions  = lastWeekLogs.length;
  const kcal      = lastWeekLogs.reduce((s, l) => s + (l.calories || 0), 0);
  const sched     = c.data?.schedule?.days || [];
  const trainDays = sched.filter(d => d.tag !== 'Rest').length;
  const adherence = trainDays ? Math.min(100, Math.round(sessions / trainDays * 100)) : null;
  const adColor   = adherence === null ? 'var(--muted)' : adherence >= 80 ? '#2ecc71' : adherence >= 50 ? '#f1c40f' : '#e74c3c';
  const rangeStr  = weekStart.toLocaleDateString('en', { month: 'short', day: 'numeric' }) + ' – ' +
                    new Date(weekEnd.getTime() - 86400000).toLocaleDateString('en', { month: 'short', day: 'numeric' });
  return `<div class="weekly-sum-card">
    <div class="weekly-sum-header">
      <div class="weekly-sum-title">📅 Last Week</div>
      <div class="weekly-sum-badge">${rangeStr}</div>
    </div>
    <div class="weekly-sum-grid">
      <div class="weekly-sum-stat">
        <div class="weekly-sum-val" style="color:${c.accent}">${sessions}</div>
        <div class="weekly-sum-lbl">Sessions</div>
      </div>
      <div class="weekly-sum-stat">
        <div class="weekly-sum-val" style="color:#ff6b35">${kcal > 0 ? (kcal / 1000).toFixed(1) + 'k' : '—'}</div>
        <div class="weekly-sum-lbl">Kcal Burned</div>
      </div>
      <div class="weekly-sum-stat">
        <div class="weekly-sum-val" style="color:${adColor}">${adherence !== null ? adherence + '%' : '—'}</div>
        <div class="weekly-sum-lbl">Adherence</div>
      </div>
    </div>
  </div>`;
}

/* ── MONTHLY SUMMARY EXPORT ─────────────────────────────────── */
function renderMonthlySummary(c) {
  const now   = new Date();
  const mName = now.toLocaleDateString('en',{month:'long',year:'numeric'});
  const mStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const logs  = getFitnessLogs(c.id).filter(l => l.date && new Date(l.date).getTime() >= mStart);
  const wts   = getWtHistory(c.id);
  const wtsMonth = wts.filter(w => new Date(w.date).getTime() >= mStart);
  const checkins = getCheckins(c.id).filter(ci => ci.date && new Date(ci.date).getTime() >= mStart);
  const prs   = getPRs(c.id);
  const totalCal = logs.reduce((s,l)=>s+(l.calories||0),0);
  const totalDur = logs.reduce((s,l)=>s+(l.duration||0),0);
  const avgCheckin = checkins.length ? (checkins.reduce((s,ci)=>s+((ci.sleep+ci.energy+ci.adherence)/3),0)/checkins.length).toFixed(1) : null;
  const wtStart = wtsMonth[0]?.weight || null;
  const wtEnd   = wtsMonth[wtsMonth.length-1]?.weight || null;
  const wtChange = wtStart && wtEnd ? (wtEnd - wtStart).toFixed(1) : null;
  const prList  = Object.entries(prs).slice(0,5);
  let html = `<div style="font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:1px;padding:4px 0 16px">${mName} Summary</div>`;
  html += `<div class="summary-grid">
    <div class="summary-stat"><div class="summary-stat-val" style="color:${c.accent}">${logs.length}</div><div class="summary-stat-lbl">Workouts</div></div>
    <div class="summary-stat"><div class="summary-stat-val" style="color:#ff6b35">${totalCal > 0 ? Math.round(totalCal/1000)+'k' : '—'}</div><div class="summary-stat-lbl">Kcal Burned</div></div>
    <div class="summary-stat"><div class="summary-stat-val" style="color:#3498db">${totalDur > 0 ? Math.round(totalDur/60)+'h' : '—'}</div><div class="summary-stat-lbl">Time Trained</div></div>
    <div class="summary-stat"><div class="summary-stat-val" style="color:${wtChange && wtChange<0?'#2ecc71':'var(--muted)'}">${wtChange !== null ? (wtChange > 0 ? '+':'') + wtChange : '—'}</div><div class="summary-stat-lbl">Weight (lbs)</div></div>
  </div>`;
  if (checkins.length) {
    html += `<div class="summary-stat" style="margin-bottom:10px;text-align:center">
      <div class="summary-stat-val" style="color:${avgCheckin>=4?'#2ecc71':avgCheckin>=2.5?'#f1c40f':'#e74c3c'}">${avgCheckin}</div>
      <div class="summary-stat-lbl">Avg Check-In Score · ${checkins.length} check-ins</div>
    </div>`;
  }
  if (prList.length) {
    html += `<div class="summary-section-title">Personal Records</div><div class="chart-card" style="margin-bottom:12px">`;
    prList.forEach(([ex,pr]) => {
      html += `<div class="pr-row"><div><div class="pr-exercise">${ex}</div></div><div style="display:flex;align-items:center"><div class="pr-val">${pr.orm}</div><div class="pr-badge">PR</div></div></div>`;
    });
    html += `</div>`;
  }
  // Generate plain-text summary for copy
  const txt = `${c.name} — ${mName}\n${'─'.repeat(30)}\nWorkouts: ${logs.length}\nKcal burned: ${totalCal.toLocaleString()}\nTime trained: ${Math.round(totalDur/60)}h\nWeight change: ${wtChange !== null ? wtChange + ' lbs' : 'n/a'}\nCheck-in avg: ${avgCheckin || 'n/a'}\n${prList.map(([ex,pr])=>`PR ${ex}: ${pr.orm} lbs`).join('\n')}`;
  html += `<button class="summary-export-btn" onclick="copyMonthlySummary(${JSON.stringify(txt)})">📋 Copy Summary Text</button>`;
  html += `<button class="summary-copy-btn" onclick="shareMonthlySummary(${JSON.stringify(txt)})">↑ Share</button>`;
  return html;
}
function copyMonthlySummary(txt) {
  navigator.clipboard?.writeText(txt).then(()=>showFitToast('Copied!')).catch(()=>showFitToast('Could not copy'));
}
function shareMonthlySummary(txt) {
  if (navigator.share) { navigator.share({ text: txt }).catch(()=>{}); }
  else copyMonthlySummary(txt);
}

/* ── PROGRESS CHARTS ─────────────────────────────────────────── */
function renderProgressCharts(c) {
  const logs = getFitnessLogs(c.id);
  const xp   = getXP(c.id);
  const lvl  = getLevelData(xp);
  const wtLogs = getLS('wt_history_' + c.id, []);
  let html = '';

  // Goals section
  const _goals = getClientGoals(c.id);
  html += `<div class="chart-card"><div class="chart-title">Goals</div>`;
  if (!_goals.length) {
    html += `<div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted);padding:8px 0">No goals set yet — ask your coach to add one.</div>`;
  } else {
    html += _goals.map(g => {
      const cur = getGoalCurrent(c.id, g.id);
      const p   = calcGoalProgress(g, cur);
      const col = GOAL_COLORS[g.type] || 'var(--accent)';
      return `<div style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px">
          <span style="font-family:'DM Sans',sans-serif;font-size:13px">${GOAL_ICONS[g.type]||'🎯'} ${esc(g.label)}</span>
          <span style="font-family:'DM Mono',monospace;font-size:10px;color:${col}">${p.pct}%</span>
        </div>
        <div style="background:var(--surface2);border-radius:4px;height:6px;overflow:hidden">
          <div style="height:100%;width:${p.pct}%;background:${col};border-radius:4px;transition:width .4s"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);margin-top:3px">
          <span>${displayGoalValue(g, g.start)}</span>
          <span>Target: ${displayGoalValue(g, g.target)}${g.unit ? ' ' + esc(g.unit) : ''}</span>
        </div>
      </div>`;
    }).join('');
  }
  html += `</div>`;

  html += `<div class="chart-card"><div class="chart-title">Weight Over Time</div>`;
  if (wtLogs.length < 2) {
    html += `<div class="chart-empty">Log weight from Body & Stats to see your trend</div>`;
  } else {
    const pts = wtLogs.slice(-30);
    const maxW2 = Math.max(...pts.map(w => w.weight));
    const minW2 = Math.min(...pts.map(w => w.weight));
    const rangeW = (maxW2 - minW2) || 2;
    const W = 300, H = 90, pad = 10;
    const xStep = (W - pad*2) / Math.max(pts.length - 1, 1);
    const toY = v => H - pad - ((v - minW2) / rangeW) * (H - pad*2);
    const pathD = pts.map((w,i) => `${i===0?'M':'L'}${pad + i*xStep},${toY(w.weight)}`).join(' ');
    const start = pts[0], end = pts[pts.length-1];
    const diff = (end.weight - start.weight).toFixed(1);
    const diffCol = diff < 0 ? '#2ecc71' : diff > 0 ? '#e74c3c' : 'var(--muted)';
    html += `<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px">
      <div style="font-family:'Bebas Neue',sans-serif;font-size:28px;color:${c.accent}">${end.weight} <span style="font-size:14px;color:var(--muted)">lbs</span></div>
      <div style="font-family:'DM Mono',monospace;font-size:10px;color:${diffCol}">${diff > 0 ? '+' : ''}${diff} lbs since start</div>
    </div>
    <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;overflow:visible">
      <defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${c.accent}" stop-opacity=".3"/><stop offset="100%" stop-color="${c.accent}" stop-opacity="0"/></linearGradient></defs>
      <path d="${pathD} L${pad+(pts.length-1)*xStep},${H} L${pad},${H} Z" fill="url(#wg)"/>
      <path d="${pathD}" fill="none" stroke="${c.accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      ${pts.map((w,i) => i===pts.length-1?`<circle cx="${pad+i*xStep}" cy="${toY(w.weight)}" r="3" fill="${c.accent}"/>`:'').join('')}
    </svg>
    <div style="display:flex;justify-content:space-between;font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);margin-top:4px">
      <span>${new Date(pts[0].date).toLocaleDateString('en',{month:'short',day:'numeric'})}</span>
      <span>${new Date(pts[pts.length-1].date).toLocaleDateString('en',{month:'short',day:'numeric'})}</span>
    </div>`;
    if (c.weightLoss?.goal) {
      const goalW = c.weightLoss.goal;
      const goalPct = Math.min(100, Math.max(0, Math.round(((start.weight - end.weight) / (start.weight - goalW)) * 100)));
      html += `<div style="margin-top:12px">
        <div style="display:flex;justify-content:space-between;font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);margin-bottom:5px"><span>Goal: ${goalW} lbs</span><span>${goalPct}%</span></div>
        <div style="background:var(--surface2);border-radius:4px;height:6px;overflow:hidden"><div style="height:100%;width:${goalPct}%;background:${c.accent};border-radius:4px"></div></div>
      </div>`;
    }
  }
  html += `</div>`;

  html += `<div class="chart-card"><div class="chart-title">XP Progress</div>
    <div style="text-align:center;padding:14px 0">
      <div style="font-family:'Bebas Neue',sans-serif;font-size:48px;letter-spacing:2px;color:${lvl.current.color}">${xp.toLocaleString()}</div>
      <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:2px">${lvl.current.tier} · Level ${lvl.current.level}</div>
      <div style="background:var(--surface2);border-radius:6px;height:10px;overflow:hidden;margin:12px 20px">
        <div style="height:100%;width:${lvl.pct}%;background:${lvl.current.color};border-radius:6px;transition:width .6s"></div>
      </div>
      <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted)">${lvl.xpIntoLevel} / ${lvl.xpNeeded} XP to next level</div>
    </div></div>`;

  // Weekly workouts bar chart
  html += `<div class="chart-card"><div class="chart-title">Weekly Workouts (Last 8 Weeks)</div>`;
  const weeks = [];
  const now = Date.now();
  for (let w = 7; w >= 0; w--) {
    const wStart = now - (w+1)*7*86400000;
    const wEnd   = now - w*7*86400000;
    const count  = logs.filter(l => { const d = new Date(l.date).getTime(); return d >= wStart && d < wEnd; }).length;
    weeks.push(count);
  }
  const maxW = Math.max(...weeks) || 1;
  html += `<div style="display:flex;align-items:flex-end;gap:6px;height:80px">`;
  weeks.forEach((cnt, i) => {
    const pct = Math.max(4, Math.round((cnt/maxW)*70));
    const label = i === 7 ? 'This' : (7-i)+'w';
    html += `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px">
      <div style="font-family:'DM Mono',monospace;font-size:8px;color:${cnt>0?c.accent:'var(--muted)'}">${cnt||''}</div>
      <div style="width:100%;background:${cnt>0?c.accent:'var(--border)'};border-radius:3px 3px 0 0;height:${pct}px"></div>
      <div style="font-family:'DM Mono',monospace;font-size:7px;color:var(--muted)">${label}</div>
    </div>`;
  });
  html += `</div></div>`;
  return html;
}

/* ── MEASUREMENTS ───────────────────────────────────────────── */
function renderMeasurements(c) {
  const entries = getMeasurements(c.id);
  const latest  = entries[entries.length - 1] || {};
  const prev    = entries[entries.length - 2] || {};
  const fields  = ['waist','hips','chest','larm','rarm','lthigh','rthigh'];
  const labels  = { waist:'Waist', hips:'Hips', chest:'Chest', larm:'L. Arm', rarm:'R. Arm', lthigh:'L. Thigh', rthigh:'R. Thigh' };

  // Stats grid
  let html = `<div class="meas-grid">`;
  fields.forEach(f => {
    const val  = latest[f] ? latest[f] + '"' : '—';
    const diff = (latest[f] && prev[f]) ? (latest[f] - prev[f]).toFixed(1) : null;
    const dc   = diff ? (parseFloat(diff) < 0 ? '#2ecc71' : parseFloat(diff) > 0 ? '#e74c3c' : 'var(--muted)') : null;
    html += `<div class="meas-stat">
      <div class="meas-stat-val" style="color:${latest[f] ? 'var(--accent)' : 'var(--muted)'}">${val}</div>
      <div class="meas-stat-lbl">${labels[f]}</div>
      ${diff !== null ? `<div class="meas-stat-change" style="color:${dc}">${parseFloat(diff) > 0 ? '+' : ''}${diff}"</div>` : '<div class="meas-stat-change" style="color:var(--faint)">·</div>'}
    </div>`;
  });
  html += `</div>`;

  // Log form
  html += `<div class="meas-log-form">
    <div class="meas-log-title">Log Measurements (inches)</div>
    <div class="meas-input-grid">`;
  fields.forEach(f => {
    html += `<div class="meas-input-item">
      <label>${labels[f]}</label>
      <input class="meas-input" type="number" step="0.25" min="0" placeholder="—" id="meas-${f}-${c.id}">
    </div>`;
  });
  html += `</div>
    <button class="meas-log-btn" onclick="logMeasurement('${c.id}')">Save Measurements</button>
  </div>`;

  // History
  if (entries.length) {
    html += `<div class="meas-history-card">
      <div class="meas-history-header">History</div>`;
    entries.slice().reverse().slice(0, 8).forEach(entry => {
      html += `<div class="meas-history-entry">
        <div class="meas-history-date">${new Date(entry.date).toLocaleDateString('en', { month:'short', day:'numeric', year:'numeric' })}</div>
        <div class="meas-history-vals">`;
      fields.forEach(f => {
        if (entry[f]) html += `<div class="meas-history-val"><span>${labels[f]}</span>${entry[f]}"</div>`;
      });
      html += `</div></div>`;
    });
    html += `</div>`;
  }
  return html;
}
function logMeasurement(cid) {
  const fields = ['waist','hips','chest','larm','rarm','lthigh','rthigh'];
  const entry  = { date: new Date().toISOString() };
  let hasAny   = false;
  fields.forEach(f => {
    const el = document.getElementById('meas-' + f + '-' + cid);
    if (el && el.value) { entry[f] = parseFloat(el.value); hasAny = true; el.value = ''; }
  });
  if (!hasAny) { showFitToast('Enter at least one measurement'); return; }
  const entries = getMeasurements(cid);
  entries.push(entry);
  saveMeasurements(cid, entries);
  awardXP(cid, 'workout');
  showFitToast('Measurements saved');
  if (currentClient) renderFeature('measurements', currentClient);
  sbAutoSync(cid);
  syncClientData(cid);
}

/* ── 1RM CALCULATOR ─────────────────────────────────────────── */
function calc1RM(weight, reps) {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}
function renderStrength(c) {
  const prs = getPRs(c.id);
  let html = `<div class="orm-card"><div class="chart-title">1RM Calculator</div>
    <div class="ob-input-row" style="margin-bottom:10px">
      <div class="ob-field"><label class="ob-label">Exercise</label>
        <input class="ob-input" type="text" placeholder="Barbell Squat" id="orm-ex-${c.id}"></div>
    </div>
    <div class="ob-input-row" style="margin-bottom:10px">
      <div class="ob-field"><label class="ob-label">Weight (lbs)</label>
        <input class="ob-input" type="number" placeholder="225" id="orm-wt-${c.id}" oninput="updateORM('${c.id}')"></div>
      <div class="ob-field"><label class="ob-label">Reps</label>
        <input class="ob-input" type="number" placeholder="5" id="orm-reps-${c.id}" oninput="updateORM('${c.id}')"></div>
    </div>
    <div class="orm-result" id="orm-result-${c.id}">—</div>
    <div class="orm-result-lbl">Estimated 1RM (Epley)</div>
    <div class="orm-pct-grid" id="orm-pct-${c.id}"></div>
    <button style="width:100%;margin-top:12px;font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;padding:11px;background:var(--accent);color:#000;border:none;cursor:pointer;border-radius:6px;font-weight:600" onclick="savePR('${c.id}')">Save as PR →</button>
  </div>`;
  html += `<div class="chart-card"><div class="chart-title">Personal Records</div>`;
  const prKeys = Object.keys(prs);
  if (!prKeys.length) {
    html += `<div class="chart-empty">No PRs yet — calculate a 1RM above</div>`;
  } else {
    prKeys.forEach(ex => {
      const pr = prs[ex];
      const hist = pr.history || [];
      // Build mini sparkline if 2+ history points
      let sparkHtml = '';
      if (hist.length >= 2) {
        const vals = hist.map(h => h.orm);
        const minV = Math.min(...vals), maxV = Math.max(...vals);
        const range = maxV - minV || 1;
        const W = 80, H = 28;
        const xStep = (W - 4) / Math.max(vals.length - 1, 1);
        const toY = v => H - 2 - ((v - minV) / range) * (H - 4);
        const pathD = vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${2 + i * xStep},${toY(v)}`).join(' ');
        const trend = vals[vals.length - 1] > vals[0];
        const sparkCol = trend ? '#2ecc71' : '#e74c3c';
        sparkHtml = `<svg viewBox="0 0 ${W} ${H}" style="width:${W}px;height:${H}px;flex-shrink:0" aria-hidden="true">
          <path d="${pathD}" fill="none" stroke="${sparkCol}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="${2 + (vals.length - 1) * xStep}" cy="${toY(vals[vals.length - 1])}" r="2.5" fill="${sparkCol}"/>
        </svg>`;
      }
      html += `<div class="pr-row" style="align-items:flex-start">
        <div style="flex:1;min-width:0">
          <div class="pr-exercise">${esc(ex)}</div>
          <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted)">${pr.weight}lbs × ${pr.reps}reps · ${new Date(pr.date).toLocaleDateString('en',{month:'short',day:'numeric'})}</div>
          ${hist.length >= 2 ? `<div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);margin-top:3px">${hist.length} entries · from ${hist[0].orm} → ${pr.orm} lbs</div>` : ''}
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
          ${sparkHtml}
          <div style="display:flex;align-items:center"><div class="pr-val">${pr.orm}</div><div class="pr-badge">PR</div></div>
        </div>
      </div>`;
    });
  }
  html += `</div>`;
  return html;
}
function updateORM(cid) {
  const wt   = parseFloat(document.getElementById('orm-wt-'+cid)?.value)||0;
  const reps = parseInt(document.getElementById('orm-reps-'+cid)?.value)||0;
  const re   = document.getElementById('orm-result-'+cid);
  const pg   = document.getElementById('orm-pct-'+cid);
  if (!wt||!reps||!re) return;
  const orm = calc1RM(wt,reps);
  re.textContent = orm + ' lbs';
  pg.innerHTML = [90,80,70,60].map(p => `<div class="orm-pct-cell"><div class="orm-pct-val">${Math.round(orm*p/100)}</div><div class="orm-pct-lbl">${p}%</div></div>`).join('');
}
function savePR(cid) {
  const ex   = document.getElementById('orm-ex-'+cid)?.value?.trim();
  const wt   = parseFloat(document.getElementById('orm-wt-'+cid)?.value)||0;
  const reps = parseInt(document.getElementById('orm-reps-'+cid)?.value)||0;
  if (!ex||!wt||!reps) { showFitToast('Fill in exercise, weight and reps'); return; }
  const orm = calc1RM(wt, reps);
  const prs = getPRs(cid);
  if (prs[ex] && prs[ex].orm >= orm) { showFitToast('No new PR — best is '+prs[ex].orm+'lbs'); return; }
  const entry = { weight:wt, reps, orm, date: new Date().toISOString() };
  // Append to history (keep last 20), preserving existing history array
  const prev = prs[ex];
  const history = (prev?.history || (prev ? [{ weight: prev.weight, reps: prev.reps, orm: prev.orm, date: prev.date }] : []));
  history.push(entry);
  if (history.length > 20) history.splice(0, history.length - 20);
  prs[ex] = { ...entry, history };
  savePRs(cid, prs);
  showFitToast('New PR! ' + ex + ' — ' + orm + 'lbs');
  showPRCelebration(ex, orm);
  awardXP(cid, 'workout');
  if (currentClient) renderFeature('strength', currentClient);
  sbAutoSync(cid);
}

/* ── MEAL PLANNER ───────────────────────────────────────────── */
const MEAL_DAYS  = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const MEAL_SLOTS = ['Breakfast','Morning Snack','Lunch','Afternoon Snack','Dinner','Evening Snack'];
function getDefaultMealPlan(c) {
  const targets = (c.data && c.data.nutrition) ? { calories: c.data.nutrition.calories||2200, protein: c.data.nutrition.protein||160, carbs: c.data.nutrition.carbs||240, fat: c.data.nutrition.fat||65 } : { calories:2200, protein:160, carbs:240, fat:65 };
  const plan = {};
  MEAL_DAYS.forEach(d => { plan[d] = {}; MEAL_SLOTS.forEach(s => { plan[d][s] = []; }); });
  return { targets, days: plan };
}
function getMealLog(cid) { return getLS('meal_log_' + cid, []); }
function saveMealLog(cid, d) { localStorage.setItem('meal_log_' + cid, JSON.stringify(d)); }

function renderMealPlan(c) {
  const plan    = getMealPlan(c.id) || getDefaultMealPlan(c);
  const targets = plan.targets || {};
  const day     = MEAL_DAYS[AppState.mealDay];
  const dayPlan = plan.days[day] || {};
  let totalCal=0, totalP=0, totalC=0, totalF=0;
  MEAL_SLOTS.forEach(s => { (dayPlan[s]||[]).forEach(i => { totalCal+=i.cal||0; totalP+=i.p||0; totalC+=i.c||0; totalF+=i.f||0; }); });

  // Macro progress bar
  const calPct = targets.calories ? Math.min(100, Math.round(totalCal/targets.calories*100)) : 0;
  const pPct   = targets.protein  ? Math.min(100, Math.round(totalP/targets.protein*100))   : 0;

  let html = `<div class="meal-daily-total">
    <div class="meal-total-item"><div class="meal-total-val" style="color:var(--accent)">${totalCal}</div><div class="meal-total-lbl">kcal</div></div>
    <div class="meal-total-item"><div class="meal-total-val" style="color:#ff9f7a">${totalP}g</div><div class="meal-total-lbl">Protein</div></div>
    <div class="meal-total-item"><div class="meal-total-val" style="color:#e8ff47">${totalC}g</div><div class="meal-total-lbl">Carbs</div></div>
    <div class="meal-total-item"><div class="meal-total-val" style="color:var(--muted)">${totalF}g</div><div class="meal-total-lbl">Fat</div></div>
  </div>`;

  if (targets.calories) {
    html += `<div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px 14px;margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);margin-bottom:5px"><span>Calories: ${totalCal} / ${targets.calories} kcal</span><span style="color:${calPct>100?'#e74c3c':calPct>=80?'#2ecc71':'var(--muted)'}">${calPct}%</span></div>
      <div style="background:var(--surface2);border-radius:4px;height:5px;overflow:hidden;margin-bottom:8px"><div style="height:100%;width:${calPct}%;background:${calPct>100?'#e74c3c':'var(--accent)'};border-radius:4px;transition:width .3s"></div></div>
      <div style="display:flex;justify-content:space-between;font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);margin-bottom:5px"><span>Protein: ${totalP}g / ${targets.protein||0}g</span><span style="color:${pPct>=80?'#2ecc71':'var(--muted)'}">${pPct}%</span></div>
      <div style="background:var(--surface2);border-radius:4px;height:5px;overflow:hidden"><div style="height:100%;width:${pPct}%;background:#ff9f7a;border-radius:4px;transition:width .3s"></div></div>
    </div>`;
  }

  // Day tabs
  html += `<div class="meal-day-tabs">`;
  MEAL_DAYS.forEach((d,i) => {
    const dp = plan.days[d] || {};
    const hasFoods = MEAL_SLOTS.some(s => (dp[s]||[]).length > 0);
    html += `<button class="meal-day-tab${i===AppState.mealDay?' active':''}" onclick="AppState.mealDay=${i};renderFeature('meals',currentClient)">${d.slice(0,3)}${hasFoods?'·':''}</button>`;
  });
  html += `</div>`;

  // Meal slots
  MEAL_SLOTS.forEach(slot => {
    const items = dayPlan[slot] || [];
    const slotCal = items.reduce((s,i)=>s+(i.cal||0),0);
    const slotP   = items.reduce((s,i)=>s+(i.p||0),0);
    html += `<div class="meal-slot">
      <div class="meal-slot-header">
        <div class="meal-slot-name">${slot}</div>
        <div class="meal-slot-macros">${slotCal>0?slotCal+' kcal'+(slotP?' · '+slotP+'p protein':''):'—'}</div>
      </div>`;
    if (items.length === 0) {
      html += `<div style="padding:10px 14px;font-family:'DM Mono',monospace;font-size:10px;color:var(--muted);font-style:italic">No foods added</div>`;
    }
    items.forEach((item, ii) => {
      html += `<div class="meal-item">
        <span style="flex:1;font-size:13px">${esc(item.name)}</span>
        <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted);margin-right:8px">${[item.cal?item.cal+'cal':'', item.p?item.p+'p':''].filter(Boolean).join(' · ')}</span>
        <button onclick="removeMealItem('${c.id}','${day}','${slot}',${ii})" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:18px;padding:0 4px;line-height:1">×</button>
      </div>`;
    });
    html += `<button class="meal-add-btn" onclick="addMealItem('${c.id}','${day}','${slot}')">+ Add Food</button>
    </div>`;
  });

  // Meal log history
  const mealLog = getMealLog(c.id);
  if (mealLog.length) {
    const showAll = AppState._mealLogShowAll;
    const displayed = showAll ? mealLog.slice().reverse() : mealLog.slice().reverse().slice(0,5);
    html += `<div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:2px;color:var(--muted);text-transform:uppercase;margin:16px 0 10px">Logged History (${mealLog.length})</div>`;
    displayed.forEach(entry => {
      html += `<div class="meal-log-entry">
        <div class="meal-log-date">${new Date(entry.date).toLocaleDateString('en',{weekday:'short',month:'short',day:'numeric',year:'numeric'})}</div>
        <div class="meal-log-macros">
          <span class="meal-log-macro" style="color:var(--accent)">${entry.calories||0} kcal</span>
          <span class="meal-log-macro" style="color:#ff9f7a">${entry.protein||0}g P</span>
          <span class="meal-log-macro" style="color:#e8ff47">${entry.carbs||0}g C</span>
          <span class="meal-log-macro" style="color:var(--muted)">${entry.fat||0}g F</span>
        </div>
        ${entry.note?`<div style="font-size:11px;color:var(--muted);margin-top:5px;font-style:italic">${esc(entry.note)}</div>`:''}
      </div>`;
    });
    if (mealLog.length > 5) {
      html += `<button onclick="AppState._mealLogShowAll=!AppState._mealLogShowAll;renderFeature('meals',currentClient)" style="width:100%;padding:10px;background:none;border:1px solid var(--border);border-radius:8px;color:var(--muted);font-family:'DM Mono',monospace;font-size:10px;cursor:pointer;letter-spacing:1px;margin-top:2px">${showAll?'Show Less ↑':'Show All '+mealLog.length+' Entries ↓'}</button>`;
    }
  }

  // Log today's totals button
  html += `<button onclick="logMealDay('${c.id}')" style="width:100%;padding:12px;background:var(--surface);border:1px solid var(--border);border-radius:10px;color:var(--muted);font-family:'DM Mono',monospace;font-size:10px;cursor:pointer;letter-spacing:1px;margin-top:12px">📋 Log Today's Totals</button>`;

  return html;
}
function addMealItem(cid, day, slot) {
  const existing = document.getElementById('mealAddModal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'mealAddModal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:3000;background:rgba(0,0,0,.7);display:flex;align-items:flex-end;justify-content:center';
  modal.innerHTML = `<div style="background:var(--surface);border-radius:16px 16px 0 0;padding:24px 20px;width:100%;max-width:480px">
    <div style="font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:1px;margin-bottom:16px">Add Food — ${slot}</div>
    <div class="ob-field"><label class="ob-label">Food Item</label>
      <input class="ob-input" id="mi-name" type="text" placeholder="e.g. Chicken breast 150g" autofocus></div>
    <div class="ob-input-row" style="margin-top:10px">
      <div class="ob-field"><label class="ob-label">Calories</label>
        <input class="ob-input" id="mi-cal" type="number" placeholder="0"></div>
      <div class="ob-field"><label class="ob-label">Protein (g)</label>
        <input class="ob-input" id="mi-p" type="number" placeholder="0"></div>
    </div>
    <div class="ob-input-row" style="margin-top:8px">
      <div class="ob-field"><label class="ob-label">Carbs (g)</label>
        <input class="ob-input" id="mi-c" type="number" placeholder="0"></div>
      <div class="ob-field"><label class="ob-label">Fat (g)</label>
        <input class="ob-input" id="mi-f" type="number" placeholder="0"></div>
    </div>
    <div style="display:flex;gap:10px;margin-top:16px">
      <button class="ob-next-btn" style="flex:1" onclick="confirmAddMealItem('${cid}','${day}','${slot}')">Add →</button>
      <button class="ob-back-btn" onclick="document.getElementById('mealAddModal').remove()">Cancel</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  setTimeout(() => document.getElementById('mi-name')?.focus(), 50);
}
function confirmAddMealItem(cid, day, slot) {
  const name = document.getElementById('mi-name')?.value?.trim();
  if (!name) { document.getElementById('mi-name').style.borderColor='#e74c3c'; return; }
  const cal   = parseInt(document.getElementById('mi-cal')?.value)||0;
  const p     = parseInt(document.getElementById('mi-p')?.value)||0;
  const carbs = parseInt(document.getElementById('mi-c')?.value)||0;
  const fat   = parseInt(document.getElementById('mi-f')?.value)||0;
  const plan  = getMealPlan(cid) || getDefaultMealPlan(currentClient);
  if (!plan.days[day]) plan.days[day] = {};
  if (!plan.days[day][slot]) plan.days[day][slot] = [];
  plan.days[day][slot].push({ name, cal, p, c:carbs, f:fat });
  saveMealPlan(cid, plan);
  sbAutoSync(cid);
  document.getElementById('mealAddModal')?.remove();
  renderFeature('meals', currentClient);
  showFitToast(name + ' added');
}
function removeMealItem(cid, day, slot, idx) {
  const plan = getMealPlan(cid) || getDefaultMealPlan(currentClient);
  if (plan.days[day]?.[slot]) {
    plan.days[day][slot].splice(idx, 1);
    saveMealPlan(cid, plan);
    sbAutoSync(cid);
    renderFeature('meals', currentClient);
  }
}

function logMealDay(cid) {
  const plan = getMealPlan(cid) || getDefaultMealPlan(currentClient);
  const todayName = MEAL_DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
  const dayPlan = plan.days[todayName] || {};
  let cal=0, p=0, carbs=0, fat=0;
  MEAL_SLOTS.forEach(s => { (dayPlan[s]||[]).forEach(i => { cal+=i.cal||0; p+=i.p||0; carbs+=i.c||0; fat+=i.f||0; }); });
  if (!cal && !p) { showFitToast('No foods logged for today'); return; }
  const log = getMealLog(cid);
  const todayStr = new Date().toDateString();
  const existing = log.findIndex(e => new Date(e.date).toDateString() === todayStr);
  const entry = { date: new Date().toISOString(), calories: cal, protein: p, carbs, fat };
  if (existing >= 0) log[existing] = entry; else log.push(entry);
  saveMealLog(cid, log);
  showFitToast('Day logged: ' + cal + ' kcal · ' + p + 'g protein');
  renderFeature('meals', currentClient);
}

/* ── WEEKLY CHECK-IN ────────────────────────────────────────── */
function renderCheckin(c) {
  const history    = getCheckins(c.id);
  const lastCheckin= history[history.length-1];
  const daysSince  = lastCheckin ? Math.floor((Date.now()-new Date(lastCheckin.date).getTime())/86400000) : null;
  const alreadyThisWeek = daysSince !== null && daysSince < 7;

  let html = '';

  // Status banner
  if (alreadyThisWeek) {
    html += `<div style="background:rgba(46,204,113,.08);border:1px solid rgba(46,204,113,.25);border-radius:10px;padding:12px 16px;margin-bottom:14px;display:flex;align-items:center;gap:10px">
      <span style="font-size:18px">✅</span>
      <div>
        <div style="font-family:'DM Mono',monospace;font-size:10px;color:#2ecc71;letter-spacing:1px">CHECKED IN</div>
        <div style="font-size:12px;color:var(--muted);margin-top:2px">${daysSince===0?'Today':daysSince+' day'+(daysSince===1?'':'s')+' ago'}</div>
      </div>
    </div>`;
  }

  // Check-in form
  html += `<div class="checkin-card">
    <div style="font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:2px;margin-bottom:16px;color:var(--text)">Weekly Check-In</div>`;

  const questions = [
    ['sleep',    'Sleep Quality',      '😴', '1 = terrible · 5 = great'],
    ['stress',   'Stress Level',       '😤', '1 = stressed · 5 = calm'],
    ['energy',   'Energy Level',       '⚡', '1 = exhausted · 5 = great'],
    ['adherence','Program Adherence',  '🎯', '1 = missed most · 5 = all done'],
  ];
  questions.forEach(([key, label, emoji, desc]) => {
    html += `<div style="margin-bottom:16px">
      <div class="checkin-q">${emoji} ${label}</div>
      <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);margin-bottom:8px">${desc}</div>
      <div class="checkin-scale">`;
    [1,2,3,4,5].forEach(n => {
      html += `<button class="checkin-scale-btn${AppState.checkinState[key]===n?' selected':''}" onclick="AppState.checkinState.${key}=${n};renderFeature('checkin',currentClient)">${n}</button>`;
    });
    html += `</div></div>`;
  });

  html += `<div style="margin-bottom:14px">
    <div class="checkin-q">📝 Notes for your coach</div>
    <textarea class="checkin-textarea" placeholder="How are you feeling? Any injuries, wins, or concerns?" oninput="AppState.checkinState.notes=this.value">${AppState.checkinState.notes}</textarea>
  </div>`;

  html += `<div style="margin-bottom:4px">
    <div class="checkin-q">📸 Progress Photo</div>`;
  if (AppState.checkinState.photoB64) {
    html += `<img src="${AppState.checkinState.photoB64}" class="checkin-photo-preview">`;
  }
  html += `<label class="checkin-photo-btn">${AppState.checkinState.photoB64?'Change Photo':'Add Progress Photo (optional)'}<input type="file" accept="image/*" style="display:none" onchange="loadCheckinPhoto(this)"></label></div>`;

  html += `<button class="checkin-submit-btn" onclick="submitCheckin('${c.id}')">Submit Check-In →</button></div>`;

  // History
  if (history.length) {
    const showAll = AppState._checkinShowAll;
    const displayed = showAll ? history.slice().reverse() : history.slice().reverse().slice(0, 4);
    html += `<div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:2px;color:var(--muted);text-transform:uppercase;margin:16px 0 10px">History (${history.length})</div>`;
    displayed.forEach((ci, i) => {
      const avg = ((ci.sleep+(ci.stress||0)+ci.energy+ci.adherence) / (ci.stress?4:3)).toFixed(1);
      const col = avg >= 4 ? '#2ecc71' : avg >= 2.5 ? '#f1c40f' : '#e74c3c';
      const ciIdx = history.indexOf(ci);
      html += `<div class="checkin-history-item">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <div class="checkin-history-date">${new Date(ci.date).toLocaleDateString('en',{weekday:'short',month:'short',day:'numeric',year:'numeric'})}</div>
          <span style="font-family:'DM Mono',monospace;font-size:10px;padding:3px 10px;border-radius:20px;background:${col}22;color:${col};font-weight:700">${avg} avg</span>
        </div>
        <div class="checkin-scores">
          <span class="checkin-score-pill">😴 ${ci.sleep}/5</span>
          <span class="checkin-score-pill">😤 ${ci.stress||'—'}/5</span>
          <span class="checkin-score-pill">⚡ ${ci.energy}/5</span>
          <span class="checkin-score-pill">🎯 ${ci.adherence}/5</span>
        </div>
        ${ci.notes?`<div style="font-size:12px;color:var(--muted);margin-top:8px;line-height:1.5;font-style:italic">"${esc(ci.notes)}"</div>`:''}
        ${(ci.photo||ci.photoUrl)?((_photoCache['ci_'+ciIdx]=ci.photo||ci.photoUrl),`<img src="${ci.photo||ci.photoUrl}" loading="lazy" decoding="async" style="width:72px;height:72px;object-fit:cover;border-radius:8px;margin-top:8px;cursor:pointer" onclick="_openLightbox(_photoCache['ci_${ciIdx}'],'${new Date(ci.date).toLocaleDateString()}')">`):''}
        ${ci.coachReply?`<div class="checkin-reply-wrap"><div class="checkin-reply-label">Coach Reply</div><div class="checkin-reply-text">"${esc(ci.coachReply)}"</div></div>`:''}
      </div>`;
    });
    if (history.length > 4) {
      html += `<button onclick="AppState._checkinShowAll=!AppState._checkinShowAll;renderFeature('checkin',currentClient)" style="width:100%;padding:11px;background:none;border:1px solid var(--border);border-radius:8px;color:var(--muted);font-family:'DM Mono',monospace;font-size:10px;cursor:pointer;letter-spacing:1px;margin-top:4px">${showAll?'Show Less ↑':'Show All '+history.length+' Check-Ins ↓'}</button>`;
    }
  }
  return html;
}
function loadCheckinPhoto(input) {
  const file = input.files[0]; if (!file) return;
  // Warn if raw file is very large
  if (file.size > 5 * 1024 * 1024) {
    showFitToast('Large photo — compressing…');
  }
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      // Resize to max 800px wide, compress to JPEG 70%
      const MAX = 800;
      const scale = img.width > MAX ? MAX / img.width : 1;
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      const compressed = canvas.toDataURL('image/jpeg', 0.70);
      // Warn if still large after compression (>500KB base64 ≈ 375KB binary)
      if (compressed.length > 500000) showFitToast('Photo saved (large — consider shorter crop)');
      AppState.checkinState.photoB64 = compressed;
      if (currentClient) renderFeature('checkin', currentClient);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}
function submitCheckin(cid) {
  if (!AppState.checkinState.sleep||!AppState.checkinState.energy||!AppState.checkinState.adherence) { showFitToast('Rate sleep, energy and adherence'); return; }
  const checkins = getCheckins(cid);
  checkins.push({ date:new Date().toISOString(), sleep:AppState.checkinState.sleep, stress:AppState.checkinState.stress, energy:AppState.checkinState.energy, adherence:AppState.checkinState.adherence, notes:AppState.checkinState.notes, photo:AppState.checkinState.photoB64 });
  saveCheckins(cid, checkins);
  AppState.checkinState = { sleep:0, stress:0, energy:0, adherence:0, notes:'', photoB64:'' };
  awardXP(cid, 'workout');
  showFitToast('Check-in submitted!');
  renderFeature('checkin', currentClient);
  sbAutoSync(cid);
  syncClientData(cid);
}

/* ── PROGRAM CALENDAR ───────────────────────────────────────── */
function renderCalendar(c) {
  const sched    = c.data.schedule && c.data.schedule.days ? c.data.schedule.days : [];
  const logs     = getFitnessLogs(c.id);
  const months   = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dowNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const firstDay = new Date(AppState.calYear, AppState.calMonth, 1);
  const lastDay  = new Date(AppState.calYear, AppState.calMonth+1, 0);
  const startDow = firstDay.getDay();
  let html = `<div class="cal-nav">
    <button class="cal-nav-btn" onclick="AppState.calMonth--;if(AppState.calMonth<0){AppState.calMonth=11;AppState.calYear--;}renderFeature('calendar',currentClient)">← Prev</button>
    <div class="cal-month-label">${months[AppState.calMonth]} ${AppState.calYear}</div>
    <button class="cal-nav-btn" onclick="AppState.calMonth++;if(AppState.calMonth>11){AppState.calMonth=0;AppState.calYear++;}renderFeature('calendar',currentClient)">Next →</button>
  </div><div class="cal-grid">`;
  dowNames.forEach(d => { html += `<div class="cal-header-cell">${d}</div>`; });
  for (let i=0; i<startDow; i++) html += `<div class="cal-cell other-month"></div>`;
  const today = new Date();
  for (let day=1; day<=lastDay.getDate(); day++) {
    const date     = new Date(AppState.calYear, AppState.calMonth, day);
    const dayLabel = dowNames[date.getDay()];
    const schedDay = sched.find(s => s.label === dayLabel);
    const isToday  = date.toDateString() === today.toDateString();
    const wasLogged= logs.some(l => new Date(l.date).toDateString() === date.toDateString());
    let pill = '';
    if (schedDay && schedDay.tag !== 'Rest') {
      pill = `<div class="cal-workout-pill">${(schedDay.title||schedDay.tag).slice(0,10)}</div>`;
      if (wasLogged) pill += `<div style="font-size:7px;color:#2ecc71">✓ Done</div>`;
    } else if (schedDay) {
      pill = `<div class="cal-rest-pill">Rest</div>`;
    }
    const dateISO = date.toISOString().slice(0,10);
    html += `<div class="cal-cell${isToday?' today':''}${wasLogged?' has-workout':''}" onclick="openCalDayDetail('${c.id}','${dateISO}')">
      <div class="cal-date" style="color:${isToday?'var(--accent)':'var(--muted)'}">${day}</div>${pill}
      ${wasLogged?'<div class="cal-done-dot"></div>':''}
    </div>`;
  }
  html += `</div>`;
  // Adherence this month
  let sched2=0, logged2=0;
  for (let d=1; d<=lastDay.getDate(); d++) {
    const dt = new Date(AppState.calYear, AppState.calMonth, d);
    const dl = dowNames[dt.getDay()];
    const sd = sched.find(s => s.label === dl);
    if (sd && sd.tag !== 'Rest') {
      sched2++;
      if (logs.some(l => new Date(l.date).toDateString() === dt.toDateString())) logged2++;
    }
  }
  const adh = sched2 > 0 ? Math.round((logged2/sched2)*100) : 0;
  html += `<div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:12px 14px;margin-top:12px">
    <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:1px;margin-bottom:4px">ADHERENCE THIS MONTH</div>
    <div style="font-family:'Bebas Neue',sans-serif;font-size:32px;letter-spacing:1px;color:${adh>=80?'#2ecc71':adh>=50?'#f1c40f':'#e74c3c'}">${adh}%</div>
    <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted)">${logged2} of ${sched2} sessions logged</div>
  </div>`;
  return html;
}

function openCalDayDetail(cid, dateISO) {
  const existing = document.getElementById('calDaySheet');
  if (existing) existing.remove();
  const c = getAllClients().find(cl => cl.id === cid);
  if (!c) return;
  const date = new Date(dateISO + 'T12:00:00');
  const dowNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const dayLabel = dowNames[date.getDay()];
  const dateStr = date.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const sched = c.data?.schedule?.days || c.data?.workouts?.days || [];
  const schedDay = sched.find(s => s.label === dayLabel || s.id === dayLabel.toLowerCase());
  const logs = getFitnessLogs(cid);
  const dayLogs = logs.filter(l => l.date && new Date(l.date).toDateString() === date.toDateString());
  const wlData = getWlData(cid, schedDay?.id || dayLabel.toLowerCase());
  const wlHist = getWlHistory(cid, schedDay?.id || dayLabel.toLowerCase());

  let body = `<div style="font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:2px;margin-bottom:4px">${dayLabel} — ${date.toLocaleDateString('en',{month:'short',day:'numeric'})}</div>
  <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:1px;margin-bottom:16px">${dateStr}</div>`;

  // Scheduled workout
  if (schedDay && schedDay.tag !== 'Rest') {
    body += `<div style="background:rgba(255,107,53,.08);border:1px solid rgba(255,107,53,.2);border-radius:8px;padding:10px 14px;margin-bottom:12px">
      <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:1px;color:var(--accent);margin-bottom:4px">SCHEDULED</div>
      <div style="font-size:15px;font-weight:600;color:var(--text)">${esc(schedDay.title || schedDay.tag)}</div>
    </div>`;
  } else if (schedDay?.tag === 'Rest') {
    body += `<div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:10px 14px;margin-bottom:12px;font-family:'DM Mono',monospace;font-size:11px;color:var(--muted)">Rest Day</div>`;
  }

  // Logged sessions
  if (dayLogs.length) {
    body += `<div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:1px;color:var(--muted);text-transform:uppercase;margin-bottom:8px">Logged Activity</div>`;
    dayLogs.forEach(l => {
      body += `<div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px 14px;margin-bottom:6px;display:flex;gap:16px;flex-wrap:wrap">
        <span style="font-size:12px;color:var(--text)">${l.type||'Workout'}</span>
        ${l.calories?`<span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--accent)">🔥 ${l.calories} kcal</span>`:''}
        ${l.duration?`<span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted)">${l.duration} min</span>`:''}
        ${l.avgHR?`<span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted)">♥ ${l.avgHR} bpm</span>`:''}
      </div>`;
    });
  }

  // Workout logger sets for this day (today's current or matching history entry)
  const histEntry = wlHist.find(h => h.date && new Date(h.date).toDateString() === date.toDateString());
  const wlSource = (wlData?._countedDate === date.toDateString() ? wlData : histEntry) || null;
  if (wlSource?.exercises && Object.keys(wlSource.exercises).length) {
    body += `<div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:1px;color:var(--muted);text-transform:uppercase;margin:10px 0 8px">Sets Logged</div>`;
    Object.entries(wlSource.exercises).forEach(([, exData]) => {
      if (!exData?.sets?.length) return;
      const doneSets = exData.sets.filter(s => s.weight || s.reps);
      if (!doneSets.length) return;
      body += `<div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px 14px;margin-bottom:6px">
        <div style="display:flex;flex-wrap:wrap;gap:8px">${doneSets.map((s,si) => `<span style="font-family:'DM Mono',monospace;font-size:10px;background:var(--surface2);border-radius:4px;padding:3px 8px">S${si+1} ${[s.weight,s.reps].filter(Boolean).join(' × ')}</span>`).join('')}</div>
      </div>`;
    });
  }

  if (!dayLogs.length && !wlSource) {
    body += `<div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted);text-align:center;padding:24px 0;letter-spacing:1px">No activity logged this day</div>`;
  }

  const sheet = document.createElement('div');
  sheet.id = 'calDaySheet';
  sheet.style.cssText = 'position:fixed;inset:0;z-index:2000;background:rgba(0,0,0,.6);display:flex;align-items:flex-end;justify-content:center';
  sheet.innerHTML = `<div style="background:var(--surface);border-radius:20px 20px 0 0;width:100%;max-width:520px;max-height:80vh;overflow-y:auto;padding:20px 20px 32px">
    <div style="width:36px;height:4px;background:var(--border);border-radius:2px;margin:0 auto 16px"></div>
    ${body}
    <button onclick="document.getElementById('calDaySheet').remove()" style="width:100%;margin-top:16px;padding:12px;background:var(--surface2);border:1px solid var(--border);border-radius:10px;color:var(--muted);font-family:'DM Mono',monospace;font-size:11px;cursor:pointer;letter-spacing:1px">Close</button>
  </div>`;
  sheet.addEventListener('click', e => { if (e.target === sheet) sheet.remove(); });
  document.body.appendChild(sheet);
}

/* ── CLIENT COMPARISON ──────────────────────────────────────── */
function openCompare() {
  AppState.compareSelected = [];
  openFeature('compare');
}
function renderComparison() {
  const clients = getAllClients();
  let html = `<div class="compare-client-select">`;
  clients.forEach(cl => {
    html += `<button class="compare-btn${AppState.compareSelected.includes(cl.id)?' active':''}" onclick="toggleCompare('${cl.id}')">${esc(cl.name)}</button>`;
  });
  html += `</div>`;
  if (AppState.compareSelected.length < 2) { html += `<div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted);text-align:center;padding:40px 0;letter-spacing:1px">Select 2+ clients to compare</div>`; return html; }
  const selected = clients.filter(cl => AppState.compareSelected.includes(cl.id));
  const now = Date.now();
  html += `<div style="overflow-x:auto"><table class="compare-table"><thead><tr><th>Metric</th>${selected.map(cl=>`<th style="color:${cl.accent}">${esc(cl.name)}</th>`).join('')}</tr></thead><tbody>`;
  const rows = [
    { label:'Sessions',    fn: cl => getFitnessLogs(cl.id).length, higher:true },
    { label:'XP',          fn: cl => getXP(cl.id), higher:true },
    { label:'Level',       fn: cl => getLevelData(getXP(cl.id)).current.level, higher:true },
    { label:'Milestones',  fn: cl => getUnlockedMilestones(cl.id).length, higher:true },
    { label:'Adherence',   fn: cl => { const s=(cl.data?.schedule?.days||[]).filter(d=>d.tag!=='Rest').length; if(!s)return'—'; const l=getFitnessLogs(cl.id).filter(lg=>lg.date&&(now-new Date(lg.date).getTime())<28*86400000).length; return Math.min(100,Math.round(l/(s*4)*100))+'%'; }, higher:true },
    { label:'Check-Ins',   fn: cl => getCheckins(cl.id).length, higher:true },
    { label:'Last Active', fn: cl => { const ls=localStorage.getItem('last_seen_'+cl.id); return ls?timeAgo(parseInt(ls)):'Never'; }, higher:false,
      bestFn: vals => { const ts = getAllClients().filter(cl=>AppState.compareSelected.includes(cl.id)).map(cl=>parseInt(localStorage.getItem('last_seen_'+cl.id)||0)); const max=Math.max(...ts); return ts.map(t=>t===max&&max>0); } },
  ];
  rows.forEach(row => {
    const vals    = selected.map(cl => row.fn(cl));
    const numVals = vals.map(v => parseFloat(v)||0);
    const best    = row.higher ? Math.max(...numVals) : -1;
    const bestMask = row.bestFn ? row.bestFn(vals) : vals.map((_,i) => row.higher && numVals[i]===best && best>0);
    html += `<tr><td style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted);letter-spacing:1px">${row.label}</td>`;
    vals.forEach((v,i) => { html += `<td class="${bestMask[i]?'compare-best':''}">${v}</td>`; });
    html += `</tr>`;
  });
  html += `</tbody></table></div>`;
  return html;
}
function toggleCompare(cid) {
  const idx = AppState.compareSelected.indexOf(cid);
  if (idx >= 0) AppState.compareSelected.splice(idx,1); else AppState.compareSelected.push(cid);
  const body = document.getElementById('feature-compare-body');
  if (body) body.innerHTML = renderComparison();
}

/* ── ADHERENCE FOR COACH DASHBOARD ─────────────────────────── */
function getAdherenceScore(cid, scheduleDays) {
  const logs = getFitnessLogs(cid);
  const now  = Date.now();
  const trainingDays = (scheduleDays||[]).filter(d => d.tag !== 'Rest').length;
  if (!trainingDays) return null;
  const scheduled = trainingDays * 4;
  const logged    = logs.filter(l => l.date && (now - new Date(l.date).getTime()) < 4*7*86400000).length;
  return Math.min(100, Math.round(logged/scheduled*100));
}
function buildAdherenceStat(cid, scheduleDays) {
  const adh = getAdherenceScore(cid, scheduleDays);
  const col = adh === null ? '#888' : adh>=80?'#2ecc71':adh>=50?'#f1c40f':'#e74c3c';
  return `<div class="coach-stat-val" style="color:${col}">${adh!==null?adh+'%':'—'}</div><div class="coach-stat-lbl">Adherence</div>`;
}
function buildCheckinSnippet(cid) {
  const cis = getCheckins(cid);
  if (!cis.length) return '';
  const ci  = cis[cis.length-1];
  const ciIdx = cis.length - 1;
  const avg = ((ci.sleep+ci.stress+ci.energy+ci.adherence)/4).toFixed(1);
  const col = avg>=4?'#2ecc71':avg>=2.5?'#f1c40f':'#e74c3c';
  const ds  = new Date(ci.date).toLocaleDateString('en',{month:'short',day:'numeric'});
  const _ciPhoto = ci.photo || ci.photoUrl || null;
  const photoHtml = _ciPhoto ? `<img src="${_ciPhoto}" loading="lazy" decoding="async" style="width:56px;height:56px;object-fit:cover;border-radius:6px;margin-top:6px;cursor:pointer" onclick="viewCheckinPhoto('${_ciPhoto}')">` : '';
  const existingReply = ci.coachReply || '';
  const replyHtml = existingReply
    ? `<div class="checkin-reply-wrap" style="margin-top:8px"><div class="checkin-reply-label">Your Reply</div><div class="checkin-reply-text">"${esc(existingReply)}"</div></div>`
    : '';
  return `<div class="coach-workouts"><div class="coach-section-lbl" style="padding-top:12px">Latest Check-In <span style="font-family:'DM Mono',monospace;font-size:8px;color:var(--muted)">${ds}</span></div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:5px">
      <span class="checkin-score-pill">😴 ${ci.sleep}/5</span>
      <span class="checkin-score-pill">⚡ ${ci.energy}/5</span>
      <span class="checkin-score-pill">🎯 ${ci.adherence}/5</span>
      <span style="font-family:'DM Mono',monospace;font-size:9px;padding:3px 8px;border-radius:4px;background:${col}22;color:${col}">Avg ${avg}</span>
    </div>${ci.notes?`<div style="font-size:11px;color:var(--muted);margin-top:5px;font-style:italic">"${esc(ci.notes)}"</div>`:''}${photoHtml}
    ${replyHtml}
    <textarea class="checkin-coach-reply-input" id="ci-reply-${cid}" placeholder="Reply to this check-in…">${esc(existingReply)}</textarea>
    <button class="checkin-reply-send-btn" onclick="saveCheckinReply('${cid}',${ciIdx})">Send Reply</button>
  </div>`;
}
function buildNutritionSnippet(cid) {
  const today = new Date().toISOString().slice(0, 10);
  const diary = safeJSON(localStorage.getItem('nutr_diary_' + cid + '_' + today), null);
  const waterLog = safeJSON(localStorage.getItem('water_log_' + cid), []);
  const waterToday = (waterLog.find(e => e?.date === today)?.glasses) || 0;
  let totals = { cal: 0, p: 0, c: 0, f: 0 };
  let itemCount = 0;
  if (diary && typeof diary === 'object') {
    Object.values(diary).forEach(arr => {
      if (!Array.isArray(arr)) return;
      arr.forEach(it => {
        itemCount++;
        totals.cal += (+it.cal || 0);
        totals.p   += (+it.p   || 0);
        totals.c   += (+it.c   || 0);
        totals.f   += (+it.f   || 0);
      });
    });
  }
  if (!itemCount && !waterToday) return '';
  const macros = typeof calcClientMacros === 'function' ? calcClientMacros(cid) : null;
  const calT = macros?.calories || 0;
  const pct  = calT ? Math.min(100, Math.round((totals.cal / calT) * 100)) : 0;
  const col  = pct >= 85 && pct <= 115 ? '#2ecc71' : pct < 60 || pct > 130 ? '#e74c3c' : '#f1c40f';
  return `<div class="coach-workouts"><div class="coach-section-lbl" style="padding-top:12px">Nutrition Today <span style="font-family:'DM Mono',monospace;font-size:8px;color:var(--muted)">${itemCount} item${itemCount===1?'':'s'}</span></div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:5px">
      <span class="checkin-score-pill" style="background:${col}22;color:${col}">${Math.round(totals.cal)}${calT?` / ${calT}`:''} kcal${calT?` · ${pct}%`:''}</span>
      <span class="checkin-score-pill">P ${Math.round(totals.p)}g</span>
      <span class="checkin-score-pill">C ${Math.round(totals.c)}g</span>
      <span class="checkin-score-pill">F ${Math.round(totals.f)}g</span>
      <span class="checkin-score-pill">Water ${waterToday}/8</span>
    </div>
  </div>`;
}
function saveCheckinReply(cid, idx) {
  const el = document.getElementById('ci-reply-' + cid);
  const reply = el?.value?.trim() || '';
  const cis = getCheckins(cid);
  if (!cis[idx]) return;
  cis[idx].coachReply = reply;
  cis[idx].coachReplyDate = new Date().toISOString();
  saveCheckins(cid, cis);
  sbAutoSync(cid);
  showFitToast('Reply saved');
  renderCoachDashboard();
}
function viewCheckinPhoto(src) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.95);display:flex;align-items:center;justify-content:center;cursor:pointer';
  overlay.onclick = () => overlay.remove();
  const img = document.createElement('img');
  img.src = src;
  img.style.cssText = 'max-width:90vw;max-height:90vh;border-radius:8px;object-fit:contain';
  overlay.appendChild(img);
  document.body.appendChild(overlay);
}

/* ── DURNIN-WOMERSLEY BODY FAT ──────────────────────────────── */
function calcBodyFat(sfBicep, sfTricep, sfSuprailiac, sfSubscap, age, sex) {
  const b=parseFloat(sfBicep),t=parseFloat(sfTricep),si=parseFloat(sfSuprailiac),sc=parseFloat(sfSubscap),a=parseFloat(age);
  if (!b||!t||!si||!sc||!a) return null;
  const sumSF = b+t+si+sc;
  const logSum= Math.log10(sumSF);
  const tables = {
    male:   [{maxAge:19,c:1.1620,m:0.0630},{maxAge:29,c:1.1631,m:0.0632},{maxAge:39,c:1.1422,m:0.0544},{maxAge:49,c:1.1620,m:0.0700},{maxAge:999,c:1.1715,m:0.0779}],
    female: [{maxAge:19,c:1.1549,m:0.0678},{maxAge:29,c:1.1599,m:0.0717},{maxAge:39,c:1.1423,m:0.0632},{maxAge:49,c:1.1333,m:0.0612},{maxAge:999,c:1.1339,m:0.0645}],
  };
  const row = (tables[sex]||tables.male).find(r=>a<=r.maxAge);
  if (!row) return null;
  const density = row.c - (row.m * logSum);
  const fatPct  = ((4.95/density) - 4.50) * 100;
  const wtKg    = parseFloat(typeof AppState.obState !== 'undefined' ? AppState.obState.weightLbs||0 : 0) * 0.453592;
  const fatKg   = wtKg * (fatPct/100);
  const leanKg  = wtKg - fatKg;
  return { fatPct:Math.round(fatPct*10)/10, fatMassLbs:Math.round(fatKg*2.20462*10)/10, leanMassLbs:Math.round(leanKg*2.20462*10)/10, sumSF:Math.round(sumSF*10)/10, category:bodyFatCategory(fatPct,sex) };
}
function bodyFatCategory(pct, sex) {
  const cats = sex==='female'
    ? [{max:14,label:'Essential',color:'#3498db'},{max:21,label:'Athletic',color:'#2ecc71'},{max:25,label:'Fitness',color:'#27ae60'},{max:32,label:'Average',color:'#f1c40f'},{max:999,label:'Obese',color:'#e74c3c'}]
    : [{max:6,label:'Essential',color:'#3498db'},{max:14,label:'Athletic',color:'#2ecc71'},{max:18,label:'Fitness',color:'#27ae60'},{max:25,label:'Average',color:'#f1c40f'},{max:999,label:'Obese',color:'#e74c3c'}];
  return cats.find(r=>pct<r.max)||cats[cats.length-1];
}

/* ── MILESTONES PANEL ───────────────────────────────────────── */
function renderMilestonesPanel(c) {
  const unlocked = getUnlockedMilestones(c.id);
  let html = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">`;
  MILESTONES.forEach(ms => {
    const done = unlocked.includes(ms.id);
    html += `<div style="background:${done?c.accent+'22':'var(--surface2)'};border:1px solid ${done?c.accent:'var(--border)'};border-radius:8px;padding:12px;opacity:${done?1:0.5}">
      <div style="font-size:22px;margin-bottom:4px">${ms.emoji}</div>
      <div style="font-size:13px;font-weight:600;color:${done?c.accent:'var(--muted)'}">${ms.title}</div>
      <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);margin-top:2px">${ms.desc}</div>
    </div>`;
  });
  html += `</div>`;
  return html;
}

/* ── SWAP WORKOUT ────────────────────────────────────────────── */
/* ── PER-EXERCISE SWAP ────────────────────────────────────────── */
// context: 'today' = home card (uses workouts.days flat list)
//          'tab'   = workout tab (uses schedule.days blocks, needs dayId + blockIdx)
let _exSwapState = { cid: null, exIdx: null, context: 'today', dayId: null, blockIdx: 0 };

function openExerciseSwap(cid, exIdx, context, dayId, blockIdx) {
  const existing = document.getElementById('exSwapModal');
  if (existing) existing.remove();

  _exSwapState = { cid, exIdx, context: context || 'today', dayId: dayId || null, blockIdx: blockIdx || 0 };
  _exSwapMuscleFilter = 'All';
  const nameEl = document.getElementById('today-ex-name-' + cid + '-' + exIdx);
  const currentName = nameEl ? nameEl.textContent : 'Exercise';

  const overlay = document.createElement('div');
  overlay.className = 'ex-swap-overlay';
  overlay.id = 'exSwapModal';
  overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };

  const muscles = ['All','Chest','Back','Shoulders','Biceps','Triceps','Quads','Hamstrings','Glutes','Calves','Core','Full Body','Cardio','Mobility'];
  const chipHtml = muscles.map(m => `<button class="ex-swap-chip${m==='All'?' active':''}" onclick="filterExerciseByMuscle('${m}',this)">${m}</button>`).join('');

  overlay.innerHTML = `
    <div class="ex-swap-sheet">
      <div class="ex-swap-header">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div>
            <div class="ex-swap-title">Swap Exercise</div>
            <div class="ex-swap-sub">Replacing: ${currentName}</div>
          </div>
          <button onclick="document.getElementById('exSwapModal').remove()" style="background:none;border:1px solid var(--border);border-radius:8px;padding:6px 10px;color:var(--muted);cursor:pointer;font-size:13px">✕</button>
        </div>
        <div style="display:flex;gap:6px;overflow-x:auto;padding:10px 0 4px;scrollbar-width:none;-webkit-overflow-scrolling:touch">${chipHtml}</div>
        <input class="ex-swap-search" id="exSwapSearch" type="text" placeholder="Search exercises…" oninput="filterExerciseList(this.value)">
      </div>
      <div class="ex-swap-list" id="exSwapList">
        ${buildExSwapList('')}
      </div>
    </div>`;

  document.body.appendChild(overlay);
  setTimeout(() => { const s = document.getElementById('exSwapSearch'); if (s) s.focus(); }, 100);
}

let _exSwapItems = []; // lookup table so onclick can use a safe numeric index

function buildExSwapList(query) {
  const q = query.toLowerCase().trim();
  const muscleFilter = typeof _exSwapMuscleFilter !== 'undefined' ? _exSwapMuscleFilter : 'All';
  _exSwapItems = EXERCISE_DB.filter(e => {
    const matchesMuscle = muscleFilter === 'All' || e.muscle === muscleFilter;
    const matchesQuery  = !q || e.name.toLowerCase().includes(q) || e.muscle.toLowerCase().includes(q);
    return matchesMuscle && matchesQuery;
  });

  if (!_exSwapItems.length) return '<div style="padding:20px;text-align:center;font-family:\'DM Mono\',monospace;font-size:11px;color:var(--muted)">No exercises found</div>';

  // Group by muscle, preserving global index for safe onclick
  const groups = {};
  _exSwapItems.forEach((e, idx) => {
    if (!groups[e.muscle]) groups[e.muscle] = [];
    groups[e.muscle].push({ e, idx });
  });

  let html = '';
  Object.keys(groups).forEach(muscle => {
    html += `<div class="ex-swap-group">${muscle}</div>`;
    groups[muscle].forEach(({ e, idx }) => {
      html += `<div class="ex-swap-item" onclick="applyExSwapByIdx(${idx})">
        <div>
          <div class="ex-swap-item-name">${esc(e.name)}</div>
          <div class="ex-swap-item-meta">${esc(e.sets)} sets · ${esc(e.reps)}</div>
        </div>
        <div class="ex-swap-item-tag">${esc(muscle)}</div>
      </div>`;
    });
  });
  return html;
}

function applyExSwapByIdx(idx) {
  const e = _exSwapItems[idx];
  if (!e || !_exSwapState) return;
  selectAlternateExercise(_exSwapState.cid, _exSwapState.exIdx, e.name, e.sets, e.reps);

/* ── ADD EXERCISE TO DAY ──────────────────────────────────── */
}

function openAddExerciseModal(cid, dayId, blockIdx) {
  document.getElementById('addExModal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'addExModal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:4000;background:rgba(0,0,0,.75);display:flex;align-items:flex-end;justify-content:center';
  // Build suggestions from EXERCISE_DB
  const allNames = [...new Set(EXERCISE_DB.map(e => e.name))].sort();
  const datalistHtml = allNames.map(n => `<option value="${esc(n)}">`).join('');
  modal.innerHTML = `
    <div style="background:var(--surface);border-radius:20px 20px 0 0;padding:28px 24px 40px;width:100%;max-width:520px;max-height:80vh;overflow-y:auto">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:2px">Add Exercise</div>
        <button onclick="document.getElementById('addExModal').remove()" style="background:none;border:none;color:var(--muted);font-size:22px;cursor:pointer;line-height:1">×</button>
      </div>
      <datalist id="addExNames">${datalistHtml}</datalist>
      <div style="margin-bottom:12px">
        <div style="font-family:'DM Mono',monospace;font-size:8px;color:var(--muted);letter-spacing:1px;margin-bottom:4px">EXERCISE NAME</div>
        <input class="fit-input" id="addExName" list="addExNames" placeholder="e.g. Barbell Squat" style="font-size:15px" oninput="fillAddExDefaults(this.value)">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px">
        <div>
          <div style="font-family:'DM Mono',monospace;font-size:8px;color:var(--muted);letter-spacing:1px;margin-bottom:4px">SETS</div>
          <input class="fit-input" id="addExSets" placeholder="3" style="font-size:15px">
        </div>
        <div>
          <div style="font-family:'DM Mono',monospace;font-size:8px;color:var(--muted);letter-spacing:1px;margin-bottom:4px">REPS</div>
          <input class="fit-input" id="addExReps" placeholder="10-12" style="font-size:15px">
        </div>
        <div>
          <div style="font-family:'DM Mono',monospace;font-size:8px;color:var(--muted);letter-spacing:1px;margin-bottom:4px">REST</div>
          <input class="fit-input" id="addExRest" placeholder="90 sec" style="font-size:15px">
        </div>
      </div>
      <div style="margin-bottom:18px">
        <div style="font-family:'DM Mono',monospace;font-size:8px;color:var(--muted);letter-spacing:1px;margin-bottom:4px">COACHING NOTE (optional)</div>
        <input class="fit-input" id="addExNote" placeholder="e.g. Full ROM — control the eccentric" style="font-size:14px">
      </div>
      <button onclick="saveAddedExercise('${esc(cid)}','${esc(dayId)}',${blockIdx})" style="width:100%;padding:14px;background:var(--accent);color:#000;border:none;font-family:'DM Mono',monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:600;cursor:pointer;border-radius:8px">Add to Workout</button>
    </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  setTimeout(() => document.getElementById('addExName')?.focus(), 100);
}

function fillAddExDefaults(name) {
  const match = EXERCISE_DB.find(e => e.name.toLowerCase() === name.toLowerCase());
  if (!match) return;
  const setsEl = document.getElementById('addExSets');
  const repsEl = document.getElementById('addExReps');
  if (setsEl && !setsEl.value) setsEl.value = match.sets || '';
  if (repsEl && !repsEl.value) repsEl.value = match.reps || '';
}

function saveAddedExercise(cid, dayId, blockIdx) {
  const name = document.getElementById('addExName')?.value.trim();
  if (!name) { showFitToast('Enter an exercise name'); return; }
  const sets = document.getElementById('addExSets')?.value.trim() || '3';
  const reps = document.getElementById('addExReps')?.value.trim() || '10';
  const rest = document.getElementById('addExRest')?.value.trim() || '60 sec';
  const note = document.getElementById('addExNote')?.value.trim() || '';

  const clients = getAllClients();
  const c = clients.find(cl => cl.id === cid);
  if (!c?.data?.workouts?.days) return;

  const wDay = c.data.workouts.days.find(d => d.id === dayId || d.label === dayId);
  if (!wDay) return;

  if (!wDay.blocks || !wDay.blocks.length) wDay.blocks = [{ label: 'Exercises', exercises: [] }];
  const blk = wDay.blocks[blockIdx] || wDay.blocks[0];
  if (!blk.exercises) blk.exercises = [];
  blk.exercises.push({ name, sets, reps, rest, note });

  updateDynamicClient(cid, c);
  sbAutoSync(cid);
  document.getElementById('addExModal')?.remove();
  showFitToast('Exercise added!');

  // Refresh the workout day panel
  const updatedC = getAllClients().find(cl => cl.id === cid) || c;
  const dayPanel = document.getElementById('day-' + cid + '-' + dayId);
  if (dayPanel && updatedC.data?.workouts) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = renderWorkouts(updatedC.data.workouts, updatedC);
    const newPanel = tempDiv.querySelector('#day-' + cid + '-' + dayId);
    if (newPanel) { dayPanel.innerHTML = newPanel.innerHTML; dayPanel.style.display = ''; }
  }
}

function filterExerciseList(query) {
  const list = document.getElementById('exSwapList');
  if (list) list.innerHTML = buildExSwapList(query);
}

let _exSwapMuscleFilter = 'All';
function filterExerciseByMuscle(muscle, btn) {
  _exSwapMuscleFilter = muscle;
  document.querySelectorAll('.ex-swap-chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const query = document.getElementById('exSwapSearch')?.value || '';
  const list = document.getElementById('exSwapList');
  if (list) list.innerHTML = buildExSwapList(query);
}

function selectAlternateExercise(cid, exIdx, newName, sets, reps) {
  // ── Update DOM ────────────────────────────────────────────────
  const nameEl = document.getElementById('today-ex-name-' + cid + '-' + exIdx);
  const metaEl = document.getElementById('today-ex-meta-' + cid + '-' + exIdx);
  const setsEl = document.getElementById('today-ex-sets-' + cid + '-' + exIdx);
  if (nameEl) nameEl.textContent = newName;
  if (metaEl) metaEl.textContent = sets + (reps ? ' · ' + reps : '');
  if (setsEl) setsEl.textContent = sets || '';

  // ── Persist to data ───────────────────────────────────────────
  const clients = getAllClients();
  const c = clients.find(cl => cl.id === cid);
  if (c) {
    const ctx = _exSwapState.context || 'today';

    if (ctx === 'today') {
      // Today card: find today's workout day and update the exercise in its blocks
      const days7 = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      const todayShort = days7[new Date().getDay()];
      const todayLower = todayShort.toLowerCase();
      const sched = c.data?.schedule?.days || [];
      const todaySched = sched.find(s => s.label === todayShort);
      const schedTitle = (todaySched?.title || '').trim().toLowerCase();
      if (c.data?.workouts?.days) {
        const wDay = c.data.workouts.days.find(d => {
          if (d.id && d.id.toLowerCase() === todayLower) return true;
          const lbl = (d.label || '').toLowerCase();
          if (lbl === todayLower || lbl.startsWith(todayLower + ' ')) return true;
          if (schedTitle) {
            const sep = lbl.indexOf(' — ');
            const wName = (sep >= 0 ? lbl.slice(sep + 3) : lbl).trim();
            if (wName === schedTitle) return true;
          }
          return false;
        });
        if (wDay) {
          // Update in flat exercises array if it exists
          if (wDay.exercises?.[exIdx] !== undefined) {
            wDay.exercises[exIdx] = Object.assign({}, wDay.exercises[exIdx], { name: newName, sets, reps });
          }
          // Update in blocks (the actual data structure)
          if (wDay.blocks) {
            let flat = 0;
            for (const blk of wDay.blocks) {
              if (blk.exercises) {
                for (let i = 0; i < blk.exercises.length; i++) {
                  if (flat === exIdx) blk.exercises[i] = Object.assign({}, blk.exercises[i], { name: newName, sets, reps });
                  flat++;
                }
              }
            }
          }
        }
      }
    } else if (ctx === 'wl') {
      // Workout logger: save alt name into wl_ storage and update DOM
      const dayId = _exSwapState.dayId;
      const wlData = getWlData(cid, dayId);
      wlData['alt_' + exIdx] = newName;
      saveWlData(cid, dayId, wlData);
      const wlNameEl = document.getElementById('wl-ex-name-' + cid + '-' + dayId + '-' + exIdx);
      if (wlNameEl) wlNameEl.innerHTML = esc(newName) + '<span style="font-size:9px;color:var(--muted);margin-left:6px">(alt)</span>';
    } else {
      // Workout tab: update workouts.days blocks (the rendering source) + schedule.days for consistency
      const dayId = _exSwapState.dayId;
      const blockIdx = _exSwapState.blockIdx || 0;

      // Primary: update workouts.days
      if (c.data?.workouts?.days) {
        const wDay = c.data.workouts.days.find(d => d.id === dayId || d.label === dayId);
        if (wDay?.blocks?.[blockIdx]?.exercises?.[exIdx] !== undefined) {
          wDay.blocks[blockIdx].exercises[exIdx] = Object.assign({}, wDay.blocks[blockIdx].exercises[exIdx], { name: newName, sets, reps });
        }
      }
      // Mirror: update schedule.days blocks
      if (c.data?.schedule?.days) {
        const sDay = c.data.schedule.days.find(d => d.id === dayId || d.label === dayId);
        if (sDay?.blocks?.[blockIdx]?.exercises?.[exIdx] !== undefined) {
          sDay.blocks[blockIdx].exercises[exIdx] = Object.assign({}, sDay.blocks[blockIdx].exercises[exIdx], { name: newName, sets, reps });
        }
      }
      // Refresh the workout day panel in the DOM so the change shows immediately
      updateDynamicClient(cid, c);
      sbAutoSync(cid);
      const updatedC = getAllClients().find(cl => cl.id === cid) || c;
      const dayPanel = document.getElementById('day-' + cid + '-' + dayId);
      if (dayPanel && updatedC.data?.workouts?.days) {
        const wDaySorted = renderWorkouts(updatedC.data.workouts, updatedC);
        // Re-render just the panel for this day
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = wDaySorted;
        const newPanel = tempDiv.querySelector('#day-' + cid + '-' + dayId);
        if (newPanel) { dayPanel.innerHTML = newPanel.innerHTML; dayPanel.style.display = ''; }
      }
      document.getElementById('exSwapModal')?.remove();
      showFitToast('Swapped to ' + newName);
      return; // skip the generic close/toast at end of function
    }

    updateDynamicClient(cid, c);
    sbAutoSync(cid);
  }

  document.getElementById('exSwapModal')?.remove();
  showFitToast('Swapped to ' + newName);
}

/* ── DAY STREAK ──────────────────────────────────────────────── */
function getDayStreak(cid) {
  const logs = getFitnessLogs(cid);
  if (!logs.length) return 0;
  let streak = 0;
  const today = new Date(); today.setHours(0,0,0,0);
  for (let i = 0; i < 365; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const dateStr = d.toDateString();
    const logged = logs.some(l => l.date && new Date(l.date).toDateString() === dateStr);
    if (logged) streak++;
    else if (i > 0) break; // gap — streak ends (don't break on today if nothing yet)
  }
  return streak;
}

/* ── BROADCAST MESSAGE ───────────────────────────────────────── */
function openBroadcast() {
  const existing = document.getElementById('broadcastModal');
  if (existing) existing.remove();
  const cur = localStorage.getItem('coach_broadcast') || '';
  const modal = document.createElement('div');
  modal.id = 'broadcastModal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:4000;background:rgba(0,0,0,.8);display:flex;align-items:flex-end;justify-content:center';
  modal.innerHTML = `<div style="background:var(--surface);border-radius:20px 20px 0 0;padding:28px 24px 40px;width:100%;max-width:500px">
    <div style="font-family:'Bebas Neue',sans-serif;font-size:24px;letter-spacing:2px;margin-bottom:4px;color:#e8ff47">📢 Broadcast Message</div>
    <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted);margin-bottom:16px">Sent to ALL clients on their home screen</div>
    <textarea id="broadcastInput" style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:12px;color:var(--text);font-size:14px;min-height:100px;font-family:'DM Sans',sans-serif;resize:vertical" maxlength="300" placeholder="e.g. Gym closed Saturday — see you Monday!">${esc(cur)}</textarea>
    <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);margin-top:4px;text-align:right" id="bcCharCount">${cur.length}/300</div>
    <div style="display:flex;gap:10px;margin-top:14px">
      <button class="ob-next-btn" style="flex:1;background:#e8ff47;color:#000" onclick="saveBroadcast()">📲 In-App Broadcast</button>
      <button class="ob-back-btn" onclick="document.getElementById('broadcastModal').remove()">Cancel</button>
    </div>
    <button class="ob-next-btn" id="bcEmailBtn" style="width:100%;margin-top:8px;background:rgba(255,107,53,.12);color:#ff6b35;border:1px solid #ff6b35" onclick="bcSendEmail()">📧 Email All Clients</button>
    ${cur ? `<button class="ob-back-btn" style="width:100%;margin-top:8px;color:#e74c3c;border-color:#e74c3c" onclick="clearBroadcast()">🗑 Clear Broadcast</button>` : ''}
  </div>`;
  document.body.appendChild(modal);
  document.getElementById('broadcastInput').addEventListener('input', function() {
    document.getElementById('bcCharCount').textContent = this.value.length + '/300';
  });
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}
function saveBroadcast() {
  const val = document.getElementById('broadcastInput')?.value?.trim() || '';
  if (!val) return;
  localStorage.setItem('coach_broadcast', val);
  localStorage.setItem('coach_broadcast_ts', new Date().toISOString());
  document.getElementById('broadcastModal')?.remove();
  showFitToast('Broadcast sent to all clients');
}
function clearBroadcast() {
  localStorage.removeItem('coach_broadcast');
  localStorage.removeItem('coach_broadcast_ts');
  document.getElementById('broadcastModal')?.remove();
  showFitToast('Broadcast cleared');
}
async function bcSendEmail() {
  const msg = document.getElementById('broadcastInput')?.value?.trim() || '';
  if (!msg) { showFitToast('Enter a message first'); return; }
  const btn = document.getElementById('bcEmailBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
  await sendBroadcastEmailToAll(msg);
  document.getElementById('broadcastModal')?.remove();
}

/* ── BEFORE/AFTER SLIDER ─────────────────────────────────────── */
const _baState = { active: false };
function baStart(e) {
  _baState.active = true;
  document.addEventListener('mousemove', baMove);
  document.addEventListener('mouseup', baEnd);
  document.addEventListener('touchmove', baMove, { passive: false });
  document.addEventListener('touchend', baEnd);
  baMove(e);
}
function baMove(e) {
  if (!_baState.active) return;
  if (e.cancelable) e.preventDefault();
  const wrap = document.getElementById('baWrap');
  if (!wrap) return;
  const rect = wrap.getBoundingClientRect();
  const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
  const pct = Math.max(5, Math.min(95, (x / rect.width) * 100));
  const after = document.getElementById('baAfter');
  const div   = document.getElementById('baDivider');
  const hand  = document.getElementById('baHandle');
  if (after) after.style.clipPath = `inset(0 ${100-pct}% 0 0)`;
  if (div)   div.style.left = pct + '%';
  if (hand)  hand.style.left = pct + '%';
}
function baEnd() {
  _baState.active = false;
  document.removeEventListener('mousemove', baMove);
  document.removeEventListener('mouseup', baEnd);
  document.removeEventListener('touchmove', baMove);
  document.removeEventListener('touchend', baEnd);
}

