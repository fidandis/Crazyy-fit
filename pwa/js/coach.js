/* ══════════════════════════════════════════════════════════════
   COACH FLOW
══════════════════════════════════════════════════════════════ */

function selectCoach() {
  try {
    AppState.isCoachLogin = true;
    AppState.currentClient = null;
    AppState.pinBuffer = '';
    const pinName = safeGetElement('pinName');
    if (pinName) {
      pinName.textContent = 'Coach';
      pinName.style.color = '#3B9EFF';
    }
    const pinError = safeGetElement('pinError');
    if (pinError) pinError.textContent = '';
    updatePinDots('');
    showScreen('pin');
  } catch (e) {
    console.error('Error selecting coach:', e);
  }
}

/* ── COACH BACKGROUND SYNC ───────────────────────────────────── */
let _coachPollTimer  = null;
let _lastSyncTime    = null;
let _syncBadgeTimer  = null;
let _coachPollActive = false;
let _coachVisListener = null;

function _startCoachIntervals() {
  if (_coachPollTimer || !_coachPollActive) return;
  _coachPollTimer = setInterval(coachSilentRefresh, 30000); // every 30s
  _syncBadgeTimer = setInterval(updateSyncBadge, 5000);     // badge text every 5s
}
function _pauseCoachIntervals() {
  if (_coachPollTimer)  { clearInterval(_coachPollTimer);  _coachPollTimer  = null; }
  if (_syncBadgeTimer)  { clearInterval(_syncBadgeTimer);  _syncBadgeTimer  = null; }
}

function startCoachPolling() {
  stopCoachPolling();
  _coachPollActive = true;
  coachSilentRefresh(); // immediate first pull
  if (!document.hidden) _startCoachIntervals();
  // Pause polling while the tab is hidden (saves network + battery on
  // backgrounded PWAs). One refresh fires on resume to catch up.
  _coachVisListener = () => {
    if (!_coachPollActive) return;
    if (document.hidden) _pauseCoachIntervals();
    else { coachSilentRefresh(); _startCoachIntervals(); }
  };
  document.addEventListener('visibilitychange', _coachVisListener);
}

function stopCoachPolling() {
  _coachPollActive = false;
  _pauseCoachIntervals();
  if (_coachVisListener) {
    document.removeEventListener('visibilitychange', _coachVisListener);
    _coachVisListener = null;
  }
}

// Run an array of async tasks with at most N concurrent in flight. Used to
// avoid swamping Supabase with parallel per-client pulls when many clients
// change in the same 30s sync window.
async function _runWithConcurrency(items, limit, worker) {
  const queue = items.slice();
  const inFlight = [];
  while (queue.length || inFlight.length) {
    while (inFlight.length < limit && queue.length) {
      const item = queue.shift();
      const p = Promise.resolve().then(() => worker(item)).catch(() => {})
        .finally(() => { inFlight.splice(inFlight.indexOf(p), 1); });
      inFlight.push(p);
    }
    if (inFlight.length) await Promise.race(inFlight);
  }
}

async function coachSilentRefresh() {
  const data = await sbSelect('clients', 'select=id,name,pin,goal,accent,program_type,data,meta,weight_loss,mode,updated_at');
  if (!data) {
    if (!_lastSyncTime && getAllClients().length === 0) renderCoachOfflineState();
    return;
  }
  const terminated = getLS('terminated_clients', []);
  const existing   = getLS('dynamic_clients', []);
  let changed = false;
  const needsPull = [];

  data.forEach(row => {
    if (terminated.includes(row.id)) return;
    const idx = existing.findIndex(c => c.id === row.id);
    const newClient = {
      id:          row.id,
      name:        row.name,
      pin:         row.pin         || '',
      goal:        row.goal        || '',
      accent:      row.accent      || '#3B9EFF',
      initials:    clientInitials(row.name),
      avatarBg:    (row.accent || '#3B9EFF') + '22',
      avatarColor: row.accent || '#3B9EFF',
      programType: row.program_type || '',
      data:        safeJSON(row.data,        {}),
      _meta:       safeJSON(row.meta,        {}),
      weightLoss:  safeJSON(row.weight_loss, null),
      _updated_at: row.updated_at,
    };
    if (row.mode) localStorage.setItem('client_mode_' + row.id, row.mode);

    if (idx >= 0) {
      if (existing[idx]._updated_at !== row.updated_at) {
        existing[idx] = newClient;
        needsPull.push(row.id);
        changed = true;
      }
    } else {
      existing.push(newClient);
      needsPull.push(row.id);
      changed = true;
    }
  });

  if (changed) {
    localStorage.setItem('dynamic_clients', JSON.stringify(existing));
    renderCoachDashboard();
  } else if (!_lastSyncTime) {
    // First successful sync — replace any skeleton with the real dashboard
    renderCoachDashboard();
  }
  _lastSyncTime = Date.now();
  updateSyncBadge();

  // Fan out per-client pulls with a small concurrency cap (each pull issues
  // 7+ Supabase requests of its own). Background — caller does not await.
  if (needsPull.length) {
    _runWithConcurrency(needsPull, 3, id => pullClientData(id))
      .then(() => { if (needsPull.length) renderCoachDashboard(); });
  }
}

function updateSyncBadge() {
  const el = document.getElementById('coachSyncBadge');
  if (!el) return;
  if (!_lastSyncTime) { el.textContent = '○ SYNCING…'; return; }
  const secs = Math.round((Date.now() - _lastSyncTime) / 1000);
  if (secs < 5)  el.textContent = '● LIVE';
  else           el.textContent = `● synced ${secs}s ago`;
}

function launchCoach() {
  try {
    document.documentElement.style.setProperty('--accent', '#3B9EFF');
    // On a fresh device with no cached clients, show skeletons until the first
    // Supabase pull lands — otherwise renderCoachDashboard paints normally.
    if (getAllClients().length === 0) renderCoachSkeleton();
    else renderCoachDashboard();
    showScreen('coach');
    const coachSub = safeGetElement('coachSub');
    if (coachSub) {
      coachSub.textContent = `// ${getAllClients().length} clients · ${new Date().toLocaleDateString('en',{weekday:'long',month:'short',day:'numeric'})}`;
    }
    // Start background polling (immediate first pull + every 30s)
    startCoachPolling();
  } catch (e) {
    console.error('Error launching coach dashboard:', e);
  }
}

