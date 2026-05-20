/* ══════════════════════════════════════════════════════════════
   CLIENT CONFIG — add/edit clients here
   ══════════════════════════════════════════════════════════════
   Each client has:
   - id:        unique string (no spaces)
   - name:      display name
   - pin:       4-digit string
   - goal:      short label shown under their name
   - accent:    hex color for their theme
   - initials:  shown on avatar
   - avatarBg:  avatar background color
   - data:      the full program object (see below)
══════════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════════
   COACH CONFIG — set your PIN here
══════════════════════════════════════════════════════════════ */
const COACH = {
  name: 'Coach',
  pin: '9090',
  initials: 'ME',
};

const CLIENTS = [];

/* ══════════════════════════════════════════════════════════════
   APP STATE — Centralized state management (prevents global pollution)
══════════════════════════════════════════════════════════════ */
const AppState = {
  // Authentication & Navigation
  currentClient: null,
  pinBuffer: '',
  isCoachLogin: false,
  coachViewingClientId: null,
  
  // UI/Animation State
  milestoneQueue: [],
  milestoneQueueClient: null,
  confettiAnimId: null,
  confettiPieces: [],
  
  // Tabata Timer
  tabataState: null,
  tabataAudioCtx: null,
  wakeLock: null,
  tabataReturnScreen: 'login',

  // Onboarding
  obState: {},
  
  // Modals & Dialogs
  terminateCid: null,
  terminateName: null,
  terminatePending: null,
  notifTarget: null,
  
  // Feature-specific
  mealDay: 0,
  checkinState: { sleep: 0, stress: 0, energy: 0, adherence: 0, notes: '', photoB64: '' },
  _checkinShowAll: false,
  _mealLogShowAll: false,
  calYear: new Date().getFullYear(),
  calMonth: new Date().getMonth(),
  compareSelected: [],
  
  // Pending operations (Apple Shortcut sync)
  pendingFitClient: null,
  pendingFitToast: false,

  // Alt exercise modal
  altTarget: null,

  // Touch gesture state
  touchStartY: 0,

  // AI Program Review — keyed by client ID
  aiReviewState: {},

  // Coach Analytics panel toggle
  _analyticsOpen: false,

  // Movement Library edit state
  _libraryEditId: null,
  _librarySearch: '',

  // Nutrition tracker
  nutrDate: new Date().toISOString().slice(0, 10),
  _nutrSearchCid:  null,
  _nutrSearchMeal: null,
  _nutrSearchDate: null,
  _nutrCatFilter:  '',
};

/* ══════════════════════════════════════════════════════════════
   MOBILE KEYBOARD HINTS
   Dynamically stamp `inputmode` on number inputs so mobile shows
   a numeric keypad instead of the full QWERTY keyboard.
══════════════════════════════════════════════════════════════ */
document.addEventListener('focusin', e => {
  const el = e.target;
  if (!el || el.tagName !== 'INPUT') return;
  if (el.type !== 'number' || el.hasAttribute('inputmode')) return;
  const step = el.getAttribute('step');
  const allowsDecimal = step && step !== '1' && step !== '';
  const idLike = (el.id + ' ' + (el.placeholder || '')).toLowerCase();
  const isWeight = /weight|wt|lbs|kg|bf|body\s*fat|%|pct/.test(idLike);
  el.setAttribute('inputmode', (allowsDecimal || isWeight) ? 'decimal' : 'numeric');
  if (!el.hasAttribute('enterkeyhint')) el.setAttribute('enterkeyhint', 'done');
}, true);

/* ══════════════════════════════════════════════════════════════
   HAPTIC FEEDBACK
   Respect user's OS reduced-motion setting as a proxy for
   "disable all non-essential effects"
══════════════════════════════════════════════════════════════ */
const _hapticsEnabled = !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
function haptic(kind) {
  if (!_hapticsEnabled || !navigator.vibrate) return;
  try {
    const patterns = {
      tap:     10,
      light:   [8],
      medium:  [18],
      heavy:   [30],
      success: [12, 40, 18],
      warn:    [40, 30, 40],
      error:   [60, 40, 60, 40, 60],
    };
    navigator.vibrate(patterns[kind] ?? 10);
  } catch (e) {}
}

/* ══════════════════════════════════════════════════════════════
   WAKE LOCK — keep screen on during timers
   Reacquires automatically when tab returns to foreground
   (browser auto-releases on visibility change).
══════════════════════════════════════════════════════════════ */
const _wakeHolders = new Set();
let _wakeSentinel = null;
async function _wakeAcquire() {
  if (!('wakeLock' in navigator) || _wakeSentinel) return;
  try {
    _wakeSentinel = await navigator.wakeLock.request('screen');
    _wakeSentinel.addEventListener('release', () => { _wakeSentinel = null; });
  } catch (e) {}
}
function _wakeRelease() {
  if (_wakeSentinel) { _wakeSentinel.release().catch(() => {}); _wakeSentinel = null; }
}
function acquireWakeLock(key) {
  _wakeHolders.add(key || 'default');
  _wakeAcquire();
}
function releaseWakeLock(key) {
  _wakeHolders.delete(key || 'default');
  if (_wakeHolders.size === 0) _wakeRelease();
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && _wakeHolders.size > 0) _wakeAcquire();
});

/* ══════════════════════════════════════════════════════════════
   LONG-PRESS CONTEXT MENUS
   Any element with data-longpress="kind:arg1:arg2" gets a menu on
   long-press (touch) or right-click (desktop). Menu items are
   resolved by getContextMenuItems(kind, args).
══════════════════════════════════════════════════════════════ */
(function() {
  const LP_DELAY = 450;
  const LP_MOVE_CANCEL = 10;
  let lpTimer = null, lpStartX = 0, lpStartY = 0, lpJustFired = false;
  function lpFire(target) {
    const action = target.dataset.longpress;
    if (!action) return;
    const [kind, ...rest] = action.split(':');
    if (typeof haptic === 'function') haptic('medium');
    lpJustFired = true;
    setTimeout(() => { lpJustFired = false; }, 500);
    showContextMenu(kind, rest);
  }
  document.addEventListener('touchstart', e => {
    const target = e.target.closest?.('[data-longpress]');
    if (!target) return;
    const t = e.touches[0];
    lpStartX = t.clientX; lpStartY = t.clientY;
    if (lpTimer) clearTimeout(lpTimer);
    lpTimer = setTimeout(() => { lpTimer = null; lpFire(target); }, LP_DELAY);
  }, { passive: true });
  document.addEventListener('touchmove', e => {
    if (!lpTimer) return;
    const t = e.touches[0];
    if (Math.abs(t.clientX - lpStartX) > LP_MOVE_CANCEL || Math.abs(t.clientY - lpStartY) > LP_MOVE_CANCEL) {
      clearTimeout(lpTimer); lpTimer = null;
    }
  }, { passive: true });
  const cancel = () => { if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; } };
  document.addEventListener('touchend', cancel, { passive: true });
  document.addEventListener('touchcancel', cancel, { passive: true });
  document.addEventListener('contextmenu', e => {
    const target = e.target.closest?.('[data-longpress]');
    if (!target) return;
    e.preventDefault();
    lpFire(target);
  });
  // Swallow the synthetic click that follows a long-press, so the underlying
  // card's onclick doesn't also fire once the context menu is open.
  document.addEventListener('click', e => {
    if (!lpJustFired) return;
    if (!e.target.closest?.('.ctx-menu-sheet')) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, true);
})();

/* ══════════════════════════════════════════════════════════════
   DELEGATED EVENT DISPATCHER (CSP-friendly handler pattern)
   New code should prefer `data-act="fnName"` (+ optional `data-args="a,b"`)
   over inline `onclick="fnName('a','b')"`. The dispatcher below routes
   matching clicks to the named global function — which removes the need
   for `'unsafe-inline'` in script-src CSP, shrinks template strings, and
   keeps handler attachment centralised.

   Example:
     // OLD:
     `<button onclick="saveWeight('${cid}')">Save</button>`
     // NEW:
     `<button data-act="saveWeight" data-args="${esc(cid)}">Save</button>`

   The dispatcher only fires when the element opts in via `data-act`, so
   existing inline `onclick=` handlers continue to work side-by-side
   during migration.
══════════════════════════════════════════════════════════════ */
document.addEventListener('click', e => {
  const t = e.target.closest?.('[data-act]');
  if (!t) return;
  // Backdrop / self-only handlers: only fire when the click landed on the
  // element itself, not on a child. Used for modal-backdrop close.
  if (t.dataset.actSelf === '1' && e.target !== t) return;
  const fnName = t.dataset.act;
  const fn = typeof window[fnName] === 'function' ? window[fnName] : null;
  if (!fn) return;
  const args = t.dataset.args ? t.dataset.args.split('|') : [];
  try { fn.apply(t, [...args, e]); }
  catch (err) { console.error('Delegated handler error (' + fnName + '):', err); }
});

// Mirror for `oninput` — needed for form fields like checkin notes and the
// terminate-confirm input. Same `data-act` convention; element receives the
// event as the only arg.
document.addEventListener('input', e => {
  const t = e.target.closest?.('[data-input-act]');
  if (!t) return;
  const fn = typeof window[t.dataset.inputAct] === 'function' ? window[t.dataset.inputAct] : null;
  if (!fn) return;
  try { fn.call(t, e); }
  catch (err) { console.error('Delegated input handler error:', err); }
});

// Keyboard activation for `role="button"` / custom clickable elements with
// data-act. Real <button> elements already fire click on Enter/Space, so
// we only need to forward for non-button roles.
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const t = e.target.closest?.('[data-act]');
  if (!t) return;
  if (t.tagName === 'BUTTON') return; // native handling
  // Only auto-activate elements that opt in via tabindex or button role
  if (t.getAttribute('role') !== 'button' && !t.hasAttribute('tabindex')) return;
  e.preventDefault();
  t.click();
});

function showContextMenu(kind, args) {
  const items = (typeof getContextMenuItems === 'function') ? getContextMenuItems(kind, args) : [];
  if (!items || !items.length) return;
  const backdrop = document.createElement('div');
  backdrop.className = 'ctx-menu-backdrop';
  backdrop.onclick = e => { if (e.target === backdrop) backdrop.remove(); };
  const sheet = document.createElement('div');
  sheet.className = 'ctx-menu-sheet';
  sheet.innerHTML = items.map((it, i) =>
    `<button class="ctx-menu-item${it.danger ? ' danger' : ''}" data-idx="${i}">
       <span class="ctx-menu-icon">${it.icon || ''}</span>
       <span class="ctx-menu-label">${esc(it.label)}</span>
     </button>`).join('');
  sheet.onclick = e => {
    const btn = e.target.closest('.ctx-menu-item');
    if (!btn) return;
    const it = items[parseInt(btn.dataset.idx)];
    backdrop.remove();
    try { it.action(); } catch (err) { console.error(err); }
  };
  backdrop.appendChild(sheet);
  document.body.appendChild(backdrop);
  requestAnimationFrame(() => backdrop.classList.add('visible'));
}

function getContextMenuItems(kind, args) {
  if (kind === 'client') {
    const cid = args[0];
    const paused = (typeof isClientPaused === 'function') && isClientPaused(cid);
    return [
      { icon: '👁', label: 'View as client',   action: () => coachViewAsClient(cid) },
      { icon: '✏️', label: 'Edit client',      action: () => coachEditClient(cid) },
      { icon: '🔑', label: 'View PIN',         action: () => coachViewPin(cid) },
      { icon: '📧', label: 'Email PIN',        action: () => emailClientCredentials(cid) },
      { icon: paused ? '▶' : '⏸', label: paused ? 'Unpause access' : 'Pause access', action: () => togglePauseClient(cid) },
      { icon: '🗑', label: 'Terminate',        danger: true, action: () => openTerminateModal(cid) },
    ];
  }
  if (kind === 'fitlog') {
    const cid = args[0], idx = parseInt(args[1]);
    return [
      { icon: '📋', label: 'Duplicate to today', action: () => duplicateFitLog(cid, idx) },
      { icon: '🗑', label: 'Delete entry', danger: true, action: () => deleteFitLog(cid, idx) },
    ];
  }
  return [];
}

