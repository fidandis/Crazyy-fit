/* ══════════════════════════════════════════════════════════════
   PROGRAM TEMPLATES
══════════════════════════════════════════════════════════════ */
const PROGRAM_TEMPLATES = {
  strength: {
    name: 'Strength / Muscle Gain',
    emoji: '🏋️',
    desc: 'Hypertrophy-focused lifting program',
    accent: '#e8ff47',
    days: [
      { id:'mon', label:'Mon', tag:'Strength', title:'Lower Body A', sub:'Squat focus', exercises:[
        {name:'Barbell Squat',sets:'4 sets',reps:'6–8 reps',rest:'3 min',note:'Primary strength mover. Depth is everything.'},
        {name:'Romanian Deadlift',sets:'3 sets',reps:'10–12 reps',rest:'2 min',note:'Hinge pattern — feel the hamstring stretch.'},
        {name:'Leg Press',sets:'3 sets',reps:'12–15 reps',rest:'90 sec',note:'Higher rep pump work.'},
        {name:'Leg Curl',sets:'3 sets',reps:'12–15 reps',rest:'60 sec',note:'Isolate hamstrings.'},
        {name:'Calf Raise',sets:'4 sets',reps:'15–20 reps',rest:'60 sec',note:'Full ROM — no bouncing.'},
      ]},
      { id:'tue', label:'Tue', tag:'Rest', title:'Rest / Cardio', sub:'Active recovery', exercises:[] },
      { id:'wed', label:'Wed', tag:'Strength', title:'Upper Body A', sub:'Push/Pull', exercises:[
        {name:'Barbell Bench Press',sets:'4 sets',reps:'6–8 reps',rest:'3 min',note:'Control the eccentric. Full press.'},
        {name:'Weighted Pull-Up',sets:'4 sets',reps:'6–8 reps',rest:'3 min',note:'Full hang each rep.'},
        {name:'Overhead Press',sets:'3 sets',reps:'8–10 reps',rest:'2 min',note:'Strict — no leg drive.'},
        {name:'Incline DB Press',sets:'3 sets',reps:'10–12 reps',rest:'90 sec',note:'Upper chest emphasis.'},
        {name:'Cable Row',sets:'3 sets',reps:'10–12 reps',rest:'90 sec',note:'Full retraction.'},
        {name:'Lateral Raise',sets:'4 sets',reps:'15–20 reps',rest:'60 sec',note:'No swinging.'},
      ]},
      { id:'thu', label:'Thu', tag:'Rest', title:'Rest / Cardio', sub:'Active recovery', exercises:[] },
      { id:'fri', label:'Fri', tag:'Strength', title:'Full Body', sub:'Hinge + Core', exercises:[
        {name:'Deadlift',sets:'4 sets',reps:'4–6 reps',rest:'3 min',note:'Heaviest compound — lock in the brace.'},
        {name:'Dumbbell Row',sets:'3 sets',reps:'10 / side',rest:'90 sec',note:'Full range.'},
        {name:'Hip Thrust',sets:'3 sets',reps:'12–15 reps',rest:'90 sec',note:'Squeeze at the top.'},
        {name:'Pallof Press',sets:'3 sets',reps:'10 / side',rest:'60 sec',note:'Anti-rotation core.'},
        {name:'Ab Wheel Rollout',sets:'3 sets',reps:'8–12 reps',rest:'60 sec',note:'Brace hard.'},
      ]},
      { id:'sat', label:'Sat', tag:'Rest', title:'Rest', sub:'Recover', exercises:[] },
      { id:'sun', label:'Sun', tag:'Rest', title:'Rest', sub:'Recover', exercises:[] },
    ]
  },
  weightloss: {
    name: 'Weight Loss',
    emoji: '🔥',
    desc: 'Fat-burning full-body circuit program',
    accent: '#ff6b35',
    days: [
      { id:'mon', label:'Mon', tag:'Strength', title:'Full Body A', sub:'Squat + Push', exercises:[
        {name:'Goblet Squat',sets:'3 sets',reps:'12–15 reps',rest:'90 sec',note:'Chest stays tall.'},
        {name:'Dumbbell Bench Press',sets:'3 sets',reps:'10–12 reps',rest:'90 sec',note:'Control the weight.'},
        {name:'Seated Row',sets:'3 sets',reps:'12 reps',rest:'90 sec',note:'Squeeze shoulder blades.'},
        {name:'Plank',sets:'3 sets',reps:'30–45 sec',rest:'45 sec',note:'Straight line head to heels.'},
      ]},
      { id:'tue', label:'Tue', tag:'Active', title:'Walk', sub:'20–30 min easy', exercises:[] },
      { id:'wed', label:'Wed', tag:'Strength', title:'Full Body B', sub:'Hinge + Pull', exercises:[
        {name:'Romanian Deadlift',sets:'3 sets',reps:'12 reps',rest:'90 sec',note:'Hinge at hips.'},
        {name:'Lat Pulldown',sets:'3 sets',reps:'12 reps',rest:'90 sec',note:'Lead with elbows.'},
        {name:'Leg Press',sets:'3 sets',reps:'15 reps',rest:'90 sec',note:'Full range.'},
        {name:'Hip Thrust',sets:'3 sets',reps:'15 reps',rest:'60 sec',note:'Squeeze at the top.'},
      ]},
      { id:'thu', label:'Thu', tag:'Active', title:'Walk', sub:'20–30 min easy', exercises:[] },
      { id:'fri', label:'Fri', tag:'Strength', title:'Full Body C', sub:'Circuit', exercises:[
        {name:'Dumbbell Squat to Press',sets:'3 rounds',reps:'12 reps',rest:'In circuit',note:'Full body movement.'},
        {name:'Chest-Supported Row',sets:'3 rounds',reps:'12 reps',rest:'In circuit',note:'Chest pinned.'},
        {name:'Step-Up',sets:'3 rounds',reps:'10 / leg',rest:'60 sec',note:'Drive through heel.'},
        {name:'Glute Bridge',sets:'2 sets',reps:'20 reps',rest:'45 sec',note:'Hold at top.'},
      ]},
      { id:'sat', label:'Sat', tag:'Cardio', title:'Long Walk', sub:'40–60 min brisk', exercises:[] },
      { id:'sun', label:'Sun', tag:'Rest', title:'Rest', sub:'Recover', exercises:[] },
    ]
  },
  hybrid: {
    name: 'Hybrid Athlete',
    emoji: '⚡',
    desc: 'Strength + endurance concurrent training',
    accent: '#e8ff47',
    days: [
      { id:'mon', label:'Mon', tag:'Strength', title:'Lower Body', sub:'Squat focus', exercises:[
        {name:'Bulgarian Split Squat',sets:'4 sets',reps:'8–10 / leg',rest:'2 min',note:'Primary quad/glute driver.'},
        {name:'Romanian Deadlift',sets:'3 sets',reps:'10–12 reps',rest:'2 min',note:'Hamstring stretch.'},
        {name:'Leg Press',sets:'3 sets',reps:'12–15 reps',rest:'90 sec',note:'Full depth.'},
        {name:'Ab Wheel Rollout',sets:'3 sets',reps:'8–12 reps',rest:'60 sec',note:'Brace hard.'},
      ]},
      { id:'tue', label:'Tue', tag:'Cardio', title:'Zone 2', sub:'Easy run 45–60 min', exercises:[] },
      { id:'wed', label:'Wed', tag:'Strength', title:'Upper Body', sub:'Push/Pull', exercises:[
        {name:'Barbell Bench Press',sets:'4 sets',reps:'6–8 reps',rest:'3 min',note:'Scapulae retracted.'},
        {name:'Weighted Pull-Up',sets:'4 sets',reps:'6–8 reps',rest:'3 min',note:'Full hang.'},
        {name:'Face Pull',sets:'3 sets',reps:'15–20 reps',rest:'60 sec',note:'Shoulder health.'},
        {name:'EZ-Bar Curl',sets:'3 sets',reps:'10–12 reps',rest:'60 sec',note:'Supinate at top.'},
      ]},
      { id:'thu', label:'Thu', tag:'Hybrid', title:'Tempo + Lifts', sub:'Threshold run + accessory', exercises:[
        {name:'Barbell Hip Thrust',sets:'3 sets',reps:'12–15 reps',rest:'90 sec',note:'Glute emphasis.'},
        {name:"Farmer's Carry",sets:'3 sets',reps:'40 m',rest:'90 sec',note:'Heavy — grip and core.'},
        {name:'Copenhagen Plank',sets:'3 sets',reps:'20–30 sec',rest:'60 sec',note:'Hip stability.'},
      ]},
      { id:'fri', label:'Fri', tag:'Strength', title:'Full Body', sub:'Hinge + Carry', exercises:[
        {name:'Deadlift',sets:'4 sets',reps:'4–6 reps',rest:'3 min',note:'80–85% 1RM.'},
        {name:'Overhead Press',sets:'3 sets',reps:'8–10 reps',rest:'2 min',note:'Strict.'},
        {name:'Pallof Press',sets:'3 sets',reps:'10 / side',rest:'60 sec',note:'Anti-rotation.'},
      ]},
      { id:'sat', label:'Sat', tag:'Endurance', title:'Long Effort', sub:'Zone 2 60–90 min', exercises:[] },
      { id:'sun', label:'Sun', tag:'Rest', title:'Rest', sub:'Recover', exercises:[] },
    ]
  },
  general: {
    name: 'General Fitness',
    emoji: '💪',
    desc: 'Beginner-friendly 3-day full-body program',
    accent: '#2ecc71',
    days: [
      { id:'mon', label:'Mon', tag:'Training', title:'Full Body A', sub:'Beginner circuit', exercises:[
        {name:'Goblet Squat',sets:'3 sets',reps:'10–12 reps',rest:'90 sec',note:'Sit back and down.'},
        {name:'Push-Up',sets:'3 sets',reps:'8–15 reps',rest:'60 sec',note:'Modify if needed.'},
        {name:'Dumbbell Row',sets:'3 sets',reps:'10 / side',rest:'60 sec',note:'Chest supported.'},
        {name:'Plank',sets:'3 sets',reps:'20–30 sec',rest:'45 sec',note:'Breathe steadily.'},
      ]},
      { id:'tue', label:'Tue', tag:'Rest', title:'Rest', sub:'Walk if feeling good', exercises:[] },
      { id:'wed', label:'Wed', tag:'Training', title:'Full Body B', sub:'Strength + cardio', exercises:[
        {name:'Dumbbell Lunge',sets:'3 sets',reps:'10 / leg',rest:'90 sec',note:'Upright torso.'},
        {name:'Dumbbell Press',sets:'3 sets',reps:'10–12 reps',rest:'90 sec',note:'Control down.'},
        {name:'Lat Pulldown',sets:'3 sets',reps:'12 reps',rest:'90 sec',note:'Lead with elbows.'},
        {name:'Dead Bug',sets:'2 sets',reps:'8 / side',rest:'45 sec',note:'Back pressed down.'},
      ]},
      { id:'thu', label:'Thu', tag:'Rest', title:'Rest', sub:'Active recovery', exercises:[] },
      { id:'fri', label:'Fri', tag:'Training', title:'Full Body C', sub:'Metabolic finish', exercises:[
        {name:'Bodyweight Squat',sets:'3 sets',reps:'15 reps',rest:'60 sec',note:'Full depth.'},
        {name:'Incline Push-Up',sets:'3 sets',reps:'12 reps',rest:'60 sec',note:'Progress to flat.'},
        {name:'Hip Thrust',sets:'3 sets',reps:'15 reps',rest:'60 sec',note:'Squeeze at top.'},
        {name:'Glute Bridge',sets:'2 sets',reps:'20 reps',rest:'45 sec',note:'Hold 2 sec.'},
      ]},
      { id:'sat', label:'Sat', tag:'Cardio', title:'Easy Cardio', sub:'Walk 30–45 min', exercises:[] },
      { id:'sun', label:'Sun', tag:'Rest', title:'Rest', sub:'Recover', exercises:[] },
    ]
  },
  bodybuilder: {
    name: 'Bodybuilder',
    emoji: '🥇',
    desc: 'PPL x2 — Push · Pull · Legs · Push · Pull · Legs · Rest',
    accent: '#9b59b6',
    days: [
      { id:'mon', label:'Mon', tag:'Push', title:'Push A', sub:'Chest + Shoulders + Tris', exercises:[
        {name:'Barbell Bench Press',sets:'4 sets',reps:'6-8 reps',rest:'3 min',note:'Primary chest mover. Control the eccentric.'},
        {name:'Incline DB Press',sets:'3 sets',reps:'10-12 reps',rest:'90 sec',note:'Upper chest emphasis.'},
        {name:'Cable Fly',sets:'3 sets',reps:'12-15 reps',rest:'60 sec',note:'Squeeze hard at peak contraction.'},
        {name:'Overhead Press',sets:'4 sets',reps:'8-10 reps',rest:'2 min',note:'Strict — no leg drive.'},
        {name:'Lateral Raise',sets:'4 sets',reps:'15-20 reps',rest:'60 sec',note:'Side delts — slight bend in elbow.'},
        {name:'Tricep Pushdown',sets:'3 sets',reps:'12-15 reps',rest:'60 sec',note:'Elbows locked at sides.'},
        {name:'Skull Crusher',sets:'3 sets',reps:'10-12 reps',rest:'60 sec',note:'Full extension — feel the stretch.'},
      ]},
      { id:'tue', label:'Tue', tag:'Pull', title:'Pull A', sub:'Back + Biceps', exercises:[
        {name:'Deadlift',sets:'4 sets',reps:'5-6 reps',rest:'3 min',note:'Heavy and controlled. Brace hard.'},
        {name:'Weighted Pull-Up',sets:'4 sets',reps:'6-8 reps',rest:'2 min',note:'Full hang each rep.'},
        {name:'Barbell Row',sets:'3 sets',reps:'8-10 reps',rest:'2 min',note:'Drive elbows back.'},
        {name:'Cable Row',sets:'3 sets',reps:'10-12 reps',rest:'90 sec',note:'Full retraction at end.'},
        {name:'Face Pull',sets:'3 sets',reps:'15-20 reps',rest:'60 sec',note:'Shoulder health — never skip this.'},
        {name:'EZ-Bar Curl',sets:'3 sets',reps:'10-12 reps',rest:'60 sec',note:'Supinate at the top.'},
        {name:'Hammer Curl',sets:'3 sets',reps:'12 reps',rest:'60 sec',note:'Brachialis focus.'},
      ]},
      { id:'wed', label:'Wed', tag:'Legs', title:'Legs A', sub:'Quad focus + posterior chain', exercises:[
        {name:'Barbell Squat',sets:'4 sets',reps:'6-8 reps',rest:'3 min',note:'Deep squat — break parallel.'},
        {name:'Leg Press',sets:'4 sets',reps:'10-12 reps',rest:'2 min',note:'Full range — do not lock out.'},
        {name:'Romanian Deadlift',sets:'3 sets',reps:'10-12 reps',rest:'2 min',note:'Hinge at hips — feel hamstring stretch.'},
        {name:'Leg Extension',sets:'3 sets',reps:'15 reps',rest:'60 sec',note:'Quad isolation — pause at top.'},
        {name:'Leg Curl',sets:'3 sets',reps:'12-15 reps',rest:'60 sec',note:'Hamstring isolation.'},
        {name:'Standing Calf Raise',sets:'5 sets',reps:'15-20 reps',rest:'60 sec',note:'Full ROM — stretch at bottom.'},
      ]},
      { id:'thu', label:'Thu', tag:'Push', title:'Push B', sub:'Chest + Shoulders + Tris (volume)', exercises:[
        {name:'Incline Barbell Press',sets:'4 sets',reps:'8-10 reps',rest:'2 min',note:'Upper chest emphasis today.'},
        {name:'DB Bench Press',sets:'3 sets',reps:'10-12 reps',rest:'90 sec',note:'Full stretch at bottom.'},
        {name:'Dips',sets:'3 sets',reps:'10-15 reps',rest:'90 sec',note:'Lean forward for chest emphasis.'},
        {name:'DB Shoulder Press',sets:'3 sets',reps:'12 reps',rest:'90 sec',note:'Seated — full overhead.'},
        {name:'Rear Delt Fly',sets:'3 sets',reps:'15 reps',rest:'60 sec',note:'Bent over — squeeze at the back.'},
        {name:'Tricep Overhead Extension',sets:'3 sets',reps:'12 reps',rest:'60 sec',note:'Long head stretch.'},
        {name:'Cable Lateral Raise',sets:'3 sets',reps:'15 reps',rest:'60 sec',note:'Constant tension on side delt.'},
      ]},
      { id:'fri', label:'Fri', tag:'Pull', title:'Pull B', sub:'Back width + arms (volume)', exercises:[
        {name:'Lat Pulldown',sets:'4 sets',reps:'10-12 reps',rest:'90 sec',note:'Lead with elbows — lats only.'},
        {name:'Seated Cable Row',sets:'4 sets',reps:'10-12 reps',rest:'90 sec',note:'Full retraction — hold 1 sec.'},
        {name:'Single Arm DB Row',sets:'3 sets',reps:'12 / side',rest:'60 sec',note:'Full stretch at bottom.'},
        {name:'Straight Arm Pulldown',sets:'3 sets',reps:'15 reps',rest:'60 sec',note:'Pure lat isolation.'},
        {name:'Incline DB Curl',sets:'3 sets',reps:'12 reps',rest:'60 sec',note:'Full stretch — do not swing.'},
        {name:'Concentration Curl',sets:'3 sets',reps:'12 reps',rest:'60 sec',note:'Squeeze hard at the top.'},
        {name:'Reverse Curl',sets:'2 sets',reps:'12 reps',rest:'60 sec',note:'Forearm and brachialis work.'},
      ]},
      { id:'sat', label:'Sat', tag:'Legs', title:'Legs B', sub:'Glute + hamstring focus', exercises:[
        {name:'Bulgarian Split Squat',sets:'4 sets',reps:'10 / leg',rest:'2 min',note:'Primary glute and quad driver.'},
        {name:'Hip Thrust',sets:'4 sets',reps:'12-15 reps',rest:'90 sec',note:'Squeeze glutes hard — hold at top.'},
        {name:'Hack Squat',sets:'3 sets',reps:'10-12 reps',rest:'2 min',note:'Quad sweep emphasis.'},
        {name:'Seated Leg Curl',sets:'4 sets',reps:'12-15 reps',rest:'60 sec',note:'Hamstring isolation — full stretch.'},
        {name:'Glute Kickback',sets:'3 sets',reps:'15 / side',rest:'60 sec',note:'Cable or machine — squeeze at top.'},
        {name:'Seated Calf Raise',sets:'5 sets',reps:'15-20 reps',rest:'60 sec',note:'Soleus focus — slow and controlled.'},
      ]},
      { id:'sun', label:'Sun', tag:'Rest', title:'Rest', sub:'Recover — eat, sleep, repeat', exercises:[] },
    ]
  },
  custom: {
    name: 'Custom Program',
    emoji: '✏️',
    desc: 'Build from scratch — you define every day',
    accent: '#3498db',
    days: [
      { id:'mon', label:'Mon', tag:'Training', title:'Day 1', sub:'Custom', exercises:[] },
      { id:'tue', label:'Tue', tag:'Rest', title:'Rest', sub:'', exercises:[] },
      { id:'wed', label:'Wed', tag:'Training', title:'Day 2', sub:'Custom', exercises:[] },
      { id:'thu', label:'Thu', tag:'Rest', title:'Rest', sub:'', exercises:[] },
      { id:'fri', label:'Fri', tag:'Training', title:'Day 3', sub:'Custom', exercises:[] },
      { id:'sat', label:'Sat', tag:'Rest', title:'Rest', sub:'', exercises:[] },
      { id:'sun', label:'Sun', tag:'Rest', title:'Rest', sub:'', exercises:[] },
    ]
  }
};

