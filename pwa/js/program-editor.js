/* ══════════════════════════════════════════════════════════════
   PROGRAM EDITOR — direct exercise-list editing for a client
   without the onboarding wizard. Full-screen control panel:
   left day-rail + right exercise canvas + slide-in library drawer.
   Reads/writes data.workouts.days[].blocks[].exercises[] and keeps
   _meta.days in sync. Preserves logged history (archive-then-clear
   via clearWorkoutLiveStateForClient on save when exercises change).
══════════════════════════════════════════════════════════════ */

// Live editor state. _draft is a deep clone of the client's workout days; we
// only commit to storage on Save, so Cancel discards cleanly.
const _peState = {
  cid: null,
  draft: [],        // [{ id, label, title, exercises:[{name,sets,reps,rest,note,videoUrl?}] }]
  activeDay: 0,
  dirty: false,
  origSig: '',      // exercise signature at open, to detect real changes
  dragFrom: null,
};

// Flatten a workout day's blocks into a single editable exercise array, and the
// reverse — we edit one flat list per day and write it back as a single block.
function _peDayExercises(d) {
  return (d?.blocks || []).reduce((acc, b) => b.exercises ? acc.concat(b.exercises) : acc, []);
}

function _peSignature(days) {
  return JSON.stringify((days || []).map(d => [
    d.id,
    (d.exercises || []).map(e => [e.name, e.sets, e.reps, e.rest, e.note || ''])
  ]));
}

function openProgramEditor(cid) {
  const c = (typeof getAllClients === 'function' ? getAllClients() : []).find(x => x.id === cid);
  if (!c) { if (typeof showFitToast === 'function') showFitToast('Client not found'); return; }
  const wDays = c?.data?.workouts?.days || [];
  if (!wDays.length) { if (typeof showFitToast === 'function') showFitToast('No workout days to edit — prescribe a program first'); return; }

  // Build a flat editable draft: one exercise list per day.
  _peState.cid = cid;
  _peState.draft = wDays.map(d => ({
    id: d.id,
    label: d.label || d.id,
    title: d.title || d.label || d.id,
    exercises: JSON.parse(JSON.stringify(_peDayExercises(d))),
  }));
  _peState.activeDay = 0;
  _peState.dirty = false;
  _peState.origSig = _peSignature(_peState.draft);
  _peState.dragFrom = null;

  closeProgramEditor();
  const ov = document.createElement('div');
  ov.id = 'progEditorOverlay';
  ov.className = 'pe-overlay';
  ov.innerHTML = _peShell(c);
  document.body.appendChild(ov);
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => ov.classList.add('open'));
  _peRender();
}

function closeProgramEditor() {
  const el = document.getElementById('progEditorOverlay');
  if (el) el.remove();
  _peCloseLibrary();
  document.body.style.overflow = '';
}

async function _peRequestClose() {
  if (_peState.dirty && !await fitConfirm({ title: 'Discard changes?', message: 'You have unsaved changes to this program. Discard them?', confirmText: 'Discard', danger: true })) return;
  closeProgramEditor();
}

function _peShell(c) {
  const initials = c.initials || (c.name || '?').slice(0, 2).toUpperCase();
  const accent = c.accent || '#3B9EFF';
  return `
    <div class="pe-panel" onclick="event.stopPropagation()">
      <header class="pe-head">
        <div class="pe-head-left">
          <div class="pe-avatar" style="--pe-accent:${esc(accent)}">${esc(initials)}</div>
          <div class="pe-head-meta">
            <div class="pe-kicker">PROGRAM EDITOR</div>
            <div class="pe-title">${esc(c.name || 'Client')}<span class="pe-title-sub">'s exercises</span></div>
          </div>
        </div>
        <div class="pe-head-right">
          <span id="peDirtyDot" class="pe-dirty" hidden><span class="pe-dirty-pulse"></span>UNSAVED</span>
          <button class="pe-btn pe-btn-ghost" onclick="_peRequestClose()">Close</button>
          <button class="pe-btn pe-btn-primary" id="peSaveBtn" onclick="_peSave()">Save changes</button>
        </div>
      </header>
      <div class="pe-body">
        <nav class="pe-rail" id="peRail"></nav>
        <section class="pe-canvas" id="peCanvas"></section>
      </div>
    </div>`;
}

