/* ══════════════════════════════════════════════════════════════
   AI PROGRAM REVIEW ENGINE
   Coach-side: gathers client data → calls /api/ai-program-review
   → shows approve/reject modal → applies approved changes only
══════════════════════════════════════════════════════════════ */

function gatherClientDataForAI(c) {
  const fitLogs    = getFitnessLogs(c.id).slice(-20);
  const checkins   = getCheckins(c.id).slice(-8);
  const macroScores = getCoachMacroScores(c.id).slice(-10);
  const weightLogs = getLS('wt_history_' + c.id, []).slice(-10);
  const prs        = getPRs(c.id);

  // Build a structured workout map with exact block/exercise indices for precise referencing
  const workoutDays = (c.data?.workouts?.days || []).map(d => ({
    id:    d.id    || d.label || '',
    label: d.label || '',
    title: d.title || '',
    blocks: (d.blocks || []).map((b, bi) => ({
      blockIdx: bi,
      label:    b.label || '',
      exercises: (b.exercises || []).map((e, ei) => ({
        exerciseIdx: ei,
        name:  e.name  || '',
        sets:  e.sets  || '',
        reps:  e.reps  || '',
        note:  e.note  || '',
      })),
    })),
  }));

  return {
    client: { name: c.name, goal: c.goal || '', programType: c.programType || '' },
    workoutDays,
    fitLogs: fitLogs.map(l => ({
      date:     (l.date || '').slice(0, 10),
      type:     l.type     || 'Workout',
      calories: l.calories || 0,
      duration: l.duration || 0,
      notes:    l.notes    || '',
    })),
    checkins: checkins.map(ch => ({
      date:       (ch.date || '').slice(0, 10),
      sleep:      ch.sleep     || 0,
      stress:     ch.stress    || 0,
      energy:     ch.energy    || 0,
      adherence:  ch.adherence || 0,
      notes:      ch.notes     || '',
    })),
    macroScores: macroScores.map(m => ({ date: (m.date || '').slice(0, 10), score: m.score })),
    weightLogs:  weightLogs.map(w  => ({ date: (w.date  || '').slice(0, 10), weight: w.weight })),
    prs: Object.entries(prs).slice(0, 10).map(([ex, pr]) => ({
      exercise: ex, orm: pr.orm, date: (pr.date || '').slice(0, 10),
    })),
  };
}

async function openAIReview(cid) {
  const allClients = getAllClients();
  const c = allClients.find(cl => cl.id === cid);
  if (!c) return;

  // Show modal immediately in loading state
  const existing = document.getElementById('aiReviewOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'aiReviewOverlay';
  overlay.className = 'ai-review-overlay';
  overlay.addEventListener('click', e => { if (e.target === overlay) closeAIReviewModal(); });

  overlay.innerHTML = `<div class="ai-review-sheet" id="aiReviewSheet">
    <div class="ai-review-header">
      <div class="ai-review-title">
        <span>🤖 AI Program Review</span>
        <button onclick="closeAIReviewModal()" style="background:none;border:none;color:var(--muted);font-size:20px;cursor:pointer;padding:4px">✕</button>
      </div>
      <div class="ai-review-sub">${esc(c.name)} · Analyzing training history…</div>
    </div>
    <div class="ai-review-body" id="aiReviewBody">
      <div class="ai-review-loading">
        <div class="ai-review-loading-spinner"></div>
        <div style="font-family:'Geist Mono',monospace;font-size:11px;color:var(--muted);letter-spacing:1px">ANALYZING TRAINING DATA</div>
        <div style="font-family:'Geist Mono',monospace;font-size:9px;color:var(--faint);margin-top:6px">This takes 5–10 seconds</div>
      </div>
    </div>
    <div class="ai-review-footer" id="aiReviewFooter" style="display:none"></div>
  </div>`;
  document.body.appendChild(overlay);

  // Gather data and call API
  try {
    const clientData = gatherClientDataForAI(c);

    // Check if workout days exist
    if (clientData.workoutDays.length === 0) {
      renderAIReviewError(cid, 'This client has no workout program yet. Add a program first.');
      return;
    }

    const res = await fetch('/api/ai-program-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientData }),
    });
    const data = await res.json();

    if (!data.ok) {
      renderAIReviewError(cid, data.error || 'Analysis failed — try again');
      return;
    }

    // Store result in AppState
    AppState.aiReviewState[cid] = {
      summary:         data.summary,
      recommendations: data.recommendations.map(r => ({ ...r, _approved: false, _rejected: false })),
    };

    renderAIReviewResults(cid, c.accent);
  } catch (err) {
    renderAIReviewError(cid, 'Network error: ' + err.message);
  }
}

function renderAIReviewError(cid, msg) {
  const body = document.getElementById('aiReviewBody');
  if (body) body.innerHTML = `<div class="ai-review-error">⚠ ${esc(msg)}<br><br>
    <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
      <button onclick="closeAIReviewModal()" style="background:var(--surface2);border:1px solid var(--border);color:var(--muted);border-radius:6px;padding:8px 20px;font-family:'Geist Mono',monospace;font-size:10px;cursor:pointer">Close</button>
      <button onclick="closeAIReviewModal();setTimeout(()=>openAIReview('${esc(cid)}'),50)" style="background:var(--accent);border:none;color:#000;border-radius:6px;padding:8px 20px;font-family:'Geist Mono',monospace;font-size:10px;cursor:pointer;font-weight:600">Retry</button>
    </div></div>`;
}

function renderAIReviewResults(cid, accent) {
  const state = AppState.aiReviewState[cid];
  if (!state) return;

  const body   = document.getElementById('aiReviewBody');
  const footer = document.getElementById('aiReviewFooter');
  if (!body || !footer) return;

  const recs = state.recommendations;

  const recCards = recs.map((r, idx) => {
    const typeLabel = (r.type || '').replace(/_/g, ' ').toUpperCase();
    const priorityClass = r.priority || 'medium';

    // Build the change visualization
    let changeHtml = '';
    if (r.type === 'add_exercise' && r.proposed) {
      changeHtml = `<div class="ai-rec-add-only">
        <div class="ai-rec-lbl" style="margin-bottom:4px">New exercise to add</div>
        <div class="ai-rec-add-card">
          <div class="ai-rec-ex-name">${esc(r.proposed.name || '')}</div>
          <div class="ai-rec-ex-meta">${esc(r.proposed.sets || '')}${r.proposed.reps ? ' · ' + esc(r.proposed.reps) : ''}${r.proposed.note ? ' · ' + esc(r.proposed.note) : ''}</div>
        </div>
      </div>`;
    } else if (r.type === 'remove_exercise' && r.current) {
      changeHtml = `<div class="ai-rec-add-only">
        <div class="ai-rec-lbl" style="margin-bottom:4px;color:#e74c3c">Exercise to remove</div>
        <div class="ai-rec-add-card" style="background:rgba(231,76,60,.06);border-color:rgba(231,76,60,.15)">
          <div class="ai-rec-ex-name" style="text-decoration:line-through;color:var(--muted)">${esc(r.current.name || '')}</div>
          <div class="ai-rec-ex-meta">${esc(r.current.sets || '')}${r.current.reps ? ' · ' + esc(r.current.reps) : ''}</div>
        </div>
      </div>`;
    } else if (r.current || r.proposed) {
      changeHtml = `<div class="ai-rec-change">
        ${r.current ? `<div class="ai-rec-before">
          <div class="ai-rec-lbl">Current</div>
          <div class="ai-rec-ex-name">${esc(r.current.name || '—')}</div>
          <div class="ai-rec-ex-meta">${esc(r.current.sets || '')}${r.current.reps ? ' · ' + esc(r.current.reps) : ''}</div>
        </div>` : '<div></div>'}
        <div class="ai-rec-arrow">→</div>
        ${r.proposed ? `<div class="ai-rec-after">
          <div class="ai-rec-lbl" style="color:#2ecc71">Proposed</div>
          <div class="ai-rec-ex-name" style="color:#2ecc71">${esc(r.proposed.name || '—')}</div>
          <div class="ai-rec-ex-meta">${esc(r.proposed.sets || '')}${r.proposed.reps ? ' · ' + esc(r.proposed.reps) : ''}</div>
        </div>` : '<div></div>'}
      </div>`;
    }

    return `<div class="ai-rec-card${r._approved ? ' approved' : ''}${r._rejected ? ' rejected' : ''}" id="ai-rec-card-${cid}-${idx}">
      <div class="ai-rec-head">
        <span class="ai-rec-priority ${priorityClass}">${priorityClass}</span>
        <span class="ai-rec-day">${esc(r.dayTitle || r.dayId || '')}</span>
        <span class="ai-rec-type">${typeLabel}</span>
      </div>
      <div class="ai-rec-body">
        <div class="ai-rec-reason">${esc(r.reason || '')}</div>
        ${changeHtml}
      </div>
      <div class="ai-rec-actions">
        <button class="ai-rec-approve${r._approved ? ' active' : ''}"
          data-cid="${esc(cid)}" data-idx="${idx}" onclick="toggleAIRec(this.dataset.cid, parseInt(this.dataset.idx), 'approve')">
          ${r._approved ? '✓ Approved' : 'Approve'}
        </button>
        <button class="ai-rec-reject${r._rejected ? ' active' : ''}"
          data-cid="${esc(cid)}" data-idx="${idx}" onclick="toggleAIRec(this.dataset.cid, parseInt(this.dataset.idx), 'reject')">
          ${r._rejected ? '✗ Rejected' : 'Reject'}
        </button>
      </div>
    </div>`;
  }).join('');

  body.innerHTML = `
    <div class="ai-review-summary">${esc(state.summary)}</div>
    ${recs.length === 0
      ? `<div style="font-family:'Geist Mono',monospace;font-size:11px;color:var(--muted);text-align:center;padding:20px 0">No changes recommended — program looks solid.</div>`
      : recCards
    }`;

  if (recs.length > 0) {
    footer.style.display = 'flex';
    footer.innerHTML = `
      <button class="ai-close-btn" onclick="closeAIReviewModal()">Close</button>
      <button class="ai-apply-btn" id="aiApplyBtn-${esc(cid)}" data-cid="${esc(cid)}" onclick="applyApprovedRecs(this.dataset.cid)" disabled>
        Apply Approved
      </button>`;
    updateAIApplyButton(cid);
  } else {
    footer.style.display = 'flex';
    footer.innerHTML = `<button class="ai-close-btn" style="flex:1" onclick="closeAIReviewModal()">Close</button>`;
  }
}

function updateAIApplyButton(cid) {
  const state = AppState.aiReviewState[cid];
  const btn = document.getElementById('aiApplyBtn-' + cid);
  if (!btn || !state) return;
  const approvedCount = state.recommendations.filter(r => r._approved).length;
  btn.disabled = approvedCount === 0;
  btn.textContent = approvedCount > 0
    ? `Apply ${approvedCount} Approved Change${approvedCount !== 1 ? 's' : ''}`
    : 'Apply Approved';
}

function toggleAIRec(cid, idx, action) {
  const state = AppState.aiReviewState[cid];
  if (!state) return;
  const rec = state.recommendations[idx];
  if (!rec) return;

  if (action === 'approve') {
    rec._approved = !rec._approved;
    if (rec._approved) rec._rejected = false;
  } else {
    rec._rejected = !rec._rejected;
    if (rec._rejected) rec._approved = false;
  }

  // Re-render this card
  const card = document.getElementById('ai-rec-card-' + cid + '-' + idx);
  if (card) {
    card.classList.toggle('approved', rec._approved);
    card.classList.toggle('rejected', rec._rejected);
    const approveBtn = card.querySelector('.ai-rec-approve');
    const rejectBtn  = card.querySelector('.ai-rec-reject');
    if (approveBtn) { approveBtn.classList.toggle('active', rec._approved); approveBtn.textContent = rec._approved ? '✓ Approved' : 'Approve'; }
    if (rejectBtn)  { rejectBtn.classList.toggle('active', rec._rejected);  rejectBtn.textContent  = rec._rejected  ? '✗ Rejected' : 'Reject'; }
  }
  updateAIApplyButton(cid);
}

async function applyApprovedRecs(cid) {
  const state = AppState.aiReviewState[cid];
  if (!state) return;

  const approved = state.recommendations.filter(r => r._approved);
  if (approved.length === 0) return;

  const allClients = getAllClients();
  const c = allClients.find(cl => cl.id === cid);
  if (!c || !c.data?.workouts?.days) {
    showFitToast('Could not find client workout data');
    return;
  }

  const btn = document.getElementById('aiApplyBtn-' + cid);
  if (btn) { btn.disabled = true; btn.textContent = 'Applying…'; }

  let applied = 0;
  const appliedNames = [];

  for (const rec of approved) {
    // Find the matching workout day
    const dayIdx = c.data.workouts.days.findIndex(d =>
      (d.id && d.id === rec.dayId) || (d.label && d.label === rec.dayId)
    );
    if (dayIdx === -1) continue;

    const day = c.data.workouts.days[dayIdx];
    const blockIdx = rec.blockIdx ?? 0;
    const block = day.blocks?.[blockIdx];
    if (!block || !Array.isArray(block.exercises)) continue;

    const exIdx = rec.exerciseIdx;

    try {
      switch (rec.type) {
        case 'swap_exercise':
        case 'adjust_volume':
        case 'adjust_intensity': {
          if (exIdx < 0 || exIdx >= block.exercises.length || !rec.proposed) break;
          const orig = block.exercises[exIdx];
          block.exercises[exIdx] = {
            ...orig,
            name:  rec.proposed.name  || orig.name,
            sets:  rec.proposed.sets  || orig.sets,
            reps:  rec.proposed.reps  || orig.reps,
            note:  rec.proposed.note  !== undefined ? rec.proposed.note : orig.note,
          };
          appliedNames.push(rec.proposed.name || rec.current?.name || 'exercise');
          applied++;
          break;
        }
        case 'add_exercise': {
          if (!rec.proposed) break;
          block.exercises.push({
            name: rec.proposed.name || 'New Exercise',
            sets: rec.proposed.sets || '3 sets',
            reps: rec.proposed.reps || '10–12',
            note: rec.proposed.note || '',
          });
          appliedNames.push(rec.proposed.name || 'new exercise');
          applied++;
          break;
        }
        case 'remove_exercise': {
          if (exIdx < 0 || exIdx >= block.exercises.length) break;
          const removedName = block.exercises[exIdx].name;
          block.exercises.splice(exIdx, 1);
          appliedNames.push('removed ' + removedName);
          applied++;
          break;
        }
      }
    } catch (e) {
      console.error('Error applying AI rec:', rec.type, e);
    }
  }

  if (applied === 0) {
    showFitToast('No changes could be applied — check indices');
    if (btn) { btn.disabled = false; btn.textContent = 'Apply Approved'; }
    return;
  }

  // Save the updated client
  updateDynamicClient(cid, c);
  sbAutoSync(cid);

  // Notify the client (push + email)
  const changeDesc = appliedNames.slice(0, 3).join(', ') + (appliedNames.length > 3 ? ` +${appliedNames.length - 3} more` : '');
  triggerClientPush(cid, 'Your program has been updated!', 'Your coach adjusted your training plan. Check the app.');
  const clientEmail = c._meta?.email;
  if (clientEmail) {
    const appUrl = window.location.href.split('?')[0];
    sendEmail(clientEmail, 'Your CrazyyFit program has been updated', buildAIProgramUpdateEmailHtml(c.name, changeDesc, appUrl)).catch(() => {});
  }

  // Clear approved recs from state
  state.recommendations = state.recommendations.filter(r => !r._approved);
  AppState.aiReviewState[cid] = state;

  closeAIReviewModal();
  showFitToast(`✓ ${applied} change${applied !== 1 ? 's' : ''} applied to ${c.name.split(' ')[0]}'s program`);
  renderCoachDashboard();
}