function renderCoachSkeleton() {
  const card = `
    <div class="skel-card">
      <div class="skel-row">
        <div class="skel-block skel-avatar"></div>
        <div style="flex:1">
          <div class="skel-block skel-line mid"></div>
          <div class="skel-block skel-line short"></div>
        </div>
      </div>
      <div class="skel-block skel-line long"></div>
      <div class="skel-block skel-line mid"></div>
      <div class="skel-block skel-line short"></div>
    </div>`;
  const el = document.getElementById('coachContent');
  if (el) el.innerHTML = `<div style="padding:14px 16px;font-family:'Geist Mono',monospace;font-size:10px;color:var(--muted);letter-spacing:1px">SYNCING CLIENTS…</div>${card.repeat(3)}`;
}

function renderCoachOfflineState() {
  const el = document.getElementById('coachContent');
  if (!el) return;
  const online = navigator.onLine;
  const title = online ? 'CAN\'T REACH SERVER' : 'YOU\'RE OFFLINE';
  const sub = online
    ? 'We couldn\'t fetch your clients. Check your connection or try again.'
    : 'Clients will load as soon as you\'re back online.';
  el.innerHTML = `
    <div style="padding:48px 24px;text-align:center;font-family:'Geist Mono',monospace;">
      <div style="font-size:11px;letter-spacing:2px;color:var(--accent);margin-bottom:8px">${title}</div>
      <div style="font-size:13px;line-height:1.5;color:var(--muted);max-width:320px;margin:0 auto 20px">${sub}</div>
      <button onclick="coachSilentRefresh()" style="font-family:'Geist Mono',monospace;font-size:10px;font-weight:700;letter-spacing:1.5px;color:var(--accent);background:none;border:1px solid var(--accent);border-radius:4px;padding:9px 18px;cursor:pointer;text-transform:uppercase">↻ Retry</button>
    </div>`;
}