/* ══════════════════════════════════════════════════════════════
   ONBOARDING STATE + DRAFT PERSISTENCE
══════════════════════════════════════════════════════════════ */
const OB_DRAFT_KEY = '_ob_draft';

function _obDraftSave() {
  try {
    const s = AppState.obState;
    if (!s || s.editId) return; // Don't auto-persist edit-mode drafts
    localStorage.setItem(OB_DRAFT_KEY, JSON.stringify(s));
  } catch {}
}
function _obDraftLoad() {
  try { return JSON.parse(localStorage.getItem(OB_DRAFT_KEY) || 'null'); } catch { return null; }
}
function _obDraftClear() { try { localStorage.removeItem(OB_DRAFT_KEY); } catch {} }
function _obDraftHasContent(d) {
  if (!d) return false;
  return !!(d.name && d.name.trim()) || !!d.programType || !!(d.goal && d.goal.trim());
}

// Infer program type from free-text goal; returns key or null
function _obInferProgramType(goalText) {
  const t = (goalText || '').toLowerCase();
  if (!t.trim()) return null;
  if (/(lose|cut|lean|fat loss|slim|deficit|shred)/.test(t)) return 'weightloss';
  if (/(5k|10k|marathon|run|endurance|triathlon|hybrid|hyrox)/.test(t)) return 'hybrid';
  if (/(bodybuild|physique|aesthetic|symmetry|contest|ppl|push pull)/.test(t)) return 'bodybuilder';
  if (/(bulk|mass|size|gain|muscle|hypertrophy|build|grow|strong)/.test(t)) return 'strength';
  return null;
}

// PIN + name collision helpers
function _obPinInUse(pin, exceptId) {
  try {
    return getAllClients().some(c => {
      if (exceptId && c.id === exceptId) return false;
      return c.pin === pin; // exact match on plain PIN (legacy) or hash unlikely to collide
    });
  } catch { return false; }
}
function _obNameConflict(name, exceptId) {
  if (!name || !name.trim()) return null;
  const lower = name.trim().toLowerCase();
  try {
    const hits = getAllClients().filter(c => (c.name || '').trim().toLowerCase() === lower && c.id !== exceptId);
    return hits[0] || null;
  } catch { return null; }
}

// Training days count in a template (how many days have exercises)
function _obTemplateTrainingDays(key) {
  const tpl = PROGRAM_TEMPLATES[key];
  if (!tpl) return 0;
  return tpl.days.filter(d => d.exercises && d.exercises.length > 0).length;
}

// Collect known exercises from all templates + this coach's existing clients.
// Returns a map: name → representative exercise object (first seen wins).
function _obExerciseLibraryMap() {
  const map = new Map();
  const take = (e) => {
    if (!e || !e.name) return;
    if (!map.has(e.name)) map.set(e.name, { name: e.name, sets: e.sets || '3 sets', reps: e.reps || '10-12 reps', rest: e.rest || '90 sec', note: e.note || '' });
  };
  Object.values(PROGRAM_TEMPLATES).forEach(tpl => {
    (tpl.days || []).forEach(d => (d.exercises || []).forEach(take));
  });
  try {
    (getAllClients() || []).forEach(c => {
      const days = c?._meta?.days || [];
      days.forEach(d => (d.exercises || []).forEach(take));
    });
  } catch {}
  return map;
}
function _obExerciseLibrary() { return Array.from(_obExerciseLibraryMap().keys()).sort((a,b)=>a.localeCompare(b)); }