function buildAIProgramUpdateEmailHtml(clientName, changes, appUrl) {
  const firstName = clientName.split(' ')[0];
  const yr = new Date().getFullYear();
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;">
<div style="max-width:520px;margin:0 auto;padding:40px 24px;">
  <div style="text-align:center;margin-bottom:28px;">
    <div style="font-size:28px;font-weight:900;letter-spacing:3px;color:#fff">CRAZYY<span style="color:#3B9EFF">FIT</span></div>
  </div>
  <div style="background:#111;border:1px solid #222;border-radius:16px;padding:32px;margin-bottom:20px;">
    <div style="font-size:15px;font-weight:600;color:#fff;margin-bottom:6px">Hey ${esc(firstName)},</div>
    <div style="font-size:11px;letter-spacing:2px;color:#3B9EFF;text-transform:uppercase;margin-bottom:14px">Program Update</div>
    <div style="font-size:15px;color:#ccc;line-height:1.7;margin-bottom:20px">
      Your coach has updated your training program based on your recent performance and progress data.
    </div>
    ${changes ? `<div style="background:#1a1a1a;border:1px solid #333;border-radius:10px;padding:14px 16px;margin-bottom:20px;font-family:monospace;font-size:12px;color:#aaa;line-height:1.6">Changes include: ${esc(changes)}</div>` : ''}
    <div style="font-size:13px;color:#888;margin-bottom:24px">Open the app to see your updated workout plan.</div>
    ${appUrl ? `<a href="${esc(appUrl)}" style="display:block;text-align:center;background:#3B9EFF;color:#000;font-weight:700;font-size:15px;letter-spacing:2px;text-decoration:none;padding:16px;border-radius:10px;text-transform:uppercase">Open CrazyyFit →</a>` : ''}
  </div>
  <div style="text-align:center;font-size:11px;color:#444;line-height:1.7">CrazyyFit · ${yr}</div>
</div>
</body></html>`;
}

function closeAIReviewModal() {
  document.getElementById('aiReviewOverlay')?.remove();
}

/* ── CLIENT NOTES LOG ────────────────────────────────────────── */
function getCoachNotesLog(cid) {
  const log = getLS('coach_notes_log_' + cid, null);
  if (log !== null) return log;
  // Migrate old single-textarea note on first access
  const oldNote = localStorage.getItem('coach_notes_' + cid);
  if (oldNote && oldNote.trim()) {
    const migrated = [{ id: 'n_migrated', ts: Date.now(), text: oldNote.trim(), flagged: false }];
    saveCoachNotesLog(cid, migrated);
    return migrated;
  }
  return [];
}
function saveCoachNotesLog(cid, log) {
  localStorage.setItem('coach_notes_log_' + cid, JSON.stringify(log));
}
function buildCoachNotesLogHtml(cid) {
  const log = getCoachNotesLog(cid);
  if (!log.length) return '<div style="font-family:\'Geist Mono\',monospace;font-size:10px;color:var(--muted);padding:4px 0 8px">No notes yet. Add one below.</div>';
  return [...log].reverse().map(n => `
    <div class="coach-note-entry${n.flagged ? ' flagged' : ''}">
      <div class="coach-note-ts">${new Date(n.ts).toLocaleString('en',{month:'short',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
      <div class="coach-note-text">${esc(n.text)}</div>
      <div class="coach-note-btns">
        <button class="coach-note-btn${n.flagged ? ' flag-active' : ''}" onclick="toggleFlagNoteEntry('${cid}','${n.id}')">⚑ ${n.flagged ? 'Flagged' : 'Flag'}</button>
        <button class="coach-note-btn" onclick="deleteCoachNoteEntry('${cid}','${n.id}')" style="color:#e74c3c">✕ Delete</button>
      </div>
    </div>`).join('');
}
function addCoachNoteEntry(cid) {
  const ta = document.getElementById('coach-note-input-' + cid);
  const text = ta?.value?.trim();
  if (!text) { showFitToast('Note is empty'); return; }
  const log = getCoachNotesLog(cid);
  log.push({ id: 'n_' + Date.now(), ts: Date.now(), text, flagged: false });
  saveCoachNotesLog(cid, log);
  if (ta) ta.value = '';
  const container = document.getElementById('coach-notes-log-' + cid);
  if (container) container.innerHTML = buildCoachNotesLogHtml(cid);
  sbAutoSync(cid);
}
function deleteCoachNoteEntry(cid, id) {
  const log = getCoachNotesLog(cid).filter(n => n.id !== id);
  saveCoachNotesLog(cid, log);
  const container = document.getElementById('coach-notes-log-' + cid);
  if (container) container.innerHTML = buildCoachNotesLogHtml(cid);
}
function toggleFlagNoteEntry(cid, id) {
  const log = getCoachNotesLog(cid);
  const entry = log.find(n => n.id === id);
  if (entry) entry.flagged = !entry.flagged;
  saveCoachNotesLog(cid, log);
  const container = document.getElementById('coach-notes-log-' + cid);
  if (container) container.innerHTML = buildCoachNotesLogHtml(cid);
}

/* ── COACH ANALYTICS DASHBOARD ───────────────────────────────── */
function toggleAnalyticsPanel() {
  AppState._analyticsOpen = !AppState._analyticsOpen;
  renderCoachDashboard();
}
function buildAnalyticsPanel(clients) {
  if (!clients.length) return '<div style="font-family:\'Geist Mono\',monospace;font-size:11px;color:var(--muted);padding:8px 0">No clients yet.</div>';
  const now = Date.now();
  const week = 7 * 86400000;
  const month = 30 * 86400000;
  const atRisk = clients.filter(c => {
    const ls = localStorage.getItem('last_seen_' + c.id);
    return !ls || (now - parseInt(ls)) > week;
  });
  const activeThisWeek = clients.length - atRisk.length;
  const totalSessionsMonth = clients.reduce((sum, c) =>
    sum + getFitnessLogs(c.id).filter(l => l.date && (now - new Date(l.date).getTime()) < month).length, 0);
  const totalPRs = clients.reduce((sum, c) => sum + Object.keys(getPRs(c.id)).length, 0);
  let allMacroScores = [];
  clients.forEach(c => allMacroScores.push(...getCoachMacroScores(c.id).filter(m => m.date && (now - new Date(m.date).getTime()) < month)));
  const avgMacro = allMacroScores.length > 0 ? Math.round(allMacroScores.reduce((s, m) => s + m.score, 0) / allMacroScores.length) : null;
  let totalAdherence = 0, adherenceCount = 0;
  clients.forEach(c => {
    getCheckins(c.id).filter(ci => ci.date && (now - new Date(ci.date).getTime()) < month).forEach(ci => {
      if (ci.adherence) { totalAdherence += ci.adherence; adherenceCount++; }
    });
  });
  const avgAdherence = adherenceCount > 0 ? (totalAdherence / adherenceCount).toFixed(1) : null;
  const leaders = clients.map(c => ({
    name: c.name, accent: c.accent || '#3B9EFF',
    count: getFitnessLogs(c.id).filter(l => l.date && (now - new Date(l.date).getTime()) < month).length
  })).filter(x => x.count > 0).sort((a, b) => b.count - a.count).slice(0, 3);
  const totalMilestones = clients.reduce((sum, c) => sum + getUnlockedMilestones(c.id).length, 0);
  return `
    <div class="analytics-title">📊 Analytics — Last 30 Days</div>
    <div class="analytics-stat-grid">
      <div class="analytics-stat"><div class="analytics-stat-val" style="color:var(--accent)">${clients.length}</div><div class="analytics-stat-lbl">Total Clients</div></div>
      <div class="analytics-stat"><div class="analytics-stat-val" style="color:#2ecc71">${activeThisWeek}</div><div class="analytics-stat-lbl">Active This Week</div></div>
      <div class="analytics-stat"><div class="analytics-stat-val" style="color:${atRisk.length>0?'#e74c3c':'#2ecc71'}">${atRisk.length}</div><div class="analytics-stat-lbl">At Risk (7d+)</div></div>
      <div class="analytics-stat"><div class="analytics-stat-val" style="color:#3498db">${totalSessionsMonth}</div><div class="analytics-stat-lbl">Sessions / Mo</div></div>
      <div class="analytics-stat"><div class="analytics-stat-val" style="color:#9b59b6">${totalPRs}</div><div class="analytics-stat-lbl">Total PRs</div></div>
      <div class="analytics-stat"><div class="analytics-stat-val" style="color:#f1c40f">${totalMilestones}</div><div class="analytics-stat-lbl">Milestones</div></div>
      ${avgMacro !== null ? `<div class="analytics-stat"><div class="analytics-stat-val" style="color:${avgMacro>=70?'#2ecc71':avgMacro>=50?'#f1c40f':'#e74c3c'}">${avgMacro}</div><div class="analytics-stat-lbl">Avg Macro Score</div></div>` : ''}
      ${avgAdherence !== null ? `<div class="analytics-stat"><div class="analytics-stat-val" style="color:#3B9EFF">${avgAdherence}</div><div class="analytics-stat-lbl">Avg Adherence</div></div>` : ''}
    </div>
    ${atRisk.length > 0 ? `
    <div style="font-family:'Geist Mono',monospace;font-size:9px;color:#e74c3c;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">⚠ At-Risk Clients</div>
    ${atRisk.map(c => {
      const ls = localStorage.getItem('last_seen_' + c.id);
      const days = ls ? Math.floor((now - parseInt(ls)) / 86400000) : null;
      return `<div class="analytics-risk-item"><div class="analytics-risk-dot" style="background:${c.accent||'#e74c3c'}"></div><span style="flex:1">${esc(c.name)}</span><span style="font-family:'Geist Mono',monospace;font-size:9px;color:var(--muted)">${days!==null?days+'d inactive':'Never logged in'}</span></div>`;
    }).join('')}` : ''}
    ${leaders.length > 0 ? `
    <div style="font-family:'Geist Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin-top:14px;margin-bottom:8px">🏆 Top Sessions This Month</div>
    ${leaders.map((l, i) => `<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--faint)">
      <span style="font-family:'Geist Mono',monospace;font-size:9px;color:var(--muted);width:14px">${i+1}.</span>
      <span style="flex:1;font-size:12px">${esc(l.name)}</span>
      <span style="font-family:'Geist Mono',monospace;font-size:11px;font-weight:700;color:${l.accent}">${l.count} sessions</span>
    </div>`).join('')}` : ''}`;
}

/* ── ACHIEVEMENT BADGES ──────────────────────────────────────── */
function renderBadgesScreen(c) {
  try { checkMilestones(c); } catch(_) {}
  const unlocked = getUnlockedMilestones(c.id);
  const earned = MILESTONES.filter(m => unlocked.includes(m.id));
  const locked = MILESTONES.filter(m => !unlocked.includes(m.id) && m.type !== 'weight_pct' && !(m.type === 'weight' && !c.weightLoss));
  const earnedHtml = earned.length > 0
    ? `<div class="badges-grid">${earned.map(m => `
        <div class="badge-chip earned">
          <div class="badge-chip-icon">${m.emoji}</div>
          <div class="badge-chip-name">${esc(m.label)}</div>
        </div>`).join('')}</div>`
    : `<div style="font-family:'Geist Mono',monospace;font-size:11px;color:var(--muted);padding:12px 0">No badges yet — complete workouts, hit PRs, and track your macros!</div>`;
  const lockedHtml = locked.length > 0
    ? `<div class="badges-grid">${locked.map(m => `
        <div class="badge-chip locked">
          <div class="badge-chip-icon">${m.emoji}</div>
          <div class="badge-chip-name">${esc(m.label)}</div>
        </div>`).join('')}</div>`
    : '';
  return `
    <div class="badges-wrap">
      <div class="panel-title">Badges</div>
      <p class="panel-desc">${earned.length} of ${MILESTONES.length} badges earned.</p>
      ${earned.length > 0 ? `<div class="badges-section-title">Earned</div>${earnedHtml}` : earnedHtml}
      ${lockedHtml ? `<div class="badges-section-title" style="margin-top:20px">Locked</div>${lockedHtml}` : ''}
    </div>`;
}
function renderBadgesInCard(cid) {
  // Inline badge pop-up for coach view (not used for client view which uses renderBadgesScreen)
  const c = getAllClients().find(cl => cl.id === cid);
  if (!c) return;
  const unlocked = getUnlockedMilestones(cid);
  const earned = MILESTONES.filter(m => unlocked.includes(m.id));
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:6000;background:rgba(0,0,0,.85);display:flex;align-items:flex-end;justify-content:center;';
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
  overlay.innerHTML = `<div style="background:var(--surface);border-radius:20px 20px 0 0;width:100%;max-width:520px;padding:24px 20px 32px;max-height:80vh;overflow-y:auto;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <div style="font-family:var(--display);font-weight:700;font-size:22px;letter-spacing:1px">${esc(c.name)}'s Badges</div>
      <button onclick="this.closest('[style]').remove()" style="background:none;border:1px solid var(--border);border-radius:8px;padding:6px 12px;color:var(--muted);cursor:pointer">✕</button>
    </div>
    ${earned.length === 0 ? `<div style="font-family:'Geist Mono',monospace;font-size:11px;color:var(--muted)">No badges unlocked yet.</div>` : `
    <div class="badges-grid">${earned.map(m => `
      <div class="badge-chip earned">
        <div class="badge-chip-icon">${m.emoji}</div>
        <div class="badge-chip-name">${esc(m.label)}</div>
      </div>`).join('')}</div>`}
  </div>`;
  document.body.appendChild(overlay);
}

/* ── MILESTONE SHARE ─────────────────────────────────────────── */
function shareMilestone() {
  const emoji = document.getElementById('msEmoji')?.textContent || '🏆';
  const title = document.getElementById('msTitle')?.textContent || 'Achievement';
  const label = document.getElementById('msLabel')?.textContent || 'Milestone';
  const msg   = document.getElementById('msMsg')?.textContent || '';

  const canvas = document.createElement('canvas');
  canvas.width = 600; canvas.height = 600;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, 600, 600);

  // Accent border
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#3B9EFF';
  ctx.strokeStyle = accent;
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, 594, 594);

  // Branding
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('CRAZYY', 280, 50);
  ctx.fillStyle = accent;
  ctx.fillText('FIT', 358, 50);

  // Emoji
  ctx.font = '96px serif';
  ctx.textAlign = 'center';
  ctx.fillText(emoji, 300, 220);

  // Label
  ctx.fillStyle = accent;
  ctx.font = 'bold 14px "Geist Mono", monospace';
  ctx.letterSpacing = '4px';
  ctx.fillText(label.toUpperCase(), 300, 270);

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 38px Arial';
  ctx.fillText(title, 300, 330);

  // Message (wrapped)
  ctx.fillStyle = '#888888';
  ctx.font = '16px Arial';
  const words = msg.split(' ');
  let line = '', y = 380;
  for (const word of words) {
    const test = line + word + ' ';
    if (ctx.measureText(test).width > 480 && line) {
      ctx.fillText(line.trim(), 300, y);
      line = word + ' '; y += 24;
    } else { line = test; }
  }
  if (line.trim()) ctx.fillText(line.trim(), 300, y);

  // App URL
  ctx.fillStyle = '#444';
  ctx.font = '13px Arial';
  ctx.fillText(window.location.hostname || 'CrazyyFit', 300, 560);

  canvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    if (navigator.share && navigator.canShare) {
      const file = new File([blob], 'achievement.png', { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: `${title} — CrazyyFit`, text: msg }).catch(() => {});
        return;
      }
    }
    // Fallback: download
    const a = document.createElement('a');
    a.href = url; a.download = 'achievement.png'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }, 'image/png');
}

/* ── MOVEMENT LIBRARY ────────────────────────────────────────── */
function getMovementLibrary() { return getLS('movement_library', []); }
function getMovementLibraryAt() { return localStorage.getItem('movement_library_at') || ''; }
function saveMovementLibrary(lib) {
  localStorage.setItem('movement_library', JSON.stringify(lib));
  // Stamp the change so cloud sync can resolve newest-wins across devices.
  localStorage.setItem('movement_library_at', new Date().toISOString());
}

// Map a freeform muscle-group string onto a known picker bucket, else "Custom".
function _normalizeMuscle(raw) {
  if (!raw) return 'Custom';
  const known = ['Chest','Back','Shoulders','Biceps','Triceps','Quads','Hamstrings','Glutes','Calves','Core','Full Body','Cardio','Mobility'];
  const first = String(raw).split(/[,/]/)[0].trim().toLowerCase();
  return known.find(m => m.toLowerCase() === first) || 'Custom';
}

// Built-in exercises plus the coach's saved/custom movements, normalised into the
// picker shape ({name,muscle,sets,reps}) and deduped by name (built-ins win).
function getPickerMovements() {
  const seen = new Set(EXERCISE_DB.map(e => e.name.toLowerCase()));
  const extra = getMovementLibrary()
    .filter(e => e && e.name && !seen.has(e.name.toLowerCase()))
    .map(e => ({
      name: e.name,
      muscle: _normalizeMuscle(e.muscleGroups),
      // Picker templates append " sets", so keep just the leading number here.
      sets: (String(e.sets || '').match(/\d+/) || ['3'])[0],
      reps: e.reps || '10–12',
      _custom: true,
    }));
  return EXERCISE_DB.concat(extra);
}

// Persist a newly typed movement to the coach's library so it's reusable in the
// pickers next time. No-op if it already exists as a built-in or saved entry.
function autoSaveCustomMovement(ex) {
  if (!ex || !ex.name) return;
  const lc = ex.name.trim().toLowerCase();
  if (!lc) return;
  if (EXERCISE_DB.some(e => e.name.toLowerCase() === lc)) return;
  const lib = getMovementLibrary();
  if (lib.some(e => e.name && e.name.toLowerCase() === lc)) return;
  lib.push({
    id: 'lib_' + Date.now(),
    name: ex.name.trim(),
    muscleGroups: '',
    equipment: '',
    videoUrl: '',
    coachNotes: ex.note || '',
    sets: ex.sets || '',
    reps: ex.reps || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _auto: true,
  });
  saveMovementLibrary(lib);
}

function openMovementLibrary() {
  AppState._librarySearch = '';
  AppState._libraryEditId = null;
  const screen = document.getElementById('feature-movement-library');
  if (screen) {
    screen.classList.add('open');
    document.body.style.overflow = 'hidden';
    renderMovementLibrary();
  }
}
function renderMovementLibrary() {
  const body = document.getElementById('feature-movement-library-body');
  if (!body) return;
  const lib = getMovementLibrary();
  const q = (AppState._librarySearch || '').toLowerCase().trim();
  const filtered = q ? lib.filter(e => e.name.toLowerCase().includes(q) || (e.muscleGroups||'').toLowerCase().includes(q)) : lib;
  const isEditing = AppState._libraryEditId !== null;
  const editEntry = isEditing ? lib.find(e => e.id === AppState._libraryEditId) || {} : {};
  const formHtml = `
    <div class="library-form${isEditing || AppState._libraryFormOpen ? ' open' : ''}" id="libraryForm">
      <div class="library-form-title">${isEditing ? '✎ Edit Exercise' : '+ Add Exercise'}</div>
      <div class="library-form-row">
        <div class="library-form-label">Exercise Name *</div>
        <input class="library-form-input" id="libName" placeholder="e.g. Bulgarian Split Squat" value="${esc(editEntry.name||'')}">
      </div>
      <div class="library-form-row">
        <div class="library-form-label">Muscle Groups</div>
        <input class="library-form-input" id="libMuscles" placeholder="e.g. Quads, Glutes" value="${esc(editEntry.muscleGroups||'')}">
      </div>
      <div class="library-form-row">
        <div class="library-form-label">Equipment</div>
        <input class="library-form-input" id="libEquip" placeholder="e.g. Dumbbells, Barbell" value="${esc(editEntry.equipment||'')}">
      </div>
      <div class="library-form-row">
        <div class="library-form-label">Video URL (optional)</div>
        <input class="library-form-input" id="libVideo" type="url" placeholder="YouTube or Instagram link" value="${esc(editEntry.videoUrl||'')}">
      </div>
      <div class="library-form-row">
        <div class="library-form-label">Coach Notes</div>
        <input class="library-form-input" id="libNotes" placeholder="Cues, common mistakes, variations…" value="${esc(editEntry.coachNotes||'')}">
      </div>
      <div class="library-form-actions">
        <button class="library-form-save" onclick="saveLibraryExercise()">Save Exercise</button>
        <button class="library-form-cancel" onclick="cancelLibraryEdit()">Cancel</button>
      </div>
    </div>`;
  const listHtml = filtered.length === 0
    ? `<div style="font-family:'Geist Mono',monospace;font-size:11px;color:var(--muted);text-align:center;padding:32px 0">${lib.length===0?'Library is empty — add your first exercise above.':'No results for "'+esc(q)+'"'}</div>`
    : filtered.map(e => `
      <div class="library-item">
        <div class="library-item-info">
          <div class="library-item-name">${esc(e.name)}</div>
          <div class="library-item-meta">${[e.muscleGroups,e.equipment].filter(Boolean).join(' · ')}</div>
          ${e.coachNotes ? `<div style="font-size:11px;color:var(--muted);margin-top:4px;line-height:1.4">${esc(e.coachNotes)}</div>` : ''}
          ${e.videoUrl ? `<a href="${esc(e.videoUrl)}" target="_blank" rel="noopener noreferrer" style="font-family:'Geist Mono',monospace;font-size:9px;color:var(--accent);margin-top:4px;display:inline-block">▶ Watch</a>` : ''}
        </div>
        <div class="library-item-btns">
          <button class="library-item-btn" onclick="editLibraryExercise('${e.id}')">Edit</button>
          <button class="library-item-btn" onclick="deleteLibraryExercise('${e.id}')" style="color:#e74c3c;border-color:rgba(231,76,60,.3)">✕</button>
        </div>
      </div>`).join('');
  body.innerHTML = `
    <div class="panel-title">Movement Library</div>
    <p class="panel-desc">${lib.length} exercise${lib.length!==1?'s':''} saved · coach-only</p>
    <div class="library-toolbar">
      <input class="library-search" placeholder="Search exercises…" value="${esc(AppState._librarySearch||'')}"
        oninput="AppState._librarySearch=this.value;renderMovementLibrary()">
      <button class="library-add-btn" onclick="AppState._libraryFormOpen=true;AppState._libraryEditId=null;renderMovementLibrary()">+ Add Exercise</button>
    </div>
    ${formHtml}
    ${listHtml}`;
}
function saveLibraryExercise() {
  const name = document.getElementById('libName')?.value?.trim();
  if (!name) { showFitToast('Exercise name is required'); return; }
  const lib = getMovementLibrary();
  const entry = {
    id: AppState._libraryEditId || 'lib_' + Date.now(),
    name,
    muscleGroups: document.getElementById('libMuscles')?.value?.trim() || '',
    equipment: document.getElementById('libEquip')?.value?.trim() || '',
    videoUrl: document.getElementById('libVideo')?.value?.trim() || '',
    coachNotes: document.getElementById('libNotes')?.value?.trim() || '',
    updatedAt: new Date().toISOString(),
  };
  if (AppState._libraryEditId) {
    const idx = lib.findIndex(e => e.id === AppState._libraryEditId);
    if (idx >= 0) lib[idx] = entry; else lib.push(entry);
  } else {
    entry.createdAt = new Date().toISOString();
    lib.push(entry);
  }
  saveMovementLibrary(lib);
  AppState._libraryEditId = null;
  AppState._libraryFormOpen = false;
  showFitToast('Exercise saved!');
  renderMovementLibrary();
}
function editLibraryExercise(id) {
  AppState._libraryEditId = id;
  AppState._libraryFormOpen = true;
  renderMovementLibrary();
  document.getElementById('libraryForm')?.scrollIntoView({ behavior: 'smooth' });
}
function cancelLibraryEdit() {
  AppState._libraryEditId = null;
  AppState._libraryFormOpen = false;
  renderMovementLibrary();
}
function deleteLibraryExercise(id) {
  const lib = getMovementLibrary().filter(e => e.id !== id);
  saveMovementLibrary(lib);
  showFitToast('Exercise removed');
  renderMovementLibrary();
}

/* ── PERIODIZATION CALENDAR ──────────────────────────────────── */
function getPeriodization(cid) { return getLS('periodization_' + cid, []); }
function savePeriodization(cid, phases) { localStorage.setItem('periodization_' + cid, JSON.stringify(phases)); }

function getCurrentPhase(cid) {
  const today = new Date().toISOString().slice(0, 10);
  return getPeriodization(cid).find(p =>
    (!p.startDate || p.startDate <= today) && (!p.endDate || p.endDate >= today)
  ) || null;
}

let _periodCid = null;
function openPeriodizationScreen(cid) {
  _periodCid = cid;
  const screen = document.getElementById('feature-periodization');
  if (screen) {
    screen.classList.add('open');
    document.body.style.overflow = 'hidden';
    renderPeriodizationScreen();
  }
}
function closePeriodizationScreen() {
  _periodCid = null;
  const screen = document.getElementById('feature-periodization');
  if (screen) { screen.classList.remove('open'); }
  document.body.style.overflow = '';
}
function renderPeriodizationScreen() {
  const body = document.getElementById('feature-periodization-body');
  if (!body || !_periodCid) return;
  const c = getAllClients().find(cl => cl.id === _periodCid);
  const phases = getPeriodization(_periodCid);
  const today = new Date().toISOString().slice(0, 10);

  // Build timeline bar if phases have dates
  const dated = phases.filter(p => p.startDate && p.endDate);
  let timelineHtml = '';
  if (dated.length > 0) {
    const minD = new Date(Math.min(...dated.map(p => new Date(p.startDate))));
    const maxD = new Date(Math.max(...dated.map(p => new Date(p.endDate))));
    const totalDays = Math.max(1, (maxD - minD) / 86400000);
    const segs = dated.map(p => {
      const start = Math.max(0, (new Date(p.startDate) - minD) / 86400000);
      const dur   = Math.max(1, (new Date(p.endDate) - new Date(p.startDate)) / 86400000);
      const flex  = (dur / totalDays * 100).toFixed(1);
      const isCurrent = p.startDate <= today && p.endDate >= today;
      return `<div class="period-phase-seg${isCurrent?' current':''}" style="flex:${flex};background:${p.color||'#555'};color:${p.color?'#000':'#aaa'}">${p.name.slice(0,6)}</div>`;
    });
    const legend = dated.map(p => `<div class="period-phase-legend-item"><div class="period-phase-dot" style="background:${p.color||'#555'}"></div>${esc(p.name)}</div>`).join('');
    timelineHtml = `<div class="period-phase-bar">${segs.join('')}</div><div class="period-phase-legend">${legend}</div>`;
  }

  const listHtml = phases.length === 0
    ? `<div style="font-family:'Geist Mono',monospace;font-size:11px;color:var(--muted);padding:8px 0">No phases yet. Add one below.</div>`
    : phases.map(p => `
      <div class="period-list-item">
        <div class="period-list-dot" style="background:${p.color||'#555'}"></div>
        <div class="period-list-info">
          <div class="period-list-name">${esc(p.name)}</div>
          <div class="period-list-dates">${p.phase?esc(p.phase)+' · ':''}${p.startDate||'?'} → ${p.endDate||'?'}${p.notes?' · '+esc(p.notes):''}</div>
        </div>
        <button onclick="deletePeriodPhase('${p.id}')" style="background:none;border:1px solid rgba(231,76,60,.3);border-radius:5px;padding:4px 8px;font-size:9px;color:#e74c3c;cursor:pointer;font-family:'Geist Mono',monospace">✕</button>
      </div>`).join('');

  const phaseColors = ['#3B9EFF','#3B9EFF','#2ecc71','#3498db','#9b59b6','#e74c3c','#f1c40f'];
  body.innerHTML = `
    <div class="panel-title">${c ? esc(c.name)+"'s " : ''}Periodization</div>
    <p class="panel-desc">Map out mesocycles and training phases. Clients see the current phase in their workout tab.</p>
    ${timelineHtml ? `<div style="margin-bottom:16px">${timelineHtml}</div>` : ''}
    <div class="period-manager-title">Phases</div>
    ${listHtml}
    <div class="period-manager-title" style="margin-top:16px">Add Phase</div>
    <div class="period-form">
      <div class="period-form-row">
        <div>
          <div class="library-form-label">Phase Name *</div>
          <input class="period-input" id="periodName" placeholder="Accumulation, Deload, Peak…">
        </div>
        <div>
          <div class="library-form-label">Type / Label</div>
          <input class="period-input" id="periodPhase" placeholder="e.g. Hypertrophy">
        </div>
      </div>
      <div class="period-form-row">
        <div>
          <div class="library-form-label">Start Date</div>
          <input class="period-input" id="periodStart" type="date" value="${today}">
        </div>
        <div>
          <div class="library-form-label">End Date</div>
          <input class="period-input" id="periodEnd" type="date">
        </div>
      </div>
      <div class="library-form-row">
        <div class="library-form-label">Color</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px">
          ${phaseColors.map((col, i) => `<button onclick="document.getElementById('periodColorVal').value='${col}';document.querySelectorAll('.period-color-btn').forEach(b=>b.classList.remove('active'));this.classList.add('active')" class="period-color-btn${i===0?' active':''}" style="width:24px;height:24px;border-radius:5px;background:${col};border:2px solid ${i===0?'#fff':'transparent'};cursor:pointer;transition:border-color .15s" onmouseover="this.style.borderColor='#fff'" onmouseout="if(!this.classList.contains('active'))this.style.borderColor='transparent'"></button>`).join('')}
          <input type="hidden" id="periodColorVal" value="${phaseColors[0]}">
        </div>
      </div>
      <div class="library-form-row">
        <div class="library-form-label">Notes (optional)</div>
        <input class="period-input" id="periodNotes" placeholder="Focus, goals, key lifts…">
      </div>
      <div class="library-form-actions">
        <button class="library-form-save" onclick="addPeriodPhase()">Add Phase</button>
      </div>
    </div>`;
}
function addPeriodPhase() {
  const name = document.getElementById('periodName')?.value?.trim();
  if (!name) { showFitToast('Phase name is required'); return; }
  const phases = getPeriodization(_periodCid);
  phases.push({
    id: 'ph_' + Date.now(),
    name,
    phase: document.getElementById('periodPhase')?.value?.trim() || '',
    startDate: document.getElementById('periodStart')?.value || '',
    endDate: document.getElementById('periodEnd')?.value || '',
    color: document.getElementById('periodColorVal')?.value || '#3B9EFF',
    notes: document.getElementById('periodNotes')?.value?.trim() || '',
  });
  savePeriodization(_periodCid, phases);
  showFitToast('Phase added');
  renderPeriodizationScreen();
}
function deletePeriodPhase(id) {
  savePeriodization(_periodCid, getPeriodization(_periodCid).filter(p => p.id !== id));
  renderPeriodizationScreen();
}

/* ── PROGRESSION RULES ENGINE ────────────────────────────────── */
// Automatic: triggers when same weight+reps appear on ≥2 sets across 2 consecutive sessions.
// Increment: +5 lbs for ≥50 lbs lifts, +2.5 lbs for lighter work.
function getProgressionSuggestions(cid) { return getLS('prog_suggestions_' + cid, []); }
function saveProgressionSuggestions(cid, s) { localStorage.setItem('prog_suggestions_' + cid, JSON.stringify(s)); }

function checkProgressionRules(cid) {
  const c = getAllClients().find(cl => cl.id === cid);
  if (!c) return;

  // Prune stale suggestions (older than 21 days) before checking for new ones
  const STALE_MS = 21 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const existing = getProgressionSuggestions(cid).filter(s => {
    const age = now - (s.createdAt || now);
    return age < STALE_MS;
  });
  saveProgressionSuggestions(cid, existing);

  const newSuggestions = [];
  const existingNames = new Set(existing.map(s => s.exerciseName));

  (c.data?.workouts?.days || []).forEach(d => {
    const dayId = d.id || d.label;
    const hist  = getWlHistory(cid, dayId); // newest-first array
    if (hist.length < 2) return;

    const session1 = hist[0]; // most recent
    const session2 = hist[1]; // one before

    const allExercises = (d.blocks || []).flatMap(b => b.exercises || []);

    Object.keys(session1.exercises || {}).forEach(exIdxStr => {
      const exIdx = parseInt(exIdxStr);
      const ex1   = session1.exercises[exIdxStr];
      const ex2   = session2.exercises?.[exIdxStr];
      if (!ex2) return;

      const exerciseName = allExercises[exIdx]?.name;
      if (!exerciseName || existingNames.has(exerciseName)) return;

      // Keep only sets that have both weight and reps logged
      const sets1 = (ex1.sets || []).filter(s => s && s.weight && s.reps);
      const sets2 = (ex2.sets || []).filter(s => s && s.weight && s.reps);
      if (sets1.length < 1 || sets2.length < 1) return;

      // Count how many corresponding sets matched on weight AND reps
      const minLen = Math.min(sets1.length, sets2.length);
      let matchCount = 0;
      for (let i = 0; i < minLen; i++) {
        const w1 = parseFloat(sets1[i].weight), w2 = parseFloat(sets2[i].weight);
        const r1 = parseInt(sets1[i].reps),   r2 = parseInt(sets2[i].reps);
        if (w1 > 0 && w1 === w2 && r1 > 0 && r1 === r2) matchCount++;
      }
      if (matchCount < 2) return; // need at least 2 identical sets across both sessions

      const currentWeight = parseFloat(sets1[0].weight) || 0;
      const increment     = currentWeight >= 50 ? 5 : 2.5;
      newSuggestions.push({
        id: 'ps_' + exerciseName.replace(/\s/g, '_') + '_' + Date.now(),
        exerciseName,
        currentWeight,
        suggestedWeight: Math.round((currentWeight + increment) * 10) / 10,
        unit: 'lbs',
        increment,
        matchCount,
        createdAt: Date.now(),
      });
      existingNames.add(exerciseName); // avoid duplicates within this run
    });
  });

  if (newSuggestions.length) {
    const all = [...getProgressionSuggestions(cid), ...newSuggestions];
    saveProgressionSuggestions(cid, all);
  }
}

function buildProgressionSuggestionsHtml(c) {
  const STALE_MS = 21 * 24 * 60 * 60 * 1000;
  const suggestions = getProgressionSuggestions(c.id).filter(s => !s.createdAt || (Date.now() - s.createdAt) < STALE_MS);
  if (!suggestions.length) return '';
  return `<div style="margin-bottom:14px">
    <div style="font-family:'Geist Mono',monospace;font-size:9px;color:#2ecc71;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px">Progressive Overload Ready</div>
    ${suggestions.map(s => `
      <div class="prog-suggestion">
        <div class="prog-suggestion-text"><strong>${esc(s.exerciseName)}</strong> — same weight &amp; reps two sessions in a row. Add weight.</div>
        <div class="prog-suggestion-badge">${s.currentWeight} → ${s.suggestedWeight} ${esc(s.unit||'lbs')} (+${s.increment||5})</div>
        <button class="prog-apply-btn" onclick="applyProgressionSuggestion('${c.id}','${s.id}','${esc(s.exerciseName)}',${s.suggestedWeight},'${esc(s.unit||'lbs')}')">Apply</button>
        <button class="prog-dismiss-btn" onclick="dismissProgressionSuggestion('${c.id}','${s.id}')">Dismiss</button>
      </div>`).join('')}
  </div>`;
}

function applyProgressionSuggestion(cid, sid, exerciseName, suggestedWeight, unit) {
  // Find and update the exercise in the client's program
  const c = getAllClients().find(cl => cl.id === cid);
  if (!c) return;
  let updated = false;
  (c.data?.workouts?.days || []).forEach(d => {
    (d.blocks || []).forEach(b => {
      (b.exercises || []).forEach(e => {
        if (e.name.toLowerCase() === exerciseName.toLowerCase()) {
          e.note = (e.note ? e.note + ' · ' : '') + `${suggestedWeight}${unit} (progressed ${new Date().toLocaleDateString('en',{month:'short',day:'numeric'})})`;
          updated = true;
        }
      });
    });
  });
  if (updated) {
    updateDynamicClient(cid, c);
    sbAutoSync(cid);
    showFitToast(`Updated ${exerciseName} to ${suggestedWeight}${unit}`);
  }
  dismissProgressionSuggestion(cid, sid);
}

function dismissProgressionSuggestion(cid, sid) {
  saveProgressionSuggestions(cid, getProgressionSuggestions(cid).filter(s => s.id !== sid));
  // Re-render workouts if we're in client view
  if (currentClient?.id === cid) {
    const tab = document.querySelector('.tab-item.active');
    if (tab) switchTab(tab.dataset.tid, tab);
  }
}
function buildProgressionRulesCoachPanel(c) {
  const suggestions = getProgressionSuggestions(c.id);
  if (!suggestions.length) return '';
  const rows = suggestions.map(s => `
    <div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--faint)">
      <span style="flex:1;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(s.exerciseName)}</span>
      <span class="prog-suggestion-badge">${s.currentWeight} → ${s.suggestedWeight} ${esc(s.unit||'lbs')}</span>
    </div>`).join('');
  return `<div class="prog-rule-section">
    <div class="prog-rule-title">Progressive Overload Ready
      <span style="font-weight:300;color:var(--muted);font-size:9px"> — ${suggestions.length} exercise${suggestions.length !== 1 ? 's' : ''} hit same weight+reps twice</span>
    </div>
    ${rows}
  </div>`;
}

/* ── EMAIL SYSTEM ────────────────────────────────────────────── */

// Calls /.netlify/functions/send-email (aliased to /api/send-email via netlify.toml)
async function sendEmail(to, subject, html) {
  const res = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, subject, html, type: 'custom' })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Email send failed (' + res.status + ')');
  }
  return res.json();
}

// Branded credentials email (welcome / PIN reset)
function buildCredentialsEmailHtml(name, pin, appUrl, plan) {
  const planLabels = { blueprint:'Crazyy Blueprint', blueprintv2:'BlueprintV2', transformation:'Full Transformation' };
  const planLabel = planLabels[plan] || 'Training Program';
  const yr = new Date().getFullYear();
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;">
<div style="max-width:520px;margin:0 auto;padding:40px 24px;">
  <div style="text-align:center;margin-bottom:32px;">
    <div style="font-size:28px;font-weight:900;letter-spacing:3px;color:#fff;">CRAZYY<span style="color:#3B9EFF">FIT</span></div>
    <div style="font-size:11px;color:#555;letter-spacing:2px;margin-top:4px;">YOUR PERSONAL TRAINING HUB</div>
  </div>
  <div style="background:#111;border:1px solid #222;border-radius:16px;padding:32px;margin-bottom:20px;">
    <div style="font-size:22px;font-weight:700;color:#fff;margin-bottom:6px;">Welcome, ${name}!</div>
    <div style="font-size:13px;color:#888;margin-bottom:24px;">Your <strong style="color:#3B9EFF">${planLabel}</strong> is ready. Here are your login details.</div>
    <div style="background:#1a1a1a;border:1px solid #333;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
      <div style="font-size:10px;letter-spacing:2px;color:#666;text-transform:uppercase;margin-bottom:8px;">Your App PIN</div>
      <div style="font-size:48px;font-weight:900;letter-spacing:12px;color:#3B9EFF;font-family:monospace;">${pin}</div>
      <div style="font-size:11px;color:#555;margin-top:8px;">Keep this private — it's your personal login</div>
    </div>
    <div style="font-size:13px;color:#ccc;line-height:2;margin-bottom:24px;">
      <strong style="color:#888;font-size:11px;letter-spacing:1px;text-transform:uppercase;">How to log in</strong><br>
      1 · Open the app using the button below<br>
      2 · Tap your name on the login screen<br>
      3 · Enter your 4-digit PIN
    </div>
    <a href="${appUrl}" style="display:block;text-align:center;background:#3B9EFF;color:#000;font-weight:700;font-size:15px;letter-spacing:2px;text-decoration:none;padding:16px;border-radius:10px;text-transform:uppercase;">Open CrazyyFit →</a>
  </div>
  <div style="text-align:center;font-size:11px;color:#444;line-height:1.7;">Questions? Reply to this email — your coach is here.<br><span style="color:#333">CrazyyFit · ${yr}</span></div>
</div>
</body></html>`;
}

// Broadcast email template
function buildBroadcastEmailHtml(message) {
  const yr = new Date().getFullYear();
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;">
<div style="max-width:520px;margin:0 auto;padding:40px 24px;">
  <div style="text-align:center;margin-bottom:28px;">
    <div style="font-size:28px;font-weight:900;letter-spacing:3px;color:#fff;">CRAZYY<span style="color:#3B9EFF">FIT</span></div>
  </div>
  <div style="background:#111;border:1px solid #222;border-radius:16px;padding:32px;margin-bottom:20px;">
    <div style="font-size:11px;letter-spacing:2px;color:#3B9EFF;text-transform:uppercase;margin-bottom:14px;">Message from your coach</div>
    <div style="font-size:16px;color:#fff;line-height:1.8;white-space:pre-wrap;">${message}</div>
  </div>
  <div style="text-align:center;font-size:11px;color:#444;">Reply to this email if you have questions.<br><span style="color:#333">CrazyyFit · ${yr}</span></div>
</div>
</body></html>`;
}

// Personal coach-to-client message email
function buildCoachMsgEmailHtml(clientName, message, appUrl) {
  const yr = new Date().getFullYear();
  const firstName = clientName.split(' ')[0];
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;">
<div style="max-width:520px;margin:0 auto;padding:40px 24px;">
  <div style="text-align:center;margin-bottom:28px;">
    <div style="font-size:28px;font-weight:900;letter-spacing:3px;color:#fff;">CRAZYY<span style="color:#3B9EFF">FIT</span></div>
  </div>
  <div style="background:#111;border:1px solid #222;border-radius:16px;padding:32px;margin-bottom:20px;">
    <div style="font-size:15px;font-weight:600;color:#fff;margin-bottom:6px;">Hey ${firstName},</div>
    <div style="font-size:11px;letter-spacing:2px;color:#3B9EFF;text-transform:uppercase;margin-bottom:14px;">Message from your coach</div>
    <div style="font-size:15px;color:#e0e0e0;line-height:1.8;white-space:pre-wrap;border-left:3px solid #3B9EFF;padding-left:16px;">${message}</div>
    ${appUrl ? `<a href="${appUrl}" style="display:block;text-align:center;margin-top:24px;background:#3B9EFF;color:#000;font-weight:700;font-size:13px;letter-spacing:2px;text-decoration:none;padding:14px;border-radius:10px;text-transform:uppercase;">Open CrazyyFit →</a>` : ''}
  </div>
  <div style="text-align:center;font-size:11px;color:#444;line-height:1.7;">Reply in the app to message your coach back.<br><span style="color:#333">CrazyyFit · ${yr}</span></div>
</div>
</body></html>`;
}

// Stored reference to the freshly onboarded client — used by sendWelcomeEmailToNewClient()
let _obSuccessClient = null;

// Called from the onboarding success screen (has access to the plain PIN)
async function sendWelcomeEmailToNewClient() {
  const c = _obSuccessClient;
  if (!c) return;
  const email = c._meta?.email || '';
  if (!email) { showFitToast('No email on file for this client'); return; }
  const pin = c._pinPlain || '';
  const appUrl = window.location.href.split('?')[0];
  const plan = c._meta?.plan || c.programType || c.program_type || 'blueprint';
  const btn = document.getElementById('obEmailCredBtn');
  const status = document.getElementById('obEmailStatus');
  if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
  if (status) status.innerHTML = 'Email: Sending to ' + email + '…';
  try {
    await sendEmail(email, 'Welcome to CrazyyFit — Your Login Details',
      buildCredentialsEmailHtml(c.name, pin || '(ask your coach)', appUrl, plan));
    showFitToast('Credentials emailed to ' + email);
    if (btn) { btn.disabled = false; btn.textContent = 'Sent'; }
    if (status) status.innerHTML = 'Email: <span style="color:var(--accent)">Sent to ' + email + '</span>';
  } catch (e) {
    console.error('sendWelcomeEmail:', e);
    const msg = (e && e.message) ? e.message : 'Email send failed';
    showFitToast('Email failed: ' + msg);
    if (btn) { btn.disabled = false; btn.textContent = 'Retry'; }
    if (status) status.innerHTML = 'Email: <span style="color:#e74c3c">Failed — ' + msg.replace(/</g,'&lt;') + '</span>';
  }
}

// Coach card → "Email" button: generate a fresh PIN and email it
async function emailClientCredentials(cid) {
  const clients = getAllClients();
  const c = clients.find(cl => cl.id === cid);
  if (!c) return;
  const email = c._meta?.email || '';
  if (!email) { showFitToast('No email on file — edit the client to add one'); return; }
  if (!confirm('Generate a new PIN for ' + (c.name || 'this client') + ' and email it to ' + email + '?')) return;
  const newPin = generatePIN();
  const hashed = await hashPin(newPin);
  const dynamic = getDynamicClients();
  const idx = dynamic.findIndex(cl => cl.id === cid);
  if (idx >= 0) {
    dynamic[idx].pin = hashed;
    localStorage.setItem('dynamic_clients', JSON.stringify(dynamic));
  }
  try { localStorage.setItem('pin_plain_' + cid, newPin); } catch (_) {}
  try { await sbUpsert('clients', { id: cid, pin: hashed, updated_at: new Date().toISOString() }); } catch (e) {}
  const appUrl = window.location.href.split('?')[0];
  const plan = c._meta?.plan || c.programType || c.program_type || 'blueprint';
  try {
    await sendEmail(email, 'Your CrazyyFit Login Details',
      buildCredentialsEmailHtml(c.name, newPin, appUrl, plan));
    showFitToast('New PIN emailed to ' + email);
  } catch (e) {
    console.error('emailClientCredentials:', e);
    showFitToast('Email failed. New PIN: ' + newPin + ' — save this!');
  }
}

// Broadcast email: sends the message to every client that has an email on file
async function sendBroadcastEmailToAll(message) {
  const clients = getAllClients();
  const targets = clients.filter(c => c._meta?.email);
  if (targets.length === 0) {
    showFitToast('No clients have email addresses on file');
    return;
  }
  const html = buildBroadcastEmailHtml(message);
  let sent = 0;
  for (const c of targets) {
    try {
      await sendEmail(c._meta.email, 'Message from Your Coach — CrazyyFit', html);
      sent++;
    } catch (e) { console.warn('Email failed for', c._meta.email, e); }
  }
  showFitToast('Emailed ' + sent + ' / ' + targets.length + ' client' + (targets.length !== 1 ? 's' : ''));
}

/* ── SIGNUP FLOW ─────────────────────────────────────────────── */
const SIGNUP_PLANS = [
  { id:'blueprint',     name:'CRAZYY BLUEPRINT',    price:'$50',  per:'/mo', desc:'2-month structured program · 1-on-1 texting · Peptide & anabolic guidance · Full app access' },
  { id:'transformation',name:'FULL TRANSFORMATION', price:'$350', per:'/mo', desc:'Everything in Blueprint · Custom programming rebuilt monthly · Hormone & peptide protocol optimization · Bloodwork review · Priority 24/7 access', featured: true },
];
const STRIPE_LINKS = {
  blueprint:      'https://buy.stripe.com/3cIeVe5r702Vd8H28G3oA00',
  transformation: 'https://buy.stripe.com/5kQcN6f1HbLD7On5kS3oA01',
};
/* ── EXERCISE DATABASE (200 exercises) ───────────────────────── */
const EXERCISE_DB = [
  // CHEST
  {name:'Barbell Bench Press',muscle:'Chest',sets:'4',reps:'8–10'},
  {name:'Dumbbell Bench Press',muscle:'Chest',sets:'4',reps:'10–12'},
  {name:'Incline Barbell Press',muscle:'Chest',sets:'4',reps:'8–10'},
  {name:'Incline Dumbbell Press',muscle:'Chest',sets:'3',reps:'10–12'},
  {name:'Decline Bench Press',muscle:'Chest',sets:'3',reps:'10–12'},
  {name:'Dumbbell Flyes',muscle:'Chest',sets:'3',reps:'12–15'},
  {name:'Incline Dumbbell Fly',muscle:'Chest',sets:'3',reps:'12–15'},
  {name:'Cable Crossover',muscle:'Chest',sets:'3',reps:'12–15'},
  {name:'Hi-Lo Cable Fly',muscle:'Chest',sets:'3',reps:'12–15'},
  {name:'Lo-Hi Cable Fly',muscle:'Chest',sets:'3',reps:'12–15'},
  {name:'Mid-Cable Chest Fly',muscle:'Chest',sets:'3',reps:'12–15'},
  {name:'Single-Arm Hi-Lo Cable Fly',muscle:'Chest',sets:'3',reps:'12–15 each'},
  {name:'Single-Arm Lo-Hi Cable Fly',muscle:'Chest',sets:'3',reps:'12–15 each'},
  {name:'Single-Arm Mid-Cable Fly',muscle:'Chest',sets:'3',reps:'12–15 each'},
  {name:'Cable Chest Press',muscle:'Chest',sets:'3',reps:'10–12'},
  {name:'Pec Deck Machine',muscle:'Chest',sets:'3',reps:'12–15'},
  {name:'Machine Chest Press',muscle:'Chest',sets:'3',reps:'10–12'},
  {name:'Machine Incline Press',muscle:'Chest',sets:'3',reps:'10–12'},
  {name:'Push-Up',muscle:'Chest',sets:'4',reps:'15–20'},
  {name:'Incline Push-Up',muscle:'Chest',sets:'3',reps:'15–20'},
  {name:'Decline Push-Up',muscle:'Chest',sets:'3',reps:'15–20'},
  {name:'Diamond Push-Up',muscle:'Chest',sets:'3',reps:'10–15'},
  {name:'Archer Push-Up',muscle:'Chest',sets:'3',reps:'8–10 each'},
  {name:'Dumbbell Pullover',muscle:'Chest',sets:'3',reps:'12–15'},
  {name:'Cable Pullover',muscle:'Chest',sets:'3',reps:'12–15'},
  {name:'Landmine Press',muscle:'Chest',sets:'3',reps:'10–12'},
  {name:'Smith Machine Bench Press',muscle:'Chest',sets:'4',reps:'8–10'},
  {name:'Chest Dip',muscle:'Chest',sets:'3',reps:'10–15'},
  // BACK
  {name:'Pull-Up',muscle:'Back',sets:'4',reps:'6–10'},
  {name:'Chin-Up',muscle:'Back',sets:'4',reps:'6–10'},
  {name:'Neutral-Grip Pull-Up',muscle:'Back',sets:'4',reps:'6–10'},
  {name:'Band-Assisted Pull-Up',muscle:'Back',sets:'4',reps:'8–10'},
  {name:'Lat Pulldown',muscle:'Back',sets:'4',reps:'10–12'},
  {name:'Wide-Grip Lat Pulldown',muscle:'Back',sets:'4',reps:'10–12'},
  {name:'Neutral-Grip Lat Pulldown',muscle:'Back',sets:'3',reps:'10–12'},
  {name:'Reverse-Grip Lat Pulldown',muscle:'Back',sets:'3',reps:'10–12'},
  {name:'Single-Arm Lat Pulldown',muscle:'Back',sets:'3',reps:'10–12 each'},
  {name:'Seated Cable Row',muscle:'Back',sets:'4',reps:'10–12'},
  {name:'Wide-Grip Cable Row',muscle:'Back',sets:'3',reps:'10–12'},
  {name:'Close-Grip Cable Row',muscle:'Back',sets:'3',reps:'10–12'},
  {name:'Single-Arm Cable Row',muscle:'Back',sets:'3',reps:'10–12 each'},
  {name:'Kneeling Single-Arm Cable Row',muscle:'Back',sets:'3',reps:'12–15 each'},
  {name:'High-Cable Row',muscle:'Back',sets:'3',reps:'12–15'},
  {name:'Straight-Arm Pulldown',muscle:'Back',sets:'3',reps:'12–15'},
  {name:'Single-Arm Straight-Arm Pulldown',muscle:'Back',sets:'3',reps:'12–15 each'},
  {name:'Face Pull',muscle:'Back',sets:'3',reps:'15–20'},
  {name:'Rope Face Pull',muscle:'Back',sets:'3',reps:'15–20'},
  {name:'Barbell Row',muscle:'Back',sets:'4',reps:'8–10'},
  {name:'Pendlay Row',muscle:'Back',sets:'4',reps:'6–8'},
  {name:'Dumbbell Row',muscle:'Back',sets:'4',reps:'10–12'},
  {name:'Kroc Row',muscle:'Back',sets:'3',reps:'15–20'},
  {name:'Meadows Row',muscle:'Back',sets:'3',reps:'10–12'},
  {name:'T-Bar Row',muscle:'Back',sets:'4',reps:'8–10'},
  {name:'Chest-Supported Row',muscle:'Back',sets:'3',reps:'10–12'},
  {name:'Renegade Row',muscle:'Back',sets:'3',reps:'8–10 each'},
  {name:'Hyperextension',muscle:'Back',sets:'3',reps:'12–15'},
  {name:'Good Morning',muscle:'Back',sets:'3',reps:'10–12'},
  {name:'Deadlift',muscle:'Back',sets:'4',reps:'4–6'},
  {name:'Rack Pull',muscle:'Back',sets:'4',reps:'4–6'},
  {name:'Superman',muscle:'Back',sets:'3',reps:'15–20'},
  {name:'Cable Pull-Through',muscle:'Back',sets:'3',reps:'12–15'},
  // SHOULDERS
  {name:'Overhead Press (Barbell)',muscle:'Shoulders',sets:'4',reps:'6–8'},
  {name:'Dumbbell Shoulder Press',muscle:'Shoulders',sets:'4',reps:'10–12'},
  {name:'Arnold Press',muscle:'Shoulders',sets:'3',reps:'10–12'},
  {name:'Bradford Press',muscle:'Shoulders',sets:'3',reps:'10–12'},
  {name:'Push Press',muscle:'Shoulders',sets:'4',reps:'6–8'},
  {name:'Machine Shoulder Press',muscle:'Shoulders',sets:'3',reps:'10–12'},
  {name:'Lateral Raise',muscle:'Shoulders',sets:'4',reps:'15–20'},
  {name:'Cable Lateral Raise',muscle:'Shoulders',sets:'3',reps:'15–20'},
  {name:'Single-Arm Cable Lateral Raise',muscle:'Shoulders',sets:'3',reps:'15–20 each'},
  {name:'Lean-Away Cable Lateral Raise',muscle:'Shoulders',sets:'3',reps:'15–20 each'},
  {name:'Landmine Lateral Raise',muscle:'Shoulders',sets:'3',reps:'12–15'},
  {name:'Front Raise',muscle:'Shoulders',sets:'3',reps:'12–15'},
  {name:'Cable Front Raise',muscle:'Shoulders',sets:'3',reps:'12–15'},
  {name:'Single-Arm Cable Front Raise',muscle:'Shoulders',sets:'3',reps:'12–15 each'},
  {name:'Plate Front Raise',muscle:'Shoulders',sets:'3',reps:'12–15'},
  {name:'Rear Delt Fly',muscle:'Shoulders',sets:'4',reps:'15–20'},
  {name:'Cable Rear Delt Fly',muscle:'Shoulders',sets:'3',reps:'15–20'},
  {name:'Single-Arm Cable Rear Delt Fly',muscle:'Shoulders',sets:'3',reps:'15–20 each'},
  {name:'Kneeling Cable Rear Delt Fly',muscle:'Shoulders',sets:'3',reps:'15–20'},
  {name:'Reverse Pec Deck',muscle:'Shoulders',sets:'3',reps:'15–20'},
  {name:'Upright Row',muscle:'Shoulders',sets:'3',reps:'10–12'},
  {name:'Cable Upright Row',muscle:'Shoulders',sets:'3',reps:'12–15'},
  {name:'Cable Y-Raise',muscle:'Shoulders',sets:'3',reps:'15–20'},
  {name:'Cable W-Raise',muscle:'Shoulders',sets:'3',reps:'15–20'},
  {name:'Band Pull-Apart',muscle:'Shoulders',sets:'3',reps:'20–25'},
  // BICEPS
  {name:'Barbell Curl',muscle:'Biceps',sets:'4',reps:'10–12'},
  {name:'EZ-Bar Curl',muscle:'Biceps',sets:'4',reps:'10–12'},
  {name:'Dumbbell Curl',muscle:'Biceps',sets:'3',reps:'10–12'},
  {name:'Alternating Dumbbell Curl',muscle:'Biceps',sets:'3',reps:'10–12 each'},
  {name:'Seated Alternating Dumbbell Curl',muscle:'Biceps',sets:'3',reps:'10–12 each'},
  {name:'Incline Dumbbell Curl',muscle:'Biceps',sets:'3',reps:'10–12'},
  {name:'Hammer Curl',muscle:'Biceps',sets:'3',reps:'10–12'},
  {name:'Cross-Body Hammer Curl',muscle:'Biceps',sets:'3',reps:'12–15'},
  {name:'Cable Curl',muscle:'Biceps',sets:'3',reps:'12–15'},
  {name:'Low-Cable Curl',muscle:'Biceps',sets:'3',reps:'12–15'},
  {name:'High-Cable Curl',muscle:'Biceps',sets:'3',reps:'12–15'},
  {name:'Single-Arm Cable Curl',muscle:'Biceps',sets:'3',reps:'12–15 each'},
  {name:'Rope Cable Curl',muscle:'Biceps',sets:'3',reps:'12–15'},
  {name:'Bayesian Cable Curl',muscle:'Biceps',sets:'3',reps:'12–15'},
  {name:'Cable Drag Curl',muscle:'Biceps',sets:'3',reps:'12–15'},
  {name:'Preacher Curl',muscle:'Biceps',sets:'3',reps:'10–12'},
  {name:'EZ-Bar Preacher Curl',muscle:'Biceps',sets:'3',reps:'10–12'},
  {name:'Cable Preacher Curl',muscle:'Biceps',sets:'3',reps:'12–15'},
  {name:'Concentration Curl',muscle:'Biceps',sets:'3',reps:'12–15'},
  {name:'Reverse Curl',muscle:'Biceps',sets:'3',reps:'12–15'},
  {name:'Reverse Cable Curl',muscle:'Biceps',sets:'3',reps:'12–15'},
  {name:'Spider Curl',muscle:'Biceps',sets:'3',reps:'12–15'},
  {name:'Machine Curl',muscle:'Biceps',sets:'3',reps:'12–15'},
  {name:'Zottman Curl',muscle:'Biceps',sets:'3',reps:'10–12'},
  {name:'21s',muscle:'Biceps',sets:'3',reps:'21'},
  // TRICEPS
  {name:'Close-Grip Bench Press',muscle:'Triceps',sets:'4',reps:'8–10'},
  {name:'Skull Crusher',muscle:'Triceps',sets:'4',reps:'10–12'},
  {name:'EZ-Bar Skull Crusher',muscle:'Triceps',sets:'4',reps:'10–12'},
  {name:'Dumbbell Skull Crusher',muscle:'Triceps',sets:'3',reps:'10–12'},
  {name:'Tricep Pushdown (Cable)',muscle:'Triceps',sets:'4',reps:'12–15'},
  {name:'Rope Pushdown',muscle:'Triceps',sets:'3',reps:'12–15'},
  {name:'Straight-Bar Pushdown',muscle:'Triceps',sets:'3',reps:'12–15'},
  {name:'V-Bar Pushdown',muscle:'Triceps',sets:'3',reps:'12–15'},
  {name:'Single-Arm Cable Pushdown',muscle:'Triceps',sets:'3',reps:'12–15 each'},
  {name:'Reverse-Grip Cable Pushdown',muscle:'Triceps',sets:'3',reps:'12–15'},
  {name:'Overhead Tricep Extension',muscle:'Triceps',sets:'3',reps:'10–12'},
  {name:'Cable Overhead Tricep Extension',muscle:'Triceps',sets:'3',reps:'12–15'},
  {name:'Single-Arm Cable Overhead Extension',muscle:'Triceps',sets:'3',reps:'12–15 each'},
  {name:'Rope Overhead Extension',muscle:'Triceps',sets:'3',reps:'12–15'},
  {name:'Dumbbell Kickback',muscle:'Triceps',sets:'3',reps:'12–15'},
  {name:'Cable Kickback',muscle:'Triceps',sets:'3',reps:'12–15 each'},
  {name:'Single-Arm Cable Kickback',muscle:'Triceps',sets:'3',reps:'12–15 each'},
  {name:'Dips',muscle:'Triceps',sets:'3',reps:'10–15'},
  {name:'Bench Dip',muscle:'Triceps',sets:'3',reps:'12–15'},
  {name:'Machine Tricep Dip',muscle:'Triceps',sets:'3',reps:'10–12'},
  {name:'Rolling Tricep Extension',muscle:'Triceps',sets:'3',reps:'10–12'},
  {name:'JM Press',muscle:'Triceps',sets:'3',reps:'10–12'},
  {name:'Tate Press',muscle:'Triceps',sets:'3',reps:'10–12'},
  // LEGS - QUADS
  {name:'Barbell Back Squat',muscle:'Quads',sets:'4',reps:'6–8'},
  {name:'Front Squat',muscle:'Quads',sets:'4',reps:'6–8'},
  {name:'Goblet Squat',muscle:'Quads',sets:'3',reps:'12–15'},
  {name:'Smith Machine Squat',muscle:'Quads',sets:'4',reps:'10–12'},
  {name:'Landmine Squat',muscle:'Quads',sets:'3',reps:'12–15'},
  {name:'Hack Squat',muscle:'Quads',sets:'4',reps:'10–12'},
  {name:'Bulgarian Split Squat',muscle:'Quads',sets:'3',reps:'10–12'},
  {name:'Leg Press',muscle:'Quads',sets:'4',reps:'12–15'},
  {name:'Single-Leg Press',muscle:'Quads',sets:'3',reps:'12–15 each'},
  {name:'Leg Extension',muscle:'Quads',sets:'4',reps:'12–15'},
  {name:'Single-Leg Extension',muscle:'Quads',sets:'3',reps:'12–15 each'},
  {name:'Sissy Squat',muscle:'Quads',sets:'3',reps:'12–15'},
  {name:'Box Squat',muscle:'Quads',sets:'4',reps:'6–8'},
  {name:'Sumo Squat',muscle:'Quads',sets:'3',reps:'12–15'},
  {name:'Lunge',muscle:'Quads',sets:'3',reps:'12 each'},
  {name:'Reverse Lunge',muscle:'Quads',sets:'3',reps:'12 each'},
  {name:'Walking Lunge',muscle:'Quads',sets:'3',reps:'12 each'},
  {name:'Curtsy Lunge',muscle:'Quads',sets:'3',reps:'12 each'},
  {name:'Lateral Lunge',muscle:'Quads',sets:'3',reps:'10 each'},
  {name:'Step-Up',muscle:'Quads',sets:'3',reps:'12 each'},
  {name:'Cable Squat',muscle:'Quads',sets:'3',reps:'12–15'},
  // LEGS - HAMSTRINGS
  {name:'Romanian Deadlift',muscle:'Hamstrings',sets:'4',reps:'10–12'},
  {name:'Stiff-Leg Deadlift',muscle:'Hamstrings',sets:'4',reps:'10–12'},
  {name:'Single-Leg RDL',muscle:'Hamstrings',sets:'3',reps:'10 each'},
  {name:'Lying Leg Curl',muscle:'Hamstrings',sets:'4',reps:'10–12'},
  {name:'Seated Leg Curl',muscle:'Hamstrings',sets:'4',reps:'10–12'},
  {name:'Standing Leg Curl',muscle:'Hamstrings',sets:'3',reps:'12–15 each'},
  {name:'Single-Leg Lying Curl',muscle:'Hamstrings',sets:'3',reps:'10–12 each'},
  {name:'Nordic Curl',muscle:'Hamstrings',sets:'3',reps:'6–8'},
  {name:'Good Morning',muscle:'Hamstrings',sets:'3',reps:'10–12'},
  {name:'Cable Romanian Deadlift',muscle:'Hamstrings',sets:'3',reps:'10–12'},
  {name:'Cable Pull-Through',muscle:'Hamstrings',sets:'3',reps:'12–15'},
  {name:'Swiss Ball Leg Curl',muscle:'Hamstrings',sets:'3',reps:'10–12'},
  // LEGS - GLUTES
  {name:'Hip Thrust',muscle:'Glutes',sets:'4',reps:'10–12'},
  {name:'Smith Machine Hip Thrust',muscle:'Glutes',sets:'4',reps:'10–12'},
  {name:'Single-Leg Hip Thrust',muscle:'Glutes',sets:'3',reps:'10–12 each'},
  {name:'Barbell Glute Bridge',muscle:'Glutes',sets:'4',reps:'12–15'},
  {name:'Frog Pump',muscle:'Glutes',sets:'3',reps:'20–25'},
  {name:'Cable Glute Kickback',muscle:'Glutes',sets:'3',reps:'15 each'},
  {name:'Kneeling Cable Glute Kickback',muscle:'Glutes',sets:'3',reps:'15 each'},
  {name:'Cable Hip Extension',muscle:'Glutes',sets:'3',reps:'15 each'},
  {name:'Cable Hip Abduction',muscle:'Glutes',sets:'3',reps:'15 each'},
  {name:'Cable Hip Adduction',muscle:'Glutes',sets:'3',reps:'15 each'},
  {name:'Seated Hip Abduction',muscle:'Glutes',sets:'3',reps:'15–20'},
  {name:'Donkey Kick',muscle:'Glutes',sets:'3',reps:'15 each'},
  {name:'Sumo Deadlift',muscle:'Glutes',sets:'4',reps:'6–8'},
  {name:'Clamshell',muscle:'Glutes',sets:'3',reps:'20 each'},
  {name:'Lateral Band Walk',muscle:'Glutes',sets:'3',reps:'15 each'},
  {name:'Reverse Hyperextension',muscle:'Glutes',sets:'3',reps:'12–15'},
  // CALVES
  {name:'Standing Calf Raise',muscle:'Calves',sets:'4',reps:'15–20'},
  {name:'Seated Calf Raise',muscle:'Calves',sets:'4',reps:'15–20'},
  {name:'Smith Machine Calf Raise',muscle:'Calves',sets:'4',reps:'15–20'},
  {name:'Leg Press Calf Raise',muscle:'Calves',sets:'3',reps:'15–20'},
  {name:'Single-Leg Calf Raise',muscle:'Calves',sets:'3',reps:'15 each'},
  {name:'Donkey Calf Raise',muscle:'Calves',sets:'4',reps:'15–20'},
  {name:'Tibialis Raise',muscle:'Calves',sets:'3',reps:'15–20'},
  // CORE
  {name:'Plank',muscle:'Core',sets:'3',reps:'60 sec'},
  {name:'Side Plank',muscle:'Core',sets:'3',reps:'45 sec each'},
  {name:'Copenhagen Plank',muscle:'Core',sets:'3',reps:'30 sec each'},
  {name:'Ab Wheel Rollout',muscle:'Core',sets:'3',reps:'10–12'},
  {name:'Cable Crunch',muscle:'Core',sets:'4',reps:'12–15'},
  {name:'Kneeling Cable Crunch',muscle:'Core',sets:'3',reps:'15–20'},
  {name:'Standing Cable Crunch',muscle:'Core',sets:'3',reps:'12–15'},
  {name:'Hi-Lo Cable Woodchop',muscle:'Core',sets:'3',reps:'12 each'},
  {name:'Lo-Hi Cable Woodchop',muscle:'Core',sets:'3',reps:'12 each'},
  {name:'Cable Pallof Press',muscle:'Core',sets:'3',reps:'12 each'},
  {name:'Kneeling Cable Pallof Press',muscle:'Core',sets:'3',reps:'12 each'},
  {name:'Cable Oblique Crunch',muscle:'Core',sets:'3',reps:'12–15 each'},
  {name:'Cable Twist',muscle:'Core',sets:'3',reps:'12 each'},
  {name:'Tall Kneeling Cable Chop',muscle:'Core',sets:'3',reps:'12 each'},
  {name:'Hanging Leg Raise',muscle:'Core',sets:'3',reps:'12–15'},
  {name:'Hanging Knee Raise',muscle:'Core',sets:'3',reps:'15–20'},
  {name:'Decline Sit-Up',muscle:'Core',sets:'3',reps:'15–20'},
  {name:'Dragon Flag',muscle:'Core',sets:'3',reps:'6–8'},
  {name:'L-Sit Hold',muscle:'Core',sets:'3',reps:'20–30 sec'},
  {name:'Russian Twist',muscle:'Core',sets:'3',reps:'20–30'},
  {name:'Bicycle Crunch',muscle:'Core',sets:'3',reps:'20–30'},
  {name:'Reverse Crunch',muscle:'Core',sets:'3',reps:'15–20'},
  {name:'Dead Bug',muscle:'Core',sets:'3',reps:'10 each'},
  {name:'Pallof Press',muscle:'Core',sets:'3',reps:'12 each'},
  {name:'V-Up',muscle:'Core',sets:'3',reps:'12–15'},
  {name:'Hollow Body Hold',muscle:'Core',sets:'3',reps:'30–45 sec'},
  {name:'Stir the Pot',muscle:'Core',sets:'3',reps:'10 each'},
  {name:'Landmine Rotation',muscle:'Core',sets:'3',reps:'10 each'},
  {name:'Suitcase Carry',muscle:'Core',sets:'3',reps:'20 m each'},
  {name:'Woodchop',muscle:'Core',sets:'3',reps:'12 each'},
  {name:'Toe Touch Crunch',muscle:'Core',sets:'3',reps:'15–20'},
  {name:'Mountain Climber',muscle:'Core',sets:'3',reps:'20 each'},
  // CARDIO / CONDITIONING
  {name:'Treadmill Run',muscle:'Cardio',sets:'1',reps:'20–30 min'},
  {name:'Incline Treadmill Walk',muscle:'Cardio',sets:'1',reps:'20–30 min'},
  {name:'Stationary Bike',muscle:'Cardio',sets:'1',reps:'20–30 min'},
  {name:'Elliptical',muscle:'Cardio',sets:'1',reps:'20–30 min'},
  {name:'Rowing Machine',muscle:'Cardio',sets:'1',reps:'15–20 min'},
  {name:'Ski Erg',muscle:'Cardio',sets:'5',reps:'30 sec on/30 off'},
  {name:'Stairmaster',muscle:'Cardio',sets:'1',reps:'20 min'},
  {name:'Jacob\'s Ladder',muscle:'Cardio',sets:'1',reps:'15 min'},
  {name:'Jump Rope',muscle:'Cardio',sets:'5',reps:'2 min'},
  {name:'Burpee',muscle:'Cardio',sets:'4',reps:'10–15'},
  {name:'Box Jump',muscle:'Cardio',sets:'4',reps:'8–10'},
  {name:'Broad Jump',muscle:'Cardio',sets:'4',reps:'6–8'},
  {name:'Assault Bike',muscle:'Cardio',sets:'5',reps:'30 sec on/30 off'},
  {name:'Sled Push',muscle:'Cardio',sets:'4',reps:'20 m'},
  {name:'Sled Pull',muscle:'Cardio',sets:'4',reps:'20 m'},
  {name:'Farmer\'s Carry',muscle:'Cardio',sets:'4',reps:'30 m'},
  {name:'Battle Ropes',muscle:'Cardio',sets:'4',reps:'30 sec'},
  {name:'Kettlebell Swing',muscle:'Cardio',sets:'4',reps:'15–20'},
  {name:'Sprint Interval',muscle:'Cardio',sets:'8',reps:'20 sec on/40 off'},
  {name:'Jump Squat',muscle:'Cardio',sets:'4',reps:'12–15'},
  {name:'High Knees',muscle:'Cardio',sets:'3',reps:'30 sec'},
  {name:'Bear Crawl',muscle:'Cardio',sets:'3',reps:'20 m'},
  // FULL BODY / COMPOUND
  {name:'Deadlift',muscle:'Full Body',sets:'4',reps:'4–6'},
  {name:'Power Clean',muscle:'Full Body',sets:'4',reps:'4–6'},
  {name:'Hang Clean',muscle:'Full Body',sets:'4',reps:'4–6'},
  {name:'Clean & Press',muscle:'Full Body',sets:'4',reps:'4–6'},
  {name:'Snatch',muscle:'Full Body',sets:'4',reps:'3–5'},
  {name:'Thruster',muscle:'Full Body',sets:'4',reps:'8–10'},
  {name:'Turkish Get-Up',muscle:'Full Body',sets:'3',reps:'5 each'},
  {name:'Man Maker',muscle:'Full Body',sets:'3',reps:'8–10'},
  {name:'Devil Press',muscle:'Full Body',sets:'4',reps:'8–10'},
  {name:'Dumbbell Snatch',muscle:'Full Body',sets:'4',reps:'6 each'},
  {name:'Kettlebell Clean and Press',muscle:'Full Body',sets:'3',reps:'6–8 each'},
  {name:'Sandbag Clean',muscle:'Full Body',sets:'3',reps:'8–10'},
  {name:'Barbell Complex',muscle:'Full Body',sets:'3',reps:'6 each'},
  // MOBILITY — DYNAMIC WARM-UP
  {name:'Leg Swing (Front-Back)',muscle:'Mobility',sets:'2',reps:'15 each'},
  {name:'Leg Swing (Lateral)',muscle:'Mobility',sets:'2',reps:'15 each'},
  {name:'Hip Circle',muscle:'Mobility',sets:'2',reps:'10 each direction'},
  {name:'Arm Circle',muscle:'Mobility',sets:'2',reps:'15 each direction'},
  {name:'Shoulder Roll',muscle:'Mobility',sets:'2',reps:'10 each direction'},
  {name:'Neck Roll',muscle:'Mobility',sets:'2',reps:'5 each direction'},
  {name:'Inchworm',muscle:'Mobility',sets:'2',reps:'8–10'},
  {name:'Walkout',muscle:'Mobility',sets:'2',reps:'8–10'},
  {name:'World\'s Greatest Stretch',muscle:'Mobility',sets:'2',reps:'5 each side'},
  {name:'Spiderman Lunge',muscle:'Mobility',sets:'2',reps:'8 each'},
  {name:'Spiderman Lunge with Rotation',muscle:'Mobility',sets:'2',reps:'6 each'},
  {name:'Lateral Lunge Reach',muscle:'Mobility',sets:'2',reps:'8 each'},
  {name:'Reverse Lunge with Reach',muscle:'Mobility',sets:'2',reps:'8 each'},
  {name:'Hip Hinge Drill',muscle:'Mobility',sets:'3',reps:'10'},
  {name:'Squat to Stand',muscle:'Mobility',sets:'2',reps:'10'},
  {name:'Knee Hug Walk',muscle:'Mobility',sets:'2',reps:'10 each'},
  {name:'Ankle Walk',muscle:'Mobility',sets:'2',reps:'10 m'},
  // MOBILITY — STATIC STRETCHES
  {name:'Hip Flexor Stretch',muscle:'Mobility',sets:'2',reps:'45 sec each'},
  {name:'Couch Stretch',muscle:'Mobility',sets:'2',reps:'60 sec each'},
  {name:'Standing Quad Stretch',muscle:'Mobility',sets:'2',reps:'45 sec each'},
  {name:'Seated Hamstring Stretch',muscle:'Mobility',sets:'2',reps:'45 sec each'},
  {name:'Standing Hamstring Stretch',muscle:'Mobility',sets:'2',reps:'45 sec each'},
  {name:'Standing IT Band Stretch',muscle:'Mobility',sets:'2',reps:'45 sec each'},
  {name:'Butterfly Groin Stretch',muscle:'Mobility',sets:'2',reps:'60 sec'},
  {name:'Straddle Stretch',muscle:'Mobility',sets:'2',reps:'60 sec'},
  {name:'Pigeon Pose',muscle:'Mobility',sets:'2',reps:'60 sec each'},
  {name:'Half Pigeon',muscle:'Mobility',sets:'2',reps:'60 sec each'},
  {name:'Figure-4 Hip Stretch',muscle:'Mobility',sets:'2',reps:'45 sec each'},
  {name:'90/90 Hip Stretch',muscle:'Mobility',sets:'2',reps:'60 sec each'},
  {name:'90/90 Hip Rotation',muscle:'Mobility',sets:'2',reps:'10 each'},
  {name:'Supine Piriformis Stretch',muscle:'Mobility',sets:'2',reps:'45 sec each'},
  {name:'Lying Glute Stretch',muscle:'Mobility',sets:'2',reps:'45 sec each'},
  {name:'Calf Stretch (Wall)',muscle:'Mobility',sets:'2',reps:'45 sec each'},
  {name:'Soleus Stretch',muscle:'Mobility',sets:'2',reps:'45 sec each'},
  {name:'Ankle Circles',muscle:'Mobility',sets:'2',reps:'10 each direction'},
  {name:'Ankle Dorsiflexion Drill',muscle:'Mobility',sets:'2',reps:'10 each'},
  {name:'Cross-Body Shoulder Stretch',muscle:'Mobility',sets:'2',reps:'30 sec each'},
  {name:'Overhead Tricep Stretch',muscle:'Mobility',sets:'2',reps:'30 sec each'},
  {name:'Sleeper Stretch',muscle:'Mobility',sets:'2',reps:'30 sec each'},
  {name:'Doorway Chest Stretch',muscle:'Mobility',sets:'2',reps:'30 sec each'},
  {name:'Pec Minor Stretch',muscle:'Mobility',sets:'2',reps:'30 sec each'},
  {name:'Lat Stretch',muscle:'Mobility',sets:'2',reps:'30 sec each'},
  {name:'Child\'s Pose',muscle:'Mobility',sets:'2',reps:'60 sec'},
  {name:'Extended Child\'s Pose',muscle:'Mobility',sets:'2',reps:'60 sec'},
  {name:'Seated Spinal Twist',muscle:'Mobility',sets:'2',reps:'45 sec each'},
  {name:'Supine Spinal Twist',muscle:'Mobility',sets:'2',reps:'45 sec each'},
  {name:'Cat-Cow',muscle:'Mobility',sets:'2',reps:'10'},
  {name:'Cobra Stretch',muscle:'Mobility',sets:'2',reps:'30–45 sec'},
  {name:'Downward Dog',muscle:'Mobility',sets:'2',reps:'45–60 sec'},
  {name:'Upward Dog',muscle:'Mobility',sets:'2',reps:'30 sec'},
  {name:'Lizard Pose',muscle:'Mobility',sets:'2',reps:'45 sec each'},
  {name:'Low Lunge (Crescent Pose)',muscle:'Mobility',sets:'2',reps:'45 sec each'},
  {name:'Thoracic Rotation',muscle:'Mobility',sets:'2',reps:'10 each'},
  {name:'Thread the Needle',muscle:'Mobility',sets:'2',reps:'8 each'},
  {name:'Thoracic Extension over Roller',muscle:'Mobility',sets:'2',reps:'60 sec'},
  {name:'Wall Slide',muscle:'Mobility',sets:'3',reps:'10–12'},
  {name:'Wrist Circles',muscle:'Mobility',sets:'2',reps:'10 each direction'},
  {name:'Wrist Flexor Stretch',muscle:'Mobility',sets:'2',reps:'30 sec each'},
  {name:'Wrist Extensor Stretch',muscle:'Mobility',sets:'2',reps:'30 sec each'},
  // MOBILITY — YOGA
  {name:'Warrior I',muscle:'Mobility',sets:'2',reps:'45 sec each'},
  {name:'Warrior II',muscle:'Mobility',sets:'2',reps:'45 sec each'},
  {name:'Warrior III',muscle:'Mobility',sets:'2',reps:'30 sec each'},
  {name:'Reverse Warrior',muscle:'Mobility',sets:'2',reps:'30 sec each'},
  {name:'Triangle Pose',muscle:'Mobility',sets:'2',reps:'45 sec each'},
  {name:'Seated Forward Fold',muscle:'Mobility',sets:'2',reps:'60 sec'},
  {name:'Standing Forward Fold',muscle:'Mobility',sets:'2',reps:'45 sec'},
  {name:'Happy Baby',muscle:'Mobility',sets:'2',reps:'60 sec'},
  {name:'Frog Stretch',muscle:'Mobility',sets:'2',reps:'60 sec'},
  {name:'Reclined Butterfly',muscle:'Mobility',sets:'2',reps:'60 sec'},
  {name:'Bridge Pose',muscle:'Mobility',sets:'2',reps:'45 sec'},
  {name:'Puppy Pose',muscle:'Mobility',sets:'2',reps:'45 sec'},
  // MOBILITY — FOAM ROLLING
  {name:'Foam Roll Quads',muscle:'Mobility',sets:'1',reps:'60 sec each'},
  {name:'Foam Roll IT Band',muscle:'Mobility',sets:'1',reps:'60 sec each'},
  {name:'Foam Roll Hamstrings',muscle:'Mobility',sets:'1',reps:'60 sec each'},
  {name:'Foam Roll Glutes',muscle:'Mobility',sets:'1',reps:'60 sec each'},
  {name:'Foam Roll Calves',muscle:'Mobility',sets:'1',reps:'60 sec each'},
  {name:'Foam Roll Thoracic',muscle:'Mobility',sets:'1',reps:'60 sec'},
  {name:'Foam Roll Upper Back',muscle:'Mobility',sets:'1',reps:'60 sec'},
  {name:'Foam Roll Lats',muscle:'Mobility',sets:'1',reps:'45 sec each'},
  {name:'Foam Roll Adductors',muscle:'Mobility',sets:'1',reps:'60 sec each'},
  {name:'Foam Roll TFL',muscle:'Mobility',sets:'1',reps:'45 sec each'},
  {name:'Lacrosse Ball Pec Release',muscle:'Mobility',sets:'1',reps:'60 sec each'},
  {name:'Lacrosse Ball Glute Release',muscle:'Mobility',sets:'1',reps:'60 sec each'},
  {name:'Lacrosse Ball Foot Roll',muscle:'Mobility',sets:'1',reps:'60 sec each'},
  {name:'Lacrosse Ball Shoulder Release',muscle:'Mobility',sets:'1',reps:'60 sec each'},
  // MOBILITY — ACTIVATION DRILLS
  {name:'Bird Dog',muscle:'Mobility',sets:'3',reps:'10 each'},
  {name:'Dead Bug (Activation)',muscle:'Mobility',sets:'3',reps:'8 each'},
  {name:'Glute Bridge Hold',muscle:'Mobility',sets:'3',reps:'30 sec'},
  {name:'Clamshell (Activation)',muscle:'Mobility',sets:'2',reps:'15 each'},
  {name:'Banded Clamshell',muscle:'Mobility',sets:'2',reps:'15 each'},
  {name:'Banded Hip Abduction',muscle:'Mobility',sets:'2',reps:'15 each'},
  {name:'Banded Monster Walk',muscle:'Mobility',sets:'2',reps:'10 each direction'},
  {name:'Banded Lateral Walk',muscle:'Mobility',sets:'2',reps:'10 each direction'},
  {name:'Band Pull-Apart',muscle:'Mobility',sets:'3',reps:'15–20'},
  {name:'Banded Shoulder Distraction',muscle:'Mobility',sets:'2',reps:'60 sec each'},
  {name:'Wall Hip Flexor Mobilization',muscle:'Mobility',sets:'2',reps:'10 each'},
  {name:'Half-Kneeling Hip Flexor Rock',muscle:'Mobility',sets:'2',reps:'10 each'},
  {name:'Deep Squat Hold',muscle:'Mobility',sets:'3',reps:'30–60 sec'},
  {name:'Tall Kneeling Hip Flexion',muscle:'Mobility',sets:'2',reps:'10 each'},
  {name:'Prone Hip Extension',muscle:'Mobility',sets:'2',reps:'10 each'},
  {name:'Side-Lying Hip Rotation',muscle:'Mobility',sets:'2',reps:'10 each'},
  // HOIST — CHEST
  {name:'Hoist ROC-IT Chest Press (RS-1301)',muscle:'Chest',sets:'4',reps:'10–12'},
  {name:'Hoist ROC-IT Incline Chest Press (RS-1303)',muscle:'Chest',sets:'4',reps:'10–12'},
  {name:'Hoist ROC-IT Decline Chest Press (RS-1302)',muscle:'Chest',sets:'3',reps:'10–12'},
  {name:'Hoist ROC-IT Pec Fly (RS-1502)',muscle:'Chest',sets:'3',reps:'12–15'},
  {name:'Hoist HD Iso-Lateral Chest Press (HD-3000)',muscle:'Chest',sets:'4',reps:'8–12'},
  {name:'Hoist HD Iso-Lateral Incline Press (HD-3100)',muscle:'Chest',sets:'4',reps:'8–12'},
  {name:'Hoist HD Iso-Lateral Decline Press (HD-3200)',muscle:'Chest',sets:'3',reps:'10–12'},
  {name:'Hoist CL Pec Fly (CL-3601)',muscle:'Chest',sets:'3',reps:'12–15'},
  // HOIST — BACK
  {name:'Hoist ROC-IT Lat Pulldown (RS-1401)',muscle:'Back',sets:'4',reps:'10–12'},
  {name:'Hoist ROC-IT Mid Row (RS-1403)',muscle:'Back',sets:'4',reps:'10–12'},
  {name:'Hoist ROC-IT Low Row (RS-1402)',muscle:'Back',sets:'3',reps:'10–12'},
  {name:'Hoist ROC-IT High Row (RS-1404)',muscle:'Back',sets:'3',reps:'10–12'},
  {name:'Hoist ROC-IT Pullover (RS-1405)',muscle:'Back',sets:'3',reps:'10–12'},
  {name:'Hoist HD Iso-Lateral Front Pulldown (HD-3200)',muscle:'Back',sets:'4',reps:'10–12'},
  {name:'Hoist HD Iso-Lateral Mid Row (HD-3300)',muscle:'Back',sets:'4',reps:'10–12'},
  {name:'Hoist HD Iso-Lateral Low Row (HD-3400)',muscle:'Back',sets:'3',reps:'10–12'},
  // HOIST — SHOULDERS
  {name:'Hoist ROC-IT Shoulder Press (RS-1501)',muscle:'Shoulders',sets:'4',reps:'10–12'},
  {name:'Hoist ROC-IT Lateral Raise (RS-1502)',muscle:'Shoulders',sets:'3',reps:'12–15'},
  {name:'Hoist ROC-IT Rear Delt Fly (RS-1503)',muscle:'Shoulders',sets:'3',reps:'12–15'},
  {name:'Hoist HD Iso-Lateral Shoulder Press (HD-3500)',muscle:'Shoulders',sets:'4',reps:'8–10'},
  // HOIST — ARMS
  {name:'Hoist ROC-IT Bicep Curl (RS-1601)',muscle:'Biceps',sets:'3',reps:'12–15'},
  {name:'Hoist ROC-IT Tricep Extension (RS-1602)',muscle:'Triceps',sets:'3',reps:'12–15'},
  {name:'Hoist HD Iso-Lateral Bicep Curl (HD-3700)',muscle:'Biceps',sets:'3',reps:'10–12'},
  {name:'Hoist HD Iso-Lateral Tricep Extension (HD-3800)',muscle:'Triceps',sets:'3',reps:'10–12'},
  // HOIST — LEGS
  {name:'Hoist ROC-IT Leg Extension (RS-1402)',muscle:'Quads',sets:'4',reps:'12–15'},
  {name:'Hoist ROC-IT Prone Leg Curl (RS-1408)',muscle:'Hamstrings',sets:'4',reps:'10–12'},
  {name:'Hoist ROC-IT Seated Leg Curl (RS-1407)',muscle:'Hamstrings',sets:'4',reps:'10–12'},
  {name:'Hoist ROC-IT Leg Press (RS-1403)',muscle:'Quads',sets:'4',reps:'10–12'},
  {name:'Hoist HD Iso-Lateral Leg Press (HD-3600)',muscle:'Quads',sets:'4',reps:'10–12'},
  {name:'Hoist CL Leg Press (CL-3401)',muscle:'Quads',sets:'4',reps:'10–12'},
  {name:'Hoist CL 45° Leg Press (CL-3403)',muscle:'Quads',sets:'4',reps:'10–12'},
  {name:'Hoist CL Hack Squat (CL-3402)',muscle:'Quads',sets:'4',reps:'10–12'},
  {name:'Hoist CL Calf Raise (CL-3501)',muscle:'Calves',sets:'4',reps:'15–20'},
  {name:'Hoist CL Seated Calf Raise (CL-3502)',muscle:'Calves',sets:'4',reps:'15–20'},
  // HOIST — GLUTES / HIPS
  {name:'Hoist ROC-IT Glute Master (RS-1412)',muscle:'Glutes',sets:'4',reps:'10–12 each'},
  {name:'Hoist ROC-IT Hip Abductor (RS-1409)',muscle:'Glutes',sets:'3',reps:'15–20'},
  {name:'Hoist ROC-IT Hip Adductor (RS-1410)',muscle:'Glutes',sets:'3',reps:'15–20'},
  {name:'Hoist HD Iso-Lateral Glute Drive (HD-3900)',muscle:'Glutes',sets:'4',reps:'10–12 each'},
  // HOIST — CORE
  {name:'Hoist ROC-IT Abdominal Crunch (RS-1601)',muscle:'Core',sets:'3',reps:'15–20'},
  {name:'Hoist ROC-IT Rotary Torso (RS-1602)',muscle:'Core',sets:'3',reps:'12–15 each'},
  // HOIST — CABLES / FUNCTIONAL
  {name:'Hoist CF-3461 Functional Trainer Cable Row',muscle:'Back',sets:'3',reps:'10–12'},
  {name:'Hoist CF-3461 Functional Trainer Cable Press',muscle:'Chest',sets:'3',reps:'10–12'},
  {name:'Hoist CF-3461 Functional Trainer Cable Fly',muscle:'Chest',sets:'3',reps:'12–15'},
  {name:'Hoist CF-3461 Functional Trainer Single-Arm Row',muscle:'Back',sets:'3',reps:'10–12 each'},
  {name:'Hoist Mi6 Cable Crossover',muscle:'Chest',sets:'3',reps:'12–15'},
  {name:'Hoist Mi6 Single-Arm Cable Press',muscle:'Chest',sets:'3',reps:'10–12 each'},
  {name:'Hoist Mi7 Smith Squat',muscle:'Quads',sets:'4',reps:'8–10'},
  {name:'Hoist Mi7 Smith Bench Press',muscle:'Chest',sets:'4',reps:'8–10'},
  {name:'Hoist Mi7 Smith Shoulder Press',muscle:'Shoulders',sets:'3',reps:'10–12'},
  // ADDITIONAL — CHEST
  {name:'Svend Press',muscle:'Chest',sets:'3',reps:'12–15'},
  {name:'Floor Press',muscle:'Chest',sets:'4',reps:'8–10'},
  {name:'Spoto Press',muscle:'Chest',sets:'4',reps:'6–8'},
  {name:'Larsen Press',muscle:'Chest',sets:'3',reps:'8–10'},
  {name:'Plate Pinch Press',muscle:'Chest',sets:'3',reps:'12–15'},
  {name:'Dumbbell Squeeze Press',muscle:'Chest',sets:'3',reps:'12–15'},
  // ADDITIONAL — BACK
  {name:'Trap Bar Deadlift',muscle:'Back',sets:'4',reps:'5–8'},
  {name:'Trap Bar Row',muscle:'Back',sets:'3',reps:'8–10'},
  {name:'Seal Row',muscle:'Back',sets:'3',reps:'8–10'},
  {name:'Helms Row',muscle:'Back',sets:'3',reps:'10–12'},
  {name:'Yates Row',muscle:'Back',sets:'4',reps:'8–10'},
  {name:'Inverted Row',muscle:'Back',sets:'3',reps:'10–15'},
  {name:'Snatch-Grip Deadlift',muscle:'Back',sets:'4',reps:'5'},
  {name:'Deficit Deadlift',muscle:'Back',sets:'4',reps:'5'},
  // ADDITIONAL — SHOULDERS
  {name:'Seated Dumbbell Press',muscle:'Shoulders',sets:'4',reps:'8–10'},
  {name:'Z Press',muscle:'Shoulders',sets:'3',reps:'8–10'},
  {name:'Viking Press',muscle:'Shoulders',sets:'4',reps:'8–10'},
  {name:'Bottoms-Up Kettlebell Press',muscle:'Shoulders',sets:'3',reps:'6–8 each'},
  {name:'Half-Kneeling Landmine Press',muscle:'Shoulders',sets:'3',reps:'8–10 each'},
  {name:'Cuban Press',muscle:'Shoulders',sets:'3',reps:'10–12'},
  {name:'Bus Driver',muscle:'Shoulders',sets:'3',reps:'12–15'},
  // ADDITIONAL — ARMS
  {name:'Drag Curl',muscle:'Biceps',sets:'3',reps:'10–12'},
  {name:'Waiter Curl',muscle:'Biceps',sets:'3',reps:'12–15'},
  {name:'Pinwheel Curl',muscle:'Biceps',sets:'3',reps:'10–12 each'},
  {name:'Concentration Hammer Curl',muscle:'Biceps',sets:'3',reps:'12–15 each'},
  {name:'California Press',muscle:'Triceps',sets:'3',reps:'10–12'},
  {name:'Diamond Push-Up (Triceps)',muscle:'Triceps',sets:'3',reps:'10–15'},
  // ADDITIONAL — LEGS
  {name:'Pause Squat',muscle:'Quads',sets:'4',reps:'5–6'},
  {name:'Tempo Squat',muscle:'Quads',sets:'3',reps:'8'},
  {name:'1.5 Rep Squat',muscle:'Quads',sets:'3',reps:'8'},
  {name:'Belt Squat',muscle:'Quads',sets:'4',reps:'10–12'},
  {name:'Pendulum Squat',muscle:'Quads',sets:'4',reps:'10–12'},
  {name:'Cyclist Squat',muscle:'Quads',sets:'3',reps:'12–15'},
  {name:'ATG Split Squat',muscle:'Quads',sets:'3',reps:'10 each'},
  {name:'Heels-Elevated Goblet Squat',muscle:'Quads',sets:'3',reps:'12–15'},
  {name:'Reverse Nordic Curl',muscle:'Quads',sets:'3',reps:'8–10'},
  {name:'Razor Curl',muscle:'Hamstrings',sets:'3',reps:'8–10'},
  {name:'Glute-Ham Raise',muscle:'Hamstrings',sets:'3',reps:'8–10'},
  {name:'Stiff-Leg Single-Leg RDL',muscle:'Hamstrings',sets:'3',reps:'10 each'},
  {name:'B-Stance RDL',muscle:'Hamstrings',sets:'3',reps:'10 each'},
  {name:'B-Stance Hip Thrust',muscle:'Glutes',sets:'3',reps:'10 each'},
  {name:'Pendulum Kickback',muscle:'Glutes',sets:'3',reps:'12–15 each'},
  {name:'45° Hip Extension',muscle:'Glutes',sets:'3',reps:'12–15'},
  // ADDITIONAL — CARDIO / ATHLETIC
  {name:'Air Bike Sprint',muscle:'Cardio',sets:'8',reps:'15 sec on/45 off'},
  {name:'Tabata Squats',muscle:'Cardio',sets:'8',reps:'20 sec on/10 off'},
  {name:'Tabata Push-Ups',muscle:'Cardio',sets:'8',reps:'20 sec on/10 off'},
  {name:'Shuttle Run',muscle:'Cardio',sets:'5',reps:'30 m'},
  {name:'Lateral Bound',muscle:'Cardio',sets:'3',reps:'10 each'},
  {name:'Depth Jump',muscle:'Cardio',sets:'4',reps:'5'},
  {name:'Medicine Ball Slam',muscle:'Cardio',sets:'4',reps:'10–12'},
  {name:'Medicine Ball Throw',muscle:'Cardio',sets:'4',reps:'8–10'},
  // ADDITIONAL — CORE
  {name:'Hollow Rock',muscle:'Core',sets:'3',reps:'15–20'},
  {name:'GHD Sit-Up',muscle:'Core',sets:'3',reps:'10–12'},
  {name:'Toes-to-Bar',muscle:'Core',sets:'3',reps:'8–12'},
  {name:'Windshield Wiper',muscle:'Core',sets:'3',reps:'8 each'},
  {name:'Ab Wheel Standing Rollout',muscle:'Core',sets:'3',reps:'5–8'},
];

/* ── EXERCISE FORM TIPS ──────────────────────────────────────── */
const EXERCISE_TIPS = {
  'Barbell Bench Press':       'Retract & depress shoulder blades. Keep a slight arch. Bar touches 1–2 cm below nipples. Drive feet into floor and push the bar away from you.',
  'Dumbbell Bench Press':      'Lower dumbbells until elbows are at 90°. Control the descent. Press up and slightly inward — don\'t let the dumbbells drift apart.',
  'Incline Barbell Press':     'Set bench to 30–45°. Bar should touch upper chest. Keep elbows at ~45° to body to protect shoulders.',
  'Incline Dumbbell Press':    'Control the stretch at the bottom. Elbows at ~45°. Focus on squeezing chest at the top rather than just straightening arms.',
  'Barbell Back Squat':        'Brace core 360°, push knees out over toes. Hip crease breaks parallel. Keep chest up and weight in mid-foot. Breathe before descent.',
  'Front Squat':               'Elbows high and forward — don\'t let them drop. Keep torso upright. Knees track over toes. Use a clean grip or cross-arm grip.',
  'Romanian Deadlift':         'Hinge at hips, not waist. Keep bar close to legs. Feel the hamstring stretch — stop when lower back starts to round. Slight knee bend.',
  'Deadlift':                  'Neutral spine, bar over mid-foot. Pull slack out before lifting. Drive floor away from you. Lock hips and shoulders out together.',
  'Overhead Press (Barbell)':  'Bar starts at collarbone. Press straight up, head moves back to allow bar to pass. Lock out overhead with ribs down — don\'t flare.',
  'Pull-Up':                   'Full hang at bottom. Pull elbows to hips — think about bending the bar. Chin clears bar at top. Avoid kipping unless programmed.',
  'Lat Pulldown':              'Lean slightly back. Pull bar to upper chest — lead with elbows. Squeeze lats at bottom. Controlled return to full stretch.',
  'Barbell Row':               'Hinge to ~45°. Bar contacts lower chest. Lead with elbows, not hands. Hold 1 second squeeze at top. Neutral spine throughout.',
  'Dumbbell Row':              'Supported with hand/knee on bench. Pull elbow straight back and up. Keep hips square. Full stretch at bottom, hard squeeze at top.',
  'Hip Thrust':                'Shoulders on bench, feet flat. Drive through heels, squeeze glutes at top. Full hip extension — don\'t hyperextend lower back.',
  'Barbell Curl':              'Elbows pinned to sides. Full ROM — full extension at bottom. Supinate wrist slightly at top. Avoid swinging or using momentum.',
  'Skull Crusher':             'Keep elbows pointing at the ceiling. Lower bar to just above forehead. Press back up without flaring elbows. Control the negative.',
  'Tricep Pushdown (Cable)':   'Elbows locked at sides. Press down to full elbow extension. Squeeze triceps at bottom. Slow controlled return.',
  'Lateral Raise':             'Slight bend in elbows. Lead with elbows, not hands. Stop at shoulder height. Lower slowly — the negative builds more muscle.',
  'Leg Press':                 'Feet hip-width, mid-platform. Lower until knees reach ~90°. Don\'t let lower back peel off pad. Drive through mid-foot, not toes.',
  'Leg Extension':             'Full extension at top, hold 1s. Control the descent. Don\'t use momentum. If knee hurts, reduce range of motion.',
  'Lying Leg Curl':            'Hips stay flat on pad. Full extension at bottom. Curl until heels touch glutes. Squeeze at top. Don\'t lift hips.',
  'Bulgarian Split Squat':     'Back foot elevated, not too high. Front shin should stay nearly vertical. Lower until back knee nearly touches floor. Drive through front heel.',
  'Plank':                     'Neutral spine — don\'t pike hips or sag lower back. Squeeze glutes and quads. Breathe steadily. Think about pulling elbows toward toes.',
  'Ab Wheel Rollout':          'Start from knees. Brace core hard before rolling. Extend until back is flat — stop before hips drop. Pull back using abs, not back.',
  'Face Pull':                 'Pull to nose/forehead height, not chin. Elbows flare high and wide. External rotate — hands end behind ears. Key for shoulder health.',
  'Arnold Press':              'Start palms facing you, press overhead while rotating palms out. Full ROM. Don\'t rush the rotation.',
  'Good Morning':              'Bar on traps, hinge at hips with soft knees. Stop when hamstrings are fully stretched. Keep back flat — this is a mobility movement.',
};

let _exTipTimer = null;
function _getExName(el) {
  // Get exercise name from element — strip the "(alt)" span text if present
  return (el?.firstChild?.nodeType === 3 ? el.firstChild.textContent : el?.textContent || '').replace(/\(alt\)/g,'').trim();
}
function exTipStart(el) {
  exTipCancel();
  const name = _getExName(el);
  _exTipTimer = setTimeout(() => exTipShowPopup(el, name), 500);
}
function exTipCancel() {
  if (_exTipTimer) { clearTimeout(_exTipTimer); _exTipTimer = null; }
}
function exTipShowPopup(el, name) {
  if (!name) name = _getExName(el);
  exTipCancel();
  // Find closest tip key
  const tipEntry = Object.entries(EXERCISE_TIPS).find(([k]) => name.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(name.toLowerCase().split(' ').slice(0,2).join(' ')));
  const tipText = tipEntry ? tipEntry[1] : null;
  if (!tipText) return; // No tip — don't show empty popup
  const existing = document.getElementById('exTipPopup');
  if (existing) existing.remove();
  const popup = document.createElement('div');
  popup.id = 'exTipPopup';
  popup.className = 'form-tip-popup';
  // Position near element
  let topPx = 200, leftPx = 16;
  try {
    const rect = typeof el.getBoundingClientRect === 'function' ? el.getBoundingClientRect() : {};
    topPx = Math.min((rect.top || 200) + window.scrollY - 10, window.innerHeight - 220);
    leftPx = Math.max(16, Math.min((rect.left || 16), window.innerWidth - 320));
  } catch(_) {}
  popup.style.cssText = `top:${topPx}px;left:${leftPx}px;`;
  popup.innerHTML = `<div class="form-tip-ex">📋 Form Tip</div>
    <div style="font-size:11px;font-weight:600;margin-bottom:6px">${esc(name)}</div>
    <div class="form-tip-body">${esc(tipText)}</div>
    <span class="form-tip-close" onclick="document.getElementById('exTipPopup')?.remove()">Dismiss ×</span>`;
  document.body.appendChild(popup);
  // Backdrop tap to close
  const _tipBackdrop = document.createElement('div');
  _tipBackdrop.style.cssText = 'position:fixed;inset:0;z-index:3099;';
  _tipBackdrop.id = 'exTipBackdrop';
  _tipBackdrop.onclick = () => { popup.remove(); _tipBackdrop.remove(); };
  document.body.appendChild(_tipBackdrop);
  setTimeout(() => { if (document.getElementById('exTipPopup') === popup) { popup.remove(); _tipBackdrop.remove(); } }, 6000);
}

let _signupState = { plan: 'blueprint' };
function openSignup() {
  const existing = document.getElementById('signupModal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'signupModal';
  modal.className = 'signup-modal-wrap';
  modal.innerHTML = `<div class="signup-modal">
    <div class="signup-modal-title">Start Your Program</div>
    <div class="signup-modal-sub">// Fill in your details and choose a plan</div>
    <div class="ob-field" style="margin-bottom:10px">
      <label class="ob-label">Full Name *</label>
      <input class="ob-input" id="su-name" type="text" placeholder="e.g. Alex Johnson">
    </div>
    <div class="ob-field" style="margin-bottom:10px">
      <label class="ob-label">Email *</label>
      <input class="ob-input" id="su-email" type="email" placeholder="alex@email.com">
    </div>
    <div class="ob-input-row" style="margin-bottom:10px">
      <div class="ob-field">
        <label class="ob-label">Phone (optional)</label>
        <input class="ob-input" id="su-phone" type="tel" placeholder="+1 555 000 0000">
      </div>
      <div class="ob-field">
        <label class="ob-label">Age</label>
        <input class="ob-input" id="su-age" type="number" min="16" max="80" placeholder="28">
      </div>
    </div>
    <div class="ob-field" style="margin-bottom:16px">
      <label class="ob-label">Your Primary Goal</label>
      <select class="ob-select" id="su-goal">
        <option value="lose_weight">Lose weight</option>
        <option value="build_muscle">Build muscle</option>
        <option value="get_fit">Get fit & healthy</option>
        <option value="sport">Sport performance</option>
        <option value="other">Other</option>
      </select>
    </div>
    <div style="font-family:'Geist Mono',monospace;font-size:9px;letter-spacing:1px;color:var(--muted);margin-bottom:10px;text-transform:uppercase">Choose Your Plan</div>
    <div class="signup-plan-grid" id="suPlans">
      ${SIGNUP_PLANS.map(p => `
        <div class="signup-plan-card${p.id===_signupState.plan?' selected':''}${p.featured?' signup-plan-featured':''}" onclick="selectSignupPlan('${p.id}')">
          ${p.featured ? '<div style="font-family:\'Geist Mono\',monospace;font-size:8px;letter-spacing:2px;color:#3B9EFF;margin-bottom:6px;text-transform:uppercase">★ Best Value</div>' : ''}
          <div class="signup-plan-price">${p.price}<span style="font-size:12px;color:var(--muted)">${p.per}</span></div>
          <div class="signup-plan-name">${p.name}</div>
          <div class="signup-plan-desc">${p.desc}</div>
        </div>`).join('')}
    </div>
    <div style="font-family:'Geist Mono',monospace;font-size:9px;color:var(--muted);margin-bottom:4px;text-align:center">Secure payment via Stripe · Cancel anytime</div>
    <button class="signup-pay-btn" id="suPayBtn" onclick="submitSignup()">Continue to Payment →</button>
    <button class="ob-back-btn" style="width:100%;margin-top:10px" onclick="document.getElementById('signupModal').remove()">Cancel</button>
  </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}
function selectSignupPlan(id) {
  _signupState.plan = id;
  document.querySelectorAll('.signup-plan-card').forEach(el => el.classList.remove('selected'));
  document.querySelectorAll('.signup-plan-card').forEach((el, i) => {
    if (SIGNUP_PLANS[i].id === id) el.classList.add('selected');
  });
}
async function submitSignup() {
  const name  = document.getElementById('su-name')?.value?.trim();
  const email = document.getElementById('su-email')?.value?.trim();
  const phone = document.getElementById('su-phone')?.value?.trim() || '';
  const age   = document.getElementById('su-age')?.value?.trim() || '';
  const goal  = document.getElementById('su-goal')?.value || '';
  const plan  = _signupState.plan;
  if (!name) { document.getElementById('su-name').style.borderColor='#e74c3c'; return; }
  if (!email || !email.includes('@')) { document.getElementById('su-email').style.borderColor='#e74c3c'; return; }
  const btn = document.getElementById('suPayBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }
  // Save lead to Supabase signups table
  const lead = { id: 'lead_'+Date.now(), name, email, phone, age, goal, plan, created_at: new Date().toISOString(), converted: false };
  const existing = getLS('signups', []);
  existing.push(lead);
  localStorage.setItem('signups', JSON.stringify(existing));
  // Also push to Supabase
  try { await sbUpsert('signups', lead); } catch(e) {}
  document.getElementById('signupModal')?.remove();
  // Redirect to Stripe payment link
  const link = STRIPE_LINKS[plan];
  if (link && !link.includes('test_')) {
    window.open(link + '?prefilled_email=' + encodeURIComponent(email) + '&client_reference_id=' + encodeURIComponent(name), '_blank');
  } else {
    showFitToast('Application submitted! Your coach will be in touch.');
  }
}

/* ── LEADS PANEL (coach) ─────────────────────────────────────── */
function openLeads() {
  const existing = document.getElementById('leadsModal');
  if (existing) existing.remove();
  const leads = getLS('signups', []);
  const modal = document.createElement('div');
  modal.id = 'leadsModal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:4000;background:rgba(0,0,0,.8);display:flex;align-items:flex-end;justify-content:center';
  const leadsHtml = leads.length === 0
    ? `<div style="font-family:'Geist Mono',monospace;font-size:11px;color:var(--muted);text-align:center;padding:30px">No signups yet</div>`
    : leads.slice().reverse().map((l,i) => {
        const plan = SIGNUP_PLANS.find(p => p.id === l.plan) || {};
        return `<div class="lead-card">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div>
              <div class="lead-name">${esc(l.name)}</div>
              <div class="lead-meta">${esc(l.email)}${l.phone?' · '+esc(l.phone):''}${l.age?' · Age '+l.age:''}</div>
              <div class="lead-meta" style="margin-top:2px">Goal: ${(l.goal||'').replace(/_/g,' ')}</div>
              <div class="lead-plan">${plan.name||l.plan} ${plan.price||''}</div>
            </div>
            <div style="text-align:right">
              <div style="font-family:'Geist Mono',monospace;font-size:8px;color:var(--muted)">${new Date(l.created_at).toLocaleDateString('en',{month:'short',day:'numeric'})}</div>
              ${l.converted ? '<div style="font-family:\'Geist Mono\',monospace;font-size:8px;color:#2ecc71;margin-top:4px">✓ Converted</div>' : ''}
            </div>
          </div>
          ${!l.converted ? `<div style="display:flex;gap:8px;margin-top:10px">
            <a href="mailto:${esc(l.email)}?subject=Your Fitness Program Application&body=Hi ${esc(l.name)},%0A%0AThanks for signing up! Let's get you started." class="fit-log-btn" style="flex:1;text-align:center;text-decoration:none;font-size:11px;padding:8px">📧 Email</a>
            <button class="fit-log-btn" style="flex:1;background:rgba(46,204,113,.1);color:#2ecc71;border:1px solid #2ecc71;font-size:11px;padding:8px" onclick="convertLead(${leads.length-1-i})">✓ Convert to Client</button>
          </div>` : ''}
        </div>`;
      }).join('');
  modal.innerHTML = `<div style="background:var(--surface);border-radius:20px 20px 0 0;padding:24px;width:100%;max-width:540px;max-height:85vh;overflow-y:auto">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <div style="font-family:var(--display);font-weight:700;font-size:24px;letter-spacing:2px;color:#3B9EFF">📥 Signup Leads</div>
      <button class="ob-back-btn" onclick="document.getElementById('leadsModal').remove()">Close</button>
    </div>
    ${leadsHtml}
  </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}
function convertLead(idx) {
  const leads = getLS('signups', []);
  const reversed = leads.slice().reverse();
  const lead = reversed[idx];
  if (!lead) return;
  leads[leads.findIndex(l => l.id === lead.id)].converted = true;
  localStorage.setItem('signups', JSON.stringify(leads));
  document.getElementById('leadsModal')?.remove();
  // Pre-fill onboarding with lead data
  startOnboarding();
  setTimeout(() => {
    const nameEl = document.getElementById('ob-name');
    const emailEl = document.getElementById('ob-email');
    if (nameEl) { nameEl.value = lead.name; AppState.obState.name = lead.name; }
    if (emailEl) { emailEl.value = lead.email; AppState.obState.email = lead.email; }
  }, 200);
  showFitToast('Lead loaded into onboarding');
}

/* ── SCHEDULE DRAG & DROP ───────────────────────────────────── */
let _schedWasDragged = false;
const _schedDrag = { src: null, cid: null };

function schedDragStart(e, idx, cid) {
  _schedDrag.src = idx; _schedDrag.cid = cid;
  e.dataTransfer.effectAllowed = 'move';
  setTimeout(() => e.target.classList.add('sched-dragging'), 0);
}
function schedDragOver(e, idx) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  document.querySelectorAll('.wk.sched-over').forEach(el => el.classList.remove('sched-over'));
  e.currentTarget.classList.add('sched-over');
}
function schedDragLeave(e) { e.currentTarget.classList.remove('sched-over'); }
function schedDragEnd(e) {
  document.querySelectorAll('.wk').forEach(el => { el.classList.remove('sched-over'); el.classList.remove('sched-dragging'); });
}
function schedDrop(e, idx, cid) {
  e.preventDefault();
  schedDragEnd(e);
  if (_schedDrag.src === null || _schedDrag.src === idx) { _schedDrag.src = null; return; }
  reorderSchedule(cid, _schedDrag.src, idx);
  _schedDrag.src = null;
}

// Touch drag for mobile
const _schedTouch = { src: null, cid: null };
function schedTouchStart(e, idx, cid) {
  _schedTouch.src = idx; _schedTouch.cid = cid;
  e.currentTarget.classList.add('sched-dragging');
}
function schedTouchMove(e) {
  e.preventDefault();
  const touch = e.touches[0];
  const el = document.elementFromPoint(touch.clientX, touch.clientY);
  const wkEl = el?.closest('.wk[data-sched-idx]');
  document.querySelectorAll('.wk.sched-over').forEach(w => w.classList.remove('sched-over'));
  if (wkEl) wkEl.classList.add('sched-over');
}
function schedTouchEnd(e, idx, cid) {
  const touch = e.changedTouches[0];
  const el = document.elementFromPoint(touch.clientX, touch.clientY);
  const wkEl = el?.closest('.wk[data-sched-idx]');
  document.querySelectorAll('.wk').forEach(w => { w.classList.remove('sched-over'); w.classList.remove('sched-dragging'); });
  if (wkEl && _schedTouch.src !== null) {
    const targetIdx = parseInt(wkEl.dataset.schedIdx);
    if (!isNaN(targetIdx) && targetIdx !== _schedTouch.src) reorderSchedule(cid, _schedTouch.src, targetIdx);
  }
  _schedTouch.src = null;
}

function reorderSchedule(cid, fromIdx, toIdx) {
  const clients = getAllClients();
  const c = clients.find(cl => cl.id === cid);
  if (!c?.data?.schedule?.days) return;
  const DAY_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const FULL_DAY_NAMES = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

  const days = [...c.data.schedule.days];

  // Snapshot training-day titles BEFORE reorder so we can match workouts.days entries
  const origTrainingTitles = days
    .filter(d => d.type === 'wk-a' || d.type === 'wk-card')
    .map(d => d.title);

  const [moved] = days.splice(fromIdx, 1);
  days.splice(toIdx, 0, moved);

  // Reassign day labels to keep Mon=0, Tue=1, … Sun=6
  days.forEach((d, i) => { if (DAY_LABELS[i]) d.label = DAY_LABELS[i]; });
  c.data.schedule.days = days;

  // Reorder workouts.days to match the new training-day sequence and update labels.
  if (c.data?.workouts?.days?.length) {
    const newTrainingDays = days.filter(d => d.type === 'wk-a' || d.type === 'wk-card');
    if (newTrainingDays.length === c.data.workouts.days.length) {
      // Build map: workout name (after ' — ' in label, lowercased) → workout day entry
      // This correctly handles mismatches between stored order and schedule order
      const byWorkoutName = {};
      c.data.workouts.days.forEach(wd => {
        const lbl = wd.label || wd.title || '';
        const sep = lbl.indexOf(' — ');
        const name = (sep >= 0 ? lbl.slice(sep + 3) : lbl).trim().toLowerCase();
        if (name) byWorkoutName[name] = wd;
      });

      // Rebuild workouts.days in the new schedule order
      c.data.workouts.days = newTrainingDays.map((sd, i) => {
        const wd = byWorkoutName[(sd.title || '').trim().toLowerCase()] || c.data.workouts.days[i] || {};
        const newShort = sd.label;
        const newFull  = FULL_DAY_NAMES[DAY_LABELS.indexOf(sd.label)] || sd.label;
        const existingLabel = wd.label || wd.title || '';
        const sep2 = existingLabel.indexOf(' — ');
        const workoutPart = sep2 >= 0 ? existingLabel.slice(sep2 + 3) : existingLabel;
        return Object.assign({}, wd, {
          label: `${newShort} — ${workoutPart}`,
          title: `${newFull} — ${workoutPart}`,
        });
      });
    }
  }
  updateDynamicClient(cid, c);
  sbAutoSync(cid);
  showFitToast('Schedule updated');
  const updated = getAllClients().find(cl => cl.id === cid) || AppState.currentClient;
  if (!updated?.data?.schedule) return;
  // Re-render training accordion if open
  const body = document.getElementById('acc-body-training');
  if (body && body.innerHTML.trim()) {
    body.innerHTML = renderSchedule(updated.data.schedule, updated) + renderWorkouts(updated.data.workouts, updated) + renderFitnessLog(updated);
  }
  // Re-render schedule tab panel
  const tabSched = document.getElementById('panel-schedule');
  if (tabSched) tabSched.innerHTML = renderSchedule(updated.data.schedule, updated);
  // Re-render workouts tab panel so day order matches
  const tabWork = document.getElementById('panel-workouts');
  if (tabWork) tabWork.innerHTML = renderWorkouts(updated.data.workouts, updated);
}

/* ── SCHEDULE DAY DETAIL POPUP ──────────────────────────────── */
function openScheduleDayDetail(cid, dayLabel) {
  document.getElementById('schedDayModal')?.remove();
  const clients = getAllClients();
  const c = clients.find(cl => cl.id === cid) || AppState.currentClient;
  if (!c) return;

  const schedDay = c.data?.schedule?.days?.find(d => d.label === dayLabel);
  if (!schedDay) return;

  const isRest = schedDay.tag === 'Rest';
  const schedTitle = (schedDay.title || '').trim().toLowerCase();

  // Find matching workout day
  let wDay = null;
  if (!isRest && c.data?.workouts?.days) {
    wDay = c.data.workouts.days.find(wd => {
      const lbl = (wd.label || wd.title || '').toLowerCase();
      const sep = lbl.indexOf(' — ');
      const wName = (sep >= 0 ? lbl.slice(sep + 3) : lbl).trim();
      return wName === schedTitle;
    }) || c.data.workouts.days.find(wd =>
      (wd.id || '').toLowerCase() === dayLabel.toLowerCase()
    );
  }

  const allExercises = wDay ? wDay.blocks?.reduce((acc, b) => b.exercises ? [...acc, ...b.exercises] : acc, []) || [] : [];

  // Get last workout session for this day
  const dayId = wDay?.id || wDay?.label || dayLabel;
  const hist = getWlHistory(cid, dayId);
  const wlCurrent = getWlData(cid, dayId);
  const lastSession = (wlCurrent?.exercises && Object.keys(wlCurrent.exercises).length) ? wlCurrent : (hist[0] || null);
  const lastDate = lastSession?.savedAt ? new Date(lastSession.savedAt).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' }) : null;

  let exercisesHtml = '';
  if (isRest) {
    exercisesHtml = `<div style="padding:24px 0;text-align:center;font-family:'Geist Mono',monospace;font-size:12px;color:var(--muted)">😴 Rest day — recovery is part of the program</div>`;
  } else if (!allExercises.length) {
    exercisesHtml = `<div style="padding:16px 0;font-family:'Geist Mono',monospace;font-size:11px;color:var(--muted)">No exercises assigned yet.</div>`;
  } else {
    exercisesHtml = allExercises.map((ex, ei) => {
      const exData = lastSession?.exercises?.[ei];
      const doneSets = exData?.sets?.filter(s => s && (s.done || s.weight || s.reps)) || [];
      const setsHtml = doneSets.length ? doneSets.map((s, si) =>
        `<div style="display:flex;gap:8px;align-items:center;padding:4px 0;border-bottom:1px solid var(--faint)">
          <div style="font-family:'Geist Mono',monospace;font-size:9px;color:var(--muted);min-width:20px">S${si+1}</div>
          <div style="font-family:'Geist Mono',monospace;font-size:11px;color:var(--text)">${s.weight ? `<span style="color:#3B9EFF">${esc(s.weight)}</span>` : '<span style="color:var(--muted)">—</span>'}</div>
          <div style="font-family:'Geist Mono',monospace;font-size:10px;color:var(--muted)">×</div>
          <div style="font-family:'Geist Mono',monospace;font-size:11px;color:var(--text)">${s.reps ? `<span style="color:${c.accent}">${esc(s.reps)} reps</span>` : '<span style="color:var(--muted)">—</span>'}</div>
          ${s.done ? '<div style="margin-left:auto;color:#2ecc71;font-size:12px">✓</div>' : ''}
        </div>`
      ).join('') : `<div style="font-family:'Geist Mono',monospace;font-size:10px;color:var(--muted);padding:4px 0">No sets logged yet</div>`;

      return `<div style="padding:12px 0;border-bottom:1px solid var(--border)">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <div>
            <div style="font-size:14px;font-weight:500">${esc(ex.name)}</div>
            <div style="font-family:'Geist Mono',monospace;font-size:9px;color:var(--muted);margin-top:2px">${esc(ex.sets||'')}${ex.reps?' · '+esc(ex.reps):''}${ex.rest?' · '+esc(ex.rest):''}</div>
          </div>
          ${doneSets.length ? `<div style="font-family:'Geist Mono',monospace;font-size:9px;color:#2ecc71">${doneSets.length} sets done</div>` : ''}
        </div>
        <div style="padding-left:4px">${setsHtml}</div>
      </div>`;
    }).join('');
  }

  const canEdit = !!AppState.isCoachLogin;
  const editBtn = canEdit
    ? `<button onclick="renameScheduleDayTitle('${esc(cid)}','${esc(dayLabel)}')" title="Rename workout" style="background:none;border:1px solid var(--border);color:var(--muted);font-family:'Geist Mono',monospace;font-size:9px;letter-spacing:1px;padding:4px 8px;border-radius:6px;cursor:pointer;margin-top:6px">EDIT</button>`
    : '';

  const modal = document.createElement('div');
  modal.id = 'schedDayModal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:4000;background:rgba(0,0,0,.75);display:flex;align-items:flex-end;justify-content:center';
  modal.innerHTML = `
    <div style="background:var(--surface);border-radius:20px 20px 0 0;padding:28px 24px 48px;width:100%;max-width:520px;max-height:85vh;overflow-y:auto">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:4px">
        <div>
          <div style="font-family:'Geist Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:2px;text-transform:uppercase">${esc(dayLabel)}</div>
          <div style="font-family:var(--display);font-weight:700;font-size:26px;letter-spacing:1px;color:${isRest ? 'var(--muted)' : c.accent};line-height:1.1;margin-top:2px">${esc(schedDay.title)}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:4px">${esc(schedDay.sub || '')}</div>
          ${editBtn}
        </div>
        <button onclick="document.getElementById('schedDayModal').remove()" style="background:none;border:none;color:var(--muted);font-size:24px;cursor:pointer;padding:0;margin-top:4px">×</button>
      </div>
      ${lastDate ? `<div style="font-family:'Geist Mono',monospace;font-size:9px;color:var(--muted);margin-bottom:16px;padding:6px 10px;background:var(--surface2);border-radius:6px;display:inline-block">Last logged: ${lastDate}</div>` : '<div style="margin-bottom:16px"></div>'}
      <div style="font-family:'Geist Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:2px;text-transform:uppercase;margin-bottom:4px">Exercises</div>
      ${exercisesHtml}
    </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

// Coach-only: rename a schedule day's title and propagate to the matching
// workout day so future name-based lookups still resolve. Persists to
// dynamic_clients + cloud, then re-renders the active screens.
function renameScheduleDayTitle(cid, dayLabel) {
  if (!AppState.isCoachLogin) return;
  const dyn = getDynamicClients();
  const idx = dyn.findIndex(cl => cl.id === cid);
  if (idx < 0) { showFitToast('Client not found'); return; }
  const c = dyn[idx];
  const schedDay = c.data?.schedule?.days?.find(d => d.label === dayLabel);
  if (!schedDay) { showFitToast('Day not found'); return; }

  const current = schedDay.title || '';
  const next = (window.prompt('Workout name for ' + dayLabel + ':', current) || '').trim();
  if (!next || next === current) return;

  // Find the matching workout day by the old title BEFORE we mutate the schedule
  const oldKey = current.trim().toLowerCase();
  let wDay = null;
  if (c.data?.workouts?.days?.length) {
    wDay = c.data.workouts.days.find(wd => {
      const lbl = (wd.label || wd.title || '').toLowerCase();
      const sep = lbl.indexOf(' — ');
      const wName = (sep >= 0 ? lbl.slice(sep + 3) : lbl).trim();
      return wName === oldKey;
    });
  }

  schedDay.title = next;
  if (wDay) {
    // Preserve the "Short — Name" / "Long — Name" label shape that renderWorkouts builds
    const lbl = wDay.label || '';
    const sep = lbl.indexOf(' — ');
    if (sep >= 0) wDay.label = lbl.slice(0, sep + 3) + next;
    const ttl = wDay.title || '';
    const sep2 = ttl.indexOf(' — ');
    if (sep2 >= 0) wDay.title = ttl.slice(0, sep2 + 3) + next;
    else wDay.title = next;
  }

  saveDynamicClients(dyn);
  if (AppState.currentClient && AppState.currentClient.id === cid) {
    AppState.currentClient = c;
    try { if (typeof currentClient !== 'undefined') currentClient = c; } catch (_) {}
  }
  if (typeof sbAutoSync === 'function') sbAutoSync(cid);

  // Re-render the screens that show the title
  try { renderContent(c); } catch (_) {}
  document.getElementById('schedDayModal')?.remove();
  showFitToast('Renamed to "' + next + '"');
}

/* ── SUPABASE SYNC ──────────────────────────────────────────── */
// Web Push — replace with your key after running: npx web-push generate-vapid-keys
// VAPID public key is safe in the bundle — by design only the public
// half is sent to the browser; the private half stays in Netlify env.
const VAPID_PUBLIC_KEY = 'BG96mHmP4m4VEkYxqLg5gnj4gXnqlf6pqixS3inIsVEAkrxiWANFRo6lQ3i57zaVU-B1S0JR2C5IukZxMU8IkOU';

/* ══════════════════════════════════════════════════════════════
   SUPABASE PROXY CLIENT
   All Supabase reads/writes go through /api/sb (Netlify Function)
   which validates an HMAC-signed session token and uses the service
   role key server-side. The anon key + Supabase URL are no longer
   shipped in the bundle, so a scraper can't read any data.

   Auth flow:
     POST /api/login  { role, pin } → { token }
     token kept in localStorage as 'auth_token'
     sent on every /api/sb request as `Authorization: Bearer …`
══════════════════════════════════════════════════════════════ */
const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_ROLE_KEY  = 'auth_role';

function getAuthToken() { return localStorage.getItem(AUTH_TOKEN_KEY) || ''; }
function getAuthRole()  { return localStorage.getItem(AUTH_ROLE_KEY)  || ''; }
function setAuth(token, role) {
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
  if (role)  localStorage.setItem(AUTH_ROLE_KEY,  role);
}
function clearAuth() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_ROLE_KEY);
}

// sbInit returns truthy when we have a valid-looking token. Existing
// callers only check truthiness ("is Supabase available"), so we keep
// the boolean contract.
function sbInit() {
  return getAuthToken() ? { ok: true } : null;
}

// Low-level proxy call. Internal helper; the public surface is
// sbSelect / sbUpsert / sbPatch below.
async function _sbProxy(body) {
  const token = getAuthToken();
  if (!token) return { ok: false, status: 401, data: null };
  try {
    const r = await fetch('/api/sb', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + token,
      },
      body: JSON.stringify(body),
    });
    if (r.status === 401) {
      // Token expired or invalid — drop it so the next login screen catches the user
      clearAuth();
      if (typeof showFitToast === 'function') showFitToast('Session expired — please log in');
      return { ok: false, status: 401, data: null };
    }
    let data = null;
    try { data = await r.json(); } catch { data = null; }
    return { ok: r.ok, status: r.status, data };
  } catch (e) {
    return { ok: false, status: 0, data: null, error: e };
  }
}

// /api/login wrapper. Returns { ok, token?, role?, clientId?, error? }
async function apiLogin(role, pin) {
  try {
    const r = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, pin }),
    });
    const data = await r.json().catch(() => ({}));
    if (r.ok && data.token) {
      setAuth(data.token, data.role || role);
      return { ok: true, ...data };
    }
    return { ok: false, status: r.status, error: data.error || 'Login failed' };
  } catch (e) {
    return { ok: false, status: 0, error: 'Network error — try again' };
  }
}

/* ── Offline write queue ─────────────────────────────────────────
   Failed sbUpsert/sbPatch operations get queued to localStorage and
   replayed automatically when the browser comes back online or when
   the app boots. Keeps writes durable across flaky connections.
────────────────────────────────────────────────────────────────── */
const SB_QUEUE_KEY = '_sb_queue';
const SB_QUEUE_MAX = 200;
function _sbQueueRead() { try { return JSON.parse(localStorage.getItem(SB_QUEUE_KEY) || '[]'); } catch { return []; } }
function _sbQueueWrite(q) { try { localStorage.setItem(SB_QUEUE_KEY, JSON.stringify(q.slice(-SB_QUEUE_MAX))); updateOfflinePill(); } catch {} }
function updateOfflinePill() {
  const pill = document.getElementById('offlinePill');
  if (!pill) return;
  const text = document.getElementById('offlinePillText');
  const queued = _sbQueueRead().length;
  const online = navigator.onLine;
  if (!online) {
    pill.style.display = 'inline-flex';
    pill.classList.remove('syncing');
    if (text) text.textContent = queued > 0 ? 'Offline · ' + queued : 'Offline';
  } else if (queued > 0) {
    pill.style.display = 'inline-flex';
    pill.classList.add('syncing');
    if (text) text.textContent = 'Queued · ' + queued;
  } else {
    pill.style.display = 'none';
  }
}
window.addEventListener('online', updateOfflinePill);
window.addEventListener('offline', updateOfflinePill);
document.addEventListener('DOMContentLoaded', updateOfflinePill);
function _sbQueuePush(op) {
  const q = _sbQueueRead();
  if (op.kind === 'upsert') {
    // Collapse duplicate upserts to same table+id — keep newest only
    const id = op.data?.id || op.data?.client_id;
    if (id) {
      for (let i = q.length - 1; i >= 0; i--) {
        const prev = q[i];
        if (prev.kind === 'upsert' && prev.table === op.table && (prev.data?.id === id || prev.data?.client_id === id)) q.splice(i, 1);
      }
    }
  }
  q.push({ ...op, ts: Date.now(), _qid: Date.now().toString(36) + Math.random().toString(36).slice(2, 8) });
  _sbQueueWrite(q);
}
let _draining = false;
async function drainSbQueue() {
  if (_draining || !navigator.onLine) return;
  if (!sbInit()) return; // Supabase not configured
  _draining = true;
  try {
    const q = _sbQueueRead();
    if (!q.length) return;
    // Drain in small parallel batches — many flaky-network clients accumulate
    // dozens of queued ops, and serial sending takes O(n × RTT). Keep batch
    // size low so we don't overwhelm a weak connection.
    const sentIds = new Set();
    const BATCH = 4;
    for (let i = 0; i < q.length; i += BATCH) {
      const slice = q.slice(i, i + BATCH);
      const results = await Promise.all(slice.map(op => _sbSend(op).catch(() => false)));
      results.forEach((ok, idx) => {
        if (ok && slice[idx]._qid) sentIds.add(slice[idx]._qid);
      });
    }
    // Re-read latest queue (may have grown during drain) and drop only sent ops
    const latest = _sbQueueRead();
    const remaining = latest.filter(op => !op._qid || !sentIds.has(op._qid));
    _sbQueueWrite(remaining);
    if (sentIds.size > 0) {
      try { if (typeof showFitToast === 'function') showFitToast('✓ Synced ' + sentIds.size + ' queued change' + (sentIds.size === 1 ? '' : 's')); } catch {}
    }
  } finally { _draining = false; updateOfflinePill(); }
}
async function _sbSend(op) {
  // Queue replay uses the same proxy as live writes. _sbProxy handles auth.
  const r = await _sbProxy({
    op:     op.kind, // 'upsert' | 'patch'
    table:  op.table,
    data:   op.data,
    filter: op.filter,
  });
  return r.ok;
}
window.addEventListener('online', () => drainSbQueue());
document.addEventListener('DOMContentLoaded', () => setTimeout(drainSbQueue, 1500));

async function sbUpsert(table, data) {
  if (!sbInit()) return null;
  const r = await _sbProxy({ op: 'upsert', table, data });
  if (!r.ok) _sbQueuePush({ kind: 'upsert', table, data });
  return r.ok;
}
async function sbSelect(table, query) {
  if (!sbInit()) return null;
  // `query` is the legacy raw query string (e.g. "select=*&order=foo.desc").
  // The proxy strips/forwards it and force-injects client scope when needed.
  const r = await _sbProxy({ op: 'select', table, query });
  return r.ok ? r.data : null;
}
async function sbPatch(table, filter, data) {
  if (!sbInit()) return null;
  const r = await _sbProxy({ op: 'patch', table, data, filter });
  if (!r.ok) _sbQueuePush({ kind: 'patch', table, filter, data });
  return r.ok;
}
async function sbUploadPhoto(cid, date, dataUrl) {
  // Photo upload still needs direct Storage access. Route through a
  // dedicated function so the service role key stays server-side.
  if (!sbInit()) return null;
  try {
    const token = getAuthToken();
    const r = await fetch('/api/upload-photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ cid, dataUrl }),
    });
    if (!r.ok) return null;
    const data = await r.json().catch(() => ({}));
    return data.url || null;
  } catch { return null; }
}
function _collectNutritionBlob(cid) {
  const diary = {};
  const prefix = 'nutr_diary_' + cid + '_';
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.indexOf(prefix) === 0) {
      const date = k.slice(prefix.length);
      diary[date] = safeJSON(localStorage.getItem(k), null);
    }
  }
  return {
    diary,
    water:  safeJSON(localStorage.getItem('water_log_'    + cid), []),
    custom: safeJSON(localStorage.getItem('custom_foods_' + cid), []),
  };
}
// Coalesce rapid sbAutoSync calls per client. Each call rebuilds the entire
// data blob (every workout history + nutrition diary + fitness log) and
// uploads it; without debouncing, logging 5 sets in a workout triggers 5
// full uploads in ~30s. 1.2s debounce collapses the burst into one upload.
const _sbAutoSyncTimers = {};
function sbAutoSync(cid) {
  if (!cid) return;
  if (_sbAutoSyncTimers[cid]) clearTimeout(_sbAutoSyncTimers[cid]);
  _sbAutoSyncTimers[cid] = setTimeout(() => {
    delete _sbAutoSyncTimers[cid];
    _sbAutoSyncFlush(cid);
  }, 1200);
}
// Force-flush any pending sync (used on logout / before leaving page so we
// don't drop the last write of a session).
function sbAutoSyncFlushAll() {
  Object.keys(_sbAutoSyncTimers).forEach(cid => {
    clearTimeout(_sbAutoSyncTimers[cid]);
    delete _sbAutoSyncTimers[cid];
    _sbAutoSyncFlush(cid);
  });
}
window.addEventListener('pagehide', sbAutoSyncFlushAll);

function _sbAutoSyncFlush(cid) {
  const sb = sbInit(); if (!sb) return;
  // Push core client profile row — critical for clients onboarded before Supabase was added
  const allC = getAllClients();
  const c = allC.find(cl => cl.id === cid);
  if (c) {
    // Embed per-client data into the blob so it survives on a new device
    const _wlHist = {};
    const _wlRepeat = {};
    (c.data?.workouts?.days || []).forEach(d => {
      const dayId = d.id || d.label;
      const h = getWlHistory(cid, dayId);
      if (h.length) _wlHist[dayId] = h;
      const r = getWlRepeat(cid, dayId);
      if (r) _wlRepeat[dayId] = r;
    });
    const _nutr = _collectNutritionBlob(cid);
    const dataBlob = Object.assign({}, c.data || {}, {
      _prs:           getPRs(cid),
      _fitLogs:       getFitnessLogs(cid),
      _macroScores:   getCoachMacroScores(cid),
      _wtHistory:     getWtHistory(cid),
      _wtCurrent:     localStorage.getItem('wt_current_' + cid) || null,
      _wlHist,
      _wlRepeat,
      _mealLog:       getMealLog(cid),
      _periodization: getPeriodization(cid),
      _movementLibrary:   getMovementLibrary(),
      _movementLibraryAt: getMovementLibraryAt(),
      _nutrDiary:     _nutr.diary,
      _waterLog:      _nutr.water,
      _customFoods:   _nutr.custom,
    });
    sbUpsert('clients', {
      id:           c.id,
      name:         c.name,
      pin:          c.pin || '',
      goal:         c.goal || '',
      accent:       c.accent || '#3B9EFF',
      program_type: c.programType || c.program_type || '',
      mode:         getClientMode(c.id),
      data:         JSON.stringify(dataBlob),
      meta:         JSON.stringify(c._meta       || {}),
      weight_loss:  JSON.stringify(c.weightLoss  || null),
      updated_at:   new Date().toISOString()
    });
  }
  // Push coach notes (new structured log takes priority; fall back to old plain-text key)
  const notesLog = localStorage.getItem('coach_notes_log_' + cid);
  const notesLegacy = localStorage.getItem('coach_notes_' + cid);
  const notesSyncVal = notesLog || notesLegacy;
  if (notesSyncVal) sbUpsert('coach_notes', { client_id: cid, notes: notesSyncVal, updated_at: new Date().toISOString() });
  // Push meal plan
  const mealRaw = localStorage.getItem('meal_plan_' + cid);
  if (mealRaw) {
    try { sbUpsert('meal_plans', { client_id: cid, plan_data: JSON.parse(mealRaw), updated_at: new Date().toISOString() }); } catch (_e) {}
  }
}
/* ── WEB PUSH ────────────────────────────────────────────────── */
async function subscribeToPush(cid) {
  if (!VAPID_PUBLIC_KEY || !('PushManager' in window)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    // Check existing subscription first
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const key = Uint8Array.from(atob(VAPID_PUBLIC_KEY.replace(/-/g,'+').replace(/_/g,'/')), c => c.charCodeAt(0));
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
    }
    if (sub) await sbUpsert('push_subscriptions', { client_id: cid, subscription: sub.toJSON(), updated_at: new Date().toISOString() });
  } catch (e) { console.warn('Push subscribe failed:', e.message); }
}
async function requestPushPermission(cid) {
  if (!VAPID_PUBLIC_KEY || !('Notification' in window)) return;
  if (Notification.permission === 'granted') { subscribeToPush(cid); return; }
  if (Notification.permission === 'denied')  return;
  const perm = await Notification.requestPermission();
  if (perm === 'granted') subscribeToPush(cid);
}
async function triggerClientPush(cid, title, body) {
  try {
    await fetch('/api/send-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: cid, title, body })
    });
  } catch (_) {}
}

async function syncAllClients() {
  const sb = sbInit();
  if (!sb) { showFitToast('Connect Supabase first'); return; }
  const clients = getAllClients();
  showSyncOverlay(`Pushing 0 / ${clients.length} clients…`);
  let ok = 0, fail = 0;
  for (const c of clients) {
    const _wlHistFull = {};
    const _wlRepeatFull = {};
    (c.data?.workouts?.days || []).forEach(d => {
      const dayId = d.id || d.label;
      const h = getWlHistory(c.id, dayId);
      if (h.length) _wlHistFull[dayId] = h;
      const r = getWlRepeat(c.id, dayId);
      if (r) _wlRepeatFull[dayId] = r;
    });
    const _nutrFull = _collectNutritionBlob(c.id);
    const fullBlob = Object.assign({}, c.data || {}, {
      _prs:           getPRs(c.id),
      _fitLogs:       getFitnessLogs(c.id),
      _macroScores:   getCoachMacroScores(c.id),
      _wtHistory:     getWtHistory(c.id),
      _wtCurrent:     localStorage.getItem('wt_current_' + c.id) || null,
      _wlHist:        _wlHistFull,
      _wlRepeat:      _wlRepeatFull,
      _mealLog:       getMealLog(c.id),
      _periodization: getPeriodization(c.id),
      _movementLibrary:   getMovementLibrary(),
      _movementLibraryAt: getMovementLibraryAt(),
      _nutrDiary:     _nutrFull.diary,
      _waterLog:      _nutrFull.water,
      _customFoods:   _nutrFull.custom,
    });
    const result = await sbUpsert('clients', {
      id:           c.id,
      name:         c.name,
      pin:          c.pin || '',
      goal:         c.goal || '',
      accent:       c.accent || '#3B9EFF',
      program_type: c.programType || c.program_type || '',
      mode:         getClientMode(c.id),
      data:         JSON.stringify(fullBlob),
      meta:         JSON.stringify(c._meta  || {}),
      weight_loss:  JSON.stringify(c.weightLoss || null),
      updated_at:   new Date().toISOString()
    });
    result ? ok++ : fail++;
    showSyncOverlay(`Pushing ${ok+fail} / ${clients.length} clients…`);
  }
  // Push per-client data
  for (let i = 0; i < clients.length; i++) {
    showSyncOverlay(`Syncing data: ${esc(clients[i].name)}…`);
    await syncClientData(clients[i].id);
  }
  hideSyncOverlay();
  showFitToast(fail === 0 ? `✓ ${ok} client${ok!==1?'s':''} synced` : `✓ ${ok} synced · ${fail} failed`);
  renderCoachDashboard();
}

async function syncClientData(cid) {
  const sb = sbInit(); if (!sb) return;
  // Checkins (with photo upload to Supabase Storage)
  const checkins = getCheckins(cid);
  for (const ch of checkins) {
    let photoUrl = ch.photoUrl || null; // use cached URL if already uploaded
    if (ch.photo && ch.photo.startsWith('data:') && !ch.photoUrl) {
      // Upload base64 photo to Supabase Storage
      photoUrl = await sbUploadPhoto(cid, ch.date, ch.photo);
      if (photoUrl) {
        // Cache URL back to localStorage so we don't re-upload next time
        ch.photoUrl = photoUrl;
        delete ch.photo; // remove base64 blob to free localStorage space
      }
    }
    await sbUpsert('checkins', {
      client_id:  cid,
      checked_at: ch.date || new Date().toISOString(),
      sleep:      ch.sleep || null,
      stress:     ch.stress || null,
      energy:     ch.energy || null,
      adherence:  ch.adherence || null,
      notes:      ch.notes || null,
      photo_url:  photoUrl,
    });
  }
  // Save back updated checkins (with photoUrl cached, base64 removed)
  saveCheckins(cid, checkins);
  // Measurements
  const measurements = getMeasurements(cid);
  for (const m of measurements) {
    await sbUpsert('measurements', {
      client_id:   cid,
      measured_at: m.date || new Date().toISOString(),
      waist:       m.waist || null,
      hips:        m.hips || null,
      chest:       m.chest || null,
      larm:        m.larm || null,
      rarm:        m.rarm || null,
      lthigh:      m.lthigh || null,
      rthigh:      m.rthigh || null,
      weight_lbs:  m.weight || null,
    });
  }
  // Goals
  const goals = getClientGoals(cid);
  for (const g of goals) {
    await sbUpsert('client_goals', {
      id:         g.id,
      client_id:  cid,
      type:       g.type,
      label:      g.label,
      start_val:  g.start || null,
      target_val: g.target || null,
      unit:       g.unit || null,
    });
    const cur = getGoalCurrent(cid, g.id);
    if (cur !== null) {
      await sbUpsert('goal_progress', {
        goal_id:     g.id,
        client_id:   cid,
        current_val: cur,
        logged_at:   new Date().toISOString(),
      });
    }
  }
  // XP + milestones
  await sbUpsert('client_xp', {
    client_id:           cid,
    total_xp:            getXP(cid),
    unlocked_milestones: getUnlockedMilestones(cid),
    updated_at:          new Date().toISOString(),
  });
  // Coach notes (new structured log takes priority; fall back to old plain-text key)
  const notesLog = localStorage.getItem('coach_notes_log_' + cid);
  const notesLegacy = localStorage.getItem('coach_notes_' + cid);
  const notesSyncVal = notesLog || notesLegacy;
  if (notesSyncVal) await sbUpsert('coach_notes', { client_id: cid, notes: notesSyncVal, updated_at: new Date().toISOString() });
}

async function pullClientData(cid) {
  const sb = sbInit(); if (!sb) return;

  // ── Pull core client blob (weights, program data, meta) ──────
  const cRows = await sbSelect('clients', `id=eq.${cid}&select=data,meta,weight_loss,updated_at`);
  if (cRows && cRows[0]) {
    const dyn = getLS('dynamic_clients', []);
    const idx = dyn.findIndex(c => c.id === cid);
    if (idx >= 0) {
      if (cRows[0].data !== null) {
        const pulled = safeJSON(cRows[0].data, dyn[idx].data || {});
        // Restore all embedded blob fields
        if (pulled._prs && Object.keys(pulled._prs).length) {
          localStorage.setItem('prs_' + cid, JSON.stringify(pulled._prs));
        }
        if (pulled._fitLogs && pulled._fitLogs.length) {
          // Merge: keep local logs, add any new ones from cloud by date
          const localLogs  = getFitnessLogs(cid);
          const localDates = new Set(localLogs.map(l => l.date));
          const merged     = [...localLogs, ...pulled._fitLogs.filter(l => !localDates.has(l.date))];
          saveFitnessLogs(cid, merged);
        }
        if (pulled._macroScores && pulled._macroScores.length) {
          const local = getCoachMacroScores(cid);
          const localDates = new Set(local.map(m => m.date));
          const merged = [...local, ...pulled._macroScores.filter(m => !localDates.has(m.date))];
          localStorage.setItem('macro_scores_' + cid, JSON.stringify(merged));
        }
        if (pulled._wtHistory && pulled._wtHistory.length) {
          const local = getWtHistory(cid);
          const localDates = new Set(local.map(w => w.date?.slice(0,10)));
          const merged = [...local, ...pulled._wtHistory.filter(w => !localDates.has(w.date?.slice(0,10)))];
          saveWtHistory(cid, merged);
        }
        if (pulled._wtCurrent && !localStorage.getItem('wt_current_' + cid)) {
          localStorage.setItem('wt_current_' + cid, pulled._wtCurrent);
        }
        if (pulled._wlHist && typeof pulled._wlHist === 'object') {
          Object.entries(pulled._wlHist).forEach(([dayId, hist]) => {
            if (!Array.isArray(hist) || !hist.length) return;
            const local = getWlHistory(cid, dayId);
            if (hist.length > local.length) saveWlHistory(cid, dayId, hist);
          });
        }
        if (pulled._wlRepeat && typeof pulled._wlRepeat === 'object') {
          Object.entries(pulled._wlRepeat).forEach(([dayId, plan]) => {
            // Only keep plans whose window is still open; drop expired ones.
            if (plan && plan.expiresAt && Date.now() < new Date(plan.expiresAt).getTime()) {
              saveWlRepeat(cid, dayId, plan);
            } else {
              saveWlRepeat(cid, dayId, null);
            }
          });
        }
        // Movement Library (global, coach-level): newest-wins by timestamp so
        // adds AND deletes converge across devices. Stored redundantly in every
        // client blob; the timestamp guard makes the merge order-independent.
        if (Array.isArray(pulled._movementLibrary)) {
          const cloudAt = pulled._movementLibraryAt || '';
          const localAt = getMovementLibraryAt();
          if (cloudAt && (!localAt || cloudAt > localAt)) {
            localStorage.setItem('movement_library', JSON.stringify(pulled._movementLibrary));
            localStorage.setItem('movement_library_at', cloudAt);
          }
        }
        if (pulled._mealLog && pulled._mealLog.length) {
          const local = getMealLog(cid);
          const localDates = new Set(local.map(m => m.date?.slice(0,10)));
          const merged = [...local, ...pulled._mealLog.filter(m => !localDates.has(m.date?.slice(0,10)))];
          saveMealLog(cid, merged);
        }
        if (pulled._periodization && pulled._periodization.length && !getPeriodization(cid).length) {
          savePeriodization(cid, pulled._periodization);
        }
        if (pulled._nutrDiary && typeof pulled._nutrDiary === 'object') {
          Object.entries(pulled._nutrDiary).forEach(([date, diary]) => {
            if (!diary) return;
            const key = 'nutr_diary_' + cid + '_' + date;
            const local = safeJSON(localStorage.getItem(key), null);
            // Prefer local if it has more items across all meals; else accept cloud
            const count = (d) => d ? Object.values(d).reduce((s, arr) => s + (Array.isArray(arr) ? arr.length : 0), 0) : 0;
            if (!local || count(diary) > count(local)) {
              localStorage.setItem(key, JSON.stringify(diary));
            }
          });
        }
        if (pulled._waterLog && Array.isArray(pulled._waterLog) && pulled._waterLog.length) {
          const local = safeJSON(localStorage.getItem('water_log_' + cid), []);
          const byDate = {};
          [...local, ...pulled._waterLog].forEach(e => {
            if (!e || !e.date) return;
            if (!byDate[e.date] || (e.glasses || 0) > (byDate[e.date].glasses || 0)) byDate[e.date] = e;
          });
          localStorage.setItem('water_log_' + cid, JSON.stringify(Object.values(byDate)));
        }
        if (pulled._customFoods && Array.isArray(pulled._customFoods) && pulled._customFoods.length) {
          const local = safeJSON(localStorage.getItem('custom_foods_' + cid), []);
          const ids = new Set(local.map(f => f.id));
          const merged = [...local, ...pulled._customFoods.filter(f => !ids.has(f.id))];
          localStorage.setItem('custom_foods_' + cid, JSON.stringify(merged));
        }
        dyn[idx].data = pulled;
      }
      if (cRows[0].meta       !== null) {
        dyn[idx]._meta = safeJSON(cRows[0].meta, dyn[idx]._meta || {});
        // Always sync last_seen to its own key so the coach dashboard can read it
        const pulledLastSeen = dyn[idx]._meta?.last_seen;
        if (pulledLastSeen) {
          const localLastSeen = parseInt(localStorage.getItem('last_seen_' + cid) || '0');
          if (parseInt(pulledLastSeen) > localLastSeen) {
            localStorage.setItem('last_seen_' + cid, String(pulledLastSeen));
          }
        }
      }
      if (cRows[0].weight_loss!== null) dyn[idx].weightLoss = safeJSON(cRows[0].weight_loss, dyn[idx].weightLoss || null);
      dyn[idx]._updated_at = cRows[0].updated_at;
      localStorage.setItem('dynamic_clients', JSON.stringify(dyn));
    }
  }

  // ── Pull meal plan ────────────────────────────────────────────
  const mealRows = await sbSelect('meal_plans', `client_id=eq.${cid}&select=plan_data`);
  if (mealRows && mealRows[0] && mealRows[0].plan_data) {
    localStorage.setItem('meal_plan_' + cid, JSON.stringify(mealRows[0].plan_data));
  }

  // Checkins
  const checkinRows = await sbSelect('checkins', `client_id=eq.${cid}&order=checked_at.asc`);
  if (checkinRows) {
    const mapped = checkinRows.map(r => ({ date: r.checked_at, sleep: r.sleep, stress: r.stress, energy: r.energy, adherence: r.adherence, notes: r.notes, photoUrl: r.photo_url || null }));
    localStorage.setItem('checkins_' + cid, JSON.stringify(mapped));
  }
  // Measurements
  const measRows = await sbSelect('measurements', `client_id=eq.${cid}&order=measured_at.asc`);
  if (measRows) {
    const mapped = measRows.map(r => ({ date: r.measured_at, waist: r.waist, hips: r.hips, chest: r.chest, larm: r.larm, rarm: r.rarm, lthigh: r.lthigh, rthigh: r.rthigh, weight: r.weight_lbs }));
    localStorage.setItem('meas_' + cid, JSON.stringify(mapped));
  }
  // Goals
  const goalRows = await sbSelect('client_goals', `client_id=eq.${cid}`);
  if (goalRows) {
    const goals = goalRows.map(r => ({ id: r.id, type: r.type, label: r.label, start: r.start_val, target: r.target_val, unit: r.unit }));
    saveClientGoals(cid, goals);
  }
  // Goal progress
  const progressRows = await sbSelect('goal_progress', `client_id=eq.${cid}`);
  if (progressRows) {
    progressRows.forEach(r => {
      const history = getGoalHistory(cid, r.goal_id);
      if (!history.find(h => h.val === r.current_val)) {
        history.push({ val: r.current_val, date: r.logged_at });
        localStorage.setItem('goal_cur_' + cid + '_' + r.goal_id, JSON.stringify(history));
      }
    });
  }
  // XP + milestones — milestones are append-only (can't un-earn), so union
  // local + cloud rather than overwrite. Prevents the modal from re-firing
  // on every app open when cloud has a stale/empty list.
  const xpRows = await sbSelect('client_xp', `client_id=eq.${cid}`);
  if (xpRows && xpRows[0]) {
    localStorage.setItem('xp_' + cid, String(xpRows[0].total_xp || 0));
    const cloudMs = Array.isArray(xpRows[0].unlocked_milestones) ? xpRows[0].unlocked_milestones : [];
    const localMs = getUnlockedMilestones(cid);
    const merged  = Array.from(new Set([...localMs, ...cloudMs]));
    saveUnlockedMilestones(cid, merged);
  }
  // Coach notes
  const noteRows = await sbSelect('coach_notes', `client_id=eq.${cid}`);
  if (noteRows && noteRows[0]) localStorage.setItem('coach_notes_' + cid, noteRows[0].notes || '');

  // Messages (both directions) — merge into local notif_log
  const msgRows = await sbSelect('messages', `client_id=eq.${cid}&order=sent_at.asc`);
  if (msgRows && msgRows.length) {
    const existing = getLS('notif_log_' + cid, []);
    const existingIds = new Set(existing.map(n => n._msgId).filter(Boolean));
    let added = 0;
    msgRows.forEach(m => {
      if (!existingIds.has(m.id)) {
        existing.push({ msg: m.body, ts: m.sent_at, from: m.from_coach ? 'coach' : 'client', read: m.read, _msgId: m.id });
        added++;
      }
    });
    if (added > 0) localStorage.setItem('notif_log_' + cid, JSON.stringify(existing));
    // Update latest coach_msg banner from the most recent coach message
    const coachMsgs = msgRows.filter(m => m.from_coach);
    const latestMsg = coachMsgs[coachMsgs.length - 1];
    if (latestMsg) {
      localStorage.setItem('coach_msg_' + cid, latestMsg.body);
      localStorage.setItem('coach_msg_ts_' + cid, latestMsg.sent_at);
    }
  }
}

async function pullFromCloud() {
  const sb = sbInit();
  if (!sb) { showFitToast('Connect Supabase first'); return; }
  showSyncOverlay('Pulling clients from cloud…');
  const data = await sbSelect('clients', 'select=*');
  if (!data) { hideSyncOverlay(); showFitToast('Pull failed'); return; }
  const terminated = getLS('terminated_clients', []);
  const existing = getLS('dynamic_clients', []);
  data.forEach(row => {
    if (terminated.includes(row.id)) return; // don't resurrect archived clients
    const idx = existing.findIndex(c => c.id === row.id);
    const client = {
      id:          row.id,
      name:        row.name,
      pin:         row.pin || '',
      goal:        row.goal || '',
      accent:      row.accent || '#3B9EFF',
      programType: row.program_type || '',
      data:        safeJSON(row.data, {}),
      _meta:       safeJSON(row.meta, {}),
      weightLoss:  safeJSON(row.weight_loss, null),
    };
    // restore per-client localStorage keys
    if (row.mode) localStorage.setItem('client_mode_' + row.id, row.mode);
    if (idx >= 0) existing[idx] = client; else existing.push(client);
  });
  localStorage.setItem('dynamic_clients', JSON.stringify(existing));
  // Pull per-client data for each restored client
  const pulledIds = data.filter(r => !terminated.includes(r.id)).map(r => r.id);
  for (let i = 0; i < pulledIds.length; i++) {
    showSyncOverlay(`Pulling data: ${i+1} / ${pulledIds.length}…`);
    await pullClientData(pulledIds[i]);
  }
  hideSyncOverlay();
  showFitToast('✓ Pulled ' + data.length + ' clients + data');
  renderCoachDashboard();
}
function openSBSettings() {
  // Supabase credentials now live in Netlify env vars on the server side.
  // Coaches no longer paste a project URL / anon key into the app — all
  // sync goes through /api/sb with their authenticated session token.
  const existing = document.getElementById('sbSettingsModal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'sbSettingsModal';
  modal.className = 'terminate-backdrop open';
  const tokenOk = !!getAuthToken();
  modal.innerHTML = `<div class="terminate-modal">
    <div style="font-family:var(--display);font-weight:700;font-size:24px;letter-spacing:2px;margin-bottom:14px">☁ Cloud Sync</div>
    <div style="background:var(--surface2);border:1px solid ${tokenOk ? '#2ecc71' : '#e74c3c'}55;border-radius:8px;padding:12px 14px;margin-bottom:14px;font-size:12px">
      <div style="font-family:'Geist Mono',monospace;font-size:10px;color:var(--muted);letter-spacing:1px;margin-bottom:4px">STATUS</div>
      <div style="color:${tokenOk ? '#2ecc71' : '#e74c3c'};font-weight:600">${tokenOk ? '● Authenticated — sync active' : '○ Not authenticated — log in again'}</div>
    </div>
    <div style="display:flex;gap:10px;margin-top:6px">
      <button class="fit-log-btn" style="flex:1;font-size:12px;padding:10px" onclick="syncAllClients()" ${tokenOk?'':'disabled'}>↑ Push All</button>
      <button class="fit-log-btn" style="flex:1;font-size:12px;padding:10px;background:var(--surface);color:var(--text);border:1px solid var(--border)" onclick="pullFromCloud()" ${tokenOk?'':'disabled'}>↓ Pull Cloud</button>
    </div>
    <button class="fit-log-btn" style="width:100%;margin-top:8px;font-size:12px;padding:10px;background:rgba(52,152,219,.1);color:#3498db;border:1px solid #3498db" onclick="testSBConnection()" ${tokenOk?'':'disabled'}>⚡ Test Connection</button>
    <div id="sbTestResult" style="margin-top:8px;font-family:'Geist Mono',monospace;font-size:10px;line-height:1.6;color:var(--muted);word-break:break-all"></div>
    <button class="ob-back-btn" style="width:100%;margin-top:14px" onclick="document.getElementById('sbSettingsModal').remove()">Close</button>
  </div>`;
  document.body.appendChild(modal);
}
function showSyncOverlay(msg) {
  let el = document.getElementById('syncOverlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'syncOverlay';
    el.style.cssText = 'position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,.7);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px';
    el.innerHTML = `<div style="width:40px;height:40px;border:3px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin .8s linear infinite"></div>
      <div id="syncOverlayMsg" style="font-family:'Geist Mono',monospace;font-size:11px;letter-spacing:1px;color:var(--text)"></div>`;
    document.body.appendChild(el);
  }
  document.getElementById('syncOverlayMsg').textContent = msg || 'Syncing…';
}
function hideSyncOverlay() { document.getElementById('syncOverlay')?.remove(); }
// Legacy saveSBSettings — coach paste-the-keys flow is deprecated, but
// keep a no-op stub so the More menu / Sync settings modal don't crash
// if some old code path still calls it.
function saveSBSettings() {
  document.getElementById('sbSettingsModal')?.remove();
  showFitToast('Cloud sync is managed server-side now');
}
async function testSBConnection() {
  const out = document.getElementById('sbTestResult');
  if (out) out.textContent = 'Testing…';
  if (!sbInit()) { if (out) out.textContent = '✗ Not authenticated'; return; }
  try {
    // Round-trip a tiny select through the proxy
    const r = await _sbProxy({ op: 'select', table: 'clients', query: 'select=id&limit=1' });
    if (r.ok) {
      if (out) out.innerHTML = `<span style="color:#2ecc71">✓ Connected (HTTP ${r.status})</span>`;
    } else {
      if (out) out.innerHTML = `<span style="color:#e74c3c">✗ HTTP ${r.status}</span><br>${(r.data && r.data.error) || 'Unknown error'}`;
    }
  } catch(e) {
    if (out) out.innerHTML = `<span style="color:#e74c3c">✗ Network error: ${e.message}</span>`;
  }
}

/* ── AUTO-UPDATE BANNER ─────────────────────────────────────── */
function showUpdateBanner() {
  const banner = document.getElementById('updateBanner');
  if (!banner) return;
  const h = banner.offsetHeight || 64;
  document.documentElement.style.setProperty('--update-banner-h', h + 'px');
  banner.classList.add('show');
  document.body.classList.add('has-update-banner');
}
function applyUpdate() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then(reg => {
      if (reg && reg.waiting) { reg.waiting.postMessage({ type: 'SKIP_WAITING' }); }
      window.location.reload();
    });
  } else { window.location.reload(); }
}
function dismissUpdate() {
  const banner = document.getElementById('updateBanner');
  if (banner) banner.classList.remove('show');
  document.body.classList.remove('has-update-banner');
  document.documentElement.style.removeProperty('--update-banner-h');
}

/* ── WORKOUT LOGGER (ALT EXERCISES) ────────────────────────── */
function openAltModal(cid, dayId, exIdx) {
  AppState.altTarget = { cid, dayId, exIdx };
  const clients = getAllClients();
  const c = clients.find(cl => cl.id === cid);
  if (!c) return;
  const wDays = c.data.workouts && c.data.workouts.days ? c.data.workouts.days : [];
  const wDay  = wDays.find(d => d.id === dayId || d.label === dayId);
  const ex    = wDay && wDay.exercises ? wDay.exercises[exIdx] : null;
  if (!ex) return;
  const existing = document.getElementById('altModalBackdrop');
  if (existing) existing.remove();
  const saved = getLS('wl_' + cid + '_' + dayId, {});
  const altVal= saved['alt_' + exIdx] || '';
  const backdrop = document.createElement('div');
  backdrop.id = 'altModalBackdrop';
  backdrop.className = 'alt-modal-backdrop';
  backdrop.innerHTML = `<div class="alt-modal">
    <div class="alt-modal-handle"></div>
    <div class="alt-modal-header">
      <div class="alt-modal-label">Alternative Exercise</div>
      <div class="alt-modal-ex">${ex.name}</div>
    </div>
    <div class="alt-modal-body">
      <div class="alt-field"><div class="alt-field-label">Substitute exercise (optional)</div>
        <input class="alt-input" type="text" placeholder="e.g. Dumbbell Press" id="altExInput" value="${altVal}"></div>
      <div class="alt-row">
        <div class="alt-field"><div class="alt-field-label">Sets</div><input class="alt-input" type="number" placeholder="${ex.sets||'3 sets'}" id="altSetsInput"></div>
        <div class="alt-field"><div class="alt-field-label">Reps</div><input class="alt-input" type="text" placeholder="${ex.reps||'10'}" id="altRepsInput"></div>
      </div>
    </div>
    <div class="alt-modal-footer">
      <button class="alt-save-btn" onclick="saveAlt()">Save</button>
      <button class="alt-clear-btn" onclick="clearAlt()">Clear</button>
    </div>
  </div>`;
  backdrop.addEventListener('click', e => { if (e.target === backdrop) backdrop.remove(); });
  document.body.appendChild(backdrop);
  requestAnimationFrame(() => backdrop.classList.add('open'));
}
function saveAlt() {
  if (!AppState.altTarget) return;
  const { cid, dayId, exIdx } = AppState.altTarget;
  const altEx   = document.getElementById('altExInput')?.value?.trim();
  const altSets = document.getElementById('altSetsInput')?.value?.trim();
  const altReps = document.getElementById('altRepsInput')?.value?.trim();
  const saved = getLS('wl_' + cid + '_' + dayId, {});
  saved['alt_' + exIdx]      = altEx;
  saved['altSets_' + exIdx]  = altSets;
  saved['altReps_' + exIdx]  = altReps;
  localStorage.setItem('wl_' + cid + '_' + dayId, JSON.stringify(saved));
  document.getElementById('altModalBackdrop')?.remove();
  showFitToast('Alternative saved');
  renderContent(currentClient);
}
function clearAlt() {
  if (!AppState.altTarget) return;
  const { cid, dayId, exIdx } = AppState.altTarget;
  const saved = getLS('wl_' + cid + '_' + dayId, {});
  delete saved['alt_' + exIdx];
  delete saved['altSets_' + exIdx];
  delete saved['altReps_' + exIdx];
  localStorage.setItem('wl_' + cid + '_' + dayId, JSON.stringify(saved));
  document.getElementById('altModalBackdrop')?.remove();
  showFitToast('Alternative cleared');
  renderContent(currentClient);
}




function quickLogWorkout(cid) {
  const cal   = parseInt(document.getElementById('ql-cal-'+cid)?.value)||0;
  const dur   = parseInt(document.getElementById('ql-dur-'+cid)?.value)||0;
  const type  = document.getElementById('ql-type-'+cid)?.value || 'Workout';
  const notes = document.getElementById('ql-notes-'+cid)?.value?.trim() || '';
  if (!cal && !dur) { showFitToast('Enter calories or duration'); return; }
  const logs = getFitnessLogs(cid);
  const entry = { date: new Date().toISOString(), calories: cal, duration: dur, type };
  if (notes) entry.notes = notes;
  logs.push(entry);
  saveFitnessLogs(cid, logs);
  const calEl   = document.getElementById('ql-cal-'+cid);
  const durEl   = document.getElementById('ql-dur-'+cid);
  const notesEl = document.getElementById('ql-notes-'+cid);
  if (calEl)   calEl.value   = '';
  if (durEl)   durEl.value   = '';
  if (notesEl) notesEl.value = '';
  showFitToast('Workout saved!');
  awardXP(cid, 'workout');
  sbAutoSync(cid);
  if (currentClient && currentClient.id === cid) checkMilestones(currentClient);
  // Refresh home
  const homePanel = document.getElementById('panel-home');
  if (homePanel && currentClient && currentClient.id === cid) homePanel.innerHTML = renderHome(currentClient);
}


/* ══════════════════════════════════════════════════════════════
   AI WORKOUT BUILDER — describe a session, AI generates one
   biased toward exercises the client has already logged.
══════════════════════════════════════════════════════════════ */

// Walk all wl_hist_<cid>_* and wl_<cid>_* keys, dedupe by exercise name,
// and capture last logged weight/reps + total times logged.
function _collectLoggedExercises(cid) {
  const map = {}; // name -> { name, lastWeight, lastReps, lastDate, timesLogged }
  const ingest = (sessionDate, exercisesObj) => {
    if (!exercisesObj) return;
    Object.values(exercisesObj).forEach(ex => {
      if (!ex || !ex.name) return;
      const name = String(ex.name).trim();
      if (!name) return;
      const sets = Array.isArray(ex.sets) ? ex.sets : [];
      const lastSet = [...sets].reverse().find(s => s && (s.weight || s.reps));
      const entry = map[name] || { name, lastWeight: '', lastReps: '', lastDate: '', timesLogged: 0 };
      entry.timesLogged += sets.filter(s => s && (s.done || s.weight || s.reps)).length || 1;
      if (lastSet && (!entry.lastDate || sessionDate > entry.lastDate)) {
        entry.lastWeight = lastSet.weight || entry.lastWeight;
        entry.lastReps   = lastSet.reps   || entry.lastReps;
        entry.lastDate   = sessionDate || entry.lastDate;
      }
      map[name] = entry;
    });
  };

  try {
    const histPrefix = 'wl_hist_' + cid + '_';
    const livePrefix = 'wl_' + cid + '_';
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k.startsWith(histPrefix)) {
        const arr = safeJSON(localStorage.getItem(k), []);
        if (Array.isArray(arr)) arr.forEach(entry => ingest(entry?.date || '', entry?.exercises));
      } else if (k.startsWith(livePrefix) && !k.startsWith(histPrefix)) {
        const obj = safeJSON(localStorage.getItem(k), null);
        if (obj && obj.exercises) ingest(obj.savedAt || obj._countedDate || '', obj.exercises);
      }
    }
  } catch (_) {}

  // Sort: most-frequent first, then most-recent
  return Object.values(map)
    .sort((a, b) => (b.timesLogged - a.timesLogged) || String(b.lastDate).localeCompare(String(a.lastDate)))
    .slice(0, 80); // cap for prompt size
}

function openAIBuildWorkout(cid) {
  const c = getAllClients().find(cl => cl.id === cid);
  if (!c) { showFitToast('Client not found'); return; }

  const existing = document.getElementById('aiBuildOverlay');
  if (existing) existing.remove();

  const accent = c.accent || 'var(--accent)';
  const ov = document.createElement('div');
  ov.id = 'aiBuildOverlay';
  ov.className = 'ai-review-overlay';
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  ov.innerHTML = `
    <div class="ai-review-sheet">
      <div class="ai-review-header">
        <div class="ai-review-title">
          <span>AI Workout Builder</span>
          <button onclick="document.getElementById('aiBuildOverlay')?.remove()" style="background:none;border:none;color:var(--muted);font-size:20px;cursor:pointer;padding:4px">&times;</button>
        </div>
        <div class="ai-review-sub">${esc(c.name)} &middot; describe what you want, AI builds it from movements you've logged before</div>
      </div>
      <div class="ai-review-body" id="aiBuildBody">
        <label style="display:block;font-family:'Geist Mono',monospace;font-size:10px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">What do you want to train?</label>
        <textarea id="aiBuildPrompt" maxlength="1000" rows="4"
          placeholder="e.g. 45 min upper body push, focus on shoulders, no bench access today"
          style="width:100%;padding:12px;border:1px solid var(--border);border-radius:8px;background:var(--surface2);color:var(--text);font-family:inherit;font-size:14px;resize:vertical"></textarea>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
          ${['30 min full-body','45 min upper push','60 min legs','30 min conditioning','45 min pull day','recovery / mobility']
            .map(p => `<button onclick="document.getElementById('aiBuildPrompt').value='${esc(p)}';document.getElementById('aiBuildPrompt').focus()" style="background:var(--surface2);border:1px solid var(--border);color:var(--muted);font-family:'Geist Mono',monospace;font-size:9px;padding:6px 10px;border-radius:6px;cursor:pointer;letter-spacing:.5px">${esc(p)}</button>`).join('')}
        </div>
        <button id="aiBuildGo" onclick="runAIBuildWorkout('${esc(cid)}')"
          style="width:100%;margin-top:16px;background:${esc(accent)};border:none;color:#000;font-family:'Geist Mono',monospace;font-size:11px;font-weight:700;letter-spacing:1.5px;padding:14px;border-radius:8px;cursor:pointer">GENERATE WORKOUT</button>
        <div id="aiBuildResult" style="margin-top:18px"></div>
      </div>
    </div>`;
  document.body.appendChild(ov);
  setTimeout(() => document.getElementById('aiBuildPrompt')?.focus(), 100);
}

async function runAIBuildWorkout(cid) {
  const promptEl = document.getElementById('aiBuildPrompt');
  const btn      = document.getElementById('aiBuildGo');
  const resEl    = document.getElementById('aiBuildResult');
  const description = (promptEl?.value || '').trim();
  if (!description) { showFitToast('Describe what you want to train'); return; }
  if (!resEl || !btn) return;

  const c = getAllClients().find(cl => cl.id === cid);
  if (!c) return;
  const logged = _collectLoggedExercises(cid);

  btn.disabled = true;
  btn.textContent = 'GENERATING...';
  resEl.innerHTML = `<div style="text-align:center;color:var(--muted);font-family:'Geist Mono',monospace;font-size:10px;letter-spacing:1px;padding:20px">Building your session...</div>`;

  try {
    const r = await fetch('/api/ai-build-workout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description,
        clientName:  c.name || '',
        goal:        c.goal || '',
        programType: c.programType || c.program_type || '',
        loggedExercises: logged,
      }),
    });
    const data = await r.json();
    if (!data.ok) throw new Error(data.error || 'AI request failed');
    resEl.innerHTML = _renderAiWorkoutResult(data.workout, cid, logged);
  } catch (e) {
    console.error('AI build workout:', e);
    resEl.innerHTML = `<div style="color:#e74c3c;font-family:'Geist Mono',monospace;font-size:11px;padding:12px;border:1px solid rgba(231,76,60,.3);border-radius:6px;background:rgba(231,76,60,.05)">Error: ${esc(e.message || 'Could not generate workout')}</div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = 'GENERATE WORKOUT';
  }
}