/* ══════════════════════════════════════════════════════════════
   UTILITY: Safe DOM queries & error handling
══════════════════════════════════════════════════════════════ */
function esc(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
async function hashPin(pin) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}
function pinsMatch(storedPin, enteredPin) {
  // stored pin is either a 64-char hex hash or a legacy 4-digit plaintext
  if (!storedPin || !enteredPin) return false;
  if (storedPin.length === 64) {
    // async hash comparison not possible synchronously — caller must use hashPin() first
    return false;
  }
  return storedPin === enteredPin; // legacy plaintext
}
function safeGetElement(id) {
  try {
    const el = document.getElementById(id);
    if (!el) console.warn(`DOM element not found: ${id}`);
    return el;
  } catch (e) {
    console.error(`Error getting element ${id}:`, e);
    return null;
  }
}

function safeJSON(jsonStr, fallback = null) {
  if (jsonStr == null) return fallback;
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.warn(`JSON parse error:`, e);
    return fallback;
  }
}

function getLS(key, fallback = null) {
  return safeJSON(localStorage.getItem(key), fallback);
}

/* ══════════════════════════════════════════════════════════════
   SCHEMA VERSIONING
   Bump LS_SCHEMA_VERSION whenever a localStorage key is renamed,
   restructured, or removed. Add a migration block below.
══════════════════════════════════════════════════════════════ */
const LS_SCHEMA_VERSION = 2;
function migrateSchema() {
  const stored = parseInt(localStorage.getItem('ls_schema_v') || '0');
  if (stored >= LS_SCHEMA_VERSION) return;
  // ── v0 → v1: initial stamp, no structural changes needed ──
  // ── v1 → v2: compact sparse sets arrays in workout logger keys.
  //   wlUpdate could assign data.exercises[i].sets[3] = {} on a length-1
  //   array, creating holes that JSON serialised as nulls. Any later
  //   reader doing sets.filter(s => s.weight) crashed on the null entry,
  //   which was bringing down the WORK tab and the calendar render.
  if (stored < 2) {
    try {
      const compactSets = (exercises) => {
        if (!exercises || typeof exercises !== 'object') return;
        Object.values(exercises).forEach(ex => {
          if (!ex || !Array.isArray(ex.sets)) return;
          ex.sets = ex.sets.filter(s => s != null);
          ex.sets.forEach(s => {
            if (s && Array.isArray(s.drops)) s.drops = s.drops.filter(d => d != null);
          });
        });
      };
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || !(k.startsWith('wl_') || k.startsWith('wl_hist_'))) continue;
        const v = safeJSON(localStorage.getItem(k), null);
        if (!v) continue;
        if (k.startsWith('wl_hist_') && Array.isArray(v)) {
          v.forEach(entry => compactSets(entry?.exercises));
          localStorage.setItem(k, JSON.stringify(v));
        } else if (v.exercises) {
          compactSets(v.exercises);
          localStorage.setItem(k, JSON.stringify(v));
        }
      }
    } catch (e) { console.warn('v2 sets compaction skipped:', e); }
  }
  localStorage.setItem('ls_schema_v', String(LS_SCHEMA_VERSION));
}
migrateSchema();

/* ══════════════════════════════════════════════════════════════
   UTILITY: Input Validation
══════════════════════════════════════════════════════════════ */
function validatePin(pin) {
  return typeof pin === 'string' && /^\d{4}$/.test(pin);
}

function validateWeight(val) {
  const num = parseFloat(val);
  return !isNaN(num) && num >= 50 && num <= 500;
}

function validateCalories(val) {
  const num = parseInt(val);
  return !isNaN(num) && num >= 0 && num <= 10000;
}

function validateHR(val) {
  const num = parseInt(val);
  return !isNaN(num) && num >= 30 && num <= 250;
}

/* ══════════════════════════════════════════════════════════════
   UTILITY: Extracted DRY Functions
══════════════════════════════════════════════════════════════ */
function calculateWeightProgress(client) {
  if (!client?.weightLoss) return null;
  const wl = client.weightLoss;
  const current = getCurrentWeight(client);
  const lost = wl.start - current;
  const totalToLose = wl.start - wl.goal;
  const pct = Math.min(100, Math.max(0, Math.round((lost / totalToLose) * 100)));
  const remaining = Math.max(0, current - wl.goal);
  const done = current <= wl.goal;
  return { current, lost, totalToLose, pct, remaining, done };
}

/* ══════════════════════════════════════════════════════════════
   SCREEN TRANSITIONS
══════════════════════════════════════════════════════════════ */
function showScreen(id) {
  try {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = safeGetElement('screen-' + id);
    if (screen) screen.classList.add('active');
  } catch (e) {
    console.error(`Error showing screen ${id}:`, e);
  }
}

/* ══════════════════════════════════════════════════════════════
   BUILD LOGIN
══════════════════════════════════════════════════════════════ */
function buildLogin() {
  // Login screen is now PIN-first — no client grid needed
  // Keep function for compatibility with other callers
}

/* ══════════════════════════════════════════════════════════════
   PIN FLOW
══════════════════════════════════════════════════════════════ */
function selectClient(id) {
  try {
    const client = getAllClients().find(c => c.id === id);
    if (!client) throw new Error(`Client not found: ${id}`);
    AppState.currentClient = client;
    AppState.pinBuffer = '';
    const pinName = safeGetElement('pinName');
    const pinError = safeGetElement('pinError');
    if (pinName) {
      pinName.textContent = client.name;
      pinName.style.color = client.accent;
    }
    if (pinError) pinError.textContent = '';
    updatePinDots('');
    showScreen('pin');
  } catch (e) {
    console.error('Error selecting client:', e);
  }
}

function updatePinDots(buf, mode) {
  try {
    const dots = document.querySelectorAll('.pin-dot');
    dots.forEach((d, i) => {
      d.className = 'pin-dot';
      d.style.borderColor = '';
      d.style.background = '';
      if (mode === 'error') {
        d.classList.add('error');
        d.style.borderColor = '#e74c3c';
        d.style.background = '#e74c3c';
      } else if (i < buf.length) {
        d.classList.add('filled');
        const accentColor = AppState.currentClient?.accent || '#e8ff47';
        d.style.borderColor = accentColor;
        d.style.background = accentColor;
      }
    });
  } catch (e) {
    console.error('Error updating PIN dots:', e);
  }
}

function pinKey(k) {
  try {
    if (AppState.pinBuffer.length >= 4) return;
    haptic('tap');
    AppState.pinBuffer += k;
    updatePinDots(AppState.pinBuffer);
    if (AppState.pinBuffer.length === 4) {
      setTimeout(() => handlePinSubmit(), 150);
    }
  } catch (e) {
    console.error('Error processing PIN key:', e);
  }
}

function handlePinSubmit() {
  try {
    const pin = AppState.pinBuffer;
    // Check brute-force lockout
    const lockKey = 'pin_lockout';
    const lockData = safeJSON(localStorage.getItem(lockKey), { count: 0, until: 0 });
    if (lockData.until > Date.now()) {
      const secsLeft = Math.ceil((lockData.until - Date.now()) / 1000);
      const pinError = safeGetElement('pinError');
      if (pinError) pinError.textContent = `Too many attempts — wait ${secsLeft}s`;
      AppState.pinBuffer = '';
      updatePinDots('');
      return;
    }
    handlePinSubmitAsync(pin, lockData, lockKey);
  } catch (e) {
    console.error('Error processing PIN submit:', e);
  }
}
// Pull a single client's profile row from the cloud and store it locally.
// Used on first login from a new device, where localStorage is empty but
// the session token is now valid. Returns the client object or null.
async function _hydrateClientFromCloud(cid) {
  try {
    if (typeof sbSelect !== 'function') return null;
    const rows = await sbSelect('clients', `select=*&id=eq.${encodeURIComponent(cid)}`);
    if (!Array.isArray(rows) || !rows.length) return null;
    const row = rows[0];
    const client = {
      id:          row.id,
      name:        row.name,
      pin:         row.pin || '',
      goal:        row.goal || '',
      accent:      row.accent || '#ff6b35',
      programType: row.program_type || '',
      data:        safeJSON(row.data, {}),
      _meta:       safeJSON(row.meta, {}),
      weightLoss:  safeJSON(row.weight_loss, null),
      _updated_at: row.updated_at,
    };
    const dyn = getDynamicClients();
    const idx = dyn.findIndex(c => c.id === cid);
    if (idx >= 0) dyn[idx] = client; else dyn.push(client);
    localStorage.setItem('dynamic_clients', JSON.stringify(dyn));
    if (row.mode) localStorage.setItem('client_mode_' + cid, row.mode);
    // Pull the rest of their data (logs, checkins, etc.) in the background
    if (typeof pullClientData === 'function') { try { await pullClientData(cid); } catch (_) {} }
    return getAllClients().find(c => c.id === cid) || client;
  } catch (e) {
    console.error('Hydrate client failed:', e);
    return null;
  }
}

async function handlePinSubmitAsync(pin, lockData, lockKey) {
  try {
    // PIN is verified server-side via /api/login. The function returns
    // a signed session token used for every subsequent Supabase call.
    const role = AppState.isCoachLogin ? 'coach' : 'client';
    // Show a verifying state — the round-trip can take a beat on mobile
    const _subEl = safeGetElement('pinSub');
    const _subPrev = _subEl ? _subEl.textContent : '';
    if (_subEl) _subEl.textContent = 'Verifying…';
    const _dots = document.querySelectorAll('.pin-dot');
    _dots.forEach(d => d.classList.add('verifying'));
    const res  = await apiLogin(role, pin);
    _dots.forEach(d => d.classList.remove('verifying'));
    if (_subEl && _subEl.textContent === 'Verifying…') _subEl.textContent = _subPrev;

    if (res.ok) {
      localStorage.setItem(lockKey, JSON.stringify({ count: 0, until: 0 }));

      if (role === 'coach') {
        AppState.isCoachLogin = false;
        haptic('success');
        fireTransition(() => launchCoach(), 'Coach', 'COACH ACCESS');
        return;
      }

      // Client login: server returned the client_id; resolve to a local row.
      // On a fresh device the client won't be in localStorage yet — now that
      // we hold a valid token, pull their profile from the cloud first.
      let matched = getAllClients().find(c => c.id === res.clientId);
      if (!matched) {
        const subEl = safeGetElement('pinSub');
        if (subEl) subEl.textContent = 'Loading your profile…';
        matched = await _hydrateClientFromCloud(res.clientId);
      }
      if (!matched) {
        const pinError = safeGetElement('pinError');
        if (pinError) pinError.textContent = 'Could not load your profile — check connection';
        setTimeout(() => { AppState.pinBuffer = ''; updatePinDots(''); }, 1800);
        return;
      }
      if (isClientPaused(matched.id)) {
        const pinError = safeGetElement('pinError');
        if (pinError) pinError.textContent = 'Access paused — contact your coach';
        setTimeout(() => { AppState.pinBuffer = ''; updatePinDots(''); }, 1800);
        return;
      }
      AppState.currentClient = matched;
      const pinName = safeGetElement('pinName');
      if (pinName) { pinName.textContent = matched.name; pinName.style.color = matched.accent; }
      const subEl = safeGetElement('pinSub');
      if (subEl) subEl.textContent = 'Welcome back!';
      haptic('success');
      fireTransition(() => launchApp(), matched.name, 'IDENTITY CONFIRMED');
      return;
    }

    // ── Login failed ──────────────────────────────────────────────
    // Server enforces its own rate-limit (429) — if we hit it, surface it.
    if (res.status === 429) {
      const pinError = safeGetElement('pinError');
      if (pinError) pinError.textContent = 'Too many attempts — wait a few minutes';
      haptic('error');
      AppState.pinBuffer = '';
      setTimeout(() => updatePinDots(''), 600);
      return;
    }

    // Otherwise: count locally and back off with the existing UX
    lockData.count = (lockData.count || 0) + 1;
    if (lockData.count >= 5) {
      lockData.lockouts = (lockData.lockouts || 0) + 1;
      const backoff = Math.min(30 * Math.pow(2, lockData.lockouts - 1), 600);
      lockData.until = Date.now() + backoff * 1000;
      lockData.count = 0;
    }
    localStorage.setItem(lockKey, JSON.stringify(lockData));
    const attemptsLeft = 5 - lockData.count;
    const pinError = safeGetElement('pinError');
    if (pinError) {
      if (lockData.until > Date.now()) {
        const secs = Math.ceil((lockData.until - Date.now()) / 1000);
        pinError.textContent = secs >= 60 ? `Too many attempts — locked ${Math.ceil(secs/60)}m` : `Too many attempts — locked ${secs}s`;
      } else {
        pinError.textContent = res.error || `Incorrect PIN${attemptsLeft <= 2 ? ` · ${attemptsLeft} attempt${attemptsLeft!==1?'s':''} left` : ''}`;
      }
    }
    haptic('error');
    const dots = document.querySelectorAll('.pin-dot');
    dots.forEach(d => { d.style.borderColor = '#e74c3c'; d.style.background = '#e74c3c'; });
    setTimeout(() => {
      AppState.pinBuffer = '';
      updatePinDots('');
      const el = safeGetElement('pinError');
      if (el) el.textContent = '';
    }, 900);
  } catch (e) {
    console.error('Error handling PIN submission:', e);
  }
}