function startOnboarding(editClientId) {
  const isEdit = !!editClientId;
  let existing = null;
  if (isEdit) {
    existing = getAllClients().find(c => c.id === editClientId);
  }

  // If not editing and a draft exists, offer to resume
  let draft = null;
  if (!isEdit) {
    const d = _obDraftLoad();
    if (_obDraftHasContent(d) && confirm('Resume your unfinished draft for "' + (d.name || 'unnamed client') + '"?')) {
      draft = d;
    } else if (d) {
      _obDraftClear();
    }
  }

  AppState.obState = draft || {
    step: 0,
    editId: editClientId || null,
    name: existing?.name || '',
    goal: existing?.goal || '',
    experience: existing?._meta?.experience || 'Beginner',
    trainingDays: existing?._meta?.trainingDays || 3,
    startWeight: existing?.weightLoss?.start || '',
    goalWeight: existing?.weightLoss?.goal || '',
    programType: existing?._meta?.programType || null,
    pin: existing?.pin || generatePIN(),
    accent: existing?.accent || '#ff6b35',
    days: existing?._meta?.days ? JSON.parse(JSON.stringify(existing._meta.days)) : null,
    editDay: 0,
    activityLevel: existing?._meta?.activityLevel || 'moderate',
    goalType: existing?._meta?.goalType || '',
    age: existing?._meta?.age || '',
    sex: existing?._meta?.sex || 'male',
    heightFt: existing?._meta?.heightFt || '',
    heightIn: existing?._meta?.heightIn || '0',
    weightLbs: existing?._meta?.weightLbs || '',
    sfBicep: existing?._meta?.sfBicep || '',
    sfTricep: existing?._meta?.sfTricep || '',
    sfSuprailiac: existing?._meta?.sfSuprailiac || '',
    sfSubscap: existing?._meta?.sfSubscap || '',
    // NEW: direct BF% input mode (alternative to skinfold test)
    bfMode: existing?._meta?.bfMode || 'skinfold',
    bfPctDirect: existing?._meta?.bodyFatPct || '',
    email: existing?._meta?.email || '',
    address: existing?._meta?.address || '',
    emailCredentialsOnSave: true,
  };
  if (!AppState.obState.editId) AppState.obState.editId = editClientId || null;

  document.getElementById('onboardHeaderTitle').textContent = isEdit ? `Edit ${existing?.name || 'Client'}` : 'New Client';
  document.documentElement.style.setProperty('--accent', '#e8ff47');
  showScreen('onboard');
  renderOnboardStep(draft ? (draft.step || 0) : 0);
}

function generatePIN() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function onboardBack() {
  if (AppState.obState.step === 0) {
    if (!AppState.obState.editId && _obDraftHasContent(AppState.obState)) {
      if (!confirm('Discard this client? Unsaved progress will be kept as a draft.')) return;
    }
    document.documentElement.style.setProperty('--accent', '#e8ff47');
    showScreen('coach');
  } else {
    renderOnboardStep(AppState.obState.step - 1);
  }
}

function renderOnboardStep(step) {
  AppState.obState.step = step;
  _obDraftSave();
  // Update dots
  const labels = ['Profile', 'Program', 'Workouts'];
  [0,1,2].forEach(i => {
    const dot = document.getElementById('sdot-' + i);
    if (!dot) return;
    dot.className = 'onboard-step-dot' + (i < step ? ' done' : i === step ? ' active' : '');
    dot.title = labels[i];
    dot.setAttribute('data-step-label', labels[i]);
  });
  const content = document.getElementById('onboardContent');
  if (step === 0) content.innerHTML = renderObStep0();
  if (step === 1) content.innerHTML = renderObStep1();
  if (step === 2) content.innerHTML = renderObStep2();
  content.scrollTop = 0;
}