function _peRender() {
  _peRenderRail();
  _peRenderCanvas();
  _peUpdateDirty();
}

function _peRenderRail() {
  const rail = document.getElementById('peRail');
  if (!rail) return;
  rail.innerHTML = _peState.draft.map((d, i) => {
    const n = d.exercises.length;
    const active = i === _peState.activeDay;
    const dayShort = (d.label || '').split(' — ')[0] || d.label || ('D' + (i + 1));
    const dayName = (d.title || '').split(' — ').slice(-1)[0] || d.title || '';
    return `
      <button class="pe-day ${active ? 'active' : ''}" onclick="_peSelectDay(${i})">
        <span class="pe-day-tag">${esc(dayShort)}</span>
        <span class="pe-day-name">${esc(dayName)}</span>
        <span class="pe-day-count">${n} ex</span>
      </button>`;
  }).join('');
}

function _peSelectDay(i) {
  _peState.activeDay = i;
  if (typeof haptic === 'function') haptic('light');
  _peRenderRail();
  _peRenderCanvas();
}

function _peRenderCanvas() {
  const canvas = document.getElementById('peCanvas');
  if (!canvas) return;
  const day = _peState.draft[_peState.activeDay];
  if (!day) { canvas.innerHTML = ''; return; }

  const rows = day.exercises.map((e, i) => _peExerciseRow(e, i)).join('');
  const empty = day.exercises.length ? '' : `
    <div class="pe-empty">
      <div class="pe-empty-mark">∅</div>
      <div class="pe-empty-text">No exercises on this day yet</div>
      <div class="pe-empty-sub">Add from the library or type a custom movement below.</div>
    </div>`;

  canvas.innerHTML = `
    <div class="pe-canvas-head">
      <div>
        <div class="pe-canvas-kicker">EDITING</div>
        <div class="pe-canvas-title">${esc(day.title || day.label || '')}</div>
      </div>
      <div class="pe-canvas-count">${day.exercises.length} exercise${day.exercises.length !== 1 ? 's' : ''}</div>
    </div>
    <div class="pe-list" id="peList">${rows}${empty}</div>
    <div class="pe-add">
      <input id="peAddInput" class="pe-add-input" type="text" list="peAddDatalist"
        placeholder="Type a movement and press Enter…"
        onkeydown="if(event.key==='Enter'){_peAddTyped();}">
      <datalist id="peAddDatalist">${_peLibraryOptions()}</datalist>
      <button class="pe-add-browse" onclick="_peOpenLibrary()">＋ Browse library</button>
    </div>`;
}

function _peExerciseRow(e, i) {
  const cid = _peState.cid;
  const di = _peState.activeDay;
  const vid = e.videoUrl
    ? `<a class="pe-row-vid" href="${esc(e.videoUrl)}" target="_blank" rel="noopener" title="Demo video" onclick="event.stopPropagation()">▶</a>`
    : '';
  return `
    <div class="pe-row" draggable="true" data-pe-idx="${i}"
      ondragstart="_peDragStart(event,${i})" ondragover="_peDragOver(event,${i})"
      ondragleave="_peDragLeave(event)" ondrop="_peDrop(event,${i})" ondragend="_peDragEnd(event)">
      <span class="pe-row-grip" title="Drag to reorder">⠿</span>
      <span class="pe-row-num">${i + 1}</span>
      <div class="pe-row-main">
        <div class="pe-row-name-line">
          <input class="pe-row-name" value="${esc(e.name || '')}" spellcheck="false"
            onchange="_peEdit(${i},'name',this.value)" placeholder="Exercise name">
          ${vid}
        </div>
        <div class="pe-chips">
          ${_peChip(i, 'sets', e.sets, 'SETS')}
          ${_peChip(i, 'reps', e.reps, 'REPS')}
          ${_peChip(i, 'rest', e.rest, 'REST')}
        </div>
        <input class="pe-row-note" value="${esc(e.note || '')}"
          onchange="_peEdit(${i},'note',this.value)" placeholder="Coaching note (optional)">
      </div>
      <div class="pe-row-actions">
        <button class="pe-icon-btn" title="Swap from library" onclick="_peSwap(${i})">↔</button>
        <button class="pe-icon-btn pe-icon-del" title="Remove" onclick="_peRemove(${i})">✕</button>
      </div>
    </div>`;
}