function pinDel() {
  try {
    if (AppState.pinBuffer.length > 0) haptic('light');
    AppState.pinBuffer = AppState.pinBuffer.slice(0, -1);
    updatePinDots(AppState.pinBuffer);
  } catch (e) {
    console.error('Error deleting PIN digit:', e);
  }
}

function goBack() {
  try {
    AppState.pinBuffer = '';
    AppState.isCoachLogin = false;
    AppState.currentClient = null;
    const pinName = safeGetElement('pinName');
    if (pinName) {
      pinName.textContent = 'Enter PIN';
      pinName.style.color = 'var(--text)';
    }
    const subEl = safeGetElement('pinSub');
    if (subEl) subEl.textContent = '4-digit PIN to access your profile';
    showScreen('login');
  } catch (e) {
    console.error('Error going back:', e);
  }
}

/* ══════════════════════════════════════════════════════════════
   LAUNCH APP
══════════════════════════════════════════════════════════════ */
function fireTransition(callback, name, subLabel) {
  const overlay   = document.getElementById('fireOverlay');
  if (!overlay) { callback(); return; }

  const linesEl   = document.getElementById('termLines');
  const nameEl    = document.getElementById('termName');
  const subEl     = document.getElementById('termSub');
  const grantedEl = document.getElementById('termGranted');

  // Reset
  [linesEl, nameEl, subEl, grantedEl].forEach(el => { if (el) { el.style.animation = 'none'; el.style.opacity = '0'; el.innerHTML = el === linesEl ? '' : el.innerHTML; } });
  overlay.style.transition = '';
  overlay.style.opacity = '0';
  overlay.classList.add('active');

  const firstName   = (name || 'User').split(' ')[0].toUpperCase();
  const isPixie     = firstName === 'PIXIE';
  const displayName = isPixie ? 'CRAZYY LOVES PIXIE' : firstName;
  const displaySub  = isPixie ? 'WELCOME BACK 🖤' : (subLabel || 'IDENTITY CONFIRMED');

  // Terminal lines sequence
  const lines = [
    { text: '> SYSTEM ONLINE', delay: 80,  accent: false },
    { text: '> SCANNING CREDENTIALS...', delay: 260, accent: false },
    { text: '> BIOMETRIC MATCH: CONFIRMED', delay: 520, accent: true  },
    { text: '> CLEARANCE LEVEL: AUTHORIZED', delay: 720, accent: false },
    { text: '> INITIALIZING INTERFACE...', delay: 920, accent: false  },
  ];

  // Show overlay
  requestAnimationFrame(() => {
    overlay.style.transition = 'opacity .06s';
    overlay.style.opacity = '1';
  });

  // Sequence terminal lines
  lines.forEach(({ text, delay, accent }) => {
    setTimeout(() => {
      if (!linesEl) return;
      const span = document.createElement('span');
      span.className = 'term-line' + (accent ? ' accent' : '');
      span.textContent = text;
      span.style.animationDelay = '0s';
      linesEl.appendChild(span);
    }, delay);
  });

  // Big name reveal
  setTimeout(() => {
    if (nameEl) {
      nameEl.textContent = displayName;
      nameEl.style.animation = 'none';
      nameEl.offsetHeight;
      nameEl.style.animation = 'termNameIn .4s ease forwards';
    }
    if (subEl) {
      subEl.textContent = displaySub;
      subEl.style.transition = 'opacity .3s';
      subEl.style.opacity = '1';
    }
  }, 1050);

  // ACCESS GRANTED flash
  setTimeout(() => {
    if (grantedEl) {
      grantedEl.textContent = '// ACCESS GRANTED';
      grantedEl.style.animation = 'none';
      grantedEl.offsetHeight;
      grantedEl.style.opacity = '1';
      grantedEl.style.animation = 'termGranted .25s steps(1) infinite';
    }
  }, 1500);

  // Launch app after 3s welcome
  setTimeout(() => { try { callback(); } catch(e) { console.error('Transition callback error:', e); } }, 2900);

  // Safety net — always clear overlay even if callback fails
  setTimeout(() => {
    overlay.style.opacity = '0';
    overlay.classList.remove('active');
  }, 4500);

  // Fade out overlay
  setTimeout(() => {
    overlay.style.transition = 'opacity .2s';
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.classList.remove('active');
      if (linesEl) linesEl.innerHTML = '';
      [nameEl, subEl, grantedEl].forEach(el => { if (el) { el.style.opacity = '0'; el.style.animation = 'none'; } });
    }, 220);
  }, 3100);
}