/* ── STEP 0: Profile ── */
function renderObStep0() {
  const isWeightLoss = AppState.obState.programType === 'weightloss' || AppState.obState.goal.toLowerCase().includes('weight') || AppState.obState.goal.toLowerCase().includes('loss');
  const nameDup = _obNameConflict(AppState.obState.name, AppState.obState.editId);
  const nameDupHtml = nameDup ? `<div class="ob-warn" id="ob-name-warn" style="color:#f5a524;font-family:'DM Mono',monospace;font-size:10px;margin-top:6px;letter-spacing:.5px">Heads up — you already have a client named "${esc(nameDup.name)}".</div>` : `<div class="ob-warn" id="ob-name-warn" style="display:none"></div>`;
  return `
    <div class="onboard-step active">
      <div class="onboard-step-title">Client Profile</div>
      <div class="onboard-step-sub">Step 1 of 3 — Basic info and login credentials</div>

      <div class="ob-field">
        <label class="ob-label">Client Name</label>
        <input class="ob-input" id="ob-name" type="text" placeholder="e.g. Alex Johnson" value="${esc(AppState.obState.name)}" oninput="AppState.obState.name=this.value;obNameCheck();_obDraftSave()">
        <div class="ob-err" id="ob-name-err" style="display:none;color:#e74c3c;font-family:'DM Mono',monospace;font-size:10px;margin-top:6px;letter-spacing:.5px">Client name is required</div>
        ${nameDupHtml}
      </div>

      <div class="ob-field">
        <label class="ob-label">Goal</label>
        <input class="ob-input" id="ob-goal" type="text" placeholder="e.g. Lose 20 lbs, Build muscle, Run 5K" value="${esc(AppState.obState.goal)}" oninput="AppState.obState.goal=this.value;_obDraftSave()">
      </div>

      <div class="ob-input-row">
        <div class="ob-field">
          <label class="ob-label">Experience Level</label>
          <select class="ob-select" onchange="AppState.obState.experience=this.value;_obDraftSave()">
            <option value="Beginner" ${AppState.obState.experience==='Beginner'?'selected':''}>Beginner</option>
            <option value="Intermediate" ${AppState.obState.experience==='Intermediate'?'selected':''}>Intermediate</option>
            <option value="Advanced" ${AppState.obState.experience==='Advanced'?'selected':''}>Advanced</option>
          </select>
        </div>
        <div class="ob-field">
          <label class="ob-label">Training Days/Week</label>
          <select class="ob-select" onchange="AppState.obState.trainingDays=parseInt(this.value);_obDraftSave()">
            ${[3,4,5,6].map(n=>`<option value="${n}" ${AppState.obState.trainingDays===n?'selected':''}>${n} days</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="ob-field" id="ob-weight-section" style="${isWeightLoss?'':'display:none'}">
        <label class="ob-label">Weight Loss Details</label>
        <div class="ob-input-row">
          <input class="ob-input" type="number" placeholder="Start weight (lbs)" value="${AppState.obState.startWeight}" oninput="AppState.obState.startWeight=parseFloat(this.value)||'';_obDraftSave()">
          <input class="ob-input" type="number" placeholder="Goal weight (lbs)" value="${AppState.obState.goalWeight}" oninput="AppState.obState.goalWeight=parseFloat(this.value)||'';_obDraftSave()">
        </div>
      </div>

      <div class="ob-section-title" style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin:18px 0 10px;padding-bottom:6px;border-bottom:1px solid var(--border)">Body Stats &amp; Nutrition</div>

      <div class="ob-field">
        <label class="ob-label">Activity Level</label>
        <select class="ob-select" onchange="AppState.obState.activityLevel=this.value;obCalcBF();obUpdateMacroPreview();_obDraftSave()">
          <option value="sedentary"   ${AppState.obState.activityLevel==='sedentary'  ?'selected':''}>Sedentary (desk job, no exercise)</option>
          <option value="light"       ${AppState.obState.activityLevel==='light'      ?'selected':''}>Light (1–2 workouts/week)</option>
          <option value="moderate"    ${AppState.obState.activityLevel==='moderate'   ?'selected':''}>Moderate (3–4 workouts/week)</option>
          <option value="active"      ${AppState.obState.activityLevel==='active'     ?'selected':''}>Active (5–6 workouts/week)</option>
          <option value="very_active" ${AppState.obState.activityLevel==='very_active'?'selected':''}>Very Active (athlete, physical job)</option>
        </select>
      </div>

      <div class="ob-section-title" style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin:14px 0 8px;padding-bottom:4px;border-bottom:1px solid var(--border)">Body Measurements</div>

      <div class="ob-input-row">
        <div class="ob-field">
          <label class="ob-label">Age</label>
          <input class="ob-input" type="number" min="16" max="80" placeholder="28" value="${AppState.obState.age}" oninput="AppState.obState.age=this.value;obCalcBF();obUpdateMacroPreview();_obDraftSave()">
        </div>
        <div class="ob-field">
          <label class="ob-label">Sex</label>
          <select class="ob-select" onchange="AppState.obState.sex=this.value;obCalcBF();obUpdateMacroPreview();_obDraftSave()">
            <option value="male" ${AppState.obState.sex==='male'?'selected':''}>Male</option>
            <option value="female" ${AppState.obState.sex==='female'?'selected':''}>Female</option>
          </select>
        </div>
      </div>

      <div class="ob-input-row">
        <div class="ob-field">
          <label class="ob-label">Height</label>
          <div style="display:flex;gap:6px">
            <input class="ob-input" type="number" placeholder="5" style="width:60px" value="${AppState.obState.heightFt}" oninput="AppState.obState.heightFt=this.value;_obDraftSave()">
            <span style="display:flex;align-items:center;color:var(--muted);font-size:13px">ft</span>
            <input class="ob-input" type="number" placeholder="10" style="width:60px" value="${AppState.obState.heightIn}" oninput="AppState.obState.heightIn=this.value;_obDraftSave()">
            <span style="display:flex;align-items:center;color:var(--muted);font-size:13px">in</span>
          </div>
        </div>
        <div class="ob-field">
          <label class="ob-label">Weight (lbs)</label>
          <input class="ob-input" type="number" placeholder="180" value="${AppState.obState.weightLbs}" oninput="AppState.obState.weightLbs=this.value;obUpdateMacroPreview();_obDraftSave()">
        </div>
      </div>

      <div class="ob-section-title" style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin:14px 0 8px;display:flex;justify-content:space-between;align-items:center">
        <span>Body Fat % <span style="color:var(--faint)">(optional)</span></span>
        <div style="display:flex;gap:4px;font-size:8px">
          <button type="button" class="ob-bfmode-btn ${AppState.obState.bfMode!=='direct'?'active':''}" onclick="obSetBFMode('skinfold')" style="background:${AppState.obState.bfMode!=='direct'?'var(--accent)':'var(--surface2)'};color:${AppState.obState.bfMode!=='direct'?'#000':'var(--muted)'};border:1px solid var(--border);padding:5px 10px;border-radius:4px;font-family:'DM Mono',monospace;letter-spacing:1px;cursor:pointer">CALIPER TEST</button>
          <button type="button" class="ob-bfmode-btn ${AppState.obState.bfMode==='direct'?'active':''}" onclick="obSetBFMode('direct')" style="background:${AppState.obState.bfMode==='direct'?'var(--accent)':'var(--surface2)'};color:${AppState.obState.bfMode==='direct'?'#000':'var(--muted)'};border:1px solid var(--border);padding:5px 10px;border-radius:4px;font-family:'DM Mono',monospace;letter-spacing:1px;cursor:pointer">I KNOW IT</button>
        </div>
      </div>
      ${AppState.obState.bfMode === 'direct' ? `
        <div class="ob-field" style="margin-bottom:10px">
          <label class="ob-label">Body Fat %</label>
          <input class="ob-input" type="number" min="3" max="60" step="0.1" placeholder="e.g. 18" value="${AppState.obState.bfPctDirect||''}" oninput="AppState.obState.bfPctDirect=this.value;obCalcBF();_obDraftSave()">
          <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--faint);letter-spacing:1px;margin-top:6px">Enter a known DEXA, InBody, or estimate. Used for lean-mass protein targeting.</div>
        </div>
      ` : `
        <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--faint);letter-spacing:1px;margin-bottom:10px">Durnin-Womersley 4-site · caliper readings in millimetres</div>
        <div class="ob-input-row" style="margin-bottom:8px">
          <div class="ob-field">
            <label class="ob-label">Bicep (mm)</label>
            <input class="ob-input" type="number" min="1" max="60" step="0.5" placeholder="e.g. 8" value="${AppState.obState.sfBicep}" oninput="AppState.obState.sfBicep=this.value;obCalcBF();_obDraftSave()">
          </div>
          <div class="ob-field">
            <label class="ob-label">Tricep (mm)</label>
            <input class="ob-input" type="number" min="1" max="60" step="0.5" placeholder="e.g. 14" value="${AppState.obState.sfTricep}" oninput="AppState.obState.sfTricep=this.value;obCalcBF();_obDraftSave()">
          </div>
        </div>
        <div class="ob-input-row" style="margin-bottom:10px">
          <div class="ob-field">
            <label class="ob-label">Suprailiac (mm)</label>
            <input class="ob-input" type="number" min="1" max="60" step="0.5" placeholder="e.g. 16" value="${AppState.obState.sfSuprailiac}" oninput="AppState.obState.sfSuprailiac=this.value;obCalcBF();_obDraftSave()">
          </div>
          <div class="ob-field">
            <label class="ob-label">Subscapular (mm)</label>
            <input class="ob-input" type="number" min="1" max="60" step="0.5" placeholder="e.g. 18" value="${AppState.obState.sfSubscap}" oninput="AppState.obState.sfSubscap=this.value;obCalcBF();_obDraftSave()">
          </div>
        </div>
      `}
      <div id="ob-bf-result" style="display:none;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:12px 14px;margin-bottom:14px">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div>
            <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:1px">BODY FAT %</div>
            <div id="ob-bf-pct" style="font-family:'Bebas Neue',sans-serif;font-size:36px;letter-spacing:1px;line-height:1"></div>
            <div id="ob-bf-cat" style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:1px;margin-top:2px"></div>
          </div>
          <div style="text-align:right">
            <div id="ob-bf-lean" style="font-family:'DM Mono',monospace;font-size:10px;color:var(--text)"></div>
            <div id="ob-bf-fat" style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted);margin-top:2px"></div>
            <div id="ob-bf-sum" style="font-family:'DM Mono',monospace;font-size:9px;color:var(--faint);margin-top:4px"></div>
          </div>
      <div id="ob-macro-preview" style="display:none;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:14px;margin-bottom:14px"></div>
        </div>
      </div>

      <div class="ob-field">
        <label class="ob-label">Client Email <span style="color:var(--muted);font-size:9px">(optional — for sending credentials)</span></label>
        <input class="ob-input" id="ob-email" type="email" placeholder="client@email.com" value="${esc(AppState.obState.email||'')}" oninput="AppState.obState.email=this.value.trim();_obDraftSave()">
        <div class="ob-err" id="ob-email-err" style="display:none;color:#e74c3c;font-family:'DM Mono',monospace;font-size:10px;margin-top:6px;letter-spacing:.5px">Enter a valid email address</div>
      </div>

      <div class="ob-field">
        <label class="ob-label">Home Address <span style="color:var(--muted);font-size:9px">(optional — for weather-based workout alerts)</span></label>
        <input class="ob-input" id="ob-address" type="text" placeholder="e.g. Austin, TX or 123 Main St, Chicago" value="${esc(AppState.obState.address||'')}" oninput="AppState.obState.address=this.value.trim();_obDraftSave()">
      </div>

      <div class="ob-field">
        <label class="ob-label">Client PIN</label>
        <div class="ob-pin-display">
          <div class="ob-pin-val" id="ob-pin-display">${AppState.obState.pin}</div>
          <div style="display:flex;gap:6px">
            <button type="button" class="ob-pin-regen" onclick="obCopyPin()" title="Copy to clipboard">Copy</button>
            <button type="button" class="ob-pin-regen" onclick="obRegenPin()">Regenerate</button>
          </div>
        </div>
      </div>

      <div class="ob-nav">
        <button class="ob-back-btn" onclick="onboardBack()">← Cancel</button>
        <button class="ob-next-btn" onclick="obNextStep0()">Choose Program →</button>
      </div>
    </div>`;
}

function obSetBFMode(mode) {
  AppState.obState.bfMode = mode;
  _obDraftSave();
  renderOnboardStep(0);
}

function obCopyPin() {
  const pin = AppState.obState.pin;
  const done = () => { try { if (typeof showFitToast === 'function') showFitToast('PIN copied'); } catch {} };
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(pin).then(done).catch(() => { prompt('Copy PIN:', pin); });
    } else { prompt('Copy PIN:', pin); }
  } catch { prompt('Copy PIN:', pin); }
}

function obNameCheck() {
  const warn = document.getElementById('ob-name-warn');
  const err = document.getElementById('ob-name-err');
  const input = document.getElementById('ob-name');
  if (input) input.style.borderColor = '';
  if (err) err.style.display = 'none';
  if (!warn) return;
  const dup = _obNameConflict(AppState.obState.name, AppState.obState.editId);
  if (dup) {
    warn.style.display = 'block';
    warn.style.color = '#f5a524';
    warn.style.fontFamily = "'DM Mono',monospace";
    warn.style.fontSize = '10px';
    warn.style.marginTop = '6px';
    warn.style.letterSpacing = '.5px';
    warn.textContent = 'Heads up — you already have a client named "' + dup.name + '".';
  } else {
    warn.style.display = 'none';
    warn.textContent = '';
  }
}

function obRegenPin() {
  // Regenerate until we find a PIN not in use by another client
  let pin, attempts = 0;
  do { pin = generatePIN(); attempts++; } while (_obPinInUse(pin, AppState.obState.editId) && attempts < 30);
  AppState.obState.pin = pin;
  _obDraftSave();
  const el = document.getElementById('ob-pin-display');
  if (el) el.textContent = AppState.obState.pin;
}

function obNextStep0() {
  let ok = true;
  const nameInput = document.getElementById('ob-name');
  const nameErr = document.getElementById('ob-name-err');
  if (!AppState.obState.name.trim()) {
    if (nameInput) { nameInput.style.borderColor = '#e74c3c'; nameInput.focus(); }
    if (nameErr) nameErr.style.display = 'block';
    ok = false;
  } else if (nameInput) { nameInput.style.borderColor = ''; if (nameErr) nameErr.style.display = 'none'; }

  // Email validation (if provided, must be valid)
  const emailInput = document.getElementById('ob-email');
  const emailErr = document.getElementById('ob-email-err');
  const email = (AppState.obState.email || '').trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    if (emailInput) emailInput.style.borderColor = '#e74c3c';
    if (emailErr) emailErr.style.display = 'block';
    if (ok && emailInput) emailInput.focus();
    ok = false;
  } else if (emailInput) { emailInput.style.borderColor = ''; if (emailErr) emailErr.style.display = 'none'; }

  if (!ok) return;

  // Auto-infer program type from goal text if not yet chosen
  if (!AppState.obState.programType) {
    const inferred = _obInferProgramType(AppState.obState.goal);
    if (inferred) {
      AppState.obState.programType = inferred;
      AppState.obState.accent = PROGRAM_TEMPLATES[inferred]?.accent || '#ff6b35';
    }
  }
  renderOnboardStep(1);
}

/* ── STEP 1: Program Type ── */
function renderObStep1() {
  const types = [
    { key:'strength',    emoji:'🏋️', name:'Strength / Muscle Gain', desc:'Progressive overload, hypertrophy focus' },
    { key:'weightloss',  emoji:'🔥', name:'Weight Loss',             desc:'Full-body circuits, caloric deficit focus' },
    { key:'hybrid',      emoji:'⚡', name:'Hybrid Athlete',          desc:'Strength + endurance concurrent training' },
    { key:'bodybuilder', emoji:'🥇', name:'Bodybuilder',             desc:'Push/Pull/Legs classic bro split' },
    { key:'general',     emoji:'💪', name:'General Fitness',         desc:'Beginner-friendly 3-day full body' },
    { key:'custom',      emoji:'✏️', name:'Custom',                  desc:'Build every day from scratch' },
  ];

  const cards = types.map(t => {
    const tplDays = _obTemplateTrainingDays(t.key);
    const dayLabel = t.key === 'custom' ? 'build from scratch' : `${tplDays}-day default`;
    return `
    <div class="program-type-card ${AppState.obState.programType===t.key?'selected':''}" onclick="obSelectProgram('${t.key}')">
      <div class="program-type-emoji">${t.emoji}</div>
      <div class="program-type-name">${t.name}</div>
      <div class="program-type-desc">${t.desc}</div>
      <div style="font-family:'DM Mono',monospace;font-size:8px;color:var(--faint);letter-spacing:1px;margin-top:6px;text-transform:uppercase">${dayLabel}</div>
      ${t.key !== 'custom' ? `<button type="button" class="program-preview-btn" onclick="event.stopPropagation();obPreviewProgram('${t.key}')" style="margin-top:8px;width:100%;background:none;border:1px solid var(--border);color:var(--muted);font-family:'DM Mono',monospace;font-size:9px;letter-spacing:1px;padding:6px 0;border-radius:4px;cursor:pointer;text-transform:uppercase">Preview 7 days</button>` : ''}
    </div>`;
  }).join('');

  // Clone-from-existing-client card
  const otherClients = (typeof getAllClients === 'function' ? (getAllClients() || []) : []).filter(c => c.id !== AppState.obState.editId);
  const cloneCard = otherClients.length > 0 ? `
    <div class="program-type-card ${AppState.obState.programType==='clone'?'selected':''}" onclick="obOpenClonePicker()" style="border-style:dashed">
      <div class="program-type-emoji">⎘</div>
      <div class="program-type-name">Start from client</div>
      <div class="program-type-desc">Clone an existing client's program as a starting point</div>
      ${AppState.obState._cloneFromName ? `<div style="font-family:'DM Mono',monospace;font-size:8px;color:var(--accent);letter-spacing:1px;margin-top:6px;text-transform:uppercase">Using: ${esc(AppState.obState._cloneFromName)}</div>` : ''}
    </div>` : '';

  // Mismatch warning
  const sel = AppState.obState.programType;
  const tplCount = (sel && sel !== 'custom' && sel !== 'clone') ? _obTemplateTrainingDays(sel) : null;
  const target = AppState.obState.trainingDays;
  const mismatchHtml = (tplCount && tplCount !== target) ? `
    <div style="background:rgba(245,165,36,.08);border:1px solid rgba(245,165,36,.35);border-radius:6px;padding:10px 12px;margin-bottom:14px;font-family:'DM Mono',monospace;font-size:10px;color:#f5a524;line-height:1.5;letter-spacing:.5px">
      You set <b>${target}</b> training days but this template is ${tplCount}-day. ${target > tplCount ? `We'll add ${target - tplCount} accessory day(s) automatically.` : `We'll convert ${tplCount - target} training day(s) to rest.`}
    </div>` : '';

  return `
    <div class="onboard-step active">
      <div class="onboard-step-title">Choose Program</div>
      <div class="onboard-step-sub">Step 2 of 3 — Select a template to start from</div>
      ${mismatchHtml}
      <div class="program-type-grid">${cards}${cloneCard}</div>
      <div class="ob-nav">
        <button class="ob-back-btn" onclick="renderOnboardStep(0)">← Back</button>
        <button class="ob-next-btn" id="ob-next-1" onclick="obNextStep1()" ${!AppState.obState.programType?'disabled':''}>Customize →</button>
      </div>
    </div>`;
}

function obPreviewProgram(key) {
  const tpl = PROGRAM_TEMPLATES[key];
  if (!tpl) return;
  const dayHtml = tpl.days.map(d => {
    const isRest = !d.exercises || d.exercises.length === 0;
    const exList = isRest ? '<div style="font-family:\'DM Mono\',monospace;font-size:10px;color:var(--muted);letter-spacing:1px">REST / RECOVERY</div>'
      : d.exercises.map(e => `<div style="font-size:11px;padding:4px 0;border-bottom:1px solid var(--border)"><span style="color:var(--text)">${esc(e.name)}</span> <span style="color:var(--muted);font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.5px">${esc(e.sets)} · ${esc(e.reps)}</span></div>`).join('');
    return `<div style="background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:10px 12px;margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">
        <div><span style="font-weight:700;font-size:12px">${d.label}</span> <span style="color:var(--muted);font-size:11px">— ${esc(d.title || '')}</span></div>
        <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--faint);letter-spacing:1px">${esc((d.tag||'').toUpperCase())}</div>
      </div>
      ${exList}
    </div>`;
  }).join('');
  const modal = document.createElement('div');
  modal.id = 'obPreviewModal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;padding:16px;';
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  modal.innerHTML = `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;max-width:520px;width:100%;max-height:85vh;display:flex;flex-direction:column">
      <div style="padding:14px 16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-size:14px;font-weight:700">${esc(tpl.name)}</div>
          <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted);letter-spacing:1px;margin-top:2px">${esc(tpl.desc || '')}</div>
        </div>
        <button onclick="document.getElementById('obPreviewModal')?.remove()" style="background:none;border:none;color:var(--muted);font-size:20px;cursor:pointer;padding:4px 8px">&times;</button>
      </div>
      <div style="overflow-y:auto;padding:14px 16px">${dayHtml}</div>
      <div style="padding:12px 16px;border-top:1px solid var(--border);display:flex;gap:8px;justify-content:flex-end">
        <button onclick="document.getElementById('obPreviewModal')?.remove()" style="background:none;border:1px solid var(--border);color:var(--text);padding:8px 14px;border-radius:4px;font-family:'DM Mono',monospace;font-size:10px;letter-spacing:1px;cursor:pointer">Close</button>
        <button onclick="obSelectProgram('${key}');document.getElementById('obPreviewModal')?.remove()" style="background:var(--accent);color:#000;border:none;padding:8px 14px;border-radius:4px;font-family:'DM Mono',monospace;font-size:10px;font-weight:700;letter-spacing:1px;cursor:pointer">Use this program</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