// Stash for the action buttons so we don't have to escape JSON into HTML attributes
window._aiBuildLast = null;
function _renderAiWorkoutResult(w, cid, logged) {
  window._aiBuildLast = { workout: w, cid };
  const loggedNames = new Set((logged || []).map(x => x.name.toLowerCase()));
  const blocksHtml = (w.blocks || []).map(b => {
    const exHtml = (b.exercises || []).map(e => {
      const isNew = !!e.isNew || !loggedNames.has(String(e.name || '').toLowerCase());
      const newBadge = isNew
        ? `<span style="display:inline-block;font-family:'Geist Mono',monospace;font-size:8px;padding:2px 6px;border-radius:4px;background:rgba(241,196,15,.15);color:#f1c40f;letter-spacing:1px;margin-left:6px">NEW</span>`
        : '';
      const meta = [e.sets, e.reps, e.rest && ('rest ' + e.rest)].filter(Boolean).join(' &middot; ');
      return `<div style="padding:10px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface2);margin-bottom:8px">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
          <div style="font-weight:600;font-size:14px">${esc(e.name || '')}${newBadge}</div>
          <div style="font-family:'Geist Mono',monospace;font-size:10px;color:var(--muted);white-space:nowrap">${meta}</div>
        </div>
        ${e.note ? `<div style="font-size:12px;color:var(--muted);margin-top:6px">${esc(e.note)}</div>` : ''}
      </div>`;
    }).join('');
    return `<div style="margin-bottom:14px">
      <div style="font-family:'Geist Mono',monospace;font-size:10px;letter-spacing:2px;color:var(--muted);text-transform:uppercase;margin-bottom:8px">${esc(b.label || 'Block')}</div>
      ${exHtml}
    </div>`;
  }).join('');

  return `
    <div style="border-top:1px solid var(--border);padding-top:14px;margin-top:6px">
      <div style="font-family:var(--display);font-weight:700;font-size:24px;letter-spacing:1px;margin-bottom:4px">${esc(w.title || 'Today\'s Session')}</div>
      ${w.summary ? `<div style="font-size:13px;color:var(--muted);margin-bottom:14px">${esc(w.summary)}</div>` : ''}
      ${blocksHtml}
      <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
        <button onclick="aiBuildAddToProgram()"
          style="flex:1;min-width:140px;background:var(--accent);border:none;color:#000;font-family:'Geist Mono',monospace;font-size:10px;font-weight:700;letter-spacing:1px;padding:12px;border-radius:8px;cursor:pointer">ADD TO PROGRAM</button>
        <button onclick="aiBuildCopyText()"
          style="flex:1;min-width:120px;background:var(--surface2);border:1px solid var(--border);color:var(--text);font-family:'Geist Mono',monospace;font-size:10px;letter-spacing:1px;padding:12px;border-radius:8px;cursor:pointer">COPY TEXT</button>
      </div>
    </div>`;
}