function _peChip(i, field, val, label) {
  return `
    <label class="pe-chip">
      <span class="pe-chip-label">${label}</span>
      <input class="pe-chip-input" value="${esc(val || '')}" spellcheck="false"
        onchange="_peEdit(${i},'${field}',this.value)">
    </label>`;
}

/* ── Mutations (operate on the draft, mark dirty, re-render minimally) ── */
function _peDay() { return _peState.draft[_peState.activeDay]; }

function _peEdit(i, field, value) {
  const d = _peDay(); if (!d || !d.exercises[i]) return;
  d.exercises[i][field] = value;
  _peMarkDirty();
}

function _peRemove(i) {
  const d = _peDay(); if (!d) return;
  const name = d.exercises[i]?.name || 'exercise';
  d.exercises.splice(i, 1);
  _peMarkDirty();
  _peRenderRail();
  _peRenderCanvas();
  if (typeof showFitToast === 'function') showFitToast('Removed ' + name);
}

function _peAddExerciseObj(ex) {
  const d = _peDay(); if (!d) return;
  d.exercises.push({
    name: ex.name,
    sets: ex.sets || '3 sets',
    reps: ex.reps || '10–12 reps',
    rest: ex.rest || '90 sec',
    note: ex.note || '',
    ...(ex.videoUrl ? { videoUrl: ex.videoUrl } : {}),
  });
  _peMarkDirty();
  _peRenderRail();
  _peRenderCanvas();
}

function _peAddTyped() {
  const input = document.getElementById('peAddInput');
  const name = (input?.value || '').trim();
  if (!name) return;
  // Match the library for sensible sets/reps defaults; else generic.
  let base = { name };
  try {
    const lib = (typeof _obExerciseLibraryMap === 'function') ? _obExerciseLibraryMap() : new Map();
    const hit = lib.get(name) || Array.from(lib.values()).find(v => v.name.toLowerCase() === name.toLowerCase());
    if (hit) base = { name: hit.name, sets: hit.sets, reps: hit.reps, rest: hit.rest, note: hit.note };
  } catch (_) {}
  _peAddExerciseObj(base);
  if (typeof showFitToast === 'function') showFitToast('Added ' + base.name);
  // Refocus the (re-rendered) input for fast successive adds.
  setTimeout(() => document.getElementById('peAddInput')?.focus(), 30);
}

/* ── Drag to reorder ── */
function _peDragStart(e, i) {
  _peState.dragFrom = i;
  e.dataTransfer.effectAllowed = 'move';
  e.currentTarget.classList.add('pe-dragging');
}
function _peDragOver(e, i) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const row = e.currentTarget;
  if (!row.classList.contains('pe-drag-over')) row.classList.add('pe-drag-over');
}
function _peDragLeave(e) { e.currentTarget.classList.remove('pe-drag-over'); }
function _peDrop(e, to) {
  e.preventDefault();
  e.currentTarget.classList.remove('pe-drag-over');
  const from = _peState.dragFrom;
  if (from == null || from === to) return;
  const list = _peDay().exercises;
  const [moved] = list.splice(from, 1);
  list.splice(to, 0, moved);
  _peState.dragFrom = null;
  _peMarkDirty();
  _peRenderCanvas();
}
function _peDragEnd(e) {
  e.currentTarget.classList.remove('pe-dragging');
  document.querySelectorAll('.pe-drag-over').forEach(el => el.classList.remove('pe-drag-over'));
}