function obOpenClonePicker() {
  const others = (typeof getAllClients === 'function' ? (getAllClients() || []) : []).filter(c => c.id !== AppState.obState.editId);
  if (!others.length) { if (typeof showFitToast === 'function') showFitToast('No other clients to clone from'); return; }
  const modal = document.createElement('div');
  modal.id = 'obCloneModal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;padding:16px;';
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  const rows = others.map(c => `
    <button onclick="obCloneFromClient('${c.id}')" style="width:100%;text-align:left;background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:12px 14px;margin-bottom:6px;cursor:pointer;color:var(--text)">
      <div style="font-weight:600;font-size:13px">${esc(c.name)}</div>
      <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:1px;margin-top:2px">${esc(c._meta?.programType || 'custom').toUpperCase()} · ${(c._meta?.days||[]).filter(d=>d.exercises?.length>0).length} training days</div>
    </button>`).join('');
  modal.innerHTML = `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;max-width:460px;width:100%;max-height:80vh;display:flex;flex-direction:column">
      <div style="padding:14px 16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
        <div style="font-size:14px;font-weight:700">Clone from client</div>
        <button onclick="document.getElementById('obCloneModal')?.remove()" style="background:none;border:none;color:var(--muted);font-size:20px;cursor:pointer;padding:4px 8px">&times;</button>
      </div>
      <div style="overflow-y:auto;padding:12px 14px">${rows}</div>
    </div>`;
  document.body.appendChild(modal);
}

function obCloneFromClient(cid) {
  const src = (typeof getAllClients === 'function' ? (getAllClients() || []) : []).find(c => c.id === cid);
  if (!src) return;
  const srcDays = src._meta?.days;
  if (!srcDays || !Array.isArray(srcDays)) { if (typeof showFitToast === 'function') showFitToast('That client has no workout days to clone'); return; }
  AppState.obState.days = JSON.parse(JSON.stringify(srcDays));
  AppState.obState.programType = src._meta?.programType || 'custom';
  AppState.obState.accent = src.accent || AppState.obState.accent;
  AppState.obState._cloneFromName = src.name || '';
  _obDraftSave();
  document.getElementById('obCloneModal')?.remove();
  renderOnboardStep(2);
}

function obSelectProgram(key) {
  AppState.obState.programType = key;
  AppState.obState.accent = PROGRAM_TEMPLATES[key]?.accent || '#ff6b35';
  // Always reset days when selecting a program so training day count is applied fresh on Next
  AppState.obState.days = null;
  AppState.obState._cloneFromName = null;
  _obDraftSave();
  // Re-render to show selection
  renderOnboardStep(1);
}

function obNextStep1() {
  if (!AppState.obState.programType) return;
  // If user cloned from another client, days are already set — don't rebuild from template
  if (!AppState.obState.days) {
    const templateDays = JSON.parse(JSON.stringify(PROGRAM_TEMPLATES[AppState.obState.programType].days));
    AppState.obState.days = applyTrainingDayCount(templateDays, AppState.obState.trainingDays, AppState.obState.programType);
  }
  AppState.obState.editDay = 0;
  _obDraftSave();
  renderOnboardStep(2);
}

function applyTrainingDayCount(days, targetCount, programType) {
  // Count current training days (days with exercises)
  const trainingIndices = days.map((d, i) => d.exercises.length > 0 ? i : -1).filter(i => i >= 0);
  const restIndices = days.map((d, i) => d.exercises.length === 0 ? i : -1).filter(i => i >= 0);
  const currentTraining = trainingIndices.length;

  if (targetCount === currentTraining) return days; // already correct

  const result = JSON.parse(JSON.stringify(days));

  if (targetCount > currentTraining) {
    // Need more training days — convert rest days to training days
    // Use a sensible default block based on program type
    const extraNeeded = targetCount - currentTraining;
    const templates = {
      strength:    { tag:'Strength', title:'Accessory Day',  sub:'Accessory + weak points', exercises:[
        {name:'Romanian Deadlift',sets:'3 sets',reps:'10-12 reps',rest:'2 min',note:'Hinge pattern — hamstring focus.'},
        {name:'Dumbbell Row',sets:'3 sets',reps:'10 / side',rest:'90 sec',note:'Full ROM.'},
        {name:'Lateral Raise',sets:'4 sets',reps:'15-20 reps',rest:'60 sec',note:'Side delts.'},
        {name:'Face Pull',sets:'3 sets',reps:'15-20 reps',rest:'60 sec',note:'Shoulder health.'},
        {name:'Ab Wheel Rollout',sets:'3 sets',reps:'8-12 reps',rest:'60 sec',note:'Brace hard.'},
      ]},
      weightloss:  { tag:'Strength', title:'Metabolic Circuit', sub:'Full body burn', exercises:[
        {name:'Dumbbell Squat to Press',sets:'3 rounds',reps:'12 reps',rest:'60 sec',note:'Full body movement.'},
        {name:'Renegade Row',sets:'3 rounds',reps:'8 / side',rest:'60 sec',note:'Core and back.'},
        {name:'Step-Up',sets:'3 rounds',reps:'10 / leg',rest:'60 sec',note:'Drive through heel.'},
        {name:'Plank',sets:'3 sets',reps:'30-45 sec',rest:'45 sec',note:'Straight line.'},
      ]},
      hybrid:      { tag:'Strength', title:'Strength Accessory', sub:'Weak points + mobility', exercises:[
        {name:'Single-Leg RDL',sets:'3 sets',reps:'10 / leg',rest:'90 sec',note:'Balance and hamstring.'},
        {name:'Face Pull',sets:'3 sets',reps:'15-20 reps',rest:'60 sec',note:'Shoulder health.'},
        {name:'Copenhagen Plank',sets:'3 sets',reps:'20-30 sec',rest:'60 sec',note:'Hip stability.'},
        {name:'Ab Wheel Rollout',sets:'3 sets',reps:'8-12 reps',rest:'60 sec',note:'Brace hard.'},
      ]},
      bodybuilder: { tag:'Legs',     title:'Legs C',         sub:'Glute + calf isolation', exercises:[
        {name:'Hip Thrust',sets:'4 sets',reps:'12-15 reps',rest:'90 sec',note:'Squeeze at top.'},
        {name:'Walking Lunge',sets:'3 sets',reps:'12 / leg',rest:'90 sec',note:'Long stride.'},
        {name:'Leg Extension',sets:'3 sets',reps:'15 reps',rest:'60 sec',note:'Quad isolation.'},
        {name:'Seated Leg Curl',sets:'3 sets',reps:'12-15 reps',rest:'60 sec',note:'Full stretch.'},
        {name:'Seated Calf Raise',sets:'5 sets',reps:'15-20 reps',rest:'60 sec',note:'Soleus focus.'},
      ]},
      general:     { tag:'Training', title:'Active Day',     sub:'Light full body', exercises:[
        {name:'Bodyweight Squat',sets:'3 sets',reps:'15 reps',rest:'60 sec',note:'Full depth.'},
        {name:'Push-Up',sets:'3 sets',reps:'10-15 reps',rest:'60 sec',note:'Modify if needed.'},
        {name:'Glute Bridge',sets:'3 sets',reps:'20 reps',rest:'45 sec',note:'Hold at top.'},
        {name:'Dead Bug',sets:'2 sets',reps:'8 / side',rest:'45 sec',note:'Back pressed down.'},
      ]},
      custom:      { tag:'Training', title:'Training Day',   sub:'Custom', exercises:[] },
    };
    const fill = templates[programType] || templates.custom;
    let converted = 0;
    for (let i = 0; i < result.length && converted < extraNeeded; i++) {
      if (result[i].exercises.length === 0) {
        result[i].tag = fill.tag;
        result[i].title = fill.title;
        result[i].sub = fill.sub;
        result[i].exercises = JSON.parse(JSON.stringify(fill.exercises));
        converted++;
      }
    }
  } else if (targetCount < currentTraining) {
    // Need fewer training days — convert excess training days to rest
    // Keep the first N training days, rest the others
    let kept = 0;
    for (let i = 0; i < result.length; i++) {
      if (result[i].exercises.length > 0) {
        kept++;
        if (kept > targetCount) {
          result[i].tag = 'Rest';
          result[i].title = 'Rest';
          result[i].sub = 'Active recovery or off';
          result[i].exercises = [];
        }
      }
    }
  }

  return result;
}

/* ── STEP 2: Customize Workouts ── */
function renderObStep2() {
  const days = AppState.obState.days;
  const activeDay = days[AppState.obState.editDay];
  const editDay = AppState.obState.editDay;

  const dayBtns = days.map((d, i) => `
    <button class="day-sel-btn ${i===editDay?'active':''}" onclick="obSelectDay(${i})">${d.label}</button>
  `).join('');

  const exRows = activeDay.exercises.length === 0
    ? `<div style="padding:16px 18px;font-size:12px;color:var(--muted);font-family:'DM Mono',monospace;">No exercises — this is a rest day. Add exercises below to make it a training day.</div>`
    : activeDay.exercises.map((e, i) => `
      <div class="ex-editor-row" data-ex-idx="${i}" draggable="true"
        ondragstart="obDragStart(event,${i})" ondragover="obDragOver(event,${i})" ondragleave="obDragLeave(event)" ondrop="obDrop(event,${i})" ondragend="obDragEnd(event)"
        style="flex-wrap:wrap;gap:6px">
        <span class="ex-editor-drag" style="align-self:center;cursor:grab;touch-action:none">⠿</span>
        <div style="flex:1;min-width:140px">
          <div class="ex-editor-name">${esc(e.name)}</div>
          <div class="ex-editor-detail">${esc(e.sets || '')} · ${esc(e.reps || '')} · ${esc(e.rest || '')}</div>
          <input class="ex-editor-url" type="url"
            placeholder="YouTube URL (optional demo video)"
            value="${esc(e.videoUrl || '')}"
            oninput="AppState.obState.days[${editDay}].exercises[${i}].videoUrl=this.value.trim();_obDraftSave()"
            onclick="event.stopPropagation()">
        </div>
        <button class="ex-editor-del" style="align-self:flex-start;margin-top:2px" onclick="obDeleteExercise(${i})">✕</button>
      </div>`).join('');

  // Day duration estimate (rough): sum(sets * (reps_mid_s + rest_s))
  const est = _obEstimateDayMin(activeDay);
  const estHtml = (est > 0 && activeDay.exercises.length > 0)
    ? `<span style="font-family:'DM Mono',monospace;font-size:9px;color:var(--faint);letter-spacing:1px;margin-left:8px">~${est} min</span>`
    : '';

  // Other days for "copy to" menu
  const copyTargets = days.map((d, i) => i === editDay ? '' : `<option value="${i}">${d.label} — ${esc(d.title || '')}</option>`).join('');

  return `
    <div class="onboard-step active">
      <div class="onboard-step-title">Customize</div>
      <div class="onboard-step-sub">Step 3 of 3 — ${AppState.obState.trainingDays} training days · tap any day to add or remove exercises.</div>

      <div class="day-selector-row">${dayBtns}</div>

      <div class="workout-editor">
        <div class="workout-editor-header">
          <input class="workout-editor-title-input" type="text"
            value="${esc(activeDay.title || '')}"
            placeholder="Day title (e.g. Push Day A)"
            oninput="AppState.obState.days[${editDay}].title=this.value;_obDraftSave()">
          <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);display:flex;align-items:center;gap:10px">
            <span>${activeDay.exercises.length} exercise${activeDay.exercises.length!==1?'s':''}${estHtml}</span>
            <select onchange="if(this.value!==''){obCopyDayTo(parseInt(this.value));this.value=''}" style="background:var(--surface2);color:var(--muted);border:1px solid var(--border);border-radius:4px;padding:3px 6px;font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.5px;cursor:pointer">
              <option value="">COPY DAY TO…</option>
              ${copyTargets}
            </select>
          </div>
        </div>
        ${exRows}
        <datalist id="ob-ex-library">
          ${_obExerciseLibrary().map(n => `<option value="${esc(n)}"></option>`).join('')}
        </datalist>
        <div class="ex-add-row" style="flex-wrap:wrap;gap:8px">
          <input class="ex-add-input" id="ob-ex-input" type="text" list="ob-ex-library" placeholder="Exercise name (type to search)" style="flex:2;min-width:120px" onkeydown="if(event.key==='Enter')obAddExercise()">
          <input class="ex-add-input" id="ob-ex-url" type="url" placeholder="YouTube URL (optional)" style="flex:3;min-width:160px">
          <button class="ex-add-btn" onclick="obOpenExercisePicker()" style="background:none;border:1px solid var(--border);color:var(--muted)" title="Pick from known exercises">Browse</button>
          <button class="ex-add-btn" onclick="obAddExercise()">Add</button>
        </div>
      </div>

      <div class="ob-nav">
        <button class="ob-back-btn" onclick="renderOnboardStep(1)">← Back</button>
        <button class="ob-next-btn" id="ob-save-btn" onclick="obSaveClient(this)">Save Client ✓</button>
      </div>
    </div>`;
}