function aiBuildCopyText() {
  const w = window._aiBuildLast?.workout;
  if (!w) return;
  const lines = [w.title || 'Workout'];
  if (w.summary) lines.push(w.summary);
  lines.push('');
  (w.blocks || []).forEach(b => {
    lines.push((b.label || 'Block').toUpperCase());
    (b.exercises || []).forEach(e => {
      const meta = [e.sets, e.reps, e.rest && ('rest ' + e.rest)].filter(Boolean).join(' / ');
      lines.push('  - ' + (e.name || '') + (meta ? '  [' + meta + ']' : '') + (e.isNew ? '  (NEW)' : ''));
      if (e.note) lines.push('      ' + e.note);
    });
    lines.push('');
  });
  const text = lines.join('\n');
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(() => showFitToast('Copied to clipboard')).catch(() => showFitToast('Copy failed'));
  } else {
    showFitToast('Clipboard unavailable');
  }
}

function aiBuildAddToProgram() {
  const stash = window._aiBuildLast;
  if (!stash) return;
  const cid = stash.cid;
  const w   = stash.workout;
  const list = getDynamicClients();
  const idx  = list.findIndex(c => c.id === cid);
  if (idx < 0) {
    // Built-in client — fall back to in-memory currentClient and warn that it won't persist on a new device
    if (!(AppState.currentClient && AppState.currentClient.id === cid)) {
      showFitToast('Cannot add to a built-in client program');
      return;
    }
  }
  const target = idx >= 0 ? list[idx] : AppState.currentClient;
  target.data = target.data || {};
  target.data.workouts = target.data.workouts || { days: [] };

  const id = 'ai-' + Date.now().toString(36);
  const day = {
    id,
    label: 'AI - ' + (w.title || 'Custom Day'),
    title: w.title || 'AI Custom Day',
    sub:   w.summary || '',
    blocks: (w.blocks || []).map(b => ({
      label: b.label || 'Block',
      exercises: (b.exercises || []).map(e => ({
        name:  e.name  || '',
        sets:  e.sets  || '',
        reps:  e.reps  || '',
        rest:  e.rest  || '',
        note:  (e.note || '') + (e.isNew ? (e.note ? ' ' : '') + '(new movement)' : ''),
      })),
    })),
  };
  target.data.workouts.days.push(day);

  if (idx >= 0) saveDynamicClients(list);
  if (AppState.currentClient && AppState.currentClient.id === cid) {
    AppState.currentClient = target;
    currentClient = target;
  }
  sbAutoSync(cid);
  showFitToast('Added "' + day.label + '" to program');

  // Re-render workouts tab if currently visible
  const wPanel = document.getElementById('panel-workouts');
  if (wPanel && AppState.currentClient && AppState.currentClient.id === cid) {
    try { wPanel.innerHTML = renderWorkouts(target.data.workouts, target); } catch (_) {}
  }
  document.getElementById('aiBuildOverlay')?.remove();
}