/* ── TAB BAR BUILDER ── shared by launchApp + launchClientView ── */
const _TAB_SVG = {
  home:        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5L12 3l9 7.5V21H15v-6H9v6H3z"/></svg>`,
  schedule:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`,
  workouts:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h2m12 0h2M6 8.5v7M18 8.5v7M2 10.5v3M22 10.5v3M8 12h8"/></svg>`,
  endurance:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="2 12 5.5 6 9.5 15.5 13.5 8.5 17 13 22 7"/></svg>`,
  nutrition:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 5V3M9 5.5C9 4 10 3 12 3s3 1 3 2.5"/><path d="M12 9v4l3 2"/></svg>`,
  fitness:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="15" width="4" height="6" rx="1"/><rect x="10" y="10" width="4" height="11" rx="1"/><rect x="17" y="4" width="4" height="17" rx="1"/></svg>`,
  milestones:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4a1 1 0 00-1 1v4a1 1 0 001 1h2l4 4V5L6 9z"/><path d="M15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13"/></svg>`,
  progression: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
};
const _TAB_LBL = {home:'HOME',schedule:'PLAN',workouts:'WORK',endurance:'ENDU',nutrition:'NUTR',fitness:'LOG',milestones:'WINS',progression:'PROG'};
const _TAB_MORE_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><circle cx="5" cy="12" r="1.25" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.25" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.25" fill="currentColor" stroke="none"/></svg>`;

function buildTabBarHTML(tabs) {
  return (tabs || []).filter(t => t.id !== 'macros').map((t, i) => {
    const svg = _TAB_SVG[t.id] || _TAB_SVG.fitness;
    const lbl = _TAB_LBL[t.id] || t.label.slice(0, 4).toUpperCase();
    const isFirst = i === 0;
    return `<button class="tab-item${isFirst?' active':''}" data-tid="${esc(t.id)}" onclick="switchTab(this.dataset.tid,this)" aria-label="${esc(lbl)} tab"${isFirst ? ' aria-current="page"' : ''}><span class="tab-icon" aria-hidden="true">${svg}</span><span class="tab-label">${lbl}</span></button>`;
  }).join('') + `<button class="tab-item" onclick="openMoreMenu()" aria-label="More menu"><span class="tab-icon" aria-hidden="true">${_TAB_MORE_SVG}</span><span class="tab-label">MORE</span></button>`;
}

function launchApp() {
  try {
    const c = AppState.currentClient;
    if (!c) throw new Error('No client selected');
    currentClient = c; // sync for feature screens (openFeature / renderFeature)
    
    document.documentElement.style.setProperty('--accent', c.accent);
    const clientName = safeGetElement('appClientName');
    const clientGoal = safeGetElement('appClientGoal');
    if (clientName) clientName.textContent = c.name + '\'s Program';
    if (clientGoal) clientGoal.textContent = c.goal;

    // Goals banner (replaces old weight-loss-only banner)
    const header = safeGetElement('appHeader');
    const existing = safeGetElement('wt-banner');
    if (existing) existing.remove();
    const goalBannerHtml = buildGoalsBannerHTML(c);
    if (goalBannerHtml && header) {
      const banner = document.createElement('div');
      banner.className = 'wt-banner';
      banner.id = 'wt-banner';
      banner.innerHTML = goalBannerHtml;
      header.appendChild(banner);
    }

    // Build tab bar (ensure Home is always first)
    if (c.data?.tabs && !c.data.tabs.some(t => t.id === 'home')) {
      c.data.tabs.unshift({ id: 'home', label: 'Home' });
    }
    // Drop legacy 'macros' tab — the Nutrition tab owns macro tracking now
    if (c.data?.tabs?.some(t => t.id === 'macros')) {
      c.data.tabs = c.data.tabs.filter(t => t.id !== 'macros');
      try {
        const _dyn = getDynamicClients();
        const _i = _dyn.findIndex(cl => cl.id === c.id);
        if (_i >= 0) { _dyn[_i].data = c.data; localStorage.setItem('dynamic_clients', JSON.stringify(_dyn)); }
        if (typeof sbAutoSync === 'function') sbAutoSync(c.id);
      } catch (_) {}
    }
    const tabBar = safeGetElement('tabBar');
    if (tabBar && c.data?.tabs) {
      tabBar.innerHTML = buildTabBarHTML(c.data.tabs);
    }

    // Switch screen first — must happen regardless of render errors
    showScreen('app');
    // Track last seen — store locally AND in _meta so sbAutoSync pushes it to Supabase
    const _lsNow = Date.now();
    localStorage.setItem('last_seen_' + c.id, _lsNow);
    try {
      const _dynC = getDynamicClients();
      const _dynIdx = _dynC.findIndex(cl => cl.id === c.id);
      if (_dynIdx >= 0) {
        _dynC[_dynIdx]._meta = Object.assign({}, _dynC[_dynIdx]._meta || {}, { last_seen: _lsNow });
        localStorage.setItem('dynamic_clients', JSON.stringify(_dynC));
      }
    } catch (_e) {}
    // Show skeleton first, then build content (gives browser 1 paint to show skeleton)
    const _acSkel = document.getElementById('appContent');
    if (_acSkel) _acSkel.innerHTML = buildSkeleton();
    // Render content after one frame so the skeleton actually paints first
    requestAnimationFrame(() => renderContent(c));

    // Chain post-render work so timers don't fire in parallel. Each step is
    // wrapped so a failure doesn't cancel the chain. Total budget ~3s.
    const _stillCurrent = () => AppState.currentClient && AppState.currentClient.id === c.id;
    const _safe = fn => { try { fn(); } catch (e) { console.error(e); } };

    // Kick off the cloud pull immediately, but only re-render once data has
    // actually changed (compare _updated_at) — avoids the gratuitous second
    // renderContent that runs even when nothing changed.
    const _localUpdatedAt = (() => {
      const d = getDynamicClients().find(cl => cl.id === c.id);
      return d?._updated_at || null;
    })();
    sbAutoSync(c.id);
    pullClientData(c.id).then(() => {
      const fresh = getAllClients().find(cl => cl.id === c.id);
      if (!_stillCurrent() || !fresh) return;
      AppState.currentClient = fresh;
      currentClient = fresh;
      if (fresh._updated_at !== _localUpdatedAt) renderContent(fresh);
    }).catch(() => {});

    setTimeout(() => {
      _safe(() => processSharedPhoto(c.id));
      setTimeout(() => {
        if (_stillCurrent()) _safe(() => checkMilestones(c));
        setTimeout(() => {
          _safe(() => showTutorial(c.id));
          if (VAPID_PUBLIC_KEY) {
            setTimeout(() => _safe(() => requestPushPermission(c.id)), 1800);
          }
        }, 400);
      }, 400);
    }, 400);
  } catch (e) {
    console.error('Error launching app:', e);
  }
}

/* ──────────────────────────────────────────────────────────────
   SHARE TARGET — pull photo cached by SW from POST /share-target
────────────────────────────────────────────────────────────── */
async function processSharedPhoto(cid) {
  const params = new URLSearchParams(location.search);
  if (params.get('share') !== 'photo') return;
  if (!cid || !('caches' in window)) return;
  try {
    const cache = await caches.open('share-cache');
    const res = await cache.match('/_shared_photo');
    if (!res) return;
    const blob = await res.blob();
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const MAX = 900, scale = img.width > MAX ? MAX / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        const b64 = canvas.toDataURL('image/jpeg', 0.75);
        const photos = (typeof getPhotos === 'function') ? getPhotos(cid) : [];
        photos.push({ date: new Date().toISOString(), src: b64, source: 'Shared' });
        if (typeof savePhotos === 'function') savePhotos(cid, photos);
        if (typeof showFitToast === 'function') showFitToast('✓ Shared photo saved to gallery');
        cache.delete('/_shared_photo');
        // Clean ?share=photo from URL so a refresh doesn't reprocess
        history.replaceState({}, '', location.pathname);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(blob);
  } catch (e) { console.error('Shared photo handling failed:', e); }
}

function getCurrentWeight(c) {
  const stored = localStorage.getItem('wt_current_' + c.id);
  return stored ? parseFloat(stored) : c.weightLoss.start;
}

function buildBannerHTML(c) {
  try {
    if (!c?.weightLoss) return '';
    const progress = calculateWeightProgress(c);
    if (!progress) return '';
    
    const { current, lost, totalToLose, pct, remaining, done } = progress;
    const wl = c.weightLoss;

    return `
      <div class="wt-row">
        <div class="wt-stat">
          <div class="wt-stat-val">${wl.start}</div>
          <div class="wt-stat-lbl">Start</div>
        </div>
        <div style="flex:1;padding:0 12px">
          <div class="wt-track">
            <div class="wt-fill" style="width:${pct}%"></div>
          </div>
          <div class="wt-meta" style="margin-top:6px">
            <span class="wt-remaining">${done ? '🎯 Goal reached!' : remaining + ' ' + wl.unit + ' to go'}</span>
            <span class="wt-pct">${pct}%</span>
          </div>
        </div>
        <div class="wt-stat">
          <div class="wt-stat-val accent">${wl.goal}</div>
          <div class="wt-stat-lbl">Goal</div>
        </div>
      </div>
      ${lost > 0 ? `<div style="text-align:center;margin-bottom:8px"><span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--accent)">▼ ${lost.toFixed(1)} ${wl.unit} lost</span>${done ? ' <span style="color:#2ecc71">· Goal achieved! 🎉</span>' : ''}</div>` : ''}
      <div class="wt-edit">
        <input class="wt-input" id="wt-input-${c.id}" type="number" step="0.1" min="50" max="500"
          placeholder="Update current weight (${wl.unit})" value="">
        <button class="wt-save" onclick="saveWeight('${c.id}')">Log Weight</button>
      </div>`;
  } catch (e) {
    console.error('Error building banner:', e);
    return '';
  }
}

function saveWeight(cid) {
  try {
    const input = safeGetElement('wt-input-' + cid);
    if (!input) throw new Error('Weight input not found');
    
    const val = parseFloat(input.value);
    if (!validateWeight(val)) {
      input.style.borderColor = '#e74c3c';
      setTimeout(() => input.style.borderColor = '', 800);
      return;
    }
    
    localStorage.setItem('wt_current_' + cid, val);
    input.value = '';
    input.placeholder = '✓ Saved!';
    setTimeout(() => {
      input.placeholder = 'Update current weight (' + (AppState.currentClient?.weightLoss?.unit || 'lbs') + ')';
    }, 1500);
    
    // Re-render banner
    const banner = safeGetElement('wt-banner');
    if (banner && AppState.currentClient) {
      banner.innerHTML = buildGoalsBannerHTML(AppState.currentClient);
      checkMilestones(AppState.currentClient);
    }
    sbAutoSync(cid);
  } catch (e) {
    console.error('Error saving weight:', e);
  }
}

/* ══ GOALS SYSTEM ═══════════════════════════════════════════ */
const GOAL_ICONS  = { weight: '⚖️', runtime: '🏃', lift: '🏋️' };
const GOAL_COLORS = { weight: '#3498db', runtime: '#2ecc71', lift: '#e74c3c' };

function getClientGoals(cid) { return getLS('client_goals_' + cid, []); }
function saveClientGoals(cid, goals) { localStorage.setItem('client_goals_' + cid, JSON.stringify(goals)); }
function getGoalHistory(cid, goalId) {
  return getLS('goal_cur_' + cid + '_' + goalId, []);
}
function getGoalCurrent(cid, goalId) {
  // backward-compat: old format was a plain number string
  const raw = localStorage.getItem('goal_cur_' + cid + '_' + goalId);
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length) return parsed[parsed.length - 1].val;
    return parseFloat(raw) || null; // legacy plain number
  } catch { return parseFloat(raw) || null; }
}
function saveGoalCurrent(cid, goalId, val) {
  const history = getGoalHistory(cid, goalId);
  // migrate legacy plain-number entry
  if (history.length === 0) {
    const raw = localStorage.getItem('goal_cur_' + cid + '_' + goalId);
    if (raw !== null) {
      const legacy = parseFloat(raw);
      if (!isNaN(legacy)) history.push({ val: legacy, date: new Date().toISOString() });
    }
  }
  history.push({ val, date: new Date().toISOString() });
  localStorage.setItem('goal_cur_' + cid + '_' + goalId, JSON.stringify(history));
}
function formatRuntime(sec) {
  const m = Math.floor(sec / 60), s = Math.round(sec % 60);
  return m + ':' + String(s).padStart(2, '0');
}
function parseRuntime(str) {
  const s = String(str || '').trim();
  if (s.includes(':')) { const [m, sec] = s.split(':'); return (parseInt(m)||0)*60 + (parseInt(sec)||0); }
  return parseFloat(s) || 0;
}
function displayGoalValue(goal, val) {
  if (val === null || val === undefined) return '—';
  if (goal.type === 'runtime') return formatRuntime(val);
  return String(val) + (goal.unit ? ' ' + goal.unit : '');
}
function calcGoalProgress(goal, current) {
  const cur = (current !== null && current !== undefined) ? current : goal.start;
  if (goal.type === 'lift') {
    const span = goal.target - goal.start;
    const pct = span <= 0 ? 0 : Math.min(100, Math.round(Math.max(0, cur - goal.start) / span * 100));
    return { cur, pct, remaining: Math.max(0, goal.target - cur), done: cur >= goal.target };
  } else {
    const span = goal.start - goal.target;
    const pct = span <= 0 ? 0 : Math.min(100, Math.round(Math.max(0, goal.start - cur) / span * 100));
    return { cur, pct, remaining: Math.max(0, cur - goal.target), done: cur <= goal.target };
  }
}

function migrateWeightLoss(c) {
  if (!c?.weightLoss) return;
  const existing = getClientGoals(c.id);
  if (existing.some(g => g._migrated)) return;
  const wl = c.weightLoss;
  const goal = { id: 'wl_migrated', type: 'weight', label: 'Weight Loss',
    start: parseFloat(wl.start) || 0, target: parseFloat(wl.goal) || 0,
    unit: wl.unit || 'lbs', _migrated: true };
  const stored = localStorage.getItem('wt_current_' + c.id);
  if (stored !== null) saveGoalCurrent(c.id, goal.id, parseFloat(stored));
  saveClientGoals(c.id, [goal, ...existing]);
}

function buildGoalSparkline(cid, goalId, color) {
  const history = getGoalHistory(cid, goalId);
  if (history.length < 2) return '';
  const vals = history.slice(-8).map(e => e.val);
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = max - min || 1;
  const W = 80, H = 22;
  const pts = vals.map((v, i) => {
    const x = Math.round((i / (vals.length - 1)) * W);
    const y = Math.round(H - ((v - min) / range) * H);
    return `${x},${y}`;
  }).join(' ');
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="display:block;margin:4px 0 0;opacity:.7"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
function buildGoalsBannerHTML(c) {
  migrateWeightLoss(c);
  const goals = getClientGoals(c.id);
  if (!goals.length) return '';
  return goals.map(goal => {
    const cur = getGoalCurrent(c.id, goal.id);
    const p   = calcGoalProgress(goal, cur);
    const color = GOAL_COLORS[goal.type] || 'var(--accent)';
    const icon  = GOAL_ICONS[goal.type]  || '🎯';
    const ph = goal.type === 'runtime' ? 'mm:ss' : 'Enter value';
    return `
      <div class="goal-bar-row">
        <div class="goal-bar-top">
          <span class="goal-bar-label">${icon} ${esc(goal.label)}</span>
          <span class="goal-bar-current">${displayGoalValue(goal, p.cur)}</span>
          <span class="goal-bar-pct">${p.pct}%</span>
        </div>
        <div class="wt-track"><div class="wt-fill" style="width:${p.pct}%;background:${color}"></div></div>
        ${p.done
          ? `<div style="text-align:center;font-family:'DM Mono',monospace;font-size:10px;color:#2ecc71;margin:4px 0">🎯 Goal reached!</div>`
          : `<div class="goal-endpoints"><span>${displayGoalValue(goal, goal.start)}</span><span>🎯 ${displayGoalValue(goal, goal.target)}</span></div>`}
        <div class="goal-log-row">
          <input class="goal-log-input" id="goal-input-${esc(c.id)}-${esc(goal.id)}"
            type="${goal.type === 'runtime' ? 'text' : 'number'}" step="0.1" placeholder="${ph}">
          <button class="goal-log-btn" data-cid="${esc(c.id)}" data-gid="${esc(goal.id)}" onclick="logGoalValue(this.dataset.cid,this.dataset.gid)">Log</button>
        </div>
        ${buildGoalSparkline(c.id, goal.id, color)}
      </div>
      <div class="goal-divider"></div>`;
  }).join('');
}

function logGoalValue(cid, goalId) {
  const goals = getClientGoals(cid);
  const goal  = goals.find(g => g.id === goalId);
  if (!goal) return;
  const input = document.getElementById('goal-input-' + cid + '-' + goalId);
  if (!input) return;
  const raw = input.value.trim();
  if (!raw) return;
  const val = goal.type === 'runtime' ? parseRuntime(raw) : parseFloat(raw);
  if (isNaN(val) || val <= 0) {
    input.style.borderColor = '#e74c3c';
    setTimeout(() => input.style.borderColor = '', 800);
    return;
  }
  saveGoalCurrent(cid, goalId, val);
  if (goalId === 'wl_migrated') localStorage.setItem('wt_current_' + cid, String(val));
  input.value = ''; input.placeholder = '✓ Saved!';
  setTimeout(() => { input.placeholder = goal.type === 'runtime' ? 'mm:ss' : 'Enter value'; }, 1500);
  const banner = document.getElementById('wt-banner');
  const client = getAllClients().find(cl => cl.id === cid) || AppState.currentClient;
  if (banner && client) { banner.innerHTML = buildGoalsBannerHTML(client); checkMilestones(client); }
  sbAutoSync(cid);
}

function buildCoachGoalsMini(c) {
  migrateWeightLoss(c);
  const goals = getClientGoals(c.id);
  const rows = goals.map(g => {
    const cur = getGoalCurrent(c.id, g.id);
    const p   = calcGoalProgress(g, cur);
    const color = GOAL_COLORS[g.type] || c.accent;
    return `<div class="coach-goal-mini-row">
      <span class="coach-goal-mini-label">${GOAL_ICONS[g.type]||'🎯'} ${g.label}</span>
      <div class="coach-goal-mini-track"><div class="coach-goal-mini-fill" style="width:${p.pct}%;background:${color}"></div></div>
      <span class="coach-goal-mini-pct">${p.pct}%</span>
    </div>`;
  }).join('');
  return `<div class="coach-wt-section">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
      <div class="coach-wt-label">Goals</div>
      <button class="coach-goal-manage-btn" onclick="openGoalsModal('${c.id}')">Manage</button>
    </div>
    ${rows || `<div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);padding:4px 0">No goals set yet.</div>`}
  </div>`;
}

/* ── Goals Modal (Coach) ─────────────────────────────────── */
function openGoalsModal(cid) {
  const c = getAllClients().find(cl => cl.id === cid);
  if (!c) return;
  migrateWeightLoss(c);
  const goals = getClientGoals(cid);
  const listHtml = goals.length === 0
    ? `<div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--muted);padding:12px 0">No goals yet.</div>`
    : goals.map(g => {
        const cur = getGoalCurrent(cid, g.id);
        const p   = calcGoalProgress(g, cur);
        return `<div class="goal-modal-item">
          <span class="goal-modal-icon">${GOAL_ICONS[g.type]||'🎯'}</span>
          <div class="goal-modal-info">
            <div class="goal-modal-name">${esc(g.label)}</div>
            <div class="goal-modal-sub">${displayGoalValue(g,g.start)} → ${displayGoalValue(g,g.target)}${g.unit?' '+esc(g.unit):''} · ${p.pct}% complete</div>
          </div>
          <button class="goal-modal-del" data-cid="${esc(cid)}" data-gid="${esc(g.id)}" onclick="deleteGoal(this.dataset.cid,this.dataset.gid)">✕</button>
        </div>`;
      }).join('');

  document.getElementById('goalsModal')?.remove();
  const div = document.createElement('div');
  div.id = 'goalsModal';
  div.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:3000;display:flex;align-items:flex-end;justify-content:center';
  div.onclick = e => { if (e.target === div) closeGoalsModal(); };
  div.innerHTML = `
    <div style="background:var(--surface);border-radius:16px 16px 0 0;padding:24px;width:100%;max-width:480px;max-height:80vh;overflow-y:auto;-webkit-overflow-scrolling:touch">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:1px">Goals — ${esc(c.name)}</div>
        <button onclick="closeGoalsModal()" style="background:none;border:none;color:var(--muted);font-size:20px;cursor:pointer;padding:4px">✕</button>
      </div>
      <div class="goals-modal-scroll">${listHtml}</div>
      <div class="goal-divider" style="margin:16px 0"></div>
      <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted);letter-spacing:1px;margin-bottom:12px">ADD NEW GOAL</div>
      <div class="goal-type-row" id="goalTypeRow">
        <button class="goal-type-btn sel" onclick="selectGoalType(this,'weight')">⚖️ Weight Loss</button>
        <button class="goal-type-btn" onclick="selectGoalType(this,'runtime')">🏃 Run Time</button>
        <button class="goal-type-btn" onclick="selectGoalType(this,'lift')">🏋️ Lift</button>
      </div>
      <input type="hidden" id="goalTypeSel" value="weight">
      <div class="goal-add-form">
        <div class="goal-field-row">
          <div class="goal-field"><label>Label</label><input id="goalLabelIn" placeholder="e.g. Body Weight"></div>
          <div class="goal-field"><label>Unit</label><input id="goalUnitIn" placeholder="lbs / kg / min"></div>
        </div>
        <div class="goal-field-row">
          <div class="goal-field"><label>Start</label><input id="goalStartIn" type="text" placeholder="e.g. 200"></div>
          <div class="goal-field"><label>Target</label><input id="goalTargetIn" type="text" placeholder="e.g. 170"></div>
        </div>
        <button class="goal-log-btn" style="width:100%;margin-top:8px" onclick="saveGoal('${cid}')">Add Goal</button>
      </div>
    </div>`;
  document.body.appendChild(div);
}