// Minutes estimate: sum per-exercise of (sets × (avg-rep-time + rest-seconds))
function _obEstimateDayMin(day) {
  if (!day || !day.exercises || !day.exercises.length) return 0;
  let sec = 0;
  day.exercises.forEach(e => {
    const sets = parseInt((e.sets || '').match(/\d+/)?.[0] || '3');
    const reps = parseInt((e.reps || '').match(/\d+/)?.[0] || '10');
    const restMatch = (e.rest || '').match(/(\d+)\s*(min|sec)/i);
    let rest = 90;
    if (restMatch) rest = parseInt(restMatch[1]) * (restMatch[2].toLowerCase().startsWith('min') ? 60 : 1);
    const workSec = reps * 4; // ~4s per rep
    sec += sets * (workSec + rest);
  });
  return Math.max(5, Math.round(sec / 60));
}

// ── Drag-reorder state and handlers ──
let _obDragFrom = -1;
function obDragStart(e, idx) {
  _obDragFrom = idx;
  try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(idx)); } catch {}
  e.currentTarget?.classList.add('ob-drag-ghost');
}
function obDragOver(e, idx) {
  e.preventDefault();
  try { e.dataTransfer.dropEffect = 'move'; } catch {}
  if (_obDragFrom < 0 || idx === _obDragFrom) return;
  e.currentTarget?.classList.add('ob-drag-over');
}
function obDragLeave(e) {
  e.currentTarget?.classList.remove('ob-drag-over');
}
function obDrop(e, idx) {
  e.preventDefault();
  if (_obDragFrom < 0 || idx === _obDragFrom) { _obDragFrom = -1; return; }
  const ex = AppState.obState.days[AppState.obState.editDay].exercises;
  const [moved] = ex.splice(_obDragFrom, 1);
  ex.splice(idx, 0, moved);
  _obDragFrom = -1;
  _obDraftSave();
  renderOnboardStep(2);
}
function obDragEnd(e) {
  _obDragFrom = -1;
  document.querySelectorAll('.ob-drag-ghost,.ob-drag-over').forEach(el => el.classList.remove('ob-drag-ghost','ob-drag-over'));
}

function obCopyDayTo(targetIdx) {
  const src = AppState.obState.days[AppState.obState.editDay];
  if (!src || targetIdx < 0 || targetIdx >= AppState.obState.days.length) return;
  const tgt = AppState.obState.days[targetIdx];
  if (tgt.exercises && tgt.exercises.length > 0) {
    if (!confirm('Replace ' + tgt.label + '\'s exercises with ' + src.label + '\'s?')) return;
  }
  tgt.exercises = JSON.parse(JSON.stringify(src.exercises));
  tgt.tag = src.tag;
  tgt.title = (tgt.title === 'Rest' || !tgt.title) ? src.title : tgt.title;
  tgt.sub = tgt.sub || src.sub;
  _obDraftSave();
  if (typeof showFitToast === 'function') showFitToast('Copied ' + src.label + ' → ' + tgt.label);
  renderOnboardStep(2);
}

function obSelectDay(idx) {
  AppState.obState.editDay = idx;
  renderOnboardStep(2);
}

function obDeleteExercise(idx) {
  AppState.obState.days[AppState.obState.editDay].exercises.splice(idx, 1);
  _obDraftSave();
  renderOnboardStep(2);
}

function obAddExercise() {
  const input = document.getElementById('ob-ex-input');
  const urlInput = document.getElementById('ob-ex-url');
  const name = input?.value?.trim();
  if (!name) { input.style.borderColor='#e74c3c'; setTimeout(()=>input.style.borderColor='',800); return; }
  const videoUrl = urlInput?.value?.trim() || '';
  const lib = _obExerciseLibraryMap();
  const match = lib.get(name);
  const base = match
    ? { name: match.name, sets: match.sets, reps: match.reps, rest: match.rest, note: match.note || 'Added by coach.' }
    : { name, sets:'3 sets', reps:'10–12 reps', rest:'90 sec', note:'Added by coach.' };
  AppState.obState.days[AppState.obState.editDay].exercises.push({
    ...base,
    ...(videoUrl ? { videoUrl } : {})
  });
  _obDraftSave();
  renderOnboardStep(2);
}

function obOpenExercisePicker() {
  const lib = _obExerciseLibraryMap();
  const items = Array.from(lib.values()).sort((a,b) => a.name.localeCompare(b.name));
  if (!items.length) { if (typeof showFitToast === 'function') showFitToast('No exercises in library yet'); return; }
  const existing = new Set((AppState.obState.days?.[AppState.obState.editDay]?.exercises || []).map(e => (e.name||'').toLowerCase()));
  const modal = document.createElement('div');
  modal.id = 'obExPickerModal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;padding:16px;';
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  const rowsHtml = items.map((ex, i) => {
    const used = existing.has(ex.name.toLowerCase());
    return `<button type="button" data-ob-ex-idx="${i}" data-ob-ex-name="${esc(ex.name.toLowerCase())}" onclick="obPickExerciseFromLibrary(${i})" ${used ? 'disabled' : ''} style="width:100%;text-align:left;background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:10px 12px;margin-bottom:6px;cursor:${used?'not-allowed':'pointer'};color:var(--text);opacity:${used?'.45':'1'}">
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
        <span style="font-weight:600;font-size:13px">${esc(ex.name)}</span>
        ${used ? '<span style="font-family:\'DM Mono\',monospace;font-size:9px;color:var(--faint);letter-spacing:1px">IN DAY</span>' : ''}
      </div>
      <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:.8px;margin-top:3px">${esc(ex.sets)} · ${esc(ex.reps)} · ${esc(ex.rest)}</div>
    </button>`;
  }).join('');
  modal.innerHTML = `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;max-width:480px;width:100%;max-height:85vh;display:flex;flex-direction:column">
      <div style="padding:14px 16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-size:14px;font-weight:700">Exercise library</div>
          <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted);letter-spacing:1px;margin-top:2px">${items.length} exercise${items.length!==1?'s':''} · tap to add</div>
        </div>
        <button onclick="document.getElementById('obExPickerModal')?.remove()" style="background:none;border:none;color:var(--muted);font-size:20px;cursor:pointer;padding:4px 8px">&times;</button>
      </div>
      <div style="padding:10px 14px;border-bottom:1px solid var(--border)">
        <input id="obExPickerSearch" type="text" placeholder="Search exercises…" oninput="obExPickerFilter(this.value)" style="width:100%;background:var(--surface2);border:1px solid var(--border);color:var(--text);border-radius:6px;padding:8px 10px;font-size:13px">
      </div>
      <div id="obExPickerList" style="overflow-y:auto;padding:10px 14px">${rowsHtml}</div>
    </div>`;
  document.body.appendChild(modal);
  setTimeout(() => document.getElementById('obExPickerSearch')?.focus(), 40);
}

function obExPickerFilter(q) {
  const term = (q || '').toLowerCase().trim();
  const list = document.getElementById('obExPickerList');
  if (!list) return;
  let shown = 0;
  list.querySelectorAll('[data-ob-ex-name]').forEach(btn => {
    const name = btn.getAttribute('data-ob-ex-name') || '';
    const hit = !term || name.includes(term);
    btn.style.display = hit ? '' : 'none';
    if (hit) shown++;
  });
  let empty = list.querySelector('.ob-ex-empty');
  if (!shown) {
    if (!empty) {
      empty = document.createElement('div');
      empty.className = 'ob-ex-empty';
      empty.style.cssText = 'padding:20px 4px;text-align:center;font-family:\'DM Mono\',monospace;font-size:10px;color:var(--muted);letter-spacing:1px';
      empty.textContent = 'NO MATCHES';
      list.appendChild(empty);
    }
  } else if (empty) { empty.remove(); }
}

function obPickExerciseFromLibrary(idx) {
  const items = Array.from(_obExerciseLibraryMap().values()).sort((a,b) => a.name.localeCompare(b.name));
  const ex = items[idx];
  if (!ex) return;
  const day = AppState.obState.days?.[AppState.obState.editDay];
  if (!day) return;
  if (!Array.isArray(day.exercises)) day.exercises = [];
  const urlInput = document.getElementById('ob-ex-url');
  const videoUrl = urlInput?.value?.trim() || '';
  day.exercises.push({
    name: ex.name,
    sets: ex.sets || '3 sets',
    reps: ex.reps || '10–12 reps',
    rest: ex.rest || '90 sec',
    note: ex.note || 'Added by coach.',
    ...(videoUrl ? { videoUrl } : {})
  });
  _obDraftSave();
  document.getElementById('obExPickerModal')?.remove();
  renderOnboardStep(2);
  if (typeof showFitToast === 'function') showFitToast('Added ' + ex.name);
}

/* ── AUTO-INFER GOALS FROM ONBOARDING ── */
function setupInitialGoals(cid, ob) {
  if (getClientGoals(cid).length) return; // don't overwrite existing goals
  const text = (ob.goal || '').toLowerCase();
  const pt   = ob.programType || '';

  // 1. Weight loss via explicit start/goal weight fields
  if (ob.startWeight && ob.goalWeight) {
    const goal = { id: 'wl_migrated', type: 'weight',
      label: ob.goal.trim() || 'Weight Loss',
      start: parseFloat(ob.startWeight), target: parseFloat(ob.goalWeight),
      unit: 'lbs', _migrated: true };
    saveGoalCurrent(cid, goal.id, goal.start);
    saveClientGoals(cid, [goal]);
    return;
  }

  // 2. "Lose X lbs/kg" in goal text + we have a start weight
  const loseMatch = text.match(/lose\s+(\d+(?:\.\d+)?)/i);
  if (loseMatch && ob.startWeight) {
    const start  = parseFloat(ob.startWeight);
    const target = start - parseFloat(loseMatch[1]);
    if (target > 0 && target < start) {
      const goal = { id: 'wl_migrated', type: 'weight',
        label: ob.goal.trim() || 'Weight Loss',
        start, target, unit: 'lbs', _migrated: true };
      saveGoalCurrent(cid, goal.id, start);
      saveClientGoals(cid, [goal]);
      return;
    }
  }

  // 3. Endurance / runtime goal — only create if we can parse a target time
  const isEndurance = pt === 'endurance' || pt === 'hybrid' ||
    /run|5k|10k|marathon|mile|cardio|sprint|pace/i.test(text);
  if (isEndurance) {
    const mmss = text.match(/(\d{1,2}):(\d{2})/);
    const mins = text.match(/(\d+)\s*min/i);
    if (mmss || mins) {
      const targetSec = mmss
        ? parseInt(mmss[1]) * 60 + parseInt(mmss[2])
        : parseInt(mins[1]) * 60;
      saveClientGoals(cid, [{ id: 'g_' + Date.now(), type: 'runtime',
        label: ob.goal.trim() || 'Endurance Goal', start: 0, target: targetSec, unit: '' }]);
      return;
    }
  }

  // 4. Strength / lift goal — only create if we can parse a target weight
  const isStrength = pt === 'strength' || pt === 'powerlifting' || pt === 'bodybuilder' ||
    /lift|bench|squat|deadlift|press|muscle|build|strength|power/i.test(text);
  if (isStrength) {
    const wMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:lbs?|kg|pound)/i) ||
                   text.match(/(\d+(?:\.\d+)?)/);
    if (wMatch) {
      const target = parseFloat(wMatch[1]);
      const unit   = /\bkg\b/i.test(text) ? 'kg' : 'lbs';
      saveClientGoals(cid, [{ id: 'g_' + Date.now(), type: 'lift',
        label: ob.goal.trim() || 'Strength Goal', start: 0, target: target, unit }]);
      return;
    }
  }
}