function buildModeBadge(mode) {
  var styles = {
    inperson:  ['rgba(46,204,113,.12)', '#2ecc71', '🏋️ In-Person'],
    remote:    ['rgba(52,152,219,.12)', '#3498db', '📡 Remote'],
    blueprint: ['rgba(59,158,255,.12)', '#3B9EFF', '⚡ Blueprint'],
  };
  var s = styles[mode] || styles.inperson;
  return '<span style="font-size:8px;font-weight:600;padding:3px 8px;border-radius:4px;background:' + s[0] + ';color:' + s[1] + '">' + s[2] + '</span>';
}


function obCalcBF() {
  let bf;
  const state = AppState.obState;
  if (state.bfMode === 'direct') {
    const pct = parseFloat(state.bfPctDirect);
    const wt  = parseFloat(state.weightLbs);
    if (!pct || pct <= 0 || pct >= 60) { bf = null; }
    else {
      const fatMass = wt ? Math.round(wt * pct / 100 * 10) / 10 : null;
      const lean    = wt ? Math.round((wt - wt * pct / 100) * 10) / 10 : null;
      bf = {
        fatPct: Math.round(pct * 10) / 10,
        fatMassLbs: fatMass,
        leanMassLbs: lean,
        sumSF: null,
        category: bodyFatCategory(pct, state.sex),
      };
    }
  } else {
    bf = calcBodyFat(state.sfBicep, state.sfTricep, state.sfSuprailiac, state.sfSubscap, state.age, state.sex);
  }
  const el = document.getElementById('ob-bf-result');
  if (!el) return;
  if (!bf) { el.style.display = 'none'; return; }
  el.style.display = 'block';
  const pctEl  = document.getElementById('ob-bf-pct');
  const catEl  = document.getElementById('ob-bf-cat');
  const leanEl = document.getElementById('ob-bf-lean');
  const fatEl  = document.getElementById('ob-bf-fat');
  const sumEl  = document.getElementById('ob-bf-sum');
  if (pctEl)  { pctEl.textContent  = bf.fatPct + '%'; pctEl.style.color = bf.category.color; }
  if (catEl)  { catEl.textContent  = bf.category.label; catEl.style.color = bf.category.color; }
  if (leanEl) leanEl.textContent   = (bf.leanMassLbs!=null?bf.leanMassLbs+' lbs lean':'');
  if (fatEl)  fatEl.textContent    = (bf.fatMassLbs!=null?bf.fatMassLbs+' lbs fat':'');
  if (sumEl)  sumEl.textContent    = (bf.sumSF!=null?bf.sumSF+'mm sum':(state.bfMode==='direct'?'Direct entry':''));
  // Also refresh macro preview
  obUpdateMacroPreview();
}

