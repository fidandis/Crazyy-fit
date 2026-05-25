/* ══════════════════════════════════════════════════════════════
   renderHome  (main client home view — accordion layout)
══════════════════════════════════════════════════════════════ */
function buildRestDayContent() {
  const tips = [
    { icon:'😴', title:'Prioritise sleep', body:'Aim for 8–9 hours tonight. Growth happens at rest — this is when your muscles repair and get stronger.' },
    { icon:'💧', title:'Hydrate all day', body:'Drink at least 2–3 litres of water. Muscles recover faster when well-hydrated.' },
    { icon:'🧘', title:'Mobility work', body:'Spend 10 minutes foam rolling or stretching your tightest areas. Hip flexors, hamstrings, thoracic spine.' },
    { icon:'🥗', title:'Hit your protein', body:'Rest days still need protein. Aim to hit your target — it fuels muscle protein synthesis even when you\'re not training.' },
    { icon:'🚶', title:'Light movement', body:'A 20-minute walk keeps blood flowing and reduces soreness without stressing your recovery.' },
  ];
  return `<div style="border-top:1px solid var(--border)">
    ${tips.map(t => `<div class="rest-tip-row">
      <div class="rest-tip-icon">${t.icon}</div>
      <div><div class="rest-tip-text" style="font-weight:500">${t.title}</div><div class="rest-tip-sub">${t.body}</div></div>
    </div>`).join('')}
  </div>`;
}