/* ── SAVE CLIENT ── */
async function obSaveClient(btn) {
  if (btn) {
    btn.disabled = true;
    btn.textContent = navigator.onLine ? 'Saving…' : 'Saving offline…';
  }
  // PIN collision guard — rotate if taken
  let safetyAttempts = 0;
  while (_obPinInUse(AppState.obState.pin, AppState.obState.editId) && safetyAttempts < 30) {
    AppState.obState.pin = generatePIN();
    safetyAttempts++;
  }
  const template = PROGRAM_TEMPLATES[AppState.obState.programType];
  const isWeightLoss = AppState.obState.programType === 'weightloss' || (AppState.obState.startWeight && AppState.obState.goalWeight);
  const id = AppState.obState.editId || ('client_' + Date.now());
  const initials = AppState.obState.name.trim().split(' ').map(w=>w[0]?.toUpperCase()||'').join('').slice(0,2) || 'CL';
  const accent = AppState.obState.accent;

  // Build tabs based on program type
  const tabs = [
    { id:'home', label:'Home' },
    { id:'schedule', label:'Schedule' },
    { id:'workouts', label:'Workouts' },
    ...(AppState.obState.programType==='hybrid' ? [{id:'endurance',label:'Endurance'}] : []),
    { id:'nutrition', label:'Nutrition' },
    { id:'fitness', label:'Fitness Log' },
    { id:'milestones', label:'Milestones' },
    { id:'progression', label:'Progression' },
  ];

  // Build workout days from AppState.obState.days
  const workoutDays = AppState.obState.days
    .filter(d => d.exercises.length > 0)
    .map(d => ({
      id: d.id,
      label: `${d.label} — ${d.title}`,
      icon: d.tag === 'Push' ? '💪' : d.tag === 'Pull' ? '🏋️' : d.tag === 'Legs' ? '🦵' : '🔥',
      title: `${d.label === 'Mon' ? 'Monday' : d.label === 'Tue' ? 'Tuesday' : d.label === 'Wed' ? 'Wednesday' : d.label === 'Thu' ? 'Thursday' : d.label === 'Fri' ? 'Friday' : d.label === 'Sat' ? 'Saturday' : 'Sunday'} — ${d.title}`,
      sub: d.sub || `${d.exercises.length} exercises`,
      blocks: [{ label: 'Exercises', exercises: d.exercises }]
    }));

  const scheduleDays = AppState.obState.days.map(d => ({
    label: d.label,
    type: d.exercises.length > 0 ? (d.tag==='Cardio'||d.tag==='Endurance'?'wk-card':'wk-a') : (d.tag==='Active'?'wk-active':'wk-rest'),
    tag: d.tag,
    title: d.title,
    sub: d.sub || ''
  }));

  // ── CALCULATE TDEE + MACROS ──────────────────────────────────
  const _macros = calcClientMacros(AppState.obState);

  const plainPin = AppState.obState.pin;
  let hashedPin;
  try { hashedPin = await hashPin(plainPin); }
  catch (e) {
    if (btn) { btn.disabled = false; btn.textContent = 'Save Client ✓'; }
    showFitToast('Error hashing PIN — ensure app is loaded over HTTPS');
    return;
  }
  const newClient = {
    id,
    name: AppState.obState.name.trim(),
    pin: hashedPin,
    _pinPlain: plainPin, // kept only for the success screen, not persisted to Supabase
    goal: AppState.obState.goal || template?.name || 'Custom Program',
    accent,
    initials,
    avatarBg: accent + '20',
    avatarColor: accent,
    ...(isWeightLoss && AppState.obState.startWeight && AppState.obState.goalWeight ? {
      weightLoss: { start: parseFloat(AppState.obState.startWeight), goal: parseFloat(AppState.obState.goalWeight), unit: 'lbs' }
    } : {}),
    _meta: {
      programType: AppState.obState.programType,
      experience: AppState.obState.experience,
      trainingDays: AppState.obState.trainingDays,
      age: AppState.obState.age,
      sex: AppState.obState.sex,
      heightFt: AppState.obState.heightFt,
      heightIn: AppState.obState.heightIn,
      weightLbs: AppState.obState.weightLbs,
      sfBicep: AppState.obState.sfBicep,
      sfTricep: AppState.obState.sfTricep,
      sfSuprailiac: AppState.obState.sfSuprailiac,
      sfSubscap: AppState.obState.sfSubscap,
      activityLevel: AppState.obState.activityLevel,
      email: AppState.obState.email || '',
      address: AppState.obState.address || '',
      bfMode: AppState.obState.bfMode || 'skinfold',
      bodyFatPct: (AppState.obState.bfMode === 'direct')
        ? (parseFloat(AppState.obState.bfPctDirect) || null)
        : (calcBodyFat(AppState.obState.sfBicep, AppState.obState.sfTricep, AppState.obState.sfSuprailiac, AppState.obState.sfSubscap, AppState.obState.age, AppState.obState.sex)?.fatPct || null),
      days: AppState.obState.days,
    },
    data: {
      hero: {
        weeks: 12,
        days: AppState.obState.trainingDays,
        phases: 3,
        level: AppState.obState.experience.slice(0,3).toUpperCase()
      },
      tabs,
      schedule: {
        desc: `${AppState.obState.trainingDays}-day ${template?.name || 'custom'} program for ${AppState.obState.name}.`,
        days: scheduleDays,
        principles: [
          'Progressive overload every session — add reps or weight when you hit the top of your range.',
          'Track every session. You can\'t improve what you don\'t measure.',
          'Sleep 7–9 hours. Recovery is where adaptation happens.',
          'Nutrition drives results — hit your protein and calorie targets daily.',
        ]
      },
      workouts: { days: workoutDays },
      ...(AppState.obState.programType==='hybrid' ? {
        endurance: {
          zones:[
            {cls:'z1',label:'Zone 1',pct:'50–60%',feel:'Very easy',purpose:'Warm-up, recovery'},
            {cls:'z2',label:'Zone 2',pct:'60–70%',feel:'Easy — full conversation',purpose:'Aerobic base — 80% of cardio volume'},
            {cls:'z3',label:'Zone 3',pct:'70–80%',feel:'Moderate',purpose:'Aerobic threshold'},
            {cls:'z4',label:'Zone 4',pct:'80–90%',feel:'Hard',purpose:'Lactate threshold, VO2max'},
            {cls:'z5',label:'Zone 5',pct:'90–100%',feel:'Max effort',purpose:'Sprint intervals'},
          ],
          sessions:[
            {day:'Tuesday',name:'Zone 2 Run',duration:'45–60 min',zone:'Zone 2',note:'Conversational pace.'},
            {day:'Saturday',name:'Long Effort',duration:'60–90 min',zone:'Zone 2',note:'Run, cycle, or row.'},
          ],
          progression:['Build aerobic base first — keep Zone 2 sessions easy for the first 4 weeks.']
        }
      } : {}),
      nutrition: {
        calories: _macros.calories,
        protein:  _macros.protein,
        carbs:    _macros.carbs,
        fat:      _macros.fat,
        tdee:     _macros.tdee,
        bmr:      _macros.bmr,
        goalLabel: _macros.goalLabel,
        macros: [
          {label:'Daily Calories', val:_macros.calories.toLocaleString(), unit:' kcal', color:accent,    desc:'TDEE '+_macros.tdee+' kcal adjusted for '+_macros.goalLabel+'. Reassess every 2–3 weeks.'},
          {label:'Protein',        val:String(_macros.protein),           unit:'g',     color:'#ff9f7a', desc:'1g per lb bodyweight minimum. Preserves muscle and maximises satiety.'},
          {label:'Carbohydrates',  val:String(_macros.carbs),             unit:'g',     color:accent,    desc:'Primary training fuel. Prioritise around workouts.'},
          {label:'Fats',           val:String(_macros.fat),               unit:'g',     color:'#aaa',    desc:'Essential for hormones. Floor is 0.35g per lb bodyweight.'},
        ],
        tips: _macros.tips,
        supplements: [
          'Creatine monohydrate — 5g/day. Take any time. Well-studied for strength + muscle.',
          'Protein powder as needed to hit the ' + _macros.protein + 'g daily protein target.',
          'Vitamin D3 + K2 with food (especially autumn/winter).',
          'Omega-3 — 2–3g EPA/DHA with food. Anti-inflammatory, supports recovery.',
        ]
      },
      macroTargets: { calories: _macros.calories, protein: _macros.protein, carbs: _macros.carbs, fat: _macros.fat, name: AppState.obState.name.trim() },
      progression: {
        phases: [
          {n:'01',title:'Foundation',weeks:'Weeks 1–4',body:'Learn the movements. Prioritise form over load. Build consistency.'},
          {n:'02',title:'Build',weeks:'Weeks 5–8',body:'Increase load progressively. Volume goes up. Push closer to failure.'},
          {n:'03',title:'Push',weeks:'Weeks 9–12',body:'Consolidate gains, test new maxes. Earn the deload at the end.'},
        ],
        rules: [
          '2-for-2 rule: hit top of rep range for 2 sessions → add weight next time.',
          'Double progression: reps first, then weight.',
          'Log every session — weight, reps, feel.',
          'Deload every 4th week: reduce weights 40–50%.',
        ]
      }
    }
  };

  // Strip _pinPlain before persisting
  const { _pinPlain, ...clientToSave } = newClient;
  if (AppState.obState.editId) {
    const list = getDynamicClients();
    const idx = list.findIndex(c => c.id === AppState.obState.editId);
    if (idx >= 0) list[idx] = clientToSave;
    else list.push(clientToSave);
    saveDynamicClients(list);
  } else {
    addDynamicClient(clientToSave);
  }

  // Auto-infer goals from onboarding data
  setupInitialGoals(newClient.id, AppState.obState);

  // Clear persisted draft — this client is committed
  _obDraftClear();

  // Show success screen (use _pinPlain so the coach sees the readable PIN)
  renderObSuccess(newClient);

  // Auto-send credentials if opted in and email is valid
  const email = (AppState.obState.email || '').trim();
  if (AppState.obState.emailCredentialsOnSave && email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    try {
      if (typeof sendWelcomeEmailToNewClient === 'function') {
        // Small delay so the success screen renders first
        setTimeout(() => { try { sendWelcomeEmailToNewClient(); } catch {} }, 300);
      }
    } catch {}
  }
}