/* ── Dirty tracking ── */
function _peMarkDirty() {
  _peState.dirty = _peSignature(_peState.draft) !== _peState.origSig;
  _peUpdateDirty();
}
function _peUpdateDirty() {
  const dot = document.getElementById('peDirtyDot');
  const save = document.getElementById('peSaveBtn');
  if (dot) dot.hidden = !_peState.dirty;
  if (save) save.classList.toggle('pe-armed', _peState.dirty);
}

/* ── Library drawer (full catalog: templates + clients + EXERCISE_DB + custom) ── */
function _peLibraryItems() {
  try {
    if (typeof _obExerciseLibraryMap !== 'function') return [];
    return Array.from(_obExerciseLibraryMap().values()).sort((a, b) => a.name.localeCompare(b.name));
  } catch (_) { return []; }
}
function _peLibraryOptions() {
  return _peLibraryItems().map(e => `<option value="${esc(e.name)}"></option>`).join('');
}

function _peOpenLibrary(swapIdx) {
  _peCloseLibrary();
  const items = _peLibraryItems();
  const inDay = new Set((_peDay()?.exercises || []).map(e => (e.name || '').toLowerCase()));
  const swapping = typeof swapIdx === 'number';
  const rows = items.map((ex, i) => {
    const used = !swapping && inDay.has(ex.name.toLowerCase());
    return `
      <button class="pe-lib-row" data-pe-lib-name="${esc(ex.name.toLowerCase())}" ${used ? 'disabled' : ''}
        onclick="_pePickLibrary(${i}, ${swapping ? swapIdx : 'null'})">
        <span class="pe-lib-name">${esc(ex.name)}</span>
        <span class="pe-lib-detail">${esc(ex.sets || '')} · ${esc(ex.reps || '')}</span>
        ${used ? '<span class="pe-lib-used">IN DAY</span>' : ''}
      </button>`;
  }).join('');
  const drawer = document.createElement('div');
  drawer.id = 'peLibraryDrawer';
  drawer.className = 'pe-lib-drawer';
  drawer.innerHTML = `
    <div class="pe-lib-backdrop" onclick="_peCloseLibrary()"></div>
    <div class="pe-lib-panel">
      <div class="pe-lib-head">
        <div>
          <div class="pe-lib-kicker">${swapping ? 'SWAP EXERCISE' : 'EXERCISE LIBRARY'}</div>
          <div class="pe-lib-count">${items.length} movements</div>
        </div>
        <button class="pe-icon-btn" onclick="_peCloseLibrary()">✕</button>
      </div>
      <input class="pe-lib-search" id="peLibSearch" type="text" placeholder="Search movements…"
        oninput="_peLibraryFilter(this.value)">
      <div class="pe-lib-list" id="peLibList">${rows}</div>
    </div>`;
  document.getElementById('progEditorOverlay')?.appendChild(drawer);
  requestAnimationFrame(() => drawer.classList.add('open'));
  setTimeout(() => document.getElementById('peLibSearch')?.focus(), 60);
}

function _peCloseLibrary() {
  const d = document.getElementById('peLibraryDrawer');
  if (d) d.remove();
}

function _peLibraryFilter(q) {
  const term = (q || '').toLowerCase().trim();
  const list = document.getElementById('peLibList');
  if (!list) return;
  let shown = 0;
  list.querySelectorAll('[data-pe-lib-name]').forEach(btn => {
    const hit = !term || btn.getAttribute('data-pe-lib-name').includes(term);
    btn.style.display = hit ? '' : 'none';
    if (hit) shown++;
  });
  let empty = list.querySelector('.pe-lib-empty');
  if (!shown && !empty) {
    empty = document.createElement('div');
    empty.className = 'pe-lib-empty';
    empty.textContent = 'NO MATCHES';
    list.appendChild(empty);
  } else if (shown && empty) empty.remove();
}

