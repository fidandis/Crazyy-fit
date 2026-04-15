/* ══════════════════════════════════════════════════════════════
   TABATA WORKOUTS DATA
   Structure: Push → Pull → Legs → Core, cycled × 3
   40s work · 20s rest per interval · 12 total rounds per workout
   Approx 13 min per workout (+ 30s warmup + 15s between cycles)
══════════════════════════════════════════════════════════════ */
const TABATA_WORKOUTS = [
  {
    id: 1, name: 'Foundation', level: 'Beginner', totalMin: 13,
    desc: 'Classic push/pull/legs/core — the perfect starter circuit',
    exercises: [
      { name: 'Push-Ups',             focus: 'Push' },
      { name: 'Bodyweight Row (Table)', focus: 'Pull' },
      { name: 'Bodyweight Squats',    focus: 'Legs' },
      { name: 'Plank Hold',           focus: 'Core' },
    ]
  },
  {
    id: 2, name: 'Ignite', level: 'Beginner', totalMin: 13,
    desc: 'Low-impact power circuit — all four patterns, full intensity',
    exercises: [
      { name: 'Incline Push-Ups',     focus: 'Push' },
      { name: 'Superman Hold',        focus: 'Pull' },
      { name: 'Reverse Lunges',       focus: 'Legs' },
      { name: 'Dead Bug',             focus: 'Core' },
    ]
  },
  {
    id: 3, name: 'Surge', level: 'Intermediate', totalMin: 13,
    desc: 'Explosive movements — push harder each cycle',
    exercises: [
      { name: 'Explosive Push-Ups',   focus: 'Push' },
      { name: 'Inverted Rows',        focus: 'Pull' },
      { name: 'Jump Squats',          focus: 'Legs' },
      { name: 'Mountain Climbers',    focus: 'Core' },
    ]
  },
  {
    id: 4, name: 'Grind', level: 'Intermediate', totalMin: 13,
    desc: 'Strength-endurance hybrid — feel every round',
    exercises: [
      { name: 'Pike Push-Ups',        focus: 'Push' },
      { name: 'Band Pull-Aparts',     focus: 'Pull' },
      { name: 'Bulgarian Split Squat (BW)', focus: 'Legs' },
      { name: 'Hollow Body Hold',     focus: 'Core' },
    ]
  },
  {
    id: 5, name: 'Blitz', level: 'Intermediate', totalMin: 13,
    desc: 'Non-stop full-body assault — zero breathing room',
    exercises: [
      { name: 'Tricep Dips',          focus: 'Push' },
      { name: 'Chin-Up Hold / Negatives', focus: 'Pull' },
      { name: 'Speed Skaters',        focus: 'Legs' },
      { name: 'Bicycle Crunches',     focus: 'Core' },
    ]
  },
  {
    id: 6, name: 'Gauntlet', level: 'Advanced', totalMin: 13,
    desc: 'Maximum output — every rep counts',
    exercises: [
      { name: 'Diamond Push-Ups',     focus: 'Push' },
      { name: 'Wide Pull-Up Hold',    focus: 'Pull' },
      { name: 'Box Jump (or Tuck Jump)', focus: 'Legs' },
      { name: 'V-Ups',               focus: 'Core' },
    ]
  },
  {
    id: 7, name: 'Wrecker', level: 'Advanced', totalMin: 13,
    desc: 'Posterior chain + pressing — brutal combination',
    exercises: [
      { name: 'Handstand Push-Up Negative', focus: 'Push' },
      { name: 'Towel Row',           focus: 'Pull' },
      { name: 'Single-Leg Glute Bridge', focus: 'Legs' },
      { name: 'Ab Wheel Rollout',    focus: 'Core' },
    ]
  },
  {
    id: 8, name: 'Storm', level: 'Advanced', totalMin: 13,
    desc: 'Cardio-strength fusion — heart rate stays high',
    exercises: [
      { name: 'Burpee Push-Up',       focus: 'Push' },
      { name: 'Renegade Row (DB)',     focus: 'Pull' },
      { name: 'Lateral Bounds',       focus: 'Legs' },
      { name: 'Plank to Down-Dog',    focus: 'Core' },
    ]
  },
  {
    id: 9, name: 'Forge', level: 'Intermediate', totalMin: 13,
    desc: 'Controlled power — quality movement at high intensity',
    exercises: [
      { name: 'Archer Push-Up',       focus: 'Push' },
      { name: 'Face Pull (Band)',      focus: 'Pull' },
      { name: 'Walking Lunges',       focus: 'Legs' },
      { name: 'Pallof Press (Band)',   focus: 'Core' },
    ]
  },
  {
    id: 10, name: 'Recover', level: 'Beginner', totalMin: 13,
    desc: 'Active recovery — low impact, all four patterns',
    exercises: [
      { name: 'Wall Push-Ups',        focus: 'Push' },
      { name: 'Cat-Cow + Superman',   focus: 'Pull' },
      { name: 'Slow Bodyweight Squats', focus: 'Legs' },
      { name: 'Bird Dog',             focus: 'Core' },
    ]
  },
];