function selectGoalType(btn, type) {
  document.querySelectorAll('#goalTypeRow .goal-type-btn').forEach(b => b.classList.remove('sel'));
  btn.classList.add('sel');
  const sel = document.getElementById('goalTypeSel');
  if (sel) sel.value = type;
}

function closeGoalsModal() { document.getElementById('goalsModal')?.remove(); }

function saveGoal(cid) {
  const type      = document.getElementById('goalTypeSel')?.value || 'weight';
  const label     = document.getElementById('goalLabelIn')?.value.trim();
  const unit      = document.getElementById('goalUnitIn')?.value.trim();
  const startRaw  = document.getElementById('goalStartIn')?.value.trim();
  const targetRaw = document.getElementById('goalTargetIn')?.value.trim();
  if (!label || !startRaw || !targetRaw) { alert('Please fill in Label, Start, and Target.'); return; }
  const parse = v => type === 'runtime' ? parseRuntime(v) : parseFloat(v);
  const start = parse(startRaw), target = parse(targetRaw);
  if (isNaN(start) || isNaN(target)) { alert('Invalid start or target value.'); return; }
  const goal = { id: 'g_' + Date.now(), type, label, start, target,
    unit: unit || (type === 'weight' ? 'lbs' : '') };
  const goals = getClientGoals(cid);
  goals.push(goal);
  saveClientGoals(cid, goals);
  sbAutoSync(cid);
  closeGoalsModal();
  openGoalsModal(cid);
}

function deleteGoal(cid, goalId) {
  const goals = getClientGoals(cid).filter(g => g.id !== goalId);
  saveClientGoals(cid, goals);
  closeGoalsModal();
  openGoalsModal(cid);
}

function _safeTabRender(tid, fn) {
  try { return fn(); }
  catch (e) {
    console.error('Tab render error (' + tid + '):', e);
    return `<div style="padding:20px;color:var(--muted);font-size:12px;font-family:'DM Mono',monospace">Failed to load — check console.</div>`;
  }
}

function _renderTabBody(tid, c) {
  const d = c.data;
  if (tid === 'home')        return _safeTabRender(tid, () => renderHome(c));
  if (tid === 'schedule')    return _safeTabRender(tid, () => renderSchedule(d.schedule, c));
  if (tid === 'workouts')    return _safeTabRender(tid, () => renderWorkouts(d.workouts, c));
  if (tid === 'endurance')   return _safeTabRender(tid, () => renderEndurance(d.endurance, c));
  if (tid === 'nutrition')   return _safeTabRender(tid, () => renderNutrition(d.nutrition, c));
  if (tid === 'fitness')     return _safeTabRender(tid, () => renderFitnessLog(c));
  if (tid === 'milestones')  return _safeTabRender(tid, () => renderMilestones(c));
  if (tid === 'progression') return _safeTabRender(tid, () => renderProgression(d.progression, d.hero, c));
  return '';
}

function switchTab(id, el) {
  if (!el.classList.contains('active')) haptic('tap');
  const appContent = document.getElementById('appContent');
  // Save scroll position of outgoing tab
  const prevId = AppState._activeTab;
  if (appContent && prevId) {
    AppState._tabScrollY = AppState._tabScrollY || {};
    AppState._tabScrollY['panel-' + prevId] = appContent.scrollTop;
    const prevPanel = document.getElementById('panel-' + prevId);
    if (prevPanel) prevPanel.classList.remove('active');
    const prevBtn = document.querySelector('.tab-item.active');
    if (prevBtn) { prevBtn.classList.remove('active'); prevBtn.removeAttribute('aria-current'); }
  }
  let panel = document.getElementById('panel-' + id);
  // Lazy-render: first time this tab is opened, build its body now
  if (panel && !panel.dataset.rendered && AppState.currentClient) {
    panel.innerHTML = _renderTabBody(id, AppState.currentClient);
    panel.dataset.rendered = '1';
    // Endurance HR zones calc has to run after its DOM is in
    if (id === 'endurance') setTimeout(() => { try { updateHRZones(AppState.currentClient.id); } catch {} }, 0);
  }
  if (panel) panel.classList.add('active');
  el.classList.add('active');
  el.setAttribute('aria-current', 'page');
  AppState._activeTab = id;
  // Restore scroll for incoming tab
  if (appContent) {
    const saved = AppState._tabScrollY?.['panel-' + id] || 0;
    appContent.scrollTop = saved;
  }
}

/* ══════════════════════════════════════════════════════════════
   RENDER CONTENT — only renders the active tab eagerly; other tabs
   are stub shells that render lazily on first switchTab. The active
   tab defaults to Home but is preserved across renderContent calls
   (e.g. cloud pull / pull-to-refresh shouldn't dump the user back
   to Home if they're mid-workout-log).
══════════════════════════════════════════════════════════════ */
function renderContent(c) {
  const d = c.data;

  // Always render home panel first (inject if not in tabs)
  const hasHome = d.tabs.some(t => t.id === 'home');
  if (!hasHome) d.tabs.unshift({ id: 'home', label: 'Home' });
  // Drop legacy 'macros' tab — the Nutrition tab owns macro tracking now
  if (d.tabs.some(t => t.id === 'macros')) d.tabs = d.tabs.filter(t => t.id !== 'macros');

  // Preserve the active tab across re-renders (e.g. cloud pull, PTR).
  const preservedTab = AppState._activeTab && d.tabs.some(t => t.id === AppState._activeTab)
    ? AppState._activeTab
    : d.tabs[0]?.id;

  // Preserve scroll position too
  const appContent = document.getElementById('appContent');
  const prevScroll = appContent?.scrollTop || 0;

  // Build all panel shells, render only the active one
  let html = '';
  d.tabs.forEach(t => {
    const isActive = t.id === preservedTab;
    const body = isActive ? _renderTabBody(t.id, c) : '';
    const rendered = isActive ? ' data-rendered="1"' : '';
    html += `<div class="tab-panel${isActive ? ' active' : ''}" id="panel-${t.id}"${rendered}>${body}</div>`;
  });

  document.getElementById('appContent').innerHTML = html;
  AppState._activeTab = preservedTab;

  // Sync the tab-bar active state in case it drifted
  document.querySelectorAll('.tab-item').forEach(btn => {
    const isActive = btn.dataset.tid === preservedTab;
    btn.classList.toggle('active', isActive);
    if (isActive) btn.setAttribute('aria-current', 'page');
    else btn.removeAttribute('aria-current');
  });

  // Restore scroll
  if (appContent) appContent.scrollTop = prevScroll;

  // Kick off async weather check after DOM is ready
  if (c._meta?.address) setTimeout(() => checkWeatherAlert(c), 0);
  // Endurance tab HR zones need DOM in place
  if (preservedTab === 'endurance') setTimeout(() => { try { updateHRZones(c.id); } catch {} }, 0);
}

// Stable hash → hue so each workout title gets its own consistent color
function _schedHueForTitle(title) {
  if (!title) return null;
  let h = 0;
  for (let i = 0; i < title.length; i++) h = ((h * 31) + title.charCodeAt(i)) | 0;
  return ((h % 360) + 360) % 360;
}

function renderSchedule(sOrC, c) {
  // Handles both renderSchedule(schedule, client) and renderSchedule(client)
  const client = c || sOrC;
  const s = c ? sOrC : sOrC?.data?.schedule;
  if (!s || !s.days) return '';
  const cid = client?.id || '';

  // Today + this-week context for highlighting and done-pips
  const _days7 = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const _todayLabel = _days7[new Date().getDay()];
  const _weekDates = {};
  {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dow = today.getDay();
    const monOffset = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(today); monday.setDate(today.getDate() + monOffset);
    _days7.forEach((lbl) => {
      const idx = lbl === 'Sun' ? 6 : _days7.indexOf(lbl) - 1;
      const d = new Date(monday); d.setDate(monday.getDate() + idx);
      _weekDates[lbl] = d.toDateString();
    });
  }
  const _logs = cid && typeof getFitnessLogs === 'function' ? getFitnessLogs(cid) : [];
  const _doneByDay = {};
  _logs.forEach(l => {
    if (!l.date) return;
    const k = new Date(l.date).toDateString();
    _doneByDay[k] = true;
  });

  const wkHtml = s.days.map((d, i) => {
    const isStrength = d.type === 'wk-a' || d.type === 'wk-b' || d.type === 'wk-c';
    const hue = isStrength && d.title ? _schedHueForTitle(d.title) : null;
    const isToday = d.label === _todayLabel;
    const dayKey = _weekDates[d.label];
    const isDone = dayKey && _doneByDay[dayKey] && d.tag !== 'Rest';
    const extra = [
      isToday ? 'wk-today' : '',
      isDone ? 'wk-done' : '',
    ].filter(Boolean).join(' ');
    const inlineStyle = 'cursor:pointer' + (hue !== null ? `;--wk-hue:${hue}` : '');
    return `
    <div class="wk ${d.type}${extra ? ' ' + extra : ''}" draggable="true" data-sched-idx="${i}"
      ondragstart="_schedWasDragged=true;schedDragStart(event,${i},'${cid}')"
      ondragover="schedDragOver(event,${i})"
      ondragleave="schedDragLeave(event)"
      ondrop="schedDrop(event,${i},'${cid}')"
      ondragend="schedDragEnd(event)"
      ontouchstart="_schedWasDragged=false;schedTouchStart(event,${i},'${cid}')"
      ontouchmove="schedTouchMove(event)"
      ontouchend="schedTouchEnd(event,${i},'${cid}')"
      onclick="if(!_schedWasDragged)openScheduleDayDetail('${esc(cid)}','${esc(d.label)}');_schedWasDragged=false;"
      style="${inlineStyle}">
      ${isToday ? '<div class="wk-today-pip">TODAY</div>' : ''}
      ${isDone ? '<div class="wk-done-pip" title="Logged this week">✓</div>' : ''}
      <div class="wk-day">${esc(d.label)}</div>
      <div class="wk-type-tag">${esc(d.tag)}</div>
      <div class="wk-label">${esc(d.title)}</div>
      <div class="wk-sub">${esc(d.sub)}</div>
    </div>`;
  }).join('');

  const tips = s.principles ? s.principles.map(p => `<li>${esc(p)}</li>`).join('') : '';
  return `
    <div class="panel-title">Week Overview <span class="sched-drag-hint">↔ DRAG TO REORDER</span></div>
    <p class="panel-desc">${esc(s.desc || '')}</p>
    <div class="wk-grid">${wkHtml}</div>
    ${tips ? `<div class="card"><div class="card-block"><div class="block-label">Core Principles for ${esc(client?.name || '')}</div><ul class="tip-list">${tips}</ul></div></div>` : ''}`;
}