function buildClientCard(c) {
  const now = Date.now();
    const logs = getFitnessLogs(c.id);
    const macroLogs = getCoachMacroScores(c.id);
    const notes = localStorage.getItem('coach_notes_' + c.id) || '';
    const lastSeenLocal = localStorage.getItem('last_seen_' + c.id);
    const lastSeenMeta  = c._meta?.last_seen ? String(c._meta.last_seen) : null;
    // Prefer whichever timestamp is newer
    const lastSeen = (lastSeenLocal && lastSeenMeta)
      ? (parseInt(lastSeenLocal) >= parseInt(lastSeenMeta) ? lastSeenLocal : lastSeenMeta)
      : (lastSeenLocal || lastSeenMeta);
    // Cache the winning value locally so timeAgo works on coach device without re-pull
    if (lastSeen && lastSeen !== lastSeenLocal) localStorage.setItem('last_seen_' + c.id, lastSeen);
    const unlockedMs = getUnlockedMilestones(c.id);
    const lastSeenStr = lastSeen
      ? timeAgo(parseInt(lastSeen))
      : 'Never logged in';
    const _isPaused = isClientPaused(c.id);
    const _mode = getClientMode(c.id);

    // Goals mini section (replaces old weight-only section)
    const wtSection = buildCoachGoalsMini(c);

    // Last 3 workouts
    const recentWorkouts = logs.slice(-3).reverse();
    const workoutHtml = recentWorkouts.length === 0
      ? `<div class="coach-no-workouts">No workouts logged yet</div>`
      : recentWorkouts.map(w => `
          <div class="coach-workout-row">
            <span class="coach-workout-date">${w.date ? new Date(w.date).toLocaleDateString('en',{month:'short',day:'numeric'}) : '—'}</span>
            <span class="coach-workout-type">${w.type || 'Workout'}</span>
            ${w.calories ? `<span class="coach-workout-cal">🔥 ${w.calories}</span>` : ''}
            ${w.avgHR ? `<span class="coach-workout-cal" style="color:#e74c3c;margin-left:6px">❤️ ${w.avgHR}</span>` : ''}
          </div>`).join('');

    // Stats
    const totalSessions = logs.length;
    const calThisWeek = logs
      .filter(l => l.date && (now - new Date(l.date).getTime()) < 7*24*60*60*1000)
      .reduce((s,l) => s + (l.calories||0), 0);
    const avgScore = macroLogs.length > 0
      ? Math.round(macroLogs.reduce((s,m) => s+m.score, 0) / macroLogs.length)
      : null;
    const lastMacroDate = macroLogs.length > 0
      ? new Date(macroLogs[macroLogs.length-1].date).toLocaleDateString('en',{month:'short',day:'numeric'})
      : null;

    const scoreColor = avgScore == null ? 'var(--muted)' : avgScore >= 80 ? '#2ecc71' : avgScore >= 60 ? '#f1c40f' : '#e74c3c';

    const _unreadMsgs = getLS('notif_log_' + c.id, []).filter(n => !n.read && n.from === 'client').length;
    return `
    <div class="coach-card" data-longpress="client:${esc(c.id)}" style="--cc-accent:${c.accent};opacity:${_isPaused?0.65:1};border-top:${_isPaused?'3px solid #f1c40f':''}">
      <div class="coach-card-header">
        <div class="coach-avatar" style="background:${c.avatarBg || (c.accent || '#3B9EFF') + '22'};color:${c.avatarColor || c.accent || '#3B9EFF'}">${c.initials || clientInitials(c.name)}</div>
        <div style="flex:1">
          <div class="coach-client-name">${esc(c.name)}${_unreadMsgs > 0 ? '' : ''}</div>
          <div class="coach-client-goal">${esc(c.goal)}</div>
          <div class="coach-last-seen">Last active: ${lastSeenStr}${lastSeen && (Date.now()-parseInt(lastSeen)) > 7*86400000 ? '<span class="coach-inactive-flag">INACTIVE 7d+</span>' : ''}</div>
          ${_isPaused ? '<div class="paused-badge">&#9208; Access Paused</div>' : ''}
          <div class="mode-switcher">
            <button class="mode-btn ${_mode==='inperson'?'active-inperson':''}" onclick="setClientMode('${c.id}','inperson');renderCoachDashboard()">🏋️ In-Person</button>
            <button class="mode-btn ${_mode==='remote'?'active-remote':''}" onclick="setClientMode('${c.id}','remote');renderCoachDashboard()">📡 Remote</button>
            <button class="mode-btn ${_mode==='blueprint'?'active-blueprint':''}" onclick="setClientMode('${c.id}','blueprint');renderCoachDashboard()">⚡ Crazyy Blueprint</button>
          </div>
          <div style="font-family:'Geist Mono',monospace;font-size:9px;color:${c.accent};margin-top:2px">${unlockedMs.length} milestone${unlockedMs.length !== 1 ? 's' : ''} unlocked</div>
        </div>
      </div>

      <!-- Key stats -->
      <div class="coach-stats">
        <div class="coach-stat">
          <div class="coach-stat-val" style="color:${c.accent}">${totalSessions}</div>
          <div class="coach-stat-lbl">Sessions</div>
        </div>
        <div class="coach-stat">
          <div class="coach-stat-val" style="color:#3B9EFF">${calThisWeek > 0 ? calThisWeek.toLocaleString() : '—'}</div>
          <div class="coach-stat-lbl">Kcal / 7d</div>
        </div>
        <div class="coach-stat">
          <div class="coach-stat-val" style="color:${scoreColor}">${avgScore != null ? avgScore : '—'}</div>
          <div class="coach-stat-lbl">Macro Avg</div>
        </div>
        <div class="coach-stat">
          ${buildAdherenceStat(c.id, c.data && c.data.schedule ? c.data.schedule.days : [])}
        </div>
      </div>

      <!-- Weight progress -->
      ${wtSection}

      <!-- Recent workouts -->
      <div class="coach-workouts">
        <div class="coach-section-lbl" style="padding-top:14px">Recent Workouts</div>
        ${workoutHtml}
      </div>

      <!-- Macro compliance -->
      ${macroLogs.length > 0 ? `
      <div class="coach-macro-section">
        <div class="coach-section-lbl">Macro Compliance${lastMacroDate ? ` · Last: ${lastMacroDate}` : ''}</div>
        <div class="coach-macro-scores">
          ${macroLogs.slice(-5).reverse().map(m => {
            const col = m.score >= 80 ? 'rgba(46,204,113,.15)' : m.score >= 60 ? 'rgba(241,196,15,.12)' : 'rgba(231,76,60,.12)';
            const tcol = m.score >= 80 ? '#2ecc71' : m.score >= 60 ? '#f1c40f' : '#e74c3c';
            return `<span class="coach-macro-score" style="background:${col};color:${tcol}">${m.score}/100</span>`;
          }).join('')}
        </div>
      </div>` : ''}

      <!-- Latest check-in -->
      ${buildCheckinSnippet(c.id)}
      <!-- Nutrition snapshot -->
      ${buildNutritionSnippet(c.id)}
      <!-- Coach notes log -->
      <div class="coach-notes-section">
        <div class="coach-section-lbl">Coach Notes (private)${(() => { const _nl = getCoachNotesLog(c.id); if (!_nl.length) return ''; const _last = _nl[_nl.length - 1]; const _flagged = _nl.filter(n => n.flagged).length; const _daysAgo = Math.floor((Date.now() - _last.ts) / 86400000); const _when = _daysAgo === 0 ? 'today' : _daysAgo === 1 ? 'yesterday' : _daysAgo + 'd ago'; const _stale = _daysAgo > 14 ? ';color:#e74c3c' : _daysAgo > 7 ? ';color:#f1c40f' : ''; return ` <span style="font-family:'Geist Mono',monospace;font-size:9px;color:var(--muted);font-weight:400${_stale}">${_nl.length} note${_nl.length===1?'':'s'} · last ${_when}${_flagged ? ` · <span style="color:#f1c40f">⚑ ${_flagged}</span>` : ''}</span>`; })()}</div>
        <div class="coach-notes-log" id="coach-notes-log-${c.id}">${buildCoachNotesLogHtml(c.id)}</div>
        <div class="coach-note-add-row">
          <textarea id="coach-note-input-${c.id}" placeholder="Add a session note, flag, or reminder…" maxlength="500"></textarea>
          <button class="coach-note-add-btn" onclick="addCoachNoteEntry('${c.id}')">Add</button>
        </div>
      </div>
      <!-- Message thread -->
      <div class="coach-notes-section" style="border-top:1px solid var(--border)">
        <div class="coach-section-lbl">Messages${_unreadMsgs > 0 ? ` <span style="background:#2ecc71;color:#000;font-size:9px;padding:1px 6px;border-radius:8px;margin-left:6px">${_unreadMsgs} repl${_unreadMsgs===1?'y':'ies'}</span>` : ''}</div>
        ${(() => {
          const thread = getLS('notif_log_' + c.id, []).slice(-6).reverse();
          if (!thread.length) return '';
          return `<div style="max-height:150px;overflow-y:auto;border:1px solid var(--border);border-radius:6px;margin-bottom:8px">${
            thread.map(n => {
              const isClient = n.from === 'client';
              const bg = isClient ? 'rgba(46,204,113,.07)' : 'transparent';
              const label = isClient ? c.name.split(' ')[0] : 'You (coach)';
              const ts = new Date(n.ts).toLocaleDateString('en',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
              return `<div style="padding:7px 10px;border-bottom:1px solid var(--faint);background:${bg}">
                <div style="font-size:12px">${esc(n.msg)}</div>
                <div style="font-family:'Geist Mono',monospace;font-size:9px;color:var(--muted);margin-top:2px">${label} · ${ts}</div>
              </div>`;
            }).join('')
          }</div>`;
        })()}
        <div style="font-family:'Geist Mono',monospace;font-size:9px;color:var(--muted);margin-bottom:6px">Sends push + email notification to ${esc(c.name.split(' ')[0])}</div>
        <div class="coach-send-msg-wrap">
          <textarea id="coachmsg-${c.id}" maxlength="300" placeholder="Great work this week! Focus on..."></textarea>
          <button class="coach-send-msg-btn" onclick="saveCoachMessage('${c.id}')">Send →</button>
        </div>
      </div>
      <!-- Progression rules -->
      ${buildProgressionRulesCoachPanel(c)}
      <!-- Card actions -->
      <div class="coach-card-actions">
        <button class="coach-action-btn" data-cid="${esc(c.id)}" onclick="coachViewPin(this.dataset.cid)">View PIN</button>
        <button class="coach-action-btn" data-cid="${esc(c.id)}" onclick="coachEditClient(this.dataset.cid)">Edit</button>
        <button class="coach-action-btn" style="color:var(--accent)" data-cid="${esc(c.id)}" onclick="coachViewAsClient(this.dataset.cid)">👁 View</button>
        <button class="coach-action-btn ${_isPaused ? 'pause-active' : ''}" data-cid="${esc(c.id)}" onclick="togglePauseClient(this.dataset.cid)">${_isPaused ? 'Unpause' : 'Pause'}</button>
        <button class="coach-action-btn" data-cid="${esc(c.id)}" onclick="openNotifModal(this.dataset.cid)">Notify</button>
        <button class="coach-action-btn" data-cid="${esc(c.id)}" onclick="emailClientCredentials(this.dataset.cid)" title="Generate new PIN and email to client">Email PIN</button>
        <button class="coach-action-btn" data-cid="${esc(c.id)}" onclick="openPeriodizationScreen(this.dataset.cid)" style="color:#9b59b6;border-color:#9b59b6">📅 Periodize</button>
        <button class="coach-action-btn" data-cid="${esc(c.id)}" onclick="renderBadgesInCard(this.dataset.cid)" style="color:#f1c40f;border-color:rgba(241,196,15,.4)">🏅 Badges</button>
        <button class="ai-review-btn" data-cid="${esc(c.id)}" onclick="openAIReview(this.dataset.cid)" style="grid-column:1/-1">🤖 AI Program Review</button>
        <button class="coach-action-btn" data-cid="${esc(c.id)}" onclick="openAIBuildWorkout(this.dataset.cid)" style="grid-column:1/-1;color:var(--accent);border-color:rgba(59,158,255,.4)">AI Build Workout</button>
        <button class="coach-action-btn danger" data-cid="${esc(c.id)}" onclick="openTerminateModal(this.dataset.cid)" style="grid-column:1/-1">Terminate</button>
      </div>
    </div>`;
}

function renderClientGroup(label, icon, color, clients, emptyMsg) {
  return `<div class="client-group">
    <div class="client-group-header">
      <div class="client-group-title">
        <span class="client-group-accent" style="background:${color}"></span>
        ${icon} ${label}
      </div>
      <span class="client-group-count">${clients.length} client${clients.length !== 1 ? 's' : ''}</span>
    </div>
    ${clients.length === 0
      ? `<div class="client-group-empty">${emptyMsg}</div>`
      : `<div class="coach-grid">${clients.map(buildClientCard).join('')}</div>`}
  </div>`;
}

function buildActivityFeed(clients) {
  const now    = Date.now();
  const cutoff = now - 48 * 60 * 60 * 1000;
  const events = [];

  clients.forEach(c => {
    getFitnessLogs(c.id).forEach(l => {
      const ts = l.date ? new Date(l.date).getTime() : 0;
      if (ts >= cutoff) events.push({ ts, icon: '🏋️', text: `${esc(c.name)} logged a workout`, sub: l.type || 'Workout', accent: c.accent || '#3B9EFF' });
    });
    getCheckins(c.id).forEach(ci => {
      const ts = ci.date ? new Date(ci.date).getTime() : 0;
      if (ts >= cutoff) events.push({ ts, icon: '📋', text: `${esc(c.name)} submitted a check-in`, sub: `Energy ${ci.energy || '—'} · Sleep ${ci.sleep || '—'} · Adherence ${ci.adherence || '—'}`, accent: c.accent || '#3B9EFF' });
    });
  });

  if (!events.length) return '';
  events.sort((a, b) => b.ts - a.ts);
  const rows = events.slice(0, 8).map(e => `
    <div style="display:flex;align-items:flex-start;gap:10px;padding:9px 0;border-bottom:1px solid var(--faint)">
      <div style="font-size:16px;flex-shrink:0;margin-top:1px">${e.icon}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;color:var(--text)">${e.text}</div>
        <div style="font-family:'Geist Mono',monospace;font-size:9px;color:var(--muted);margin-top:2px">${e.sub} · ${timeAgo(e.ts)}</div>
      </div>
      <div style="width:3px;flex-shrink:0;align-self:stretch;background:${e.accent};border-radius:2px;opacity:.6"></div>
    </div>`).join('');

  return `<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:14px 16px;margin:0 16px 16px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
      <div style="font-family:var(--display);font-weight:700;font-size:16px;letter-spacing:1px;color:var(--text)">Recent Activity <span style="font-family:'Geist Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:1px">— last 48h</span></div>
      <button onclick="triggerWeeklyDigest()" style="font-family:'Geist Mono',monospace;font-size:9px;letter-spacing:1px;background:rgba(59,158,255,.1);color:#3B9EFF;border:1px solid rgba(59,158,255,.3);border-radius:6px;padding:3px 8px;cursor:pointer">📧 Send Digest</button>
    </div>
    ${rows}
  </div>`;
}

async function triggerWeeklyDigest() {
  showFitToast('Sending digest…');
  try {
    const r = await fetch('/api/weekly-digest', { method: 'POST' });
    const d = await r.json();
    showFitToast(r.ok ? `✓ Digest sent (${d.active} active clients)` : '✗ Digest failed — check COACH_EMAIL env var');
  } catch { showFitToast('✗ Could not reach server'); }
}

function renderCoachDashboard() {
  const allClients = getAllClients();
  const sbConnected = true;
  const searchQuery = AppState._dashSearch || '';
  const searchFilter = c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || (c.goal||'').toLowerCase().includes(searchQuery.toLowerCase());
  const inperson  = allClients.filter(c => getClientMode(c.id) === 'inperson'  && searchFilter(c));
  const remote    = allClients.filter(c => getClientMode(c.id) === 'remote'    && searchFilter(c));
  const blueprint = allClients.filter(c => getClientMode(c.id) === 'blueprint' && searchFilter(c));
  const headerHtml = `
    <div class="coach-dashboard-header">
      <div style="display:flex;align-items:center;gap:10px">
        <div class="coach-client-count">${allClients.length} client${allClients.length !== 1 ? 's' : ''}</div>
        <span id="coachSyncBadge" onclick="coachSilentRefresh()" title="Click to refresh now"
          style="font-family:'Geist Mono',monospace;font-size:9px;letter-spacing:1px;padding:2px 7px;border-radius:10px;background:rgba(46,204,113,.12);color:#2ecc71;cursor:pointer;user-select:none">
          ● LIVE
        </span>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;align-items:center">
        <input id="dashSearchInput" type="search" placeholder="Search clients…" value="${esc(searchQuery)}"
          oninput="AppState._dashSearch=this.value;renderCoachDashboard()"
          style="font-family:'Geist Mono',monospace;font-size:11px;padding:6px 10px;background:var(--surface);border:1px solid var(--border);border-radius:6px;color:var(--text);width:140px;outline:none">
        <button class="coach-add-btn" onclick="startOnboarding()">+ Add Client</button>
        <button class="coach-add-btn" onclick="openLeads()" style="background:rgba(59,158,255,.1);color:#3B9EFF;border-color:#3B9EFF" title="Signup leads">📥 Leads${getLS('signups',[]).filter(s=>!s.converted).length > 0 ? ' ('+getLS('signups',[]).filter(s=>!s.converted).length+')' : ''}</button>
        <button class="coach-add-btn" onclick="openBroadcast()" style="background:rgba(59,158,255,.08);color:#3B9EFF;border-color:rgba(59,158,255,.3)" title="Broadcast message">📢 Broadcast</button>
        <button class="coach-add-btn" onclick="openCompare()" style="background:rgba(155,89,182,.1);color:#9b59b6;border-color:#9b59b6" title="Compare clients">⚖ Compare</button>
        <button class="coach-add-btn" onclick="openSBSettings()" style="background:${sbConnected?'rgba(46,204,113,.1)':'rgba(255,255,255,.05)'};color:${sbConnected?'#2ecc71':'var(--muted)'};border-color:${sbConnected?'#2ecc71':'var(--border)'}" title="Supabase sync">☁ Sync</button>
        <button class="coach-add-btn" onclick="triggerWeeklyDigest()" style="background:rgba(59,158,255,.08);color:#3B9EFF;border-color:rgba(59,158,255,.3)" title="Send weekly digest email">📧 Digest</button>
        <button id="analyticsPanelBtn" class="coach-add-btn" onclick="toggleAnalyticsPanel()" style="background:${AppState._analyticsOpen?'rgba(52,152,219,.2)':'rgba(52,152,219,.1)'};color:#3498db;border-color:#3498db" title="Analytics overview">📊 Analytics</button>
        <button class="coach-add-btn" onclick="openMovementLibrary()" style="background:rgba(155,89,182,.1);color:#9b59b6;border-color:#9b59b6" title="Movement library">📚 Library</button>
        <button class="coach-add-btn" onclick="exportAllData()" style="background:rgba(52,152,219,.1);color:#3498db;border-color:#3498db" title="Download all data">⬇ Export</button>
        <button class="coach-add-btn" style="position:relative;overflow:hidden;background:rgba(52,152,219,.05);color:var(--muted);border-color:var(--border)" title="Restore from backup">
          <input type="file" accept=".json" onchange="restoreFromBackup(this.files[0])" style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%">
          ⬆ Restore
        </button>
      </div>
    </div>`;
  // ── Archived section ──
  const archived = getArchivedClients();
  let archivedHtml = '';
  if (archived.length > 0) {
    const archivedCards = archived.map(entry => {
      const c = entry.client || {};
      const archivedDate = entry.archivedAt
        ? new Date(entry.archivedAt).toLocaleDateString('en',{month:'short',day:'numeric',year:'numeric'})
        : 'Unknown date';
      const sessions = entry.data?.fitLogs?.length || 0;
      const notes = entry.data?.coachNotes || '';
      return `
        <div class="archived-card">
          <div class="archived-card-header">
            <div class="coach-avatar" style="background:${c.avatarBg||'#222'};color:${c.avatarColor||'#888'};width:36px;height:36px;font-size:14px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--display);font-weight:700;flex-shrink:0">${c.initials||'??'}</div>
            <div>
              <div style="font-family:var(--display);font-weight:700;font-size:18px;letter-spacing:1px;color:var(--muted)">${c.name||'Unknown'}</div>
              <div class="archived-badge">Archived</div>
            </div>
          </div>
          <div class="archived-info">
            Archived on <span>${archivedDate}</span> · <span>${sessions}</span> sessions logged
            ${notes ? ` · Notes: <span>${notes.slice(0,40)}${notes.length>40?'…':''}</span>` : ''}
          </div>
          <div class="archived-actions">
            <button class="archived-restore-btn" onclick="restoreClient('${c.id}')">↩ Restore</button>
            <button class="archived-delete-btn" data-cid="${esc(c.id)}" onclick="permanentlyDeleteClient(this.dataset.cid)">Delete Forever</button>
          </div>
        </div>`;
    }).join('');

    archivedHtml = `
      <div class="coach-archived-section">
        <div class="coach-archived-header" onclick="toggleArchivedSection()">
          <div class="coach-archived-title">
            Archived Clients
            <span class="coach-archived-count">${archived.length}</span>
          </div>
          <div class="coach-archived-toggle" id="archivedToggleIcon">▼</div>
        </div>
        <div class="coach-archived-grid" id="archivedGrid">${archivedCards}</div>
      </div>`;
  }

  // First-run empty state — no clients at all (and not just filtered out)
  if (allClients.length === 0 && !searchQuery) {
    const emptyHtml = `
      <div class="coach-empty-state">
        <div class="coach-empty-icon">🏋️</div>
        <div class="coach-empty-title">Add your first client</div>
        <div class="coach-empty-sub">Build their program, track workouts, and message them — all from here.</div>
        <button class="coach-empty-cta" onclick="startOnboarding()">+ Add Client</button>
        <div class="coach-empty-hint">Clients log in with a 4-digit PIN you'll generate during setup.</div>
      </div>`;
    document.getElementById('coachContent').innerHTML = headerHtml + emptyHtml;
    return;
  }

  const groupsHtml =
    renderClientGroup('In-Person', '🏋️', '#e74c3c', inperson, 'No in-person clients yet.') +
    renderClientGroup('Remote', '📡', '#3498db', remote, 'No remote clients yet.') +
    renderClientGroup('Crazyy Blueprint', '⚡', 'var(--accent)', blueprint, 'No blueprint clients yet.');

  const analyticsHtml = `<div class="analytics-panel${AppState._analyticsOpen?' open':''}" id="coachAnalyticsPanel">${buildAnalyticsPanel(allClients)}</div>`;
  document.getElementById('coachContent').innerHTML = headerHtml + analyticsHtml + buildActivityFeed(allClients) + groupsHtml + archivedHtml;
}

function buildCoachWeightSection(c) {
  try {
    const progress = calculateWeightProgress(c);
    if (!progress) return '';
    
    const { current, lost, pct } = progress;
    const wl = c.weightLoss;
    
    return `
      <div class="coach-wt-section">
        <div class="coach-wt-label">Weight Progress</div>
        <div class="coach-wt-row">
          <div class="coach-wt-num" style="color:var(--muted)">${wl.start}</div>
          <div class="coach-wt-track">
            <div class="coach-wt-fill" style="width:${pct}%;background:${c.accent}"></div>
          </div>
          <div class="coach-wt-num" style="color:${c.accent}">${current}</div>
          <div class="coach-wt-pct">${pct}%</div>
        </div>
        <div style="font-family:'Geist Mono',monospace;font-size:9px;color:var(--muted);margin-top:6px">
          Goal: ${wl.goal} ${wl.unit} · ${lost > 0 ? `▼ ${lost.toFixed(1)} lost` : 'No progress logged yet'}
        </div>
      </div>`;
  } catch (e) {
    console.error('Error building coach weight section:', e);
    return '';
  }
}

function getCoachMacroScores(cid) {
  try { return getLS('macro_scores_' + cid, []); } catch { return []; }
}

function saveCoachNote(cid) {
  const val = document.getElementById('notes-' + cid)?.value || '';
  localStorage.setItem('coach_notes_' + cid, val);
  const saved = document.getElementById('saved-' + cid);
  if (saved) { saved.style.display = 'inline'; setTimeout(() => saved.style.display = 'none', 2000); }
  sbAutoSync(cid);
}
function saveCoachMessage(cid) {
  const val = document.getElementById('coachmsg-' + cid)?.value?.trim() || '';
  const ts  = new Date().toISOString();
  if (val) {
    localStorage.setItem('coach_msg_' + cid, val);
    localStorage.setItem('coach_msg_ts_' + cid, ts);
    // Push to Supabase messages table so client sees it on any device
    sbUpsert('messages', { id: 'msg_' + cid + '_' + Date.now(), client_id: cid, from_coach: true, body: val, read: false, sent_at: ts });
    // Fire push notification if client is subscribed
    triggerClientPush(cid, 'Message from your coach', val.length > 60 ? val.slice(0, 57) + '…' : val);
    // Send email notification to client
    const _clientForMsg = getAllClients().find(cl => cl.id === cid);
    const _clientEmail = _clientForMsg?._meta?.email;
    if (_clientEmail) {
      const _appUrl = window.location.href.split('?')[0];
      sendEmail(_clientEmail, 'New message from your coach — CrazyyFit',
        buildCoachMsgEmailHtml(_clientForMsg.name, val, _appUrl)).catch(() => {});
    }
  } else {
    localStorage.removeItem('coach_msg_' + cid);
    localStorage.removeItem('coach_msg_ts_' + cid);
  }
  showFitToast(val ? '✓ Message sent' : 'Message cleared');
  sbAutoSync(cid);
  renderCoachDashboard();
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 2)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs  < 24) return `${hrs}h ago`;
  if (days < 7)  return `${days}d ago`;
  return new Date(ts).toLocaleDateString('en',{month:'short',day:'numeric'});
}