/* ── RENDER TABATA SELECTOR ── */
function renderTabataSelector(c) {
  const cards = TABATA_WORKOUTS.map(w => {
    const levelColor = w.level === 'Beginner' ? '#2ecc71' : w.level === 'Intermediate' ? '#f1c40f' : '#e74c3c';
    return `
      <div class="tabata-card" onclick="showTabataDetail(${w.id}, '${c.id}')">
        <div class="tabata-card-num">// ${String(w.id).padStart(2,'0')}</div>
        <div class="tabata-card-name">${w.name}</div>
        <div class="tabata-card-meta" style="color:${levelColor}">${w.level} · ${w.totalMin} min</div>
        <div class="tabata-card-meta" style="margin-top:4px">${w.desc}</div>
        <div class="tabata-card-exercises">
          ${w.exercises.map(e => `<span class="tabata-ex-pill" style="color:var(--accent);opacity:.8">${e.focus}</span>`).join('')}
        </div>
      </div>`;
  }).join('');

  return `
    <div id="tabataSelectorView">
      <div class="panel-title">Tabata Workouts</div>
      <p class="panel-desc">Push → Pull → Legs → Core · 40s work · 20s rest · 3 cycles · ~13 min. Select a workout to begin.</p>
      <div class="tabata-grid">${cards}</div>
    </div>
    <div class="tabata-detail" id="tabataDetailView"></div>`;
}