function renderObSuccess(client) {
  _obSuccessClient = client; // stored for sendWelcomeEmailToNewClient()
  const pin = client._pinPlain || client.pin;
  const email = client._meta?.email || '';
  const appUrl = window.location.href.split('?')[0];
  const credText = `App: ${appUrl}\nPIN: ${pin}`;

  // Summary details for the new client
  const m = client._meta || {};
  const tpl = PROGRAM_TEMPLATES[m.programType] || null;
  const tplName = tpl?.name || 'Custom Program';
  const trainingDayCount = (m.days || []).filter(d => d.exercises && d.exercises.length > 0).length;
  const summaryLine = `${tplName} · ${trainingDayCount} training days${m.experience ? ' · ' + m.experience : ''}`;
  const syncStatus = navigator.onLine
    ? '<span style="color:var(--accent)">Saved</span>'
    : '<span style="color:#f5a524">Queued — will sync when online</span>';

  document.getElementById('onboardContent').innerHTML = `
    <div class="ob-success">
      <div class="ob-success-emoji">🎉</div>
      <div class="ob-success-title">${esc(client.name)} is Ready!</div>
      <div class="ob-success-sub">Program created. Share login credentials with your client.</div>

      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:14px 16px;margin:16px 0;text-align:left">
        <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:2px;color:var(--muted);margin-bottom:6px;text-transform:uppercase">Summary</div>
        <div style="font-size:13px;color:var(--text);margin-bottom:3px">${esc(summaryLine)}</div>
        <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted);letter-spacing:.5px">Sync: ${syncStatus}</div>
        ${email ? `<div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted);letter-spacing:.5px;margin-top:3px" id="obEmailStatus">Email: ${AppState.obState.emailCredentialsOnSave ? 'Sending to ' + esc(email) + '…' : 'Not sent'}</div>` : ''}
      </div>

      <div class="ob-pin-reveal">
        <div class="ob-pin-reveal-label">Client PIN</div>
        <div class="ob-pin-reveal-val">${esc(pin)}</div>
        <div class="ob-pin-reveal-hint">Client opens the app, taps their name, and enters this PIN</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:16px">
        ${email ? `<button id="obEmailCredBtn" class="ob-next-btn" style="cursor:pointer" onclick="sendWelcomeEmailToNewClient()">Email Credentials to ${esc(email)}</button>` : ''}
        <button class="ob-back-btn" onclick="navigator.clipboard?.writeText(${JSON.stringify(credText)}).then(()=>showFitToast('Copied!')).catch(()=>showFitToast('PIN: ${pin}'))">Copy Credentials</button>
      </div>
      <button class="ob-next-btn" style="margin-top:10px" onclick="obFinish()">Back to Dashboard →</button>
    </div>`;
  // Update step dots to all done
  [0,1,2].forEach(i => {
    const dot = document.getElementById('sdot-' + i);
    if (dot) dot.className = 'onboard-step-dot done';
  });
}

function obFinish() {
  document.documentElement.style.setProperty('--accent', '#e8ff47');
  launchCoach();
  showScreen('coach');
}

/* ── COACH CARD ACTIONS ── */
function coachViewPin(cid) {
  const list = getDynamicClients();
  const idx = list.findIndex(c => c.id === cid);
  const name = idx >= 0 ? list[idx].name : 'Client';
  if (!confirm(name + "'s PIN is hashed for security and cannot be displayed.\n\nGenerate a new PIN for " + name + '?')) return;
  const newPin = generatePIN();
  hashPin(newPin).then(hashed => {
    if (idx < 0) { showFitToast('Client not found — please refresh the dashboard.'); return; }
    list[idx].pin = hashed;
    saveDynamicClients(list);
    renderCoachDashboard();
    // Show PIN in a dismissible overlay with copy button
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9999;display:flex;align-items:center;justify-content:center';
    ov.innerHTML = `
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:28px 24px;max-width:320px;width:90%;text-align:center">
        <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted);letter-spacing:2px;text-transform:uppercase;margin-bottom:8px">New PIN for ${esc(name)}</div>
        <div id="_pinDisplay" style="font-family:'Bebas Neue',sans-serif;font-size:52px;letter-spacing:6px;color:var(--accent);margin:8px 0">${esc(newPin)}</div>
        <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);margin-bottom:20px">Share this with your client — it won't be shown again</div>
        <div style="display:flex;gap:10px;justify-content:center">
          <button onclick="navigator.clipboard?.writeText('${esc(newPin)}').then(()=>showFitToast('PIN copied!')).catch(()=>showFitToast('${esc(newPin)}'))" style="background:var(--accent);border:none;color:#000;font-family:'DM Mono',monospace;font-size:10px;font-weight:600;padding:10px 20px;border-radius:6px;cursor:pointer;letter-spacing:1px">Copy PIN</button>
          <button onclick="this.closest('[style*=fixed]').remove()" style="background:var(--surface2);border:1px solid var(--border);color:var(--text);font-family:'DM Mono',monospace;font-size:10px;padding:10px 20px;border-radius:6px;cursor:pointer">Done</button>
        </div>
      </div>`;
    ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
    document.body.appendChild(ov);
  });
}

function coachEditClient(cid) {
  const isDynamic = getDynamicClients().find(c => c.id === cid);
  if (!isDynamic) {
    showFitToast('Built-in clients must be edited in code');
    return;
  }
  document.documentElement.style.setProperty('--accent', '#e8ff47');
  showScreen('onboard');
  startOnboarding(cid);
}


function openTerminateModal(cid) {
  const _tc = getAllClients().find(c => c.id === cid);
  const name = _tc ? _tc.name : 'Client';
  AppState.terminateCid = cid;
  AppState.terminateName = name;
  const nameEl = document.getElementById('terminateName');
  const input  = document.getElementById('terminateInput');
  const btn    = document.getElementById('terminateConfirmBtn');
  const backdrop = document.getElementById('terminateBackdrop');
  if (nameEl) nameEl.textContent = name;
  if (input) { input.value = ''; input.classList.remove('matched'); }
  if (btn) btn.classList.remove('enabled');
  if (backdrop) backdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => input?.focus(), 300);
}

function closeTerminateModal() {
  const backdrop = document.getElementById('terminateBackdrop');
  if (backdrop) backdrop.classList.remove('open');
  document.body.style.overflow = '';
  AppState.terminateCid = null;
  AppState.terminateName = null;
}

function checkTerminateConfirm() {
  const input = document.getElementById('terminateInput');
  const btn   = document.getElementById('terminateConfirmBtn');
  if (!input || !btn) return;
  const matches = input.value.trim().toLowerCase() === (AppState.terminateName || '').toLowerCase();
  input.classList.toggle('matched', matches);
  btn.classList.toggle('enabled', matches);
}

/* ── ARCHIVE HELPERS ── */
function getArchivedClients() {
  return getLS('archived_clients', []);
}
function saveArchivedClients(list) {
  localStorage.setItem('archived_clients', JSON.stringify(list));
}

function executeTerminate() {
  const btn = document.getElementById('terminateConfirmBtn');
  if (!btn.classList.contains('enabled') || !AppState.terminateCid) return;
  const cid = AppState.terminateCid;
  const name = AppState.terminateName;

  // Find the full client object before removing
  const clientObj = getAllClients().find(c => c.id === cid);

  // Snapshot ALL their data into the archive
  const archive = {
    client: clientObj,
    archivedAt: new Date().toISOString(),
    data: {
      fitLogs:     getLS('fit_logs_' + cid, []),
      weight:      localStorage.getItem('wt_current_' + cid),
      milestones:  getLS('milestones_' + cid, []),
      macroScores: getLS('macro_scores_' + cid, []),
      coachNotes:  localStorage.getItem('coach_notes_' + cid) || '',
      lastSeen:    localStorage.getItem('last_seen_' + cid),
    }
  };
  const archived = getArchivedClients();
  // Replace existing archive entry if re-terminating
  const existingIdx = archived.findIndex(a => a.client?.id === cid);
  if (existingIdx >= 0) archived[existingIdx] = archive;
  else archived.push(archive);
  saveArchivedClients(archived);

  // Remove from active clients
  deleteDynamicClient(cid);

  // Add to terminated blocklist (for hardcoded clients)
  const blocked = getLS('terminated_clients', []);
  if (!blocked.includes(cid)) { blocked.push(cid); localStorage.setItem('terminated_clients', JSON.stringify(blocked)); }

  // Clear live localStorage keys (data is safe in archive)
  ['fit_logs_','wt_current_','milestones_','macro_scores_','coach_notes_','coach_notes_log_','last_seen_','video_links_'].forEach(k => {
    localStorage.removeItem(k + cid);
  });

  closeTerminateModal();
  renderCoachDashboard();
  buildLogin();
  document.getElementById('coachSub').textContent =
    `// ${getAllClients().length} clients · ${new Date().toLocaleDateString('en',{weekday:'long',month:'short',day:'numeric'})}`;
  showFitToast(name + ' archived');
}

/* ── RESTORE CLIENT ── */
function restoreClient(cid) {
  const archived = getArchivedClients();
  const entry = archived.find(a => a.client?.id === cid);
  if (!entry) return;

  // Restore client object
  const c = entry.client;
  const isDynamic = !!getDynamicClients().find(dc => dc.id === cid);
  if (!isDynamic && !CLIENTS.find(hc => hc.id === cid)) {
    // Add back as dynamic
    addDynamicClient(c);
  }

  // Remove from terminated blocklist
  const blocked = getLS('terminated_clients', []).filter(id => id !== cid);
  localStorage.setItem('terminated_clients', JSON.stringify(blocked));

  // Restore all their data
  if (entry.data.fitLogs?.length)   localStorage.setItem('fit_logs_' + cid, JSON.stringify(entry.data.fitLogs));
  if (entry.data.weight)            localStorage.setItem('wt_current_' + cid, entry.data.weight);
  if (entry.data.milestones?.length)localStorage.setItem('milestones_' + cid, JSON.stringify(entry.data.milestones));
  if (entry.data.macroScores?.length)localStorage.setItem('macro_scores_' + cid, JSON.stringify(entry.data.macroScores));
  if (entry.data.coachNotes)        localStorage.setItem('coach_notes_' + cid, entry.data.coachNotes);
  if (entry.data.lastSeen)          localStorage.setItem('last_seen_' + cid, entry.data.lastSeen);

  // Remove from archive
  saveArchivedClients(archived.filter(a => a.client?.id !== cid));

  renderCoachDashboard();
  buildLogin();
  document.getElementById('coachSub').textContent =
    `// ${getAllClients().length} clients · ${new Date().toLocaleDateString('en',{weekday:'long',month:'short',day:'numeric'})}`;
  showFitToast(c.name + ' restored');
}

/* ── PERMANENTLY DELETE ── */
function permanentlyDeleteClient(cid) {
  const _ac = getArchivedClients().find(a => a.client?.id === cid);
  const name = _ac?.client?.name || 'this client';
  if (!confirm('Permanently delete ' + name + '? All archived data will be gone forever.')) return;

  // Remove from archive
  saveArchivedClients(getArchivedClients().filter(a => a.client?.id !== cid));

  // Remove from terminated list
  const blocked = getLS('terminated_clients', []).filter(id => id !== cid);
  localStorage.setItem('terminated_clients', JSON.stringify(blocked));

  // Ensure dynamic entry gone
  deleteDynamicClient(cid);

  renderCoachDashboard();
  showFitToast(name + ' permanently deleted');
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('terminateBackdrop').addEventListener('click', e => {
    if (e.target === document.getElementById('terminateBackdrop')) closeTerminateModal();
  });
});


function toggleArchivedSection() {
  const grid = document.getElementById('archivedGrid');
  const icon = document.getElementById('archivedToggleIcon');
  if (!grid) return;
  const expanded = grid.classList.toggle('expanded');
  if (icon) icon.textContent = expanded ? '▲' : '▼';
}


/* ── PAUSE / UNPAUSE CLIENT ── */
function getPausedClients() {
  try { return getLS('paused_clients', []); } catch { return []; }
}
function isClientPaused(cid) {
  return getPausedClients().includes(cid);
}
function togglePauseClient(cid) {
  const _pc = getAllClients().find(c => c.id === cid);
  const name = _pc ? _pc.name : 'Client';
  const paused = getPausedClients();
  const idx = paused.indexOf(cid);
  if (idx >= 0) {
    paused.splice(idx, 1);
    localStorage.setItem('paused_clients', JSON.stringify(paused));
    showFitToast(name + ' access restored');
  } else {
    paused.push(cid);
    localStorage.setItem('paused_clients', JSON.stringify(paused));
    showFitToast(name + ' paused — login disabled');
  }
  renderCoachDashboard();
  buildLogin();
}


/* ── EXERCISE VIDEO LINKS ── */
function getVideoLinks(cid) {
  return getLS('video_links_' + cid, {});
}
function saveVideoLink(cid, exerciseName, url) {
  const links = getVideoLinks(cid);
  if (url) links[exerciseName] = url;
  else delete links[exerciseName];
  localStorage.setItem('video_links_' + cid, JSON.stringify(links));
}
function getVideoLink(cid, exerciseName) {
  return getVideoLinks(cid)[exerciseName] || null;
}
function openVideoLink(url) {
  if (!url) return;
  // Convert YouTube watch URLs to embed-friendly full URLs
  window.open(url, '_blank');
}


/* ── PIN-FIRST LOGIN ── */
function startPinLogin() {
  AppState.currentClient = null;
  AppState.isCoachLogin = false;
  AppState.pinBuffer = '';
  currentClient = null;
  const pinName = safeGetElement('pinName');
  if (pinName) { pinName.textContent = 'Enter PIN'; pinName.style.color = 'var(--text)'; }
  const subEl = safeGetElement('pinSub');
  if (subEl) subEl.textContent = '4-digit PIN to access your profile';
  const pinError = safeGetElement('pinError');
  if (pinError) pinError.textContent = '';
  updatePinDots('');
  showScreen('pin');
}