function renderHome(c) {
  const logs = getFitnessLogs(c.id);
  const xp   = getXP(c.id);
  const nowDate = new Date();
  const now  = nowDate.getTime();
  const days7= ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const todayLabel = days7[nowDate.getDay()];
  const sched      = c.data.schedule && c.data.schedule.days ? c.data.schedule.days : [];
  const todayDay   = sched.find(s => s.label === todayLabel);
  const weekLogs   = logs.filter(l => l.date && (now - new Date(l.date).getTime()) < 7*86400000);
  const weekKcal   = weekLogs.reduce((s,l) => s+(l.calories||0), 0);
  const trainingDays = sched.filter(d => d.tag !== 'Rest').length;
  let adherencePct = null;
  if (trainingDays) {
    const logged4w = logs.filter(l => l.date && (now - new Date(l.date).getTime()) < 28*86400000).length;
    adherencePct = Math.min(100, Math.round(logged4w / (trainingDays * 4) * 100));
  }
  const hr = nowDate.getHours();
  const greet = hr < 12 ? 'Good morning,' : hr < 17 ? 'Good afternoon,' : 'Good evening,';
  const firstName = c.name.split(' ')[0];

  let h = '';

  // ── HERO (reference "Today" layout) ──
  const streak = getDayStreak(c.id);
  const heroSub = streak >= 2
    ? `Day ${streak} of your streak. Keep showing up.`
    : nowDate.toLocaleDateString('en',{weekday:'long',month:'long',day:'numeric'});
  h += `<div class="sess-hero">
    <h1 class="sess-hero-title">${esc(greet)} <em>${esc(firstName)}.</em></h1>
    <p class="sess-hero-sub">${esc(heroSub)}</p>
  </div>`;

  // ── TODAY FEATURED WORKOUT CARD ──
  if (todayDay) {
    const _isRest = todayDay.tag === 'Rest';
    let _exs = [];
    if (!_isRest) {
      const _wid = (typeof getTodayWorkoutDayId === 'function') ? getTodayWorkoutDayId(c) : null;
      const _wd = _wid && c.data.workouts && c.data.workouts.days
        ? c.data.workouts.days.find(w => (w.id || w.label) === _wid) : null;
      if (_wd) {
        if (_wd.exercises?.length) _exs = _wd.exercises;
        else if (_wd.blocks?.length) _exs = _wd.blocks.reduce((a, b) => b.exercises ? [...a, ...b.exercises] : a, []);
      }
    }

    const _coach = (typeof COACH !== 'undefined' && COACH && COACH.name) ? COACH.name : 'your coach';
    const _clockSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
    const _dbSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h2m12 0h2M6 8.5v7M18 8.5v7M2 10.5v3M22 10.5v3M8 12h8"/></svg>';

    if (_isRest) {
      h += `<div class="sess-wrap">
        <div class="sess-feature rest">
          <div class="sess-feature-label">Today · Recovery</div>
          <div class="sess-feature-title">${esc(todayDay.title || 'Rest day')}</div>
          <div class="sess-feature-meta"><span>${_clockSvg} Mobility, hydration &amp; sleep</span></div>
        </div>
        <div class="sess-card">${buildRestDayContent()}</div>
      </div>`;
    } else {
      const _count = _exs.length;
      const _mins = _count ? Math.max(15, Math.round(_count * 7.5 / 5) * 5) : 0;
      const _title = todayDay.title || (todayDay.tag && todayDay.tag !== 'Rest' ? todayDay.tag : "Today's workout");
      h += `<div class="sess-wrap">
        <div class="sess-feature">
          <div class="sess-feature-label">Scheduled · ${esc(_coach)}</div>
          <div class="sess-feature-title">${esc(_title)}</div>
          ${_count ? `<div class="sess-feature-meta">
            <span>${_clockSvg} ~${_mins} min</span>
            <span>${_dbSvg} ${_count} exercise${_count === 1 ? '' : 's'}</span>
          </div>` : ''}
          <button class="sess-feature-btn" onclick="(document.querySelector('[data-tid=&quot;workouts&quot;]')||{click(){}}).click()">Start workout <span class="ar">→</span></button>
        </div>
      </div>`;
    }
  }

  // XP widget (after greeting and stats)
  h += buildXPWidget(c.id, c.name, c.accent);

  // Weekly summary card (Mondays only)
  h += buildWeeklySummaryCard(c);

  // Broadcast message
  const _broadcast = localStorage.getItem('coach_broadcast');
  const _broadcastTs = localStorage.getItem('coach_broadcast_ts');
  if (_broadcast) {
    const _bDate = _broadcastTs ? new Date(_broadcastTs).toLocaleDateString('en',{weekday:'short',month:'short',day:'numeric'}) : '';
    h += `<div class="broadcast-bar">
      <div class="broadcast-label">📢 Coach Announcement${_bDate ? ' · '+_bDate : ''}</div>
      <div class="broadcast-text">${esc(_broadcast)}</div>
    </div>`;
  }

  // Coach message banner
  const _coachMsg = localStorage.getItem('coach_msg_' + c.id);
  if (_coachMsg) {
    const _coachMsgTs = localStorage.getItem('coach_msg_ts_' + c.id);
    const _coachMsgDate = _coachMsgTs ? new Date(_coachMsgTs).toLocaleDateString('en',{weekday:'short',month:'short',day:'numeric'}) : '';
    h += `<div class="coach-msg-banner">
      <div class="coach-msg-label">📣 Message from your coach</div>
      <div class="coach-msg-text">${esc(_coachMsg)}</div>
      ${_coachMsgDate ? `<div class="coach-msg-date">${_coachMsgDate}</div>` : ''}
    </div>`;
  }

  // Quick weight log strip
  const _homeLastWt = parseFloat(localStorage.getItem('wt_current_' + c.id)) || null;
  h += `<div class="home-wt-strip">
    <div class="home-wt-label">⚖️ Weight</div>
    <input class="home-wt-input" type="number" id="home-wt-${c.id}" placeholder="${_homeLastWt || '175'}" step="0.1" inputmode="decimal">
    <div class="home-wt-last" id="home-wt-last-${c.id}">${_homeLastWt ? _homeLastWt + ' lbs' : 'not logged'}</div>
    <button class="home-wt-btn" onclick="homeLogWeight('${c.id}')">Log</button>
  </div>`;

  // Week Overview — always visible, popped out
  if (c.data && c.data.schedule && c.data.schedule.days) {
    h += `<div class="home-week-wrap">${renderSchedule(c.data.schedule, c)}</div>`;
  }

  // Weather alert (async — filled in after render)
  h += `<div id="weather-alert-${c.id}"></div>`;

  // Messages from coach
  h += buildHomeMsgSection(c);

  // Instagram latest post
  h += buildHomeIgSection(c.accent);

  return h;
}