function showTabataDetail(workoutId, cid) {
  const w = TABATA_WORKOUTS.find(x => x.id === workoutId);
  if (!w) return;
  const c = CLIENTS.find(cl => cl.id === cid);
  const accent = c?.accent || '#ff6b35';
  const levelColor = w.level === 'Beginner' ? '#2ecc71' : w.level === 'Intermediate' ? '#f1c40f' : '#e74c3c';
  const focusColors = { Push: '#ff6b35', Pull: '#3498db', Legs: '#e8ff47', Core: '#2ecc71' };
  const previewRows = w.exercises.map((ex, i) => `
    <div class="tabata-round-row">
      <div class="tabata-round-num" style="color:${focusColors[ex.focus] || 'var(--muted)'}">
        ${ex.focus}
      </div>
      <div class="tabata-round-ex">${ex.name}</div>
      <div class="tabata-round-timing">× 3 cycles</div>
    </div>`).join('');

  // Build cycle preview rows
  const cycleRows = [1,2,3].map(cycle => `
    <div class="tabata-round-row" style="background:${cycle===1?'rgba(255,255,255,.02)':''}">
      <div class="tabata-round-num">Cycle ${cycle}</div>
      <div class="tabata-round-ex" style="font-size:12px;color:var(--muted)">
        ${w.exercises.map(e => `<span style="color:${focusColors[e.focus]};margin-right:10px">${e.focus}</span>`).join('')}
      </div>
      <div class="tabata-round-timing">${cycle < 3 ? '+ 15s rest' : 'Finish'}</div>
    </div>`).join('');

  document.getElementById('tabataSelectorView').style.display = 'none';
  const detail = document.getElementById('tabataDetailView');
  detail.className = 'tabata-detail active';
  detail.innerHTML = `
    <div class="tabata-detail-header">
      <button class="tabata-back-btn" onclick="tabataBackToList()">← Back</button>
      <div>
        <div class="tabata-detail-title">${w.name}</div>
        <div class="tabata-detail-sub"><span style="color:${levelColor}">${w.level}</span> · ~${w.totalMin} min · 4 exercises · 3 cycles · 12 total rounds</div>
      </div>
    </div>
    <div class="block-label" style="padding:14px 18px 8px">Exercises</div>
    <div class="tabata-structure" style="margin-bottom:12px">${previewRows}</div>
    <div class="block-label" style="padding:6px 18px 8px">Cycle Structure</div>
    <div class="tabata-structure" style="margin-bottom:16px">${cycleRows}</div>
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px 18px;margin-bottom:16px;">
      <div class="block-label">How it works</div>
      <ul class="tip-list">
        <li>30-second get-ready countdown, then the first cycle begins</li>
        <li>Cycle through Push → Pull → Legs → Core — each 40 seconds full effort</li>
        <li>20 seconds rest between every exercise</li>
        <li>15 seconds transition rest between each of the 3 cycles</li>
        <li>Hit pause any time — the timer freezes until you're ready to go again</li>
      </ul>
    </div>
    <button class="tabata-start-btn" onclick="tabataUnlockAudio();tabataStart(${w.id}, '${cid}')">Start ${w.name}</button>`;
}

function tabataBackToList() {
  document.getElementById('tabataSelectorView').style.display = '';
  const detail = document.getElementById('tabataDetailView');
  detail.className = 'tabata-detail';
  detail.innerHTML = '';
}

/* ── TABATA TIMER ENGINE ── */

/* ══════════════════════════════════════════════════════════════
   TABATA AUDIO + HAPTIC ENGINE
   - Web Audio API pure synthesis (no files needed)
   - Vibration API for haptic feedback
   - Distinct sounds: work start, rest start, countdown beeps,
     cycle complete, workout complete
══════════════════════════════════════════════════════════════ */

