/* ══════════════════════════════════════════════════════════════
   MACRO CALCULATION ENGINE
   - Mifflin-St Jeor BMR
   - Activity multiplier
   - Goal adjustment (cut / maintain / bulk / recomp)
   - Protein: min 1g per lb bodyweight (lean mass prioritised if BF% known)
   - Fat: min 0.35g per lb bodyweight
   - Carbs: remainder calories
   - All rounded to nearest 5 (calories 50)
══════════════════════════════════════════════════════════════ */
function calcClientMacros(state) {
  const wt      = parseFloat(state.weightLbs) || 180;
  const ft      = parseFloat(state.heightFt)  || 5;
  const inch    = parseFloat(state.heightIn)  || 10;
  const age     = parseFloat(state.age)       || 28;
  const sex     = state.sex || 'male';
  const program = state.programType || 'general';
  const goal    = (state.goal || '').toLowerCase();

  // Height in cm, weight in kg
  const heightCm = ((ft * 12) + inch) * 2.54;
  const weightKg = wt * 0.453592;

  // Mifflin-St Jeor BMR
  const bmr = sex === 'female'
    ? Math.round(10 * weightKg + 6.25 * heightCm - 5 * age - 161)
    : Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + 5);

  // Activity multiplier
  const actMult = {
    sedentary:    1.2,
    light:        1.375,
    moderate:     1.55,
    active:       1.725,
    very_active:  1.9,
  }[state.activityLevel || 'moderate'] || 1.55;

  const tdee = Math.round(bmr * actMult);

  // ── Determine goal type from programType + goal text ──
  var isWeightLoss = program === 'weightloss'
    || goal.includes('los') || goal.includes('cut') || goal.includes('lean')
    || goal.includes('fat') || goal.includes('slim') || goal.includes('deficit');

  var isBulk = program === 'strength' || program === 'bodybuilder'
    || goal.includes('bulk') || goal.includes('gain') || goal.includes('mass')
    || goal.includes('muscle') || goal.includes('build') || goal.includes('grow');

  var isRecomp = goal.includes('recomp') || goal.includes('tone')
    || (!isWeightLoss && !isBulk);

  // Weight loss overrides everything if explicit
  if (isWeightLoss) { isBulk = false; isRecomp = false; }
  if (isBulk)       { isWeightLoss = false; isRecomp = false; }

  // ── Calorie target ──
  var calAdj, goalLabel, rateNote;
  if (isWeightLoss) {
    // Aggressive cut if large deficit desired, moderate otherwise
    var surplusToLose = AppState.obState.startWeight && AppState.obState.goalWeight
      ? Math.abs(parseFloat(AppState.obState.startWeight) - parseFloat(AppState.obState.goalWeight))
      : 20;
    calAdj    = surplusToLose > 30 ? -750 : -500;
    goalLabel = 'fat loss (' + Math.abs(calAdj) + ' kcal deficit)';
    rateNote  = 'Expected loss: ~' + (Math.abs(calAdj) / 3500 * 7).toFixed(1) + ' lbs/week';
  } else if (isBulk) {
    calAdj    = 300;
    goalLabel = 'lean bulk (+300 kcal surplus)';
    rateNote  = 'Expected gain: ~0.25–0.5 lbs/week';
  } else {
    calAdj    = 0;
    goalLabel = 'body recomposition (maintenance calories)';
    rateNote  = 'Body recomp: hold weight, shift body composition';
  }

  var calories = Math.max(1200, tdee + calAdj);
  // Round to nearest 50
  calories = Math.round(calories / 50) * 50;

  // ── Protein: min 1g/lb bodyweight ──
  // If BF% known, use lean mass × 1.1 but floor at 1g/lb total weight
  var bf = calcBodyFat(state.sfBicep, state.sfTricep, state.sfSuprailiac, state.sfSubscap, state.age, state.sex);
  var leanLbs = bf ? bf.leanMassLbs : wt * 0.8;
  // 1.25g/lb for bodybuilder or explicit muscle-gain goals, 1g/lb otherwise
  var isHighProtein = program === 'bodybuilder'
    || goal.includes('bodybuil')
    || (isBulk && (goal.includes('muscle') || goal.includes('mass') || goal.includes('gain')));
  var proteinMultiplier  = isHighProtein ? 1.25 : 1.0;
  var proteinMinByWeight = Math.round(wt * proteinMultiplier); // 1–1.25g per lb
  var proteinByLean      = Math.round(leanLbs * (isHighProtein ? 1.35 : 1.1)); // lean mass version
  var protein = Math.max(proteinMinByWeight, proteinByLean);
  // Cap protein at 40% of calories (4 kcal/g)
  protein = Math.min(protein, Math.round(calories * 0.40 / 4));
  // Round to nearest 5
  protein = Math.round(protein / 5) * 5;

  // ── Fat: min 0.35g/lb bodyweight ──
  var fat = Math.max(Math.round(wt * 0.35), 50);
  // For weight loss, keep fat moderate. For bulk, slightly higher.
  if (isWeightLoss) fat = Math.max(Math.round(wt * 0.35), 55);
  if (isBulk)       fat = Math.max(Math.round(wt * 0.40), 65);
  fat = Math.round(fat / 5) * 5;

  // ── Carbs: remaining calories ──
  var proteinCals = protein * 4;
  var fatCals     = fat * 9;
  var carbCals    = calories - proteinCals - fatCals;
  var carbs       = Math.max(0, Math.round(carbCals / 4));
  // For very low calorie scenarios, reduce protein slightly to make carbs viable
  if (carbs < 50 && calories > 1400) {
    protein = Math.round((calories - fatCals - 50 * 4) / 4 / 5) * 5;
    protein = Math.max(Math.round(wt), protein);
    carbs   = Math.max(50, Math.round((calories - protein * 4 - fatCals) / 4));
  }
  carbs = Math.round(carbs / 5) * 5;

  // ── Contextual nutrition tips ──
  var tips = [
    'Protein first at every meal — highest satiety, preserves muscle.',
    'Pre-workout (60–90 min before): ' + Math.round(carbs * 0.25) + 'g carbs + ' + Math.round(protein * 0.15) + 'g protein.',
    'Post-workout (within 60 min): ' + Math.round(protein * 0.25) + 'g protein + fast carbs to replenish glycogen.',
    'Hydration: 3–4 litres water daily, more on training days.',
  ];
  if (isWeightLoss) {
    tips.push('In a ' + Math.abs(calAdj) + ' kcal deficit. Expect some hunger — high protein and fibre manage this best.');
    tips.push(rateNote + '. If losing faster than 1.5 lbs/week, eat slightly more.');
    tips.push('Track for 14 days consistently before adjusting calories.');
  } else if (isBulk) {
    tips.push(rateNote + '. If gaining faster than 0.75 lbs/week, reduce by 100 kcal.');
    tips.push('Prioritise carbs around training for performance and muscle glycogen.');
    tips.push('Don\'t skip the surplus — you can\'t build muscle in a deficit.');
  } else {
    tips.push('Recomp requires patience — weight may stay similar while composition improves.');
    tips.push('Progressive overload in training is the signal to keep muscle and lose fat.');
    tips.push('Aim for 2+ months before reassessing — changes show in mirror before the scale.');
  }

  // ── Training day vs rest day split ──────────────────────────
  // Training days: +15% carbs (extra glycogen), same protein/fat
  // Rest days: -20% carbs (lower demand), same protein/fat
  var trainingCarbs = Math.round(Math.round(carbs * 1.15) / 5) * 5;
  var trainingCals  = Math.round((protein * 4 + trainingCarbs * 4 + fat * 9) / 50) * 50;
  var restCarbs     = Math.max(50, Math.round(Math.round(carbs * 0.80) / 5) * 5);
  var restCals      = Math.round((protein * 4 + restCarbs * 4 + fat * 9) / 50) * 50;

  return {
    calories, protein, carbs, fat, tdee, bmr, goalLabel, rateNote, tips, isWeightLoss, isBulk, isRecomp,
    trainingDay: { calories: trainingCals, protein, carbs: trainingCarbs, fat },
    restDay:     { calories: restCals,     protein, carbs: restCarbs,     fat },
  };
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  buildLogin();

  /* ── On-screen keyboard: lift fixed UI (tab bar) when keyboard opens ── */
  if (window.visualViewport) {
    const vv = window.visualViewport;
    const syncKbh = () => {
      const hidden = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      document.documentElement.style.setProperty('--kbh', `-${hidden}px`);
    };
    vv.addEventListener('resize', syncKbh);
    vv.addEventListener('scroll', syncKbh);
    syncKbh();
  }

  /* ── Connection/data-saver awareness for sync tasks ── */
  window._networkOk = () => {
    if (navigator.onLine === false) return false;
    const c = navigator.connection;
    if (c?.saveData) return false;
    if (c && /2g|slow-2g/.test(c.effectiveType || '')) return false;
    return true;
  };

  /* ── PWA install prompt capture ── */
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    window._deferredInstall = e;
  });

  /* ── Swipe left/right to switch tabs ── */
  const _swipeContent = document.getElementById('appContent');
  let _swipeX = 0, _swipeY = 0;
  if (_swipeContent) {
    _swipeContent.addEventListener('touchstart', e => {
      _swipeX = e.touches[0].clientX;
      _swipeY = e.touches[0].clientY;
    }, { passive: true });
    _swipeContent.addEventListener('touchend', e => {
      if (typeof _schedTouch !== 'undefined' && _schedTouch.src !== null) return;
      const dx = e.changedTouches[0].clientX - _swipeX;
      const dy = Math.abs(e.changedTouches[0].clientY - _swipeY);
      if (Math.abs(dx) > 120 && dy < 30) {
        const tabs = Array.from(document.querySelectorAll('#tabBar .tab-item'));
        const activeIdx = tabs.findIndex(t => t.classList.contains('active'));
        if (activeIdx < 0) return;
        const nextIdx = dx < 0 ? activeIdx + 1 : activeIdx - 1;
        if (nextIdx >= 0 && nextIdx < tabs.length) tabs[nextIdx].click();
      }
    }, { passive: true });
  }

  /* ── Pull-to-refresh ── */
  let _ptrStartY = 0, _ptrActive = false;
  function _ensurePTR() {
    if (document.getElementById('ptrIndicator')) return;
    const el = document.createElement('div');
    el.id = 'ptrIndicator';
    el.className = 'ptr-indicator';
    el.innerHTML = '<div class="ptr-spinner"></div>Refreshing…';
    document.body.appendChild(el);
  }
  const _ptrContent = document.getElementById('appContent');
  if (_ptrContent) {
    _ptrContent.addEventListener('touchstart', e => {
      if (_ptrContent.scrollTop === 0) { _ptrStartY = e.touches[0].clientY; _ptrActive = true; }
    }, { passive: true });
    _ptrContent.addEventListener('touchmove', e => {
      if (!_ptrActive) return;
      if (e.touches[0].clientY - _ptrStartY > 55) {
        _ensurePTR();
        document.getElementById('ptrIndicator')?.classList.add('visible');
      }
    }, { passive: true });
    _ptrContent.addEventListener('touchend', e => {
      if (!_ptrActive) return;
      _ptrActive = false;
      const dy = e.changedTouches[0].clientY - _ptrStartY;
      const ptrEl = document.getElementById('ptrIndicator');
      if (dy > 55 && currentClient) {
        pullClientData(currentClient.id).then(() => {
          const fresh = getAllClients().find(cl => cl.id === currentClient.id) || currentClient;
          if (AppState.currentClient?.id === currentClient.id) {
            AppState.currentClient = fresh;
            currentClient = fresh;
          }
          renderContent(fresh);
        }).catch(() => { if (currentClient) renderContent(currentClient); })
        .finally(() => { ptrEl?.classList.remove('visible'); });
      } else {
        ptrEl?.classList.remove('visible');
      }
    }, { passive: true });
  }
  // Silently pull latest client list from Supabase on page load — but only
  // when we already hold a valid session token (i.e. the coach is signed
  // in). Pre-login there's no token, so the proxy would 401; fresh-device
  // clients are hydrated individually after PIN login instead.
  if (!window._networkOk || !window._networkOk()) return;
  if (typeof getAuthToken === 'function' && !getAuthToken()) return;
  if (typeof getAuthRole === 'function' && getAuthRole() !== 'coach') return;
  sbSelect('clients', 'select=*').then(data => {
    if (!data || !data.length) return;
    const terminated = getLS('terminated_clients', []);
    const existing = getLS('dynamic_clients', []);
    let changed = false;
    data.forEach(row => {
      if (terminated.includes(row.id)) return;
      const idx = existing.findIndex(c => c.id === row.id);
      const client = {
        id: row.id, name: row.name, pin: row.pin || '',
        goal: row.goal || '', accent: row.accent || '#ff6b35',
        programType: row.program_type || '',
        data: safeJSON(row.data, {}), _meta: safeJSON(row.meta, {}),
        weightLoss: safeJSON(row.weight_loss, null),
      };
      if (row.mode) localStorage.setItem('client_mode_' + row.id, row.mode);
      if (idx >= 0) existing[idx] = client; else existing.push(client);
      changed = true;
    });
    if (changed) localStorage.setItem('dynamic_clients', JSON.stringify(existing));
  }).catch(() => {});
});