function renderWorkouts(w, c) {
  // Sort workout days to match current schedule order (schedule is the source of truth)
  let days = w.days;
  if (c?.data?.schedule?.days && days?.length) {
    const trainingDays = c.data.schedule.days.filter(d => d.type === 'wk-a' || d.type === 'wk-card');
    if (trainingDays.length === days.length) {
      const DAY_LABELS_RW = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
      const FULL_DAY_NAMES_RW = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
      // Build map: workout name (after ' — ' in label) → workout day entry
      const byName = {};
      days.forEach(wd => {
        const lbl = wd.label || wd.title || '';
        const sep = lbl.indexOf(' — ');
        const name = (sep >= 0 ? lbl.slice(sep + 3) : lbl).trim().toLowerCase();
        if (name) byName[name] = wd;
      });
      days = trainingDays.map((sd, i) => {
        const wd = byName[(sd.title || '').trim().toLowerCase()] || days[i];
        const short = sd.label;
        const full = FULL_DAY_NAMES_RW[DAY_LABELS_RW.indexOf(short)] || short;
        return Object.assign({}, wd, { label: `${short} — ${sd.title}`, title: `${full} — ${sd.title}` });
      });
    }
  }

  const btns = days.map((d, i) =>
    `<button class="sel-btn${i===0?' active':''}" data-did="${esc(d.id)}" data-cid="${esc(c.id)}" onclick="selDay(this.dataset.did,this,this.dataset.cid)">${esc(d.label)}</button>`
  ).join('');

  const panels = days.map((d, i) => {
    // Collect all exercises across all blocks for the logger
    const allExercises = d.blocks.reduce((acc, b) => b.exercises ? [...acc, ...b.exercises] : acc, []);

    let blocksHtml = d.blocks.map(b => {
      let inner = '';
      if (b.tips) inner = `<ul class="tip-list">${b.tips.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`;
      if (b.exercises) inner = b.exercises.map((e, ei) => {
        const _videoUrl = e.videoUrl || (c.id ? getVideoLink(c.id, e.name) : null);
        const _watchBtn = _videoUrl
          ? `<a class="ex-watch-btn" href="${esc(_videoUrl)}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">▶ Watch</a>`
          : '';
        const _bi = d.blocks.indexOf(b);
        return `<div class="ex-row" id="today-ex-row-${c.id}-${ei}">
          <div style="flex:1">
            <div style="display:flex;align-items:center;gap:6px">
              <div class="ex-name" id="today-ex-name-${c.id}-${ei}">${esc(e.name)}</div>
              <button class="ex-swap-btn" onclick="openExerciseSwap('${esc(c.id)}',${ei},'tab','${esc(d.id||d.label)}',${_bi})" title="Swap exercise">↔</button>
            </div>
            <div class="ex-note" id="today-ex-meta-${c.id}-${ei}">${esc(e.note||'')}</div>
          </div>
          ${_watchBtn}
          <div class="badge b-sets" id="today-ex-sets-${c.id}-${ei}">${esc(e.sets||'')}</div>
          <div class="badge b-reps">${esc(e.reps||'')}</div>
          <div class="badge b-rest">${esc(e.rest||'')}</div>
        </div>`;
      }).join('');
      return `<div class="card-block"><div class="block-label">${esc(b.label||'')}</div>${inner}</div>`;
    }).join('');

    // Build workout logger (only for days with exercises)
    const loggerHtml = allExercises.length > 0 ? buildWorkoutLogger(c.id, d.id, allExercises, c.accent) : '';

    const _mainBlockIdx = d.blocks.findIndex(b => b.exercises?.length > 0);
    const _addExBtn = `<button onclick="openAddExerciseModal('${esc(c.id)}','${esc(d.id||d.label)}',${_mainBlockIdx >= 0 ? _mainBlockIdx : 0})" style="display:flex;align-items:center;gap:6px;margin:12px 24px 4px;padding:8px 14px;background:transparent;border:1px dashed var(--border);border-radius:8px;color:var(--muted);font-family:'DM Mono',monospace;font-size:10px;letter-spacing:1px;cursor:pointer;transition:border-color .15s,color .15s" onmouseover="this.style.borderColor=this.style.color='${esc(c.accent)}'" onmouseout="this.style.borderColor='';this.style.color=''">+ ADD EXERCISE</button>`;

    return `
      <div id="day-${c.id}-${d.id}" class="day-detail" style="${i>0?'display:none':''}">
        <div class="card">
          <div class="card-header">
            <div class="card-icon" style="background:${c.accent}22">${d.icon}</div>
            <div style="flex:1"><h3>${esc(d.title)}</h3><p>${esc(d.sub||'')}</p></div>
          </div>
          ${blocksHtml}
        </div>
        ${_addExBtn}
        ${loggerHtml}
      </div>`;
  }).join('');

  const _currentPhase = getCurrentPhase(c.id);
  const _phaseBanner = _currentPhase ? `
    <div class="period-current-banner">
      <div style="font-size:20px">${_currentPhase.color || '📅'}</div>
      <div>
        <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:1px;text-transform:uppercase">Current Phase</div>
        <div class="period-current-phase">${esc(_currentPhase.name)}</div>
        <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted)">${esc(_currentPhase.phase||'')}${_currentPhase.endDate?' · ends '+new Date(_currentPhase.endDate).toLocaleDateString('en',{month:'short',day:'numeric',year:'numeric'}):''}</div>
      </div>
    </div>` : '';
  const _suggestions = buildProgressionSuggestionsHtml(c);
  const _aiBuildBtn = `<button onclick="openAIBuildWorkout('${esc(c.id)}')" style="display:block;width:100%;margin:0 0 14px;padding:12px;background:var(--surface2);border:1px dashed ${esc(c.accent || '#e8ff47')};border-radius:10px;color:${esc(c.accent || '#e8ff47')};font-family:'DM Mono',monospace;font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer">+ AI Build Workout</button>`;
  return `
    <div class="panel-title">Workout Breakdown</div>
    <p class="panel-desc">Select a training day to see the full session.</p>
    ${_phaseBanner}
    ${_aiBuildBtn}
    ${_suggestions}
    <div class="sel-grid">${btns}</div>
    ${panels}`;
}