/* ══════════════════════════════════════════════════════════════
   MILESTONE SYSTEM
══════════════════════════════════════════════════════════════ */

const MILESTONES = [
  // Workout count milestones
  { id:'first_session',   type:'sessions', threshold:1,   emoji:'🔥', title:'First Step',      msg:'You showed up. That\'s the hardest part — and you did it. The journey starts now.',        label:'1st Workout' },
  { id:'sessions_3',      type:'sessions', threshold:3,   emoji:'💪', title:'Warming Up',      msg:'3 sessions in. Your body is adapting, your habits are forming. Keep this momentum.',       label:'3 Workouts' },
  { id:'sessions_5',      type:'sessions', threshold:5,   emoji:'⚡', title:'5 Sessions',      msg:'Five workouts done. You\'re not a beginner anymore — you\'re building something real.',     label:'5 Workouts' },
  { id:'sessions_10',     type:'sessions', threshold:10,  emoji:'🏅', title:'10 Strong',       msg:'10 sessions completed. Most people quit before this point. You didn\'t. That matters.',     label:'10 Workouts' },
  { id:'sessions_25',     type:'sessions', threshold:25,  emoji:'🎯', title:'Quarter Century', msg:'25 workouts. This is no longer a phase — it\'s a lifestyle. Seriously impressive.',         label:'25 Workouts' },
  { id:'sessions_50',     type:'sessions', threshold:50,  emoji:'🏆', title:'50 Sessions',     msg:'Fifty workouts completed. You are the definition of consistency. Coach is proud.',          label:'50 Workouts' },

  // Weight loss milestones (only for weight loss clients)
  { id:'lost_1lb',        type:'weight',   threshold:1,   emoji:'📉', title:'First Pound',     msg:'1 lb down. The scale moved. Your effort is working — this is just the beginning.',          label:'1 lb Lost' },
  { id:'lost_5lbs',       type:'weight',   threshold:5,   emoji:'🔥', title:'5 Pounds Down',   msg:'5 lbs gone. That\'s a month of discipline paying off. Your body is changing.',              label:'5 lbs Lost' },
  { id:'lost_10lbs',      type:'weight',   threshold:10,  emoji:'⚡', title:'10 Pounds',       msg:'10 lbs lost. This is a massive achievement. You\'ve completely transformed your habits.',   label:'10 lbs Lost' },
  { id:'lost_halfway',    type:'weight_pct', threshold:50, emoji:'🎯', title:'Halfway There',  msg:'You\'re halfway to your goal weight. The hardest part is behind you. Keep pushing.',        label:'50% to Goal' },
  { id:'lost_goal',       type:'weight_pct', threshold:100,emoji:'🏆', title:'Goal Achieved!', msg:'You did it. You hit your goal weight. This is what months of hard work looks like.',        label:'Goal Weight!' },

  // Calorie milestones
  { id:'kcal_1000',       type:'total_kcal', threshold:1000,  emoji:'💥', title:'1,000 Kcal',  msg:'1,000 calories burned through training. That\'s real work.',                                label:'1K Kcal Burned' },
  { id:'kcal_5000',       type:'total_kcal', threshold:5000,  emoji:'🔥', title:'5,000 Kcal',  msg:'5,000 calories burned. Your metabolism is your weapon now.',                                label:'5K Kcal Burned' },
  { id:'kcal_10000',      type:'total_kcal', threshold:10000, emoji:'⚡', title:'10,000 Kcal', msg:'Ten thousand calories burned in training. Elite level consistency.',                         label:'10K Kcal Burned' },

  // Streak milestones
  { id:'week_streak',     type:'week',     threshold:1,   emoji:'🗓️', title:'Full Week',       msg:'You trained every scheduled day this week. Perfect execution.',                              label:'Full Week' },
  { id:'streak_2weeks',   type:'week',     threshold:2,   emoji:'📅', title:'2-Week Streak',   msg:'Two full weeks of consistent training. You\'re building an unbreakable habit.',             label:'2-Week Streak' },
  { id:'streak_month',    type:'week',     threshold:4,   emoji:'🏅', title:'Full Month',      msg:'A complete month of training. This is the point where it becomes automatic.',               label:'Full Month' },

  // PR milestones
  { id:'first_pr',        type:'prs',      threshold:1,   emoji:'🎯', title:'First PR',        msg:'You set your first personal record. This is what progress looks like — data doesn\'t lie.',  label:'First PR' },
  { id:'prs_5',           type:'prs',      threshold:5,   emoji:'🏋️', title:'5 PRs Set',       msg:'Five personal records across different lifts. You are getting stronger across the board.',  label:'5 PRs' },
  { id:'prs_10',          type:'prs',      threshold:10,  emoji:'💎', title:'PR Machine',      msg:'10 personal records. Consistent strength gains across your entire program.',                 label:'10 PRs' },

  // Macro/nutrition milestones
  { id:'macro_hit',       type:'macro',    threshold:1,   emoji:'🥗', title:'Macro Hit',       msg:'You hit your macro targets. Nutrition is clicking.',                                         label:'First Macro Hit' },
  { id:'macro_streak_3',  type:'macro',    threshold:3,   emoji:'🍽️', title:'Nutrition Streak',msg:'3 times hitting your macros. Consistency in the kitchen is 80% of the work.',              label:'3× Macros Hit' },
  { id:'macro_streak_7',  type:'macro',    threshold:7,   emoji:'⭐', title:'Nutrition Week',  msg:'Seven macro targets hit. You\'ve built a genuine nutrition habit. Coach is proud.',          label:'7× Macros Hit' },
];