function obUpdateMacroPreview() {
  var el = document.getElementById('ob-macro-preview');
  if (!el) return;
  if (!AppState.obState.weightLbs || !AppState.obState.age) { el.style.display = 'none'; return; }
  var m = calcClientMacros(AppState.obState);
  el.style.display = 'block';
  var monoSt = 'font-size:9px;color:var(--muted);letter-spacing:1px';
  el.innerHTML = '<div style="' + monoSt + ';text-transform:uppercase;margin-bottom:10px">Calculated Nutrition Plan</div>'
    + '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px">'
    + macroCell(m.calories.toLocaleString(), 'Calories', 'var(--accent)')
    + macroCell(m.protein + 'g', 'Protein', '#ff9f7a')
    + macroCell(m.carbs + 'g', 'Carbs', 'var(--accent)')
    + macroCell(m.fat + 'g', 'Fat', '#aaa')
    + '</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px">'
    + '<div style="background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:8px 10px">'
    + '<div style="font-size:8px;color:var(--accent);letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Training Day</div>'
    + '<div style="font-size:13px;font-weight:700;color:var(--accent)">' + m.trainingDay.calories.toLocaleString() + ' kcal</div>'
    + '<div style="font-size:9px;color:var(--muted)">' + m.trainingDay.carbs + 'g carbs · ' + m.trainingDay.protein + 'g P · ' + m.trainingDay.fat + 'g F</div>'
    + '</div>'
    + '<div style="background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:8px 10px">'
    + '<div style="font-size:8px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Rest Day</div>'
    + '<div style="font-size:13px;font-weight:700;color:var(--text)">' + m.restDay.calories.toLocaleString() + ' kcal</div>'
    + '<div style="font-size:9px;color:var(--muted)">' + m.restDay.carbs + 'g carbs · ' + m.restDay.protein + 'g P · ' + m.restDay.fat + 'g F</div>'
    + '</div>'
    + '</div>'
    + '<div style="' + monoSt + ';line-height:1.9">'
    + 'BMR: <b>' + m.bmr + '</b> kcal &nbsp;·&nbsp; TDEE: <b>' + m.tdee + '</b> kcal<br>'
    + 'Goal: ' + m.goalLabel + '<br>'
    + m.rateNote
    + '</div>';
}

function macroCell(val, label, color) {
  return '<div style="background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:10px 4px;text-align:center">'
    + '<div style="font-size:22px;font-weight:700;letter-spacing:0.5px;color:' + color + '">' + val + '</div>'
    + '<div style="font-size:8px;color:var(--muted);letter-spacing:1px;margin-top:3px;text-transform:uppercase">' + label + '</div>'
    + '</div>';
}