function buildWorkoutLogger(cid, dayId, exercises, accent) {
  const storageKey = 'wl_' + cid + '_' + dayId;
  const saved = getLS(storageKey, null);

  // Determine if the saved data is from a previous session (not today).
  // Only treat it as a previous session when _countedDate is explicitly set to
  // a different day — in-progress data that hasn't been formally saved yet has
  // no _countedDate and must NOT be discarded as if it were old.
  const todayStr = new Date().toDateString();
  const isNewSession = !!(saved?._countedDate && saved._countedDate !== todayStr);

  // Stale-session cleanup: if a prior session is sitting in the live key,
  // archive it once to history and reset the live entry. Without this the
  // old `done: true` flags linger in localStorage — the UI renders blank
  // (correct) but tapping a check toggles the stale `true` -> `false`,
  // making the check appear to do nothing.
  if (isNewSession && saved?.exercises && Object.keys(saved.exercises).length) {
    try {
      const hist = getWlHistory(cid, dayId);
      const stamp = saved.savedAt || saved._countedDate || '';
      const already = hist.some(h => (h?.date && h.date === saved.savedAt) || (h?._countedDate && h._countedDate === saved._countedDate));
      if (!already) {
        hist.unshift({
          date: saved.savedAt || new Date(saved._countedDate).toISOString(),
          _countedDate: saved._countedDate,
          exercises: saved.exercises,
          sessionNotes: saved.sessionNotes || '',
        });
        if (hist.length > 12) hist.length = 12;
        saveWlHistory(cid, dayId, hist);
      }
      saveWlData(cid, dayId, { exercises: {} });
    } catch (_) {}
  }

  // For a new session, inputs are blank; use previous session data only as reference
  const activeData  = isNewSession ? null : saved;
  // Previous session: hist[0] if new session and saved exists, otherwise hist[0] from history
  const hist = getWlHistory(cid, dayId);
  const prevSession = isNewSession
    ? (saved && saved.exercises && Object.keys(saved.exercises).length ? saved : (hist[0] || null))
    : (hist[0] || null);
  const prevDateStr = prevSession?.date
    ? new Date(prevSession.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })
    : (prevSession?._countedDate ? new Date(prevSession._countedDate).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : null);

  const exBlocks = exercises.map((e, ei) => {
    const savedEx = activeData?.exercises?.[ei];
    // Parse number of sets from e.sets string (e.g. "3 sets" -> 3, "4 rounds" -> 4)
    const setMatch = e.sets.match(/\d+/);
    const numSets = setMatch ? parseInt(setMatch[0]) : 3;
    const savedSets = savedEx?.sets || [];

    // Backfill exercise name into today's saved data if missing (old entries)
    if (savedEx && !savedEx.name) savedEx.name = e.name;

    // Build "last time" hints: match by exercise name first, fall back to position index
    let prevSets = [];
    if (prevSession?.exercises) {
      const prevExByName = Object.values(prevSession.exercises).find(ex => ex?.name === e.name);
      const prevExByIdx  = prevSession.exercises[ei];
      const prevEx = prevExByName || prevExByIdx;
      // Guard against null/undefined entries — sparse arrays from wlUpdate
      // serialise as JSON nulls and would throw when we read s.weight.
      prevSets = (prevEx?.sets || []).filter(s => s && (s.weight || s.reps));
    }

    const setRows = Array.from({length: Math.max(numSets, savedSets.length)}, (_, si) => {
      const s = savedSets[si] || {};
      const prev = prevSets[si];
      const prevHint = (prev && (prev.weight || prev.reps))
        ? `<div class="wl-prev-hint">Last: ${[prev.weight, prev.reps].filter(Boolean).join(' × ')}${prevDateStr ? ' · ' + prevDateStr : ''}</div>`
        : '';
      // Build any saved drop rows
      const drops = s.drops || [];
      const dropRowsHtml = drops.map((d, di) => `
        <div class="wl-drop-row" id="wl-drop-${cid}-${dayId}-${ei}-${si}-${di}">
          <div class="wl-drop-num">&darr;${di+1}</div>
          <input class="wl-drop-input ${d.weight?'completed':''}" type="text" inputmode="decimal"
            placeholder="lbs/kg" value="${d.weight||''}"
            oninput="wlUpdateDrop('${cid}','${dayId}',${ei},${si},${di},'weight',this.value)">
          <input class="wl-drop-input ${d.reps?'completed':''}" type="text" inputmode="numeric"
            placeholder="reps" value="${d.reps||''}"
            oninput="wlUpdateDrop('${cid}','${dayId}',${ei},${si},${di},'reps',this.value)">
          <button class="wl-drop-check ${d.done?'done':''}"
            onclick="wlToggleDropDone('${cid}','${dayId}',${ei},${si},${di})">${d.done?'✓':''}</button>
          <button class="wl-mini-btn wl-del-mini" onclick="wlDeleteDrop('${cid}','${dayId}',${ei},${si},${di})" title="Remove drop set">&times;</button>
        </div>`).join('');
      return `<div class="wl-set-row" id="wl-set-${cid}-${dayId}-${ei}-${si}">
        <div class="wl-set-num">S${si+1}</div>
        <input class="wl-set-input ${s.weight?'completed':''}" type="text" inputmode="decimal"
          placeholder="${prev?.weight ? prev.weight : 'lbs / kg'}" value="${s.weight||''}"
          oninput="wlUpdate('${cid}','${dayId}',${ei},${si},'weight',this.value)">
        <input class="wl-set-input ${s.reps?'completed':''}" type="text" inputmode="numeric"
          placeholder="${prev?.reps ? prev.reps : 'reps'}" value="${s.reps||''}"
          oninput="wlUpdate('${cid}','${dayId}',${ei},${si},'reps',this.value)">
        <button class="wl-set-check ${s.done?'done':''}"
          onclick="wlToggleDone('${cid}','${dayId}',${ei},${si})">${s.done?'✓':''}</button>
        <div class="wl-row-actions">
          <button class="wl-mini-btn wl-drop-mini" onclick="wlAddDrop('${cid}','${dayId}',${ei},${si})" title="Add drop set">&darr;</button>
          <button class="wl-mini-btn wl-del-mini" onclick="wlDeleteSet('${cid}','${dayId}',${ei},${si})" title="Remove set">&times;</button>
        </div>
      </div>${prevHint}<div class="wl-drops-wrap" id="wl-drops-${cid}-${dayId}-${ei}-${si}">${dropRowsHtml}</div>`;
    }).join('');

    const altName = activeData?.['alt_' + ei] || saved?.['alt_' + ei] || '';
    const displayName = altName || e.name;
    return `<div class="wl-ex-block">
      <div class="wl-ex-header">
        <div class="wl-ex-info">
          <div class="wl-ex-num">EX ${ei+1}</div>
          <div class="wl-ex-name" id="wl-ex-name-${cid}-${dayId}-${ei}" ontouchstart="exTipStart(this)" ontouchend="exTipCancel()" ontouchcancel="exTipCancel()" oncontextmenu="exTipShowPopup(this);return false" style="cursor:pointer;user-select:none">${displayName}${altName ? '<span style="font-size:9px;color:var(--muted);margin-left:6px">(alt)</span>' : ''}</div>
          <div class="wl-ex-prescribed">${e.sets} · ${e.reps} · Rest: ${e.rest}</div>
        </div>
        <button onclick="openExerciseSwap('${cid}',${ei},'wl','${dayId}',0)" style="background:none;border:1px solid var(--border);border-radius:6px;padding:4px 8px;color:var(--muted);cursor:pointer;font-size:11px;white-space:nowrap;flex-shrink:0">↔ Swap</button>
      </div>
      <div class="wl-sets-grid" id="wl-grid-${cid}-${dayId}-${ei}">
        ${setRows}
      </div>
      <button class="wl-add-set-btn" onclick="wlAddSet('${cid}','${dayId}',${ei},${exercises.length})">+ Add Set</button>
    </div>`;
  }).join('');

  const hasSaved = !!activeData;
  const prevLabel = isNewSession && prevDateStr
    ? `<div class="wl-prev-session-label">↑ Last session: ${prevDateStr}</div>`
    : '';
  return `
    <button class="wl-toggle-btn ${hasSaved?'active':''}" id="wl-toggle-${cid}-${dayId}"
      onclick="toggleWorkoutLogger('${cid}','${dayId}')">
      <span class="wl-icon">📝</span>
      ${hasSaved ? 'View / Edit Workout Log' : 'Log This Workout'}
    </button>
    <div class="workout-logger card ${hasSaved?'open':''}" id="wl-${cid}-${dayId}">
      <div class="wl-header">
        <div class="wl-title">Workout Log</div>
        <div class="wl-saved-badge" id="wl-saved-${cid}-${dayId}">✓ Saved</div>
      </div>
      <div class="wl-progress-wrap" id="wl-prog-wrap-${cid}-${dayId}">
        <div class="wl-progress-row">
          <div class="wl-progress-label" id="wl-prog-lbl-${cid}-${dayId}">0 / ${exercises.reduce((n,e)=>{const m=e.sets.match(/\d+/);return n+(m?parseInt(m[0]):3);},0)} sets done</div>
          <div class="wl-progress-pct" id="wl-prog-pct-${cid}-${dayId}">0%</div>
        </div>
        <div class="wl-progress-track"><div class="wl-progress-fill" id="wl-prog-fill-${cid}-${dayId}" style="width:0%"></div></div>
      </div>
      ${prevLabel}
      ${exBlocks}
      <div class="wl-notes-row">
        <div class="wl-notes-label">Session Notes</div>
        <textarea class="wl-notes-input" id="wl-notes-${cid}-${dayId}" placeholder="How did it feel? Any PRs, tweaks, or wins…" oninput="wlUpdate('${cid}','${dayId}',-1,-1,'sessionNotes',this.value)">${(activeData?.sessionNotes || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</textarea>
      </div>
      <button class="wl-save-btn" onclick="wlSaveWorkout('${cid}','${dayId}',${exercises.length})">Save Workout</button>
      ${buildWlHistoryHtml(cid, dayId, isNewSession && !!prevSession && hist.length > 0)}
    </div>`;
}