function _pePickLibrary(i, swapIdx) {
  const items = _peLibraryItems();
  const ex = items[i];
  if (!ex) return;
  if (typeof swapIdx === 'number') {
    // Swap: keep the slot, replace name + prescription, preserve the note.
    const d = _peDay(); const cur = d?.exercises?.[swapIdx];
    if (cur) {
      cur.name = ex.name;
      cur.sets = ex.sets || cur.sets;
      cur.reps = ex.reps || cur.reps;
      cur.rest = ex.rest || cur.rest;
      _peMarkDirty();
      _peRenderCanvas();
      if (typeof showFitToast === 'function') showFitToast('Swapped to ' + ex.name);
    }
  } else {
    _peAddExerciseObj(ex);
    if (typeof showFitToast === 'function') showFitToast('Added ' + ex.name);
  }
  _peCloseLibrary();
}

function _peSwap(i) { _peOpenLibrary(i); }

/* ── Save: commit draft back to the client, keep _meta.days in sync ── */
function _peSave() {
  const cid = _peState.cid;
  const dyn = getDynamicClients();
  const idx = dyn.findIndex(x => x.id === cid);
  if (idx < 0) { if (typeof showFitToast === 'function') showFitToast('Client not found'); return; }
  const cc = JSON.parse(JSON.stringify(dyn[idx]));
  cc.data = cc.data || {};
  const existing = (cc.data.workouts && cc.data.workouts.days) || [];

  // Write each edited day's flat exercise list back as a single block, matched
  // by day id. Preserve every other day field (label, icon, title, sub).
  const byId = {};
  _peState.draft.forEach(d => { byId[d.id] = d.exercises; });
  cc.data.workouts = cc.data.workouts || {};
  cc.data.workouts.days = existing.map(d => {
    const ex = byId[d.id];
    if (!ex) return d;
    return Object.assign({}, d, {
      sub: ex.length + ' exercises',
      blocks: [{ label: (d.blocks && d.blocks[0] && d.blocks[0].label) || 'Exercises', exercises: ex }],
    });
  });

  // Keep _meta.days (the wizard's representation) in sync so a later Edit opens
  // with these exercises. _meta.days holds ALL 7 days incl. rest; match by id.
  if (cc._meta && Array.isArray(cc._meta.days)) {
    cc._meta.days = cc._meta.days.map(d => {
      const ex = byId[d.id];
      return ex ? Object.assign({}, d, { exercises: ex }) : d;
    });
  }

  cc._updated_at = new Date().toISOString();
  dyn[idx] = cc;
  saveDynamicClients(dyn);
  if (typeof invalidateClientsCache === 'function') invalidateClientsCache();

  // Only clear live workout state if the exercises actually changed (day ids
  // are weekday-based and reused, so old live weights would otherwise bleed
  // onto a changed movement). Logged history is archived, not lost.
  const changed = _peSignature(_peState.draft) !== _peState.origSig;
  if (changed && typeof clearWorkoutLiveStateForClient === 'function') {
    clearWorkoutLiveStateForClient(cid);
  }

  try { if (typeof sbAutoSync === 'function') sbAutoSync(cid); } catch (_) {}
  try { if (typeof syncClientData === 'function') syncClientData(cid); } catch (_) {}

  _peState.dirty = false;
  _peState.origSig = _peSignature(_peState.draft);
  closeProgramEditor();
  if (typeof renderCoachDashboard === 'function') renderCoachDashboard();
  if (typeof showFitToast === 'function') showFitToast(changed ? 'Program updated' : 'No changes to save');
}