function tabataAudioCtx() {
  try {
    if (!AppState.tabataAudioCtx) {
      AppState.tabataAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume if suspended (needed after user gesture on iOS)
    if (AppState.tabataAudioCtx && AppState.tabataAudioCtx.state === 'suspended') {
      AppState.tabataAudioCtx.resume().catch(() => {});
    }
    return AppState.tabataAudioCtx;
  } catch (e) {
    console.warn('Audio context not available:', e);
    return null;
  }
}

function tabataBeep(freq, duration, type, gainVal, delay) {
  var ctx = tabataAudioCtx();
  if (!ctx) return;
  var t   = ctx.currentTime + (delay || 0);
  var osc = ctx.createOscillator();
  var g   = ctx.createGain();
  osc.connect(g);
  g.connect(ctx.destination);
  osc.type      = type || 'sine';
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gainVal || 0.4, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.start(t);
  osc.stop(t + duration + 0.01);
}

// 3-2-1 countdown beeps (low ticks)
function tabataSoundCountdown() {
  tabataBeep(440, 0.08, 'square', 0.3, 0.0);
}

// Work start — punchy double beep
function tabataSoundWorkStart() {
  tabataBeep(880, 0.12, 'square', 0.5, 0.0);
  tabataBeep(1100, 0.18, 'square', 0.4, 0.14);
  tabataVibrate([60, 30, 80]);
}

// Rest start — soft descending tone
function tabataSoundRestStart() {
  tabataBeep(660, 0.08, 'sine', 0.35, 0.0);
  tabataBeep(440, 0.25, 'sine', 0.25, 0.10);
  tabataVibrate([40]);
}

// Cycle complete — ascending 3-tone
function tabataSoundCycleComplete() {
  tabataBeep(440, 0.12, 'sine', 0.4, 0.0);
  tabataBeep(660, 0.12, 'sine', 0.4, 0.15);
  tabataBeep(880, 0.30, 'sine', 0.45, 0.30);
  tabataVibrate([60, 40, 60, 40, 120]);
}

// Workout complete — triumphant arpeggio
function tabataSoundComplete() {
  [440, 550, 660, 880].forEach(function(f, i) {
    tabataBeep(f, 0.25, 'sine', 0.4, i * 0.18);
  });
  tabataVibrate([80, 50, 80, 50, 80, 50, 200]);
}

function tabataVibrate(pattern) {
  if (navigator.vibrate) {
    try { navigator.vibrate(pattern); } catch(e) {}
  }
}

function tabataSoundForSegment(seg, timeLeft) {
  var isLastSecond = timeLeft === 1;
  var isCountdown  = timeLeft <= 3 && timeLeft > 0;

  if (isLastSecond) return; // silence on last tick — transition sound fires instead

  if (seg.type === 'work') {
    // Tick on every second in the last 3s
    if (isCountdown) tabataSoundCountdown();
  } else if (seg.type === 'rest' || seg.type === 'between') {
    if (isCountdown) tabataSoundCountdown();
  } else if (seg.type === 'warmup') {
    if (isCountdown) tabataSoundCountdown();
  }
}

function tabataSoundOnAdvance(prevSeg, nextSeg) {
  if (!nextSeg) {
    tabataSoundComplete();
    return;
  }
  if (nextSeg.type === 'work') {
    tabataSoundWorkStart();
  } else if (nextSeg.type === 'between') {
    tabataSoundCycleComplete();
  } else if (nextSeg.type === 'rest') {
    tabataSoundRestStart();
  } else if (nextSeg.type === 'warmup') {
    // nothing
  }
}

function tabataUnlockAudio() {
  // Call on first user gesture to unlock AudioContext on iOS/Safari
  var ctx = tabataAudioCtx();
  if (ctx) {
    // Play silent buffer to unlock
    var buf = ctx.createBuffer(1, 1, 22050);
    var src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
  }
}

function tabataStart(workoutId, cid) {
  const w = TABATA_WORKOUTS.find(x => x.id === workoutId);
  const c = cid ? getAllClients().find(cl => cl.id === cid) : null;
  if (!w || !w.exercises || w.exercises.length === 0) return;

  // Build the full sequence: Push → Pull → Legs → Core × 3 cycles
  const NUM_CYCLES = 3;
  const sequence = [];
  const focusColors = { Push: '#ff6b35', Pull: '#3498db', Legs: '#e8ff47', Core: '#2ecc71' };

  // 15s warmup
  sequence.push({
    type: 'warmup', label: 'Get Ready', duration: 15,
    exercise: w.exercises[0].name, next: w.exercises[0].name,
    focus: w.exercises[0].focus
  });

  for (let cycle = 1; cycle <= NUM_CYCLES; cycle++) {
    w.exercises.forEach((ex, ei) => {
      const isLastInCycle = ei === w.exercises.length - 1;
      const isLastCycle = cycle === NUM_CYCLES;
      const nextEx = !isLastInCycle ? w.exercises[ei + 1] : (cycle < NUM_CYCLES ? w.exercises[0] : null);

      // Work interval
      sequence.push({
        type: 'work', label: 'Work', duration: 40,
        exercise: ex.name, focus: ex.focus,
        round: ei + 1, totalRounds: w.exercises.length,
        cycle, totalCycles: NUM_CYCLES,
        next: nextEx ? `Next: ${nextEx.name}` : 'Last round!',
        exIdx: ei, exTotal: w.exercises.length,
        phaseColor: focusColors[ex.focus] || 'var(--accent)'
      });

      // Rest interval
      const isAbsoluteLast = isLastInCycle && isLastCycle;
      if (!isAbsoluteLast) {
        const restDuration = isLastInCycle ? 15 : 20; // shorter between cycles
        const restType = isLastInCycle ? 'between' : 'rest';
        const restLabel = isLastInCycle ? `Cycle ${cycle} Done` : 'Rest';
        sequence.push({
          type: restType, label: restLabel, duration: restDuration,
          exercise: isLastInCycle ? '— Recover —' : '— Rest —',
          focus: null,
          round: ei + 1, totalRounds: w.exercises.length,
          cycle, totalCycles: NUM_CYCLES,
          next: nextEx ? `Up next: ${nextEx.name} (${nextEx.focus})` : '',
          exIdx: ei, exTotal: w.exercises.length,
          phaseColor: isLastInCycle ? '#3498db' : '#2ecc71'
        });
      }
    });
  }

  AppState.tabataState = {
    workoutId, cid, c,
    sequence,
    currentIdx: 0,
    timeLeft: sequence[0].duration,
    paused: false,
    interval: null,
    startedAt: Date.now(),
  };

  // Set up UI
  document.documentElement.style.setProperty('--accent', c?.accent || '#ff6b35');
  const tabActiveView   = document.getElementById('tabataActiveView');
  const tabCompleteView = document.getElementById('tabataCompleteView');
  const tabPauseBtn     = safeGetElement('tabataPauseBtn');
  if (tabActiveView)   { tabActiveView.style.display = 'flex'; tabActiveView.style.flexDirection = 'column'; tabActiveView.style.alignItems = 'center'; }
  if (tabCompleteView) tabCompleteView.style.display = 'none';
  if (tabPauseBtn)     { tabPauseBtn.textContent = 'Pause'; tabPauseBtn.classList.remove('paused'); }
  safeGetElement('tabataTimerScreen')?.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Keep screen awake during the timer (auto-reacquires on visibility change)
  if (typeof acquireWakeLock === 'function') acquireWakeLock('tabata');

  tabataRender();
  // Play warmup-start beep
  tabataBeep(550, 0.25, 'sine', 0.35, 0.05);
  tabataVibrate([40, 30, 40]);
  tabataTick();
}

function tabataTick() {
  if (!AppState.tabataState) return;
  if (AppState.tabataState.interval) clearInterval(AppState.tabataState.interval);
  AppState.tabataState.interval = setInterval(() => {
    if (AppState.tabataState.paused) return;
    AppState.tabataState.timeLeft--;
    if (AppState.tabataState.timeLeft <= 0) {
      tabataAdvance();
    } else {
      // Play per-second audio cues
      var seg = AppState.tabataState.sequence[AppState.tabataState.currentIdx];
      tabataSoundForSegment(seg, AppState.tabataState.timeLeft);
      tabataRender();
    }
  }, 1000);
}

function tabataAdvance() {
  if (!AppState.tabataState) return;
  var prevSeg = AppState.tabataState.sequence[AppState.tabataState.currentIdx];
  AppState.tabataState.currentIdx++;
  var nextSeg = AppState.tabataState.sequence[AppState.tabataState.currentIdx] || null;
  // Play transition sound
  tabataSoundOnAdvance(prevSeg, nextSeg);
  if (!nextSeg) {
    tabataComplete();
    return;
  }
  AppState.tabataState.timeLeft = nextSeg.duration;
  tabataRender();
}

function tabataRender() {
  if (!AppState.tabataState) return;
  const seg = AppState.tabataState.sequence[AppState.tabataState.currentIdx];
  const { timeLeft } = AppState.tabataState;
  const circumference = 553;
  const pct = timeLeft / seg.duration;
  const offset = circumference * (1 - pct);
  const accent = AppState.tabataState.c?.accent || '#ff6b35';

  // Phase colors
  const phaseColors = { warmup: '#ffb347', rest: '#2ecc71', between: '#3498db' };
  const phaseColor = seg.phaseColor || phaseColors[seg.type] || accent;

  const phaseEl  = document.getElementById('tabataPhase');
  const ringFill = document.getElementById('tabataRingFill');
  if (phaseEl)  { phaseEl.textContent = seg.label.toUpperCase(); phaseEl.style.color = phaseColor; }
  const exerciseEl = document.getElementById('tabataExercise');
  if (exerciseEl) exerciseEl.textContent = (seg.type === 'rest' || seg.type === 'between') ? '— REST —' : seg.exercise;
  const nextEl = document.getElementById('tabataNext');
  if (nextEl) nextEl.textContent = seg.next ? `Next: ${seg.next}` : '';
  if (ringFill) { ringFill.style.strokeDashoffset = offset; ringFill.style.stroke = phaseColor; }
  const ringNum = document.getElementById('tabataRingNum');
  if (ringNum) ringNum.textContent = timeLeft;

  // Round indicator
  const roundInd = document.getElementById('tabataRoundInd');
  if (roundInd) {
    roundInd.textContent = (seg.cycle && seg.round)
      ? `Cycle ${seg.cycle} of ${seg.totalCycles} · ${seg.focus || 'Rest'}`
      : (seg.type === 'warmup' ? 'Get ready to go!' : '');
  }

  // Progress dots — 4 per cycle, 3 cycle indicators
  const w = TABATA_WORKOUTS.find(x => x.id === AppState.tabataState.workoutId);
  const currentCycle = seg.cycle || 1;
  const currentExIdx = seg.exIdx || 0;
  // Cycle dots (top row)
  const cycleDotsHtml = [1,2,3].map(cy => {
    const isDone = currentCycle > cy || (currentCycle === cy && seg.type === 'between');
    const isActive = currentCycle === cy;
    return `<div class="tabata-dot ${isDone ? 'done' : isActive ? 'active' : ''}" style="width:12px;height:12px"></div>`;
  }).join('');
  // Exercise dots (within cycle)
  const focusColors = { Push: '#ff6b35', Pull: '#3498db', Legs: '#e8ff47', Core: '#2ecc71' };
  const exDotsHtml = w.exercises.map((ex, i) => {
    const isDone = currentExIdx > i || (currentExIdx === i && seg.type !== 'work' && seg.type !== 'warmup');
    const isActive = currentExIdx === i && seg.type === 'work';
    const col = focusColors[ex.focus] || 'var(--accent)';
    return `<div class="tabata-dot ${isDone ? 'done' : isActive ? 'active' : ''}" style="background:${isActive ? col : isDone ? col+'88' : ''}"></div>`;
  }).join('');
  const dotsEl = document.getElementById('tabataDots');
  if (dotsEl) dotsEl.innerHTML = `<div style="display:flex;flex-direction:column;gap:6px;align-items:center"><div style="display:flex;gap:10px;margin-bottom:2px">${cycleDotsHtml}</div><div style="display:flex;gap:8px">${exDotsHtml}</div></div>`;
}

function tabataTogglePause() {
  if (!AppState.tabataState) return;
  AppState.tabataState.paused = !AppState.tabataState.paused;
  const btn      = document.getElementById('tabataPauseBtn');
  const phaseEl  = document.getElementById('tabataPhase');
  if (AppState.tabataState.paused) {
    if (btn) { btn.textContent = 'Resume'; btn.classList.add('paused'); }
    if (phaseEl) { phaseEl.textContent = '— PAUSED —'; phaseEl.style.color = 'var(--muted)'; }
  } else {
    if (btn) { btn.textContent = 'Pause'; btn.classList.remove('paused'); }
    tabataRender();
  }
}

function tabataStop() {
  // Pause immediately so interval doesn't fire during prompt
  const wasPaused = AppState.tabataState?.paused;
  if (AppState.tabataState && !AppState.tabataState.paused) {
    AppState.tabataState.paused = true;
  }
  if (!confirm('End this Tabata workout?')) {
    // Unpause if they cancel and weren't paused before
    if (AppState.tabataState && !wasPaused) AppState.tabataState.paused = false;
    return;
  }
  tabataClose();
}

function tabataComplete() {
  clearInterval(AppState.tabataState.interval);
  const w = TABATA_WORKOUTS.find(x => x.id === AppState.tabataState.workoutId);
  const activeView   = document.getElementById('tabataActiveView');
  const completeView = document.getElementById('tabataCompleteView');
  const completeMsg  = document.getElementById('tabataCompleteMsg');
  if (activeView)   activeView.style.display = 'none';
  if (completeView) completeView.style.display = 'block';
  if (completeMsg)  completeMsg.textContent = `${w.name} complete · 3 cycles · 12 rounds · ${w.totalMin} minutes. Push, Pull, Legs, Core — all done. Serious work.`;
  // Auto-log to fitness log
  if (AppState.tabataState.cid) {
    const logs = getFitnessLogs(AppState.tabataState.cid);
    const estKcal = Math.round(w.totalMin * 12); // ~12 kcal/min for 40/20 Tabata
    logs.push({ date: new Date().toISOString(), calories: estKcal, duration: w.totalMin, type: `Tabata — ${w.name}`, zone: 'Zone 4' });
    saveFitnessLogs(AppState.tabataState.cid, logs);
    if (AppState.currentClient) checkMilestones(AppState.currentClient);
  }
}

function tabataClose() {
  try {
    if (AppState.tabataState?.interval) clearInterval(AppState.tabataState.interval);
    AppState.tabataState = null;
    const timerScreen = safeGetElement('tabataTimerScreen');
    if (timerScreen) timerScreen.classList.remove('open');
    document.body.style.overflow = '';
    if (typeof releaseWakeLock === 'function') releaseWakeLock('tabata');
    // Only reset selector back to list view after workout completes — don't wipe mid-browse
    const selectorEl = safeGetElement('tabataSelectorStandalone');
    if (selectorEl) selectorEl.style.display = '';
    const detailEl = safeGetElement('tabataDetailStandalone');
    if (detailEl) detailEl.innerHTML = '';
  } catch (e) {
    console.error('Error closing tabata:', e);
  }
}


/* ── TABATA STANDALONE SCREEN ── */

function openTabataScreen() {
  // Remember which screen to return to
  const screens = ['login','app','coach'];
  _tabataReturnScreen = screens.find(s => {
    const el = document.getElementById('screen-' + s);
    return el && el.classList.contains('active');
  }) || 'login';

  // Render the selector fresh
  const container = document.getElementById('tabataScreenContent');
  container.innerHTML = renderTabataSelectorStandalone();
  showScreen('tabata');
}

function closeTabataScreen() {
  // Restore accent color for the screen we're returning to
  const returnClient = currentClient;
  if (returnClient) {
    document.documentElement.style.setProperty('--accent', returnClient.accent);
  } else if (_tabataReturnScreen === 'coach') {
    document.documentElement.style.setProperty('--accent', '#e8ff47');
  } else {
    document.documentElement.style.setProperty('--accent', '#ff6b35');
  }
  showScreen(_tabataReturnScreen);
}

function renderTabataSelectorStandalone() {
  const cards = TABATA_WORKOUTS.map(w => {
    const levelColor = w.level === 'Beginner' ? '#2ecc71' : w.level === 'Intermediate' ? '#f1c40f' : '#e74c3c';
    return `
      <div class="tabata-card" onclick="showTabataDetailStandalone(${w.id})">
        <div class="tabata-card-num">// ${String(w.id).padStart(2,'0')}</div>
        <div class="tabata-card-name">${w.name}</div>
        <div class="tabata-card-meta" style="color:${levelColor}">${w.level} · ${w.totalMin} min</div>
        <div class="tabata-card-meta" style="margin-top:4px">${w.desc}</div>
        <div class="tabata-card-exercises">
          ${w.exercises.map(e => `<span class="tabata-ex-pill" style="color:var(--accent);opacity:.8">${e.focus}</span>`).join('')}
        </div>
      </div>`;
  }).join('');

  return `
    <div id="tabataSelectorStandalone">
      <div class="tabata-grid">${cards}</div>
    </div>
    <div id="tabataDetailStandalone"></div>`;
}

function showTabataDetailStandalone(workoutId) {
  const w = TABATA_WORKOUTS.find(x => x.id === workoutId);
  if (!w) return;
  const levelColor = w.level === 'Beginner' ? '#2ecc71' : w.level === 'Intermediate' ? '#f1c40f' : '#e74c3c';
  const focusColors = { Push: '#ff6b35', Pull: '#3498db', Legs: '#e8ff47', Core: '#2ecc71' };

  const previewRows = w.exercises.map((ex, i) => `
    <div class="tabata-round-row">
      <div class="tabata-round-num" style="color:${focusColors[ex.focus] || 'var(--muted)'}">
        ${ex.focus}
      </div>
      <div class="tabata-round-ex">${ex.name}</div>
      <div class="tabata-round-timing">× 3 cycles</div>
    </div>`).join('');

  const cycleRows = [1,2,3].map(cycle => `
    <div class="tabata-round-row">
      <div class="tabata-round-num">Cycle ${cycle}</div>
      <div class="tabata-round-ex" style="font-size:12px;color:var(--muted)">
        ${w.exercises.map(e => `<span style="color:${focusColors[e.focus]};margin-right:10px">${e.focus}</span>`).join('')}
      </div>
      <div class="tabata-round-timing">${cycle < 3 ? '+ 15s rest' : 'Finish'}</div>
    </div>`).join('');

  document.getElementById('tabataSelectorStandalone').style.display = 'none';
  const detail = document.getElementById('tabataDetailStandalone');
  detail.innerHTML = `
    <div class="tabata-detail-header">
      <button class="tabata-back-btn" onclick="tabataBackToListStandalone()">← Back</button>
      <div>
        <div class="tabata-detail-title">${w.name}</div>
        <div class="tabata-detail-sub"><span style="color:${levelColor}">${w.level}</span> · ~${w.totalMin} min · 4 exercises · 3 cycles · 12 total rounds</div>
      </div>
    </div>
    <div class="block-label" style="padding:14px 18px 8px">Exercises</div>
    <div class="tabata-structure" style="margin-bottom:12px">${previewRows}</div>
    <div class="block-label" style="padding:6px 18px 8px">Cycle Structure</div>
    <div class="tabata-structure" style="margin-bottom:16px">${cycleRows}</div>
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px 18px;margin-bottom:16px;">
      <div class="block-label">How it works</div>
      <ul class="tip-list">
        <li>30-second get-ready countdown, then the first cycle begins</li>
        <li>Cycle through Push → Pull → Legs → Core — each 40 seconds full effort</li>
        <li>20 seconds rest between every exercise</li>
        <li>15 seconds transition rest between each of the 3 cycles</li>
        <li>Hit pause any time — the timer freezes until you're ready to go again</li>
      </ul>
    </div>
    <button class="tabata-start-btn" onclick="tabataUnlockAudio();tabataStartStandalone(${w.id})">Start ${w.name}</button>`;
}

function tabataBackToListStandalone() {
  document.getElementById('tabataSelectorStandalone').style.display = '';
  document.getElementById('tabataDetailStandalone').innerHTML = '';
  const content = document.getElementById('tabataScreenContent');
  if (content) content.scrollTop = 0;
}

function tabataStartStandalone(workoutId) {
  // Use current client ID if logged in, otherwise null
  const cid = currentClient?.id || null;
  tabataStart(workoutId, cid);
}