function getUnlockedMilestones(cid) {
  try { return getLS('milestones_' + cid, []); } catch { return []; }
}
function saveUnlockedMilestones(cid, list) {
  localStorage.setItem('milestones_' + cid, JSON.stringify(list));
}

function checkMilestones(c) {
  const logs = getFitnessLogs(c.id);
  const unlocked = getUnlockedMilestones(c.id);
  const newUnlocks = [];

  const totalSessions = logs.length;
  const totalKcal = logs.reduce((s,l) => s + (l.calories||0), 0);
  const lostLbs = c.weightLoss ? Math.max(0, c.weightLoss.start - getCurrentWeight(c)) : 0;
  const pctToGoal = c.weightLoss
    ? Math.min(100, Math.round((lostLbs / (c.weightLoss.start - c.weightLoss.goal)) * 100))
    : 0;

  // Week streak — count consecutive weeks with ≥ scheduled sessions
  const weeksWithSessions = countTrainingWeeks(logs, c);

  // PR count — number of exercises with a logged PR
  const prCount = Object.keys(getPRs(c.id)).length;

  // Macro hits — number of times macro score was 60+
  const macroHits = getCoachMacroScores(c.id).filter(m => m.score >= 60).length;

  for (const ms of MILESTONES) {
    if (unlocked.includes(ms.id)) continue;

    // Skip weight milestones for non-weight-loss clients
    if ((ms.type === 'weight' || ms.type === 'weight_pct') && !c.weightLoss) continue;

    let achieved = false;
    if (ms.type === 'sessions')    achieved = totalSessions >= ms.threshold;
    if (ms.type === 'total_kcal')  achieved = totalKcal >= ms.threshold;
    if (ms.type === 'weight')      achieved = lostLbs >= ms.threshold;
    if (ms.type === 'weight_pct')  achieved = pctToGoal >= ms.threshold;
    if (ms.type === 'week')        achieved = weeksWithSessions >= ms.threshold;
    if (ms.type === 'prs')         achieved = prCount >= ms.threshold;
    if (ms.type === 'macro')       achieved = macroHits >= ms.threshold;

    if (achieved) newUnlocks.push(ms);
  }

  if (newUnlocks.length > 0) {
    const allUnlocked = [...unlocked, ...newUnlocks.map(m => m.id)];
    saveUnlockedMilestones(c.id, allUnlocked);
    // Show one at a time — queue the rest
    showMilestoneQueue(newUnlocks, c);
  }
}