function accSection(id, icon, title, desc, accent, contentFn, startOpen) {
  const bodyId = 'acc-body-' + id;
  const headId = 'acc-head-' + id;
  return `<div class="acc-section">
    <div class="acc-header${startOpen ? ' open' : ''}" id="${headId}" onclick="accToggle('${id}')">
      <div class="acc-icon" style="background:${accent}22;color:${accent}">${icon}</div>
      <div class="acc-info">
        <div class="acc-title">${title}</div>
        <div class="acc-desc">${desc}</div>
      </div>
      <div class="acc-chevron">›</div>
    </div>
    <div class="acc-body${startOpen ? ' open' : ''}" id="${bodyId}">
      ${startOpen ? contentFn() : ''}
    </div>
  </div>`;
}

function accToggle(id) {
  const head = document.getElementById('acc-head-' + id);
  const body = document.getElementById('acc-body-' + id);
  if (!head || !body) return;
  const isOpen = head.classList.contains('open');
  if (!isOpen && !body.innerHTML.trim()) {
    // Lazy render
    const c = currentClient;
    if (!c) return;
    const _sr = (fn) => { try { return fn(); } catch(e) { console.error('Accordion render error ('+id+'):', e); return `<div style="padding:16px;color:var(--muted);font-size:12px;font-family:'Geist Mono',monospace">Failed to load</div>`; } };
    if (id === 'training')     body.innerHTML = _sr(() => renderSchedule(c.data.schedule, c) + (c.data.workouts ? renderWorkouts(c.data.workouts, c) : '') + renderFitnessLog(c));
    if (id === 'nutrition')    body.innerHTML = _sr(() => renderNutrition(c.data.nutrition, c));
    if (id === 'body')         body.innerHTML = renderBodyStats(c);
    if (id === 'strength')     body.innerHTML = renderStrength(c);
    if (id === 'checkin-acc')  body.innerHTML = renderCheckin(c);
    if (id === 'milestones-acc') body.innerHTML = renderMilestonesPanel(c);
    if (id === 'tools')        body.innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><button onclick="openTabataScreen()" class="fit-log-btn">⚡ Tabata</button><button onclick="openFeature('habits')" class="fit-log-btn" style="background:var(--surface);color:var(--text);border:1px solid var(--border)">✅ Habits</button><button onclick="openFeature('calendar')" class="fit-log-btn" style="background:var(--surface);color:var(--text);border:1px solid var(--border)">📅 Calendar</button><button onclick="openFeature('meals')" class="fit-log-btn" style="background:var(--surface);color:var(--text);border:1px solid var(--border)">🍽️ Meal Plan</button><button onclick="openFeature('summary')" class="fit-log-btn" style="background:var(--surface);color:var(--text);border:1px solid var(--border)">📊 Monthly Report</button></div>`;
  }
  head.classList.toggle('open', !isOpen);
  body.classList.toggle('open', !isOpen);
}


/* ── HOME: MESSAGES SECTION ─────────────────────────────────── */
function buildHomeMsgSection(c) {
  const log = getLS('notif_log_' + c.id, []);
  // Also pull from Supabase messages table (already loaded into notif_log on login)
  const unread = log.filter(n => !n.read && n.from !== 'client').length;
  const shown = log.slice(-20).reverse(); // newest first, up to 20

  const items = shown.length
    ? shown.map(n => {
        const fromClient = n.from === 'client';
        const label = fromClient ? 'You' : 'Coach';
        const timeStr = new Date(n.ts).toLocaleDateString('en',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
        return `<div class="home-msg-item${fromClient ? ' from-client' : ''}">
          <div class="home-msg-item-body">${esc(n.msg)}</div>
          <div class="home-msg-item-meta">${label} · ${timeStr}</div>
        </div>`;
      }).join('')
    : `<div class="home-msg-empty">No messages yet — your coach will send updates here</div>`;

  return `<div class="home-msg-card">
    <div class="home-msg-header">
      <div class="home-msg-title">Messages</div>
      ${unread > 0 ? `<span class="home-msg-badge">${unread} new</span>` : ''}
    </div>
    ${items}
    <div class="home-msg-reply">
      <textarea id="home-reply-${c.id}" placeholder="Send a message to your coach…" rows="1"
        oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,100)+'px'"></textarea>
      <button class="home-msg-send-btn" data-cid="${esc(c.id)}" onclick="sendClientReply(this.dataset.cid)">Send</button>
    </div>
  </div>`;
}

async function sendClientReply(cid) {
  const ta = document.getElementById('home-reply-' + cid);
  const msg = ta?.value?.trim();
  if (!msg) return;
  ta.value = '';
  ta.style.height = 'auto';
  const ts = new Date().toISOString();
  // Store locally
  const log = getLS('notif_log_' + cid, []);
  log.push({ msg, ts, from: 'client', read: true });
  localStorage.setItem('notif_log_' + cid, JSON.stringify(log));
  // Push to Supabase so coach sees it
  sbUpsert('messages', { id: 'msg_reply_' + cid + '_' + Date.now(), client_id: cid, from_coach: false, body: msg, read: false, sent_at: ts });
  showFitToast('✓ Message sent to coach');
  // Re-render messages section
  const c = currentClient;
  if (c) {
    const card = document.querySelector('.home-msg-card');
    if (card) {
      const tmp = document.createElement('div');
      tmp.innerHTML = buildHomeMsgSection(c);
      card.replaceWith(tmp.firstElementChild);
    }
  }
}

/* ── HOME: INSTAGRAM SECTION ─────────────────────────────────── */
let _igCache = null;
let _igCacheTime = 0;

function buildHomeIgSection(accent) {
  // Fetch and inject asynchronously; render placeholder for now
  setTimeout(() => loadIgPost(accent), 100);
  return `<div class="home-ig-card" id="home-ig-card">
    <div class="home-ig-header">
      <div class="home-ig-avatar">📷</div>
      <div><div class="home-ig-name">FidCrazyy</div><div class="home-ig-handle">@fidcrazyy · Instagram</div></div>
    </div>
    <div class="home-ig-placeholder">
      <div class="home-ig-placeholder-icon">📸</div>
      <div class="home-ig-placeholder-text">Loading latest post…</div>
    </div>
  </div>`;
}

async function loadIgPost(accent) {
  const card = document.getElementById('home-ig-card');
  if (!card) return;
  // Use cache (5 min)
  if (_igCache && Date.now() - _igCacheTime < 5 * 60 * 1000) {
    renderIgCard(card, _igCache, accent);
    return;
  }
  try {
    const res = await fetch('/api/get-instagram');
    if (!res.ok) throw new Error('fetch failed');
    const data = await res.json();
    _igCache = data;
    _igCacheTime = Date.now();
    renderIgCard(card, data, accent);
  } catch (_) {
    renderIgFallback(card);
  }
}

function renderIgCard(card, data, accent) {
  if (!data || !data.ok || !data.post) { renderIgFallback(card); return; }
  const p = data.post;
  const isVideo = p.media_type === 'VIDEO' || p.media_type === 'REEL';
  const thumbUrl = p.thumbnail_url || p.media_url || '';
  const caption = p.caption ? p.caption.slice(0, 120) + (p.caption.length > 120 ? '…' : '') : '';
  const dateStr = p.timestamp ? new Date(p.timestamp).toLocaleDateString('en',{month:'short',day:'numeric'}) : '';
  card.innerHTML = `
    <div class="home-ig-header">
      <div class="home-ig-avatar">📷</div>
      <div><div class="home-ig-name">FidCrazyy</div><div class="home-ig-handle">@fidcrazyy · ${dateStr}</div></div>
    </div>
    ${thumbUrl ? `<img class="home-ig-media" src="${esc(thumbUrl)}" alt="Latest post" loading="lazy" onerror="this.style.display='none'">` : ''}
    ${isVideo ? `<div style="padding:8px 16px;font-family:'Geist Mono',monospace;font-size:9px;color:var(--muted)">▶ REEL / VIDEO</div>` : ''}
    ${caption ? `<div class="home-ig-caption">${esc(caption)}</div>` : ''}
    <div class="home-ig-footer">
      <div style="font-family:'Geist Mono',monospace;font-size:9px;color:var(--muted)">Latest post</div>
      <a href="${esc(p.permalink || 'https://www.instagram.com/fidcrazyy/')}" target="_blank" rel="noopener noreferrer" class="home-ig-open-btn">Open →</a>
    </div>`;
}

function renderIgFallback(card) {
  card.innerHTML = `
    <div class="home-ig-header">
      <div class="home-ig-avatar">📷</div>
      <div><div class="home-ig-name">FidCrazyy</div><div class="home-ig-handle">@fidcrazyy · Instagram</div></div>
    </div>
    <div class="home-ig-placeholder">
      <div class="home-ig-placeholder-icon">📸</div>
      <div class="home-ig-placeholder-text" style="margin-bottom:12px">Follow your coach on Instagram</div>
      <a href="https://www.instagram.com/fidcrazyy/" target="_blank" rel="noopener noreferrer" class="home-ig-open-btn">Follow @FidCrazyy →</a>
    </div>`;
}

/* ══════════════════════════════════════════════════════════════
   WEATHER ALERT + TREADMILL SWAP
══════════════════════════════════════════════════════════════ */
function _clientHasRunningToday(c) {
  const days7 = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const todayLabel = days7[new Date().getDay()];
  const sched = c.data?.schedule?.days || [];
  const todayDay = sched.find(s => s.label === todayLabel);
  if (!todayDay) return false;
  if (/cardio|endurance|run|jog/i.test(todayDay.tag + ' ' + todayDay.title + ' ' + (todayDay.sub || ''))) return true;
  // Check workout exercises for that day
  const wDays = c.data?.workouts?.days || [];
  const wDay = wDays.find(wd =>
    (wd.id || '').toLowerCase() === todayLabel.toLowerCase() ||
    (wd.label || '').toLowerCase().startsWith(todayLabel.toLowerCase())
  );
  if (wDay) {
    const allEx = (wDay.blocks || []).reduce((a, b) => a.concat(b.exercises || []), []);
    if (allEx.some(e => /run|jog|sprint|interval run/i.test(e.name || ''))) return true;
  }
  return false;
}

async function checkWeatherAlert(c) {
  const address = c._meta?.address;
  if (!address || !_clientHasRunningToday(c)) return;
  const el = document.getElementById('weather-alert-' + c.id);
  if (!el) return;
  // Cache by (address, current 3-hour slot) — wttr.in's forecast resolution.
  // Avoids hammering on every home re-render and survives across sessions.
  const slotKey = address + '|' + Math.floor(Date.now() / (3 * 3600 * 1000));
  const cacheKey = 'wx_cache_' + c.id;
  let data;
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
    if (cached && cached.slot === slotKey) data = cached.data;
  } catch (_) {}
  try {
    if (!data) {
      const resp = await fetch('https://wttr.in/' + encodeURIComponent(address) + '?format=j1');
      if (!resp.ok) return;
      data = await resp.json();
      try { localStorage.setItem(cacheKey, JSON.stringify({ slot: slotKey, data })); } catch (_) {}
    }
    const hour = new Date().getHours();
    const hourly = data.weather?.[0]?.hourly || [];
    if (!hourly.length) return;
    // wttr.in uses 3-hour slots: index 0=0h, 1=3h, ... 7=21h
    const slotIdx = Math.min(Math.floor(hour / 3), hourly.length - 1);
    const slot = hourly[slotIdx];
    const code = parseInt(slot?.weatherCode || '0');
    const desc = (slot?.weatherDesc?.[0]?.value || '').replace(/\b\w/g, l => l.toUpperCase());
    const windKmph = parseInt(slot?.windspeedKmph || '0');
    const tempC = parseInt(slot?.tempC || '20');
    // WMO codes: rain 176+, heavy rain 302+, snow 227+, thunderstorm 200-232, 386+
    const isRain   = (code >= 176 && code <= 201) || (code >= 263 && code <= 314) || (code >= 353 && code <= 359);
    const isStorm  = (code >= 200 && code <= 232) || (code >= 386 && code <= 395);
    const isSnow   = (code >= 227 && code <= 260) || (code >= 317 && code <= 377);
    const isExtreme = windKmph > 55 || tempC > 38 || tempC < -5;
    if (!isRain && !isStorm && !isSnow && !isExtreme) return;
    const reason = isStorm ? 'Thunderstorm' : isSnow ? 'Snow / Icy conditions' : isRain ? 'Rain' : windKmph > 55 ? 'High winds (' + windKmph + ' km/h)' : tempC > 38 ? 'Extreme heat (' + tempC + '°C)' : 'Extreme cold (' + tempC + '°C)';
    el.innerHTML = `
      <div style="margin:0 20px 14px;background:rgba(52,152,219,.1);border:1px solid rgba(52,152,219,.3);border-left:3px solid #3498db;border-radius:10px;padding:14px 16px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <span style="font-size:18px">${isStorm?'⛈':isSnow?'❄️':isRain?'🌧':'💨'}</span>
          <div>
            <div style="font-family:'Geist Mono',monospace;font-size:8px;letter-spacing:2px;color:#3498db;text-transform:uppercase">Weather Alert · ${esc(desc)}</div>
            <div style="font-size:13px;font-weight:500;margin-top:2px">${esc(reason)} — skip the outdoor run today</div>
          </div>
        </div>
        <div style="background:var(--surface2);border-radius:8px;padding:12px 14px;border:1px solid var(--border)">
          <div style="font-family:'Geist Mono',monospace;font-size:8px;letter-spacing:2px;color:var(--muted);text-transform:uppercase;margin-bottom:8px">Treadmill Alternative</div>
          <div style="font-size:13px;font-weight:500">Treadmill Run</div>
          <div style="font-family:'Geist Mono',monospace;font-size:10px;color:var(--muted);margin-top:4px">1 set · 20–30 min at moderate pace · same cardio benefit, all indoors</div>
          <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
            <div style="font-family:'Geist Mono',monospace;font-size:9px;color:var(--muted);background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:4px 10px">Warm-up 5 min easy</div>
            <div style="font-family:'Geist Mono',monospace;font-size:9px;color:var(--muted);background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:4px 10px">20 min Zone 2</div>
            <div style="font-family:'Geist Mono',monospace;font-size:9px;color:var(--muted);background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:4px 10px">Cool-down 5 min</div>
          </div>
        </div>
      </div>`;
  } catch (e) { /* fail silently — weather is non-critical */ }
}

/* ══════════════════════════════════════════════════════════════
   CLIENT MODE  (inperson / remote / blueprint)
══════════════════════════════════════════════════════════════ */
function getClientMode(cid) {
  return localStorage.getItem('client_mode_' + cid) || 'inperson';
}
function setClientMode(cid, mode) {
  localStorage.setItem('client_mode_' + cid, mode);
}

/* ══════════════════════════════════════════════════════════════
   PAUSE / UNPAUSE / TERMINATE / RESTORE CLIENTS
══════════════════════════════════════════════════════════════ */
function pauseClient(cid) {
  const paused = getLS('paused_clients', []);
  if (!paused.includes(cid)) { paused.push(cid); localStorage.setItem('paused_clients', JSON.stringify(paused)); }
  renderCoachDashboard();
  showFitToast('Client paused');
}
function unpauseClient(cid) {
  let paused = getLS('paused_clients', []);
  paused = paused.filter(id => id !== cid);
  localStorage.setItem('paused_clients', JSON.stringify(paused));
  renderCoachDashboard();
  showFitToast('Client unpaused');
}
function restoreClient(cid) {
  const terminated = getLS('terminated_clients', []);
  const c = terminated.find(t => t.id === cid);
  if (!c) return;
  // Restore to dynamic_clients
  let dyn = getLS('dynamic_clients', []);
  const { terminatedAt, ...clean } = c;
  dyn.push(clean);
  localStorage.setItem('dynamic_clients', JSON.stringify(dyn));
  // Remove from terminated
  localStorage.setItem('terminated_clients', JSON.stringify(terminated.filter(t => t.id !== cid)));
  renderCoachDashboard();
  showFitToast('Client restored');
}
function deleteArchivedClient(cid) {
  if (!confirm('Permanently delete all data for this client? This cannot be undone.')) return;
  let terminated = getLS('terminated_clients', []);
  terminated = terminated.filter(t => t.id !== cid);
  localStorage.setItem('terminated_clients', JSON.stringify(terminated));
  renderCoachDashboard();
  showFitToast('Client permanently deleted');
}

/* ══════════════════════════════════════════════════════════════
   COACH VIEW-AS-CLIENT
══════════════════════════════════════════════════════════════ */
function coachViewAsClient(cid) {
  const clients = getAllClients();
  const c = clients.find(cl => cl.id === cid);
  if (!c) return;
  currentClient = c;
  AppState.currentClient = c;
  AppState.coachViewingClientId = cid;
  AppState._isCoachView = true;

  // Use the identical launchApp flow — coach sees exactly what the client sees
  document.documentElement.style.setProperty('--accent', c.accent);
  document.getElementById('appClientName').textContent = c.name + '\'s Program';
  document.getElementById('appClientGoal').textContent = c.goal;

  // Goals banner
  const header  = document.getElementById('appHeader');
  const existing = document.getElementById('wt-banner');
  if (existing) existing.remove();
  const goalBannerHtmlCV = buildGoalsBannerHTML(c);
  if (goalBannerHtmlCV) {
    const banner = document.createElement('div');
    banner.className = 'wt-banner';
    banner.id = 'wt-banner';
    banner.innerHTML = goalBannerHtmlCV;
    if (header) header.appendChild(banner);
  }

  // Build tab bar — identical to client's (ensure Home is first)
  if (c.data?.tabs && !c.data.tabs.some(t => t.id === 'home')) {
    c.data.tabs.unshift({ id: 'home', label: 'Home' });
  }
  const tabBar = document.getElementById('tabBar');
  tabBar.innerHTML = buildTabBarHTML(c.data.tabs);

  // Render all tab panels
  renderContent(c);

  // Show the orange preview bar (non-destructive — won't affect client data)
  document.getElementById('coachPreviewBar').style.display = 'flex';
  document.getElementById('coachPreviewName').textContent = c.name;

  showScreen('app');
}
function exitClientView() {
  document.getElementById('coachPreviewBar').style.display = 'none';
  currentClient = null;
  AppState.currentClient = null;
  AppState.coachViewingClientId = null;
  AppState._isCoachView = false;
  showScreen('coach');
  renderCoachDashboard();
}

/* ══════════════════════════════════════════════════════════════
   NOTIFICATION MODAL + CLIENT NOTIF LOG
══════════════════════════════════════════════════════════════ */
function openNotifModal(cid) {
  AppState.notifTarget = cid;
  const existing = document.getElementById('notifBackdrop');
  if (existing) existing.remove();
  const clients = getAllClients();
  const backdrop = document.createElement('div');
  backdrop.id = 'notifBackdrop';
  backdrop.className = 'notif-backdrop';
  backdrop.innerHTML = `
    <div class="notif-modal">
      <div class="notif-handle"></div>
      <div class="notif-header">
        <div class="notif-title">${cid ? 'Send Notification' : 'Broadcast to All'}</div>
        <div class="notif-subtitle">${cid ? clients.find(c=>c.id===cid)?.name || '' : 'All clients'}</div>
      </div>
      <div class="notif-body">
        <div class="notif-field">
          <div class="notif-label">Message</div>
          <textarea class="notif-textarea" id="notifMsg" placeholder="e.g. Great work this week! Keep it up 💪"></textarea>
        </div>
      </div>
      <div class="notif-footer">
        <button class="notif-cancel-btn" onclick="document.getElementById('notifBackdrop').remove()">Cancel</button>
        <button class="notif-send-btn" onclick="sendNotification()">Send</button>
      </div>
    </div>`;
  backdrop.addEventListener('click', e => { if (e.target === backdrop) backdrop.remove(); });
  document.body.appendChild(backdrop);
  requestAnimationFrame(() => backdrop.classList.add('open'));
}
function sendNotification() {
  const msg = document.getElementById('notifMsg')?.value?.trim();
  if (!msg) { showFitToast('Enter a message'); return; }
  const targets = AppState.notifTarget ? [AppState.notifTarget] : getAllClients().map(c => c.id);
  const ts = new Date().toISOString();
  targets.forEach(cid => {
    const log = getLS('notif_log_' + cid, []);
    log.push({ msg, ts, from: 'coach' });
    localStorage.setItem('notif_log_' + cid, JSON.stringify(log));
  });
  document.getElementById('notifBackdrop')?.remove();
  showFitToast('✓ Notification sent');
  renderCoachDashboard();
}
function openClientNotifLog() {
  if (!currentClient) return;
  const log = getLS('notif_log_' + currentClient.id, []);
  const unread = log.filter(n => !n.read);
  // Mark all read locally
  log.forEach(n => n.read = true);
  localStorage.setItem('notif_log_' + currentClient.id, JSON.stringify(log));
  const dot = document.getElementById('notifDot');
  if (dot) dot.style.display = 'none';
  // Mark unread Supabase messages as read
  if (unread.length > 0) {
    sbPatch('messages', `client_id=eq.${currentClient.id}&read=eq.false`, { read: true });
  }
  const existing = document.getElementById('clientNotifBackdrop');
  if (existing) existing.remove();
  const backdrop = document.createElement('div');
  backdrop.id = 'clientNotifBackdrop';
  backdrop.className = 'notif-backdrop';
  const items = log.length ? log.slice().reverse().map(n =>
    `<div style="padding:12px 0;border-bottom:1px solid var(--border)">
      <div style="font-size:14px">${esc(n.msg)}</div>
      <div style="font-family:'Geist Mono',monospace;font-size:9px;color:var(--muted);margin-top:4px">${new Date(n.ts).toLocaleDateString('en',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
    </div>`
  ).join('') : '<div style="text-align:center;padding:32px;color:var(--muted);font-family:\'Geist Mono\',monospace;font-size:10px">No messages yet</div>';
  backdrop.innerHTML = `<div class="notif-modal"><div class="notif-handle"></div>
    <div class="notif-header"><div class="notif-title">Messages from Coach</div></div>
    <div class="notif-body">${items}</div>
    <div class="notif-footer"><button class="notif-cancel-btn" style="flex:1" onclick="document.getElementById('clientNotifBackdrop').remove()">Close</button></div>
  </div>`;
  backdrop.addEventListener('click', e => { if (e.target === backdrop) backdrop.remove(); });
  document.body.appendChild(backdrop);
  requestAnimationFrame(() => backdrop.classList.add('open'));
}