function selDay(id, el, cid) {
  document.querySelectorAll(`[id^="day-${cid}-"]`).forEach(d => d.style.display = 'none');
  el.closest('.sel-grid').querySelectorAll('.sel-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`day-${cid}-${id}`).style.display = 'block';
  el.classList.add('active');
}

function renderEndurance(e, c) {
  const zoneStyles = { z1:'background:rgba(39,174,96,.15);color:#2ecc71', z2:'background:rgba(46,204,113,.12);color:#27ae60', z3:'background:rgba(241,196,15,.12);color:#f1c40f', z4:'background:rgba(255,107,53,.15);color:#ff6b35', z5:'background:rgba(231,76,60,.15);color:#e74c3c' };
  const zones = e.zones.map(z => `
    <div class="ex-row">
      <div>
        <div class="ex-name">${z.label} — ${z.feel}</div>
        <div class="ex-note">${z.purpose}</div>
      </div>
      <div class="badge" style="${zoneStyles[z.cls]}">${z.pct}</div>
    </div>`).join('');

  const sessions = e.sessions.map(s => `
    <div class="ex-row">
      <div><div class="ex-name">${s.day} — ${s.name}</div><div class="ex-note">${s.note}</div></div>
      <div class="badge b-sets">${s.duration}</div>
      <div class="badge b-reps">${s.zone}</div>
    </div>`).join('');

  const prog = e.progression.map(p => `<li>${p}</li>`).join('');

  const hrCalc = renderHRZoneCalc(c);

  return `
    <div class="panel-title">Endurance Blueprint</div>
    <p class="panel-desc">80% of cardio volume at Zone 2. The remaining 20% is high-intensity threshold work on Thursdays.</p>
    <div class="card"><div class="card-block"><div class="block-label">Heart Rate Zones</div>${zones}</div></div>
    ${hrCalc}
    <div class="card"><div class="card-block"><div class="block-label">Weekly Cardio Sessions</div>${sessions}</div></div>
    <div class="card"><div class="card-block"><div class="block-label">16-Week Cardio Progression</div><ul class="tip-list">${prog}</ul></div></div>`;
}

// ── Heart Rate Zone Calculator ──
const HR_CALC_KEY = (cid) => 'hr_calc_' + cid;
function _hrCalcLoad(cid) { try { return JSON.parse(localStorage.getItem(HR_CALC_KEY(cid)) || 'null') || {}; } catch { return {}; } }
function _hrCalcSave(cid, d) { try { localStorage.setItem(HR_CALC_KEY(cid), JSON.stringify(d)); } catch {} }

function renderHRZoneCalc(c) {
  const saved = _hrCalcLoad(c.id);
  const defaultAge = saved.age || c?._meta?.age || '';
  const defaultRest = saved.rest || '';
  const method = saved.method || 'tanaka';
  return `
    <div class="card" id="hrCalcCard-${c.id}">
      <div class="card-block">
        <div class="block-label" style="margin-bottom:10px">Heart Rate Zone Calculator</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
          <div>
            <div style="font-family:'DM Mono',monospace;font-size:8px;color:var(--muted);margin-bottom:4px;letter-spacing:1px">AGE</div>
            <input class="fit-input" type="number" min="10" max="100" id="hr-age-${c.id}" value="${defaultAge}" placeholder="30" oninput="updateHRZones('${esc(c.id)}')" style="font-size:16px">
          </div>
          <div>
            <div style="font-family:'DM Mono',monospace;font-size:8px;color:var(--muted);margin-bottom:4px;letter-spacing:1px">RESTING HR (OPT)</div>
            <input class="fit-input" type="number" min="30" max="120" id="hr-rest-${c.id}" value="${defaultRest}" placeholder="60" oninput="updateHRZones('${esc(c.id)}')" style="font-size:16px">
          </div>
        </div>
        <div style="display:flex;gap:6px;margin-bottom:12px">
          <button type="button" id="hr-m-tanaka-${c.id}" onclick="setHRMethod('${esc(c.id)}','tanaka')" style="flex:1;padding:6px 8px;background:${method==='tanaka'?c.accent:'var(--surface2)'};color:${method==='tanaka'?'#000':'var(--muted)'};border:1px solid var(--border);border-radius:4px;font-family:'DM Mono',monospace;font-size:9px;font-weight:700;letter-spacing:1px;cursor:pointer">TANAKA</button>
          <button type="button" id="hr-m-fox-${c.id}" onclick="setHRMethod('${esc(c.id)}','fox')" style="flex:1;padding:6px 8px;background:${method==='fox'?c.accent:'var(--surface2)'};color:${method==='fox'?'#000':'var(--muted)'};border:1px solid var(--border);border-radius:4px;font-family:'DM Mono',monospace;font-size:9px;font-weight:700;letter-spacing:1px;cursor:pointer">220 − AGE</button>
        </div>
        <div id="hr-zones-${c.id}"></div>
        <div id="hr-meta-${c.id}" style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:.8px;margin-top:8px;text-align:center"></div>
      </div>
    </div>`;
}

function setHRMethod(cid, method) {
  const d = _hrCalcLoad(cid);
  d.method = method;
  _hrCalcSave(cid, d);
  ['tanaka','fox'].forEach(m => {
    const btn = document.getElementById('hr-m-' + m + '-' + cid);
    if (!btn) return;
    const on = m === method;
    const c = (typeof getAllClients === 'function' ? getAllClients().find(x => x.id === cid) : null);
    const accent = c?.accent || 'var(--accent)';
    btn.style.background = on ? accent : 'var(--surface2)';
    btn.style.color = on ? '#000' : 'var(--muted)';
  });
  updateHRZones(cid);
}

function updateHRZones(cid) {
  const ageEl = document.getElementById('hr-age-' + cid);
  const restEl = document.getElementById('hr-rest-' + cid);
  const out = document.getElementById('hr-zones-' + cid);
  const meta = document.getElementById('hr-meta-' + cid);
  if (!out) return;
  const age = parseInt(ageEl?.value || '0');
  const rest = parseInt(restEl?.value || '0');
  const saved = _hrCalcLoad(cid);
  _hrCalcSave(cid, { ...saved, age: age || '', rest: rest || '', method: saved.method || 'tanaka' });
  if (!age || age < 10 || age > 100) {
    out.innerHTML = '<div style="padding:16px;text-align:center;font-family:\'DM Mono\',monospace;font-size:10px;color:var(--muted);letter-spacing:1px">ENTER AGE TO CALCULATE</div>';
    if (meta) meta.textContent = '';
    return;
  }
  const method = (saved.method || 'tanaka');
  const maxHR = method === 'fox' ? Math.round(220 - age) : Math.round(208 - 0.7 * age);
  const useKarvonen = rest >= 30 && rest <= 120;
  const hrr = useKarvonen ? (maxHR - rest) : 0;
  const zonePcts = [
    { key:'z1', label:'Zone 1', feel:'Recovery',        cls:'z1', color:'#2ecc71', lo:50, hi:60 },
    { key:'z2', label:'Zone 2', feel:'Aerobic base',    cls:'z2', color:'#27ae60', lo:60, hi:70 },
    { key:'z3', label:'Zone 3', feel:'Tempo',           cls:'z3', color:'#f1c40f', lo:70, hi:80 },
    { key:'z4', label:'Zone 4', feel:'Threshold',       cls:'z4', color:'#ff6b35', lo:80, hi:90 },
    { key:'z5', label:'Zone 5', feel:'VO2 / Anaerobic', cls:'z5', color:'#e74c3c', lo:90, hi:100 },
  ];
  const toBpm = (pct) => useKarvonen
    ? Math.round((hrr * pct / 100) + rest)
    : Math.round(maxHR * pct / 100);
  const rows = zonePcts.map(z => {
    const loBpm = toBpm(z.lo);
    const hiBpm = toBpm(z.hi);
    return `<div class="ex-row" style="padding:8px 0">
      <div style="flex:1">
        <div class="ex-name" style="font-size:13px">${z.label} <span style="color:var(--muted);font-weight:400">— ${z.feel}</span></div>
        <div class="ex-note" style="font-family:'DM Mono',monospace;font-size:9px;color:var(--faint);letter-spacing:.8px">${z.lo}–${z.hi}% ${useKarvonen ? 'HRR' : 'HRmax'}</div>
      </div>
      <div class="badge" style="background:${z.color}22;color:${z.color};font-weight:700;letter-spacing:.5px">${loBpm}–${hiBpm} bpm</div>
    </div>`;
  }).join('');
  out.innerHTML = rows;
  if (meta) {
    const methodLbl = method === 'fox' ? '220 − age' : 'Tanaka (208 − 0.7·age)';
    meta.textContent = `Max HR ${maxHR} bpm · ${methodLbl}${useKarvonen ? ' · Karvonen (HRR)' : ''}`;
  }
}

function renderNutrition(n, c) {
  // Delegate to full nutrition tracker (nutrition.js)
  if (typeof renderNutritionTracker === 'function') return renderNutritionTracker(c);
  if (!n) return `<div class="panel-title">Nutrition Blueprint</div><p class="panel-desc">No nutrition data — re-save this client from the coach dashboard to generate macros.</p>`;
  const macros = (n.macros || []).map(m => `
    <div class="macro-card">
      <div class="macro-lbl">${m.label}</div>
      <div class="macro-val" style="color:${m.color}">${m.val}<span class="macro-unit">${m.unit}</span></div>
      <div class="macro-desc">${m.desc}</div>
    </div>`).join('');

  const tips = (n.tips || []).map(t => `<li>${t}</li>`).join('');
  const supps = (n.supplements || []).map(s => `<li>${s}</li>`).join('');
  const _macroTxt = n.macros.map(m => `${m.label}: ${m.val}${m.unit}`).join(' · ');

  // Daily calorie intake log
  const today = new Date().toISOString().slice(0, 10);
  const intakeLogs = getCalorieIntakeLogs(c.id);
  const todayIntake = intakeLogs.find(l => l.date === today);
  const calTarget = n.macros.find(m => /calorie|kcal/i.test(m.label));
  const calTargetVal = calTarget ? parseInt(calTarget.val) : 0;
  const proteinTarget = n.macros.find(m => /protein/i.test(m.label));
  const proteinTargetVal = proteinTarget ? parseInt(proteinTarget.val) : 0;

  // 7-day history
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const entry = intakeLogs.find(l => l.date === key);
    last7.push({ date: key, label: d.toLocaleDateString('en',{weekday:'short'}), cal: entry?.calories || 0, hit: calTargetVal > 0 && entry?.calories >= calTargetVal * 0.9 });
  }
  const maxCal = Math.max(...last7.map(d => d.cal), calTargetVal || 1);
  const histBars = last7.map(d => {
    const pct = Math.min(100, Math.round((d.cal / maxCal) * 100));
    const isToday = d.date === today;
    const barColor = d.cal === 0 ? 'var(--border)' : d.hit ? '#2ecc71' : c.accent;
    return `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1">
      <div style="font-family:'DM Mono',monospace;font-size:8px;color:var(--muted)">${d.cal > 0 ? (d.cal >= 1000 ? (d.cal/1000).toFixed(1)+'k' : d.cal) : ''}</div>
      <div style="width:100%;background:var(--surface2);border-radius:3px;height:48px;display:flex;align-items:flex-end;overflow:hidden">
        <div style="width:100%;height:${pct}%;background:${barColor};border-radius:3px;transition:height 0.3s"></div>
      </div>
      <div style="font-family:'DM Mono',monospace;font-size:8px;color:${isToday ? c.accent : 'var(--muted)'};font-weight:${isToday ? '600' : '400'}">${d.label}</div>
    </div>`;
  }).join('');

  const calFill = calTargetVal > 0 && todayIntake?.calories ? Math.min(100, Math.round(todayIntake.calories / calTargetVal * 100)) : 0;
  const calColor = calFill >= 90 ? '#2ecc71' : calFill >= 60 ? c.accent : '#e74c3c';

  const intakeSection = `
    <div class="card" style="margin-bottom:12px">
      <div class="card-block" style="border-bottom:1px solid var(--border)">
        <div class="block-label" style="margin-bottom:8px">Daily Calorie Intake</div>
        <input type="date" id="ci-date-${c.id}" value="${today}" max="${today}" onchange="loadIntakeForDate('${esc(c.id)}',this.value)" style="font-family:'DM Mono',monospace;font-size:11px;background:var(--surface2,#1a1a1a);color:var(--muted);border:1px solid var(--border);border-radius:4px;padding:6px 10px;margin-bottom:14px;width:100%;color-scheme:dark">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
          <div>
            <div style="font-family:'DM Mono',monospace;font-size:8px;color:var(--muted);margin-bottom:4px;letter-spacing:1px">CALORIES${calTargetVal ? ' (target: '+calTargetVal+')' : ''}</div>
            <input class="fit-input" type="number" id="ci-cal-${c.id}" placeholder="${calTargetVal || '2000'}" value="${todayIntake?.calories || ''}" style="font-size:16px">
          </div>
          <div>
            <div style="font-family:'DM Mono',monospace;font-size:8px;color:var(--muted);margin-bottom:4px;letter-spacing:1px">PROTEIN (g)${proteinTargetVal ? ' (target: '+proteinTargetVal+'g)' : ''}</div>
            <input class="fit-input" type="number" id="ci-prot-${c.id}" placeholder="${proteinTargetVal || '150'}" value="${todayIntake?.protein || ''}" style="font-size:16px">
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
          <div>
            <div style="font-family:'DM Mono',monospace;font-size:8px;color:var(--muted);margin-bottom:4px;letter-spacing:1px">CARBS (g)</div>
            <input class="fit-input" type="number" id="ci-carb-${c.id}" placeholder="200" value="${todayIntake?.carbs || ''}" style="font-size:16px">
          </div>
          <div>
            <div style="font-family:'DM Mono',monospace;font-size:8px;color:var(--muted);margin-bottom:4px;letter-spacing:1px">FAT (g)</div>
            <input class="fit-input" type="number" id="ci-fat-${c.id}" placeholder="70" value="${todayIntake?.fat || ''}" style="font-size:16px">
          </div>
        </div>
        ${calFill > 0 ? `<div style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted)">vs target</div>
            <div style="font-family:'DM Mono',monospace;font-size:9px;color:${calColor}">${calFill}%</div>
          </div>
          <div style="height:4px;background:var(--surface2);border-radius:2px;overflow:hidden">
            <div style="height:100%;width:${calFill}%;background:${calColor};border-radius:2px;transition:width 0.4s"></div>
          </div>
        </div>` : ''}
        <button onclick="saveCalorieIntake('${esc(c.id)}',document.getElementById('ci-cal-${c.id}')?.value,document.getElementById('ci-prot-${c.id}')?.value,document.getElementById('ci-carb-${c.id}')?.value,document.getElementById('ci-fat-${c.id}')?.value,document.getElementById('ci-date-${c.id}')?.value)" style="width:100%;padding:12px;background:${c.accent};color:#000;border:none;font-family:'DM Mono',monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:600;cursor:pointer;border-radius:6px">Save Intake</button>
      </div>
      <div class="card-block">
        <div class="block-label" style="margin-bottom:12px">7-Day History</div>
        <div style="display:flex;gap:6px;align-items:flex-end">${histBars}</div>
        ${calTargetVal ? `<div style="display:flex;align-items:center;gap:6px;margin-top:8px"><div style="width:10px;height:3px;background:#2ecc71;border-radius:2px"></div><div style="font-family:'DM Mono',monospace;font-size:8px;color:var(--muted)">≥90% of ${calTargetVal} kcal target</div></div>` : ''}
      </div>
    </div>`;

  return `
    <div class="panel-title">Nutrition Blueprint</div>
    <p class="panel-desc">Daily targets tailored specifically for ${c.name}.</p>
    ${intakeSection}
    <div class="macro-grid">${macros}</div>
    <button class="macro-copy-btn" onclick="navigator.clipboard?.writeText(${JSON.stringify(_macroTxt)}).then(()=>showFitToast('Macros copied!')).catch(()=>showFitToast(${JSON.stringify(_macroTxt)}))">📋 Copy Macros for MyFitnessPal</button>
    <div class="card">
      <div class="card-block"><div class="block-label">Meal Timing</div><ul class="tip-list">${tips}</ul></div>
      <div class="card-block"><div class="block-label">Key Supplements</div><ul class="tip-list">${supps}</ul></div>
    </div>`;
}

function renderProgression(p, hero, c) {
  const phases = p.phases.map(ph => `
    <div class="phase-card" data-n="${ph.n}">
      <div class="ph-num">// Phase ${ph.n}</div>
      <div class="ph-title">${esc(ph.title)}</div>
      <div class="ph-weeks">${esc(ph.weeks)}</div>
      <div class="ph-body">${esc(ph.body)}</div>
    </div>`).join('');

  const rules = p.rules.map(r => `<li>${esc(r)}</li>`).join('');
  const stats = Object.entries(hero).map(([k,v]) => `
    <div class="macro-card" style="text-align:center">
      <div class="macro-val" style="color:var(--accent)">${v}</div>
      <div class="macro-lbl">${k}</div>
    </div>`).join('');

  return `
    <div class="panel-title">Progression Plan</div>
    <p class="panel-desc">Structured phases to maximise results while keeping training sustainable.</p>
    <div class="macro-grid">${stats}</div>
    <div class="phase-grid">${phases}</div>
    <div class="card">
      <div class="card-block"><div class="block-label">Overload Rules for ${c.name}</div><ul class="tip-list">${rules}</ul></div>
    </div>`;
}

/* ══════════════════════════════════════════════════════════════
   LOGOUT
══════════════════════════════════════════════════════════════ */
function logout() {
  try {
    // Flush any debounced cloud-sync writes before we tear down state, so we
    // don't drop the last second of work the user just did.
    if (typeof sbAutoSyncFlushAll === 'function') sbAutoSyncFlushAll();
    stopCoachPolling();
    // Drop the session token so the next login must re-authenticate
    if (typeof clearAuth === 'function') clearAuth();
    AppState.currentClient = null;
    currentClient = null;
    AppState.isCoachLogin = false;
    AppState.pinBuffer = '';
    AppState.milestoneQueue = [];
    AppState.milestoneQueueClient = null;
    AppState.checkinState = { sleep: 0, stress: 0, energy: 0, adherence: 0, notes: '', photoB64: '' };
    AppState.mealDay = 0;
    AppState.calYear = new Date().getFullYear();
    AppState.calMonth = new Date().getMonth();
    AppState.compareSelected = [];
    AppState.altTarget = null;
    AppState.obState = {};
    AppState.nutrDate = new Date().toISOString().slice(0, 10);
    document.documentElement.style.setProperty('--accent', '#ff6b35');
    AppState.tabataReturnScreen = 'login';
    showScreen('login');
  } catch (e) {
    console.error('Error during logout:', e);
  }
}

/* ══════════════════════════════════════════════════════════════
   SERVICE WORKER REGISTRATION
══════════════════════════════════════════════════════════════ */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').then(reg => {
    // Show update banner when a new SW is waiting
    const onWaiting = () => showUpdateBanner();
    if (reg.waiting) onWaiting();
    reg.addEventListener('updatefound', () => {
      const newSW = reg.installing;
      newSW.addEventListener('statechange', () => {
        if (newSW.state === 'installed' && navigator.serviceWorker.controller) onWaiting();
      });
    });
  }).catch(() => {});
  // When the new SW takes control, reload to get fresh assets
  navigator.serviceWorker.addEventListener('controllerchange', () => location.reload());
}