function showMilestoneQueue(list, c) {
  try {
    AppState.milestoneQueue = [...list];
    AppState.milestoneQueueClient = c;
    showNextMilestone();
  } catch (e) {
    console.error('Error showing milestone queue:', e);
  }
}

function showNextMilestone() {
  try {
    if (AppState.milestoneQueue.length === 0) return;
    const ms = AppState.milestoneQueue.shift();
    const accent = AppState.milestoneQueueClient?.accent || '#3B9EFF';

    document.documentElement.style.setProperty('--accent', accent);
    const backdrop = safeGetElement('milestoneBackdrop');
    const msEmoji = safeGetElement('msEmoji');
    const msLabel = safeGetElement('msLabel');
    const msTitle = safeGetElement('msTitle');
    const msMsg = safeGetElement('msMsg');
    
    if (msEmoji) msEmoji.textContent = ms.emoji;
    if (msLabel) msLabel.textContent = ms.label;
    if (msTitle) msTitle.textContent = ms.title;
    if (msMsg) msMsg.textContent = ms.msg;
    if (backdrop) backdrop.classList.add('open');

    if (typeof haptic === 'function') haptic('success');
    document.body.style.overflow = 'hidden';
    launchConfetti(accent);
  } catch (e) {
    console.error('Error showing next milestone:', e);
  }
}

function closeMilestone() {
  try {
    const backdrop = safeGetElement('milestoneBackdrop');
    if (backdrop) backdrop.classList.remove('open');
    document.body.style.overflow = '';
    stopConfetti();
    // Show next in queue after short delay
    if (AppState.milestoneQueue.length > 0) {
      setTimeout(showNextMilestone, 400);
    }
  } catch (e) {
    console.error('Error closing milestone:', e);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('milestoneBackdrop').addEventListener('click', e => {
    if (e.target === document.getElementById('milestoneBackdrop')) closeMilestone();
  });
});

function countTrainingWeeks(logs, c) {
  if (logs.length === 0) return 0;

  // How many training days per week does this client have?
  // Count non-rest days from their schedule. Default to 3 if no schedule.
  const scheduledDays = c.data?.schedule?.days
    ? c.data.schedule.days.filter(d => !['rest','wk-rest'].includes(d.type) && d.type !== 'wk-rest').length
    : 3;
  // Require at least half their scheduled days to count a week as "complete"
  // This means rest days NEVER break a streak — only missed training days do
  const requiredSessions = Math.max(1, Math.floor(scheduledDays / 2));

  // Group logs by ISO week
  const weeks = {};
  logs.forEach(l => {
    if (!l.date) return;
    const week = getISOWeek(new Date(l.date));
    weeks[week] = (weeks[week] || 0) + 1;
  });

  if (Object.keys(weeks).length === 0) return 0;

  // Walk backwards from the most recent week that has ANY session.
  // Skip the current in-progress week (it hasn't ended yet so don't penalise it).
  // For each week step backwards, if there's a gap week with zero sessions we allow
  // it ONLY if that entire week was within the client's rest schedule — we can't
  // know that precisely without a calendar, so we allow ONE gap week before breaking.
  // This prevents a single missed week from wiping a long streak unfairly.
  const sortedWeeks = Object.keys(weeks).sort();
  const latestWeek = sortedWeeks[sortedWeeks.length - 1];
  const currentWeek = getISOWeek(new Date());

  let streak = 0;
  let gapsAllowed = 0; // allow 0 full-gap weeks — only rest days within a week are forgiven
  let checkWeek = currentWeek === latestWeek ? getPrevWeek(latestWeek) : latestWeek;

  // Walk back up to 52 weeks
  for (let i = 0; i < 52; i++) {
    const sessions = weeks[checkWeek] || 0;
    if (sessions >= requiredSessions) {
      streak++;
    } else if (sessions > 0 && sessions < requiredSessions) {
      // Partial week — still counts if they got at least 1 session
      // (accounts for deload weeks, illness, etc.)
      streak++;
    } else {
      // Zero sessions this week — gap
      if (gapsAllowed > 0) {
        gapsAllowed--;
      } else {
        break; // streak ends
      }
    }
    checkWeek = getPrevWeek(checkWeek);
    // Stop if we've gone past the earliest log
    if (checkWeek < sortedWeeks[0]) break;
  }

  return streak;
}

function getPrevWeek(isoWeek) {
  // isoWeek format: "2025-W14"
  const [year, wPart] = isoWeek.split('-W');
  const w = parseInt(wPart);
  if (w > 1) return `${year}-W${String(w - 1).padStart(2,'0')}`;
  // Roll back to last week of previous year
  const prevYear = parseInt(year) - 1;
  const dec28 = new Date(prevYear, 11, 28);
  return getISOWeek(dec28);
}

function getISOWeek(d) {
  const date = new Date(d);
  date.setHours(0,0,0,0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return date.getFullYear() + '-W' + String(1 + Math.round(((date - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7)).padStart(2,'0');
}

/* ── MILESTONES TAB RENDERER ── */
function renderMilestones(c) {
  // Reconcile any unlocks from logs that were added without going through
  // the workout/tabata/fitness handlers (e.g. Apple Shortcut imports, coach manual entries).
  try { checkMilestones(c); } catch(_) {}
  const unlocked = getUnlockedMilestones(c.id);
  const logs = getFitnessLogs(c.id);
  const totalSessions = logs.length;
  const totalKcal = logs.reduce((s,l) => s + (l.calories||0), 0);
  const lostLbs = c.weightLoss ? Math.max(0, c.weightLoss.start - getCurrentWeight(c)) : 0;
  const pctToGoal = c.weightLoss ? Math.min(100, Math.round((lostLbs / (c.weightLoss.start - c.weightLoss.goal)) * 100)) : 0;

  const relevantMilestones = MILESTONES.filter(ms =>
    (ms.type !== 'weight' && ms.type !== 'weight_pct') || c.weightLoss
  );

  const unlockedCount = relevantMilestones.filter(ms => unlocked.includes(ms.id)).length;

  const cards = relevantMilestones.map(ms => {
    const isUnlocked = unlocked.includes(ms.id);
    return `
      <div class="ms-card ${isUnlocked ? 'unlocked' : ''}">
        <div class="ms-emoji">${ms.emoji}</div>
        <div class="ms-name">${ms.title}</div>
        <div class="ms-desc">${ms.label}</div>
        ${isUnlocked
          ? `<div class="ms-unlocked-badge">✓ Unlocked</div>`
          : `<div class="ms-locked-icon">🔒</div>`}
      </div>`;
  }).join('');

  // Next milestone to unlock
  const next = relevantMilestones.find(ms => !unlocked.includes(ms.id));
  let nextHtml = '';
  if (next) {
    let progress = 0, total = 1, label = '';
    if (next.type === 'sessions')    { progress = totalSessions; total = next.threshold; label = `${progress} / ${total} sessions`; }
    if (next.type === 'total_kcal')  { progress = totalKcal; total = next.threshold; label = `${progress.toLocaleString()} / ${total.toLocaleString()} kcal`; }
    if (next.type === 'weight')      { progress = lostLbs; total = next.threshold; label = `${lostLbs.toFixed(1)} / ${total} lbs lost`; }
    if (next.type === 'weight_pct')  { progress = pctToGoal; total = next.threshold; label = `${pctToGoal}% / ${total}% to goal`; }
    if (next.type === 'week')        { progress = countTrainingWeeks(logs, c); total = next.threshold; label = `${progress} / ${total} weeks`; }
    const pct = Math.min(100, Math.round((progress / total) * 100));
    nextHtml = `
      <div class="card" style="margin-bottom:20px">
        <div class="card-block">
          <div class="block-label">Next Milestone</div>
          <div style="display:flex;align-items:center;gap:14px">
            <div style="font-size:32px">${next.emoji}</div>
            <div style="flex:1">
              <div style="font-family:var(--display);font-weight:700;font-size:20px;letter-spacing:1px;margin-bottom:4px">${next.title}</div>
              <div style="display:flex;align-items:center;gap:8px">
                <div style="flex:1;height:5px;background:var(--border);border-radius:3px;overflow:hidden">
                  <div style="height:100%;width:${pct}%;background:var(--accent);border-radius:3px;transition:width .6s ease"></div>
                </div>
                <div style="font-family:'Geist Mono',monospace;font-size:10px;color:var(--muted);white-space:nowrap">${label}</div>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  }

  return `
    <div class="panel-title">Milestones</div>
    <p class="panel-desc">${unlockedCount} of ${relevantMilestones.length} unlocked — keep going.</p>
    ${nextHtml}
    <div class="ms-grid">${cards}</div>`;
}

/* ── CONFETTI ENGINE ── */

function launchConfetti(accent) {
  try {
    const canvas = safeGetElement('confettiCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = [accent, '#ffffff', '#ffb347', '#2ecc71', '#e74c3c', '#3498db'];
    AppState.confettiPieces = Array.from({length: 120}, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      w: Math.random() * 10 + 5,
      h: Math.random() * 5 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.15,
      vx: (Math.random() - 0.5) * 3,
      vy: Math.random() * 3 + 2,
      opacity: 1,
    }));

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      AppState.confettiPieces.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        if (p.y > canvas.height * 0.7) p.opacity -= 0.02;
        if (p.opacity > 0) alive = true;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
        ctx.restore();
      });
      if (alive) AppState.confettiAnimId = requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    if (AppState.confettiAnimId) cancelAnimationFrame(AppState.confettiAnimId);
    draw();
  } catch (e) {
    console.error('Error launching confetti:', e);
  }
}

function stopConfetti() {
  try {
    if (AppState.confettiAnimId) {
      cancelAnimationFrame(AppState.confettiAnimId);
      AppState.confettiAnimId = null;
    }
    const canvas = safeGetElement('confettiCanvas');
    if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  } catch (e) {
    console.error('Error stopping confetti:', e);
  }
}


