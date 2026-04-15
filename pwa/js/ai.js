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
        <div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--muted);letter-spacing:1px">ANALYZING TRAINING DATA</div>
        <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--faint);margin-top:6px">This takes 5–10 seconds</div>
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
      <button onclick="closeAIReviewModal()" style="background:var(--surface2);border:1px solid var(--border);color:var(--muted);border-radius:6px;padding:8px 20px;font-family:'DM Mono',monospace;font-size:10px;cursor:pointer">Close</button>
      <button onclick="closeAIReviewModal();setTimeout(()=>openAIReview('${esc(cid)}'),50)" style="background:var(--accent);border:none;color:#000;border-radius:6px;padding:8px 20px;font-family:'DM Mono',monospace;font-size:10px;cursor:pointer;font-weight:600">Retry</button>
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
      ? `<div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--muted);text-align:center;padding:20px 0">No changes recommended — program looks solid.</div>`
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
    <div style="font-size:28px;font-weight:900;letter-spacing:3px;color:#fff">CRAZYY<span style="color:#ff6b35">FIT</span></div>
  </div>
  <div style="background:#111;border:1px solid #222;border-radius:16px;padding:32px;margin-bottom:20px;">
    <div style="font-size:15px;font-weight:600;color:#fff;margin-bottom:6px">Hey ${esc(firstName)},</div>
    <div style="font-size:11px;letter-spacing:2px;color:#e8ff47;text-transform:uppercase;margin-bottom:14px">Program Update</div>
    <div style="font-size:15px;color:#ccc;line-height:1.7;margin-bottom:20px">
      Your coach has updated your training program based on your recent performance and progress data.
    </div>
    ${changes ? `<div style="background:#1a1a1a;border:1px solid #333;border-radius:10px;padding:14px 16px;margin-bottom:20px;font-family:monospace;font-size:12px;color:#aaa;line-height:1.6">Changes include: ${esc(changes)}</div>` : ''}
    <div style="font-size:13px;color:#888;margin-bottom:24px">Open the app to see your updated workout plan.</div>
    ${appUrl ? `<a href="${esc(appUrl)}" style="display:block;text-align:center;background:#ff6b35;color:#000;font-weight:700;font-size:15px;letter-spacing:2px;text-decoration:none;padding:16px;border-radius:10px;text-transform:uppercase">Open CrazyyFit →</a>` : ''}
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
  if (!log.length) return '<div style="font-family:\'DM Mono\',monospace;font-size:10px;color:var(--muted);padding:4px 0 8px">No notes yet. Add one below.</div>';
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
  if (!clients.length) return '<div style="font-family:\'DM Mono\',monospace;font-size:11px;color:var(--muted);padding:8px 0">No clients yet.</div>';
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
    name: c.name, accent: c.accent || '#ff6b35',
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
      ${avgAdherence !== null ? `<div class="analytics-stat"><div class="analytics-stat-val" style="color:#e8ff47">${avgAdherence}</div><div class="analytics-stat-lbl">Avg Adherence</div></div>` : ''}
    </div>
    ${atRisk.length > 0 ? `
    <div style="font-family:'DM Mono',monospace;font-size:9px;color:#e74c3c;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">⚠ At-Risk Clients</div>
    ${atRisk.map(c => {
      const ls = localStorage.getItem('last_seen_' + c.id);
      const days = ls ? Math.floor((now - parseInt(ls)) / 86400000) : null;
      return `<div class="analytics-risk-item"><div class="analytics-risk-dot" style="background:${c.accent||'#e74c3c'}"></div><span style="flex:1">${esc(c.name)}</span><span style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted)">${days!==null?days+'d inactive':'Never logged in'}</span></div>`;
    }).join('')}` : ''}
    ${leaders.length > 0 ? `
    <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin-top:14px;margin-bottom:8px">🏆 Top Sessions This Month</div>
    ${leaders.map((l, i) => `<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--faint)">
      <span style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);width:14px">${i+1}.</span>
      <span style="flex:1;font-size:12px">${esc(l.name)}</span>
      <span style="font-family:'DM Mono',monospace;font-size:11px;font-weight:700;color:${l.accent}">${l.count} sessions</span>
    </div>`).join('')}` : ''}`;
}

/* ── ACHIEVEMENT BADGES ──────────────────────────────────────── */
function renderBadgesScreen(c) {
  const unlocked = getUnlockedMilestones(c.id);
  const earned = MILESTONES.filter(m => unlocked.includes(m.id));
  const locked = MILESTONES.filter(m => !unlocked.includes(m.id) && m.type !== 'weight_pct' && !(m.type === 'weight' && !c.weightLoss));
  const earnedHtml = earned.length > 0
    ? `<div class="badges-grid">${earned.map(m => `
        <div class="badge-chip earned">
          <div class="badge-chip-icon">${m.emoji}</div>
          <div class="badge-chip-name">${esc(m.label)}</div>
        </div>`).join('')}</div>`
    : `<div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--muted);padding:12px 0">No badges yet — complete workouts, hit PRs, and track your macros!</div>`;
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
      <div style="font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:1px">${esc(c.name)}'s Badges</div>
      <button onclick="this.closest('[style]').remove()" style="background:none;border:1px solid var(--border);border-radius:8px;padding:6px 12px;color:var(--muted);cursor:pointer">✕</button>
    </div>
    ${earned.length === 0 ? `<div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--muted)">No badges unlocked yet.</div>` : `
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
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#ff6b35';
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
  ctx.font = 'bold 14px "DM Mono", monospace';
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
function saveMovementLibrary(lib) { localStorage.setItem('movement_library', JSON.stringify(lib)); }

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
    ? `<div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--muted);text-align:center;padding:32px 0">${lib.length===0?'Library is empty — add your first exercise above.':'No results for "'+esc(q)+'"'}</div>`
    : filtered.map(e => `
      <div class="library-item">
        <div class="library-item-info">
          <div class="library-item-name">${esc(e.name)}</div>
          <div class="library-item-meta">${[e.muscleGroups,e.equipment].filter(Boolean).join(' · ')}</div>
          ${e.coachNotes ? `<div style="font-size:11px;color:var(--muted);margin-top:4px;line-height:1.4">${esc(e.coachNotes)}</div>` : ''}
          ${e.videoUrl ? `<a href="${esc(e.videoUrl)}" target="_blank" rel="noopener noreferrer" style="font-family:'DM Mono',monospace;font-size:9px;color:var(--accent);margin-top:4px;display:inline-block">▶ Watch</a>` : ''}
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
    ? `<div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--muted);padding:8px 0">No phases yet. Add one below.</div>`
    : phases.map(p => `
      <div class="period-list-item">
        <div class="period-list-dot" style="background:${p.color||'#555'}"></div>
        <div class="period-list-info">
          <div class="period-list-name">${esc(p.name)}</div>
          <div class="period-list-dates">${p.phase?esc(p.phase)+' · ':''}${p.startDate||'?'} → ${p.endDate||'?'}${p.notes?' · '+esc(p.notes):''}</div>
        </div>
        <button onclick="deletePeriodPhase('${p.id}')" style="background:none;border:1px solid rgba(231,76,60,.3);border-radius:5px;padding:4px 8px;font-size:9px;color:#e74c3c;cursor:pointer;font-family:'DM Mono',monospace">✕</button>
      </div>`).join('');

  const phaseColors = ['#e8ff47','#ff6b35','#2ecc71','#3498db','#9b59b6','#e74c3c','#f1c40f'];
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
    color: document.getElementById('periodColorVal')?.value || '#e8ff47',
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
      const sets1 = (ex1.sets || []).filter(s => s.weight && s.reps);
      const sets2 = (ex2.sets || []).filter(s => s.weight && s.reps);
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
    <div style="font-family:'DM Mono',monospace;font-size:9px;color:#2ecc71;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px">Progressive Overload Ready</div>
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
    <div style="font-size:28px;font-weight:900;letter-spacing:3px;color:#fff;">CRAZYY<span style="color:#ff6b35">FIT</span></div>
    <div style="font-size:11px;color:#555;letter-spacing:2px;margin-top:4px;">YOUR PERSONAL TRAINING HUB</div>
  </div>
  <div style="background:#111;border:1px solid #222;border-radius:16px;padding:32px;margin-bottom:20px;">
    <div style="font-size:22px;font-weight:700;color:#fff;margin-bottom:6px;">Welcome, ${name}!</div>
    <div style="font-size:13px;color:#888;margin-bottom:24px;">Your <strong style="color:#ff6b35">${planLabel}</strong> is ready. Here are your login details.</div>
    <div style="background:#1a1a1a;border:1px solid #333;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
      <div style="font-size:10px;letter-spacing:2px;color:#666;text-transform:uppercase;margin-bottom:8px;">Your App PIN</div>
      <div style="font-size:48px;font-weight:900;letter-spacing:12px;color:#ff6b35;font-family:monospace;">${pin}</div>
      <div style="font-size:11px;color:#555;margin-top:8px;">Keep this private — it's your personal login</div>
    </div>
    <div style="font-size:13px;color:#ccc;line-height:2;margin-bottom:24px;">
      <strong style="color:#888;font-size:11px;letter-spacing:1px;text-transform:uppercase;">How to log in</strong><br>
      1 · Open the app using the button below<br>
      2 · Tap your name on the login screen<br>
      3 · Enter your 4-digit PIN
    </div>
    <a href="${appUrl}" style="display:block;text-align:center;background:#ff6b35;color:#000;font-weight:700;font-size:15px;letter-spacing:2px;text-decoration:none;padding:16px;border-radius:10px;text-transform:uppercase;">Open CrazyyFit →</a>
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
    <div style="font-size:28px;font-weight:900;letter-spacing:3px;color:#fff;">CRAZYY<span style="color:#ff6b35">FIT</span></div>
  </div>
  <div style="background:#111;border:1px solid #222;border-radius:16px;padding:32px;margin-bottom:20px;">
    <div style="font-size:11px;letter-spacing:2px;color:#e8ff47;text-transform:uppercase;margin-bottom:14px;">Message from your coach</div>
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
    <div style="font-size:28px;font-weight:900;letter-spacing:3px;color:#fff;">CRAZYY<span style="color:#ff6b35">FIT</span></div>
  </div>
  <div style="background:#111;border:1px solid #222;border-radius:16px;padding:32px;margin-bottom:20px;">
    <div style="font-size:15px;font-weight:600;color:#fff;margin-bottom:6px;">Hey ${firstName},</div>
    <div style="font-size:11px;letter-spacing:2px;color:#ff6b35;text-transform:uppercase;margin-bottom:14px;">Message from your coach</div>
    <div style="font-size:15px;color:#e0e0e0;line-height:1.8;white-space:pre-wrap;border-left:3px solid #ff6b35;padding-left:16px;">${message}</div>
    ${appUrl ? `<a href="${appUrl}" style="display:block;text-align:center;margin-top:24px;background:#ff6b35;color:#000;font-weight:700;font-size:13px;letter-spacing:2px;text-decoration:none;padding:14px;border-radius:10px;text-transform:uppercase;">Open CrazyyFit →</a>` : ''}
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
    showFitToast('Email failed — check Resend config in Netlify env vars');
    if (btn) { btn.disabled = false; btn.textContent = 'Retry'; }
    if (status) status.innerHTML = 'Email: <span style="color:#e74c3c">Failed — tap Retry below</span>';
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
  {name:'Cable Crossover',muscle:'Chest',sets:'3',reps:'12–15'},
  {name:'Pec Deck Machine',muscle:'Chest',sets:'3',reps:'12–15'},
  {name:'Push-Up',muscle:'Chest',sets:'4',reps:'15–20'},
  {name:'Incline Push-Up',muscle:'Chest',sets:'3',reps:'15–20'},
  {name:'Decline Push-Up',muscle:'Chest',sets:'3',reps:'15–20'},
  {name:'Diamond Push-Up',muscle:'Chest',sets:'3',reps:'10–15'},
  {name:'Dumbbell Pullover',muscle:'Chest',sets:'3',reps:'12–15'},
  {name:'Landmine Press',muscle:'Chest',sets:'3',reps:'10–12'},
  {name:'Smith Machine Bench Press',muscle:'Chest',sets:'4',reps:'8–10'},
  // BACK
  {name:'Pull-Up',muscle:'Back',sets:'4',reps:'6–10'},
  {name:'Chin-Up',muscle:'Back',sets:'4',reps:'6–10'},
  {name:'Lat Pulldown',muscle:'Back',sets:'4',reps:'10–12'},
  {name:'Seated Cable Row',muscle:'Back',sets:'4',reps:'10–12'},
  {name:'Barbell Row',muscle:'Back',sets:'4',reps:'8–10'},
  {name:'Dumbbell Row',muscle:'Back',sets:'4',reps:'10–12'},
  {name:'T-Bar Row',muscle:'Back',sets:'4',reps:'8–10'},
  {name:'Chest-Supported Row',muscle:'Back',sets:'3',reps:'10–12'},
  {name:'Meadows Row',muscle:'Back',sets:'3',reps:'10–12'},
  {name:'Straight-Arm Pulldown',muscle:'Back',sets:'3',reps:'12–15'},
  {name:'Face Pull',muscle:'Back',sets:'3',reps:'15–20'},
  {name:'Hyperextension',muscle:'Back',sets:'3',reps:'12–15'},
  {name:'Good Morning',muscle:'Back',sets:'3',reps:'10–12'},
  {name:'Deadlift',muscle:'Back',sets:'4',reps:'4–6'},
  {name:'Rack Pull',muscle:'Back',sets:'4',reps:'4–6'},
  {name:'Superman',muscle:'Back',sets:'3',reps:'15–20'},
  // SHOULDERS
  {name:'Overhead Press (Barbell)',muscle:'Shoulders',sets:'4',reps:'6–8'},
  {name:'Dumbbell Shoulder Press',muscle:'Shoulders',sets:'4',reps:'10–12'},
  {name:'Arnold Press',muscle:'Shoulders',sets:'3',reps:'10–12'},
  {name:'Lateral Raise',muscle:'Shoulders',sets:'4',reps:'15–20'},
  {name:'Cable Lateral Raise',muscle:'Shoulders',sets:'3',reps:'15–20'},
  {name:'Front Raise',muscle:'Shoulders',sets:'3',reps:'12–15'},
  {name:'Rear Delt Fly',muscle:'Shoulders',sets:'4',reps:'15–20'},
  {name:'Reverse Pec Deck',muscle:'Shoulders',sets:'3',reps:'15–20'},
  {name:'Upright Row',muscle:'Shoulders',sets:'3',reps:'10–12'},
  {name:'Push Press',muscle:'Shoulders',sets:'4',reps:'6–8'},
  {name:'Landmine Lateral Raise',muscle:'Shoulders',sets:'3',reps:'12–15'},
  {name:'Machine Shoulder Press',muscle:'Shoulders',sets:'3',reps:'10–12'},
  {name:'Cable Front Raise',muscle:'Shoulders',sets:'3',reps:'12–15'},
  {name:'Plate Front Raise',muscle:'Shoulders',sets:'3',reps:'12–15'},
  // BICEPS
  {name:'Barbell Curl',muscle:'Biceps',sets:'4',reps:'10–12'},
  {name:'Dumbbell Curl',muscle:'Biceps',sets:'3',reps:'10–12'},
  {name:'Hammer Curl',muscle:'Biceps',sets:'3',reps:'10–12'},
  {name:'Incline Dumbbell Curl',muscle:'Biceps',sets:'3',reps:'10–12'},
  {name:'Cable Curl',muscle:'Biceps',sets:'3',reps:'12–15'},
  {name:'Preacher Curl',muscle:'Biceps',sets:'3',reps:'10–12'},
  {name:'Concentration Curl',muscle:'Biceps',sets:'3',reps:'12–15'},
  {name:'Reverse Curl',muscle:'Biceps',sets:'3',reps:'12–15'},
  {name:'Spider Curl',muscle:'Biceps',sets:'3',reps:'12–15'},
  {name:'Rope Curl',muscle:'Biceps',sets:'3',reps:'12–15'},
  {name:'Cross-Body Hammer Curl',muscle:'Biceps',sets:'3',reps:'12–15'},
  {name:'EZ-Bar Curl',muscle:'Biceps',sets:'4',reps:'10–12'},
  {name:'Zottman Curl',muscle:'Biceps',sets:'3',reps:'10–12'},
  {name:'21s',muscle:'Biceps',sets:'3',reps:'21'},
  // TRICEPS
  {name:'Close-Grip Bench Press',muscle:'Triceps',sets:'4',reps:'8–10'},
  {name:'Skull Crusher',muscle:'Triceps',sets:'4',reps:'10–12'},
  {name:'Tricep Pushdown (Cable)',muscle:'Triceps',sets:'4',reps:'12–15'},
  {name:'Overhead Tricep Extension',muscle:'Triceps',sets:'3',reps:'10–12'},
  {name:'Dumbbell Kickback',muscle:'Triceps',sets:'3',reps:'12–15'},
  {name:'Dips',muscle:'Triceps',sets:'3',reps:'10–15'},
  {name:'Bench Dip',muscle:'Triceps',sets:'3',reps:'12–15'},
  {name:'Rope Pushdown',muscle:'Triceps',sets:'3',reps:'12–15'},
  {name:'Single-Arm Cable Pushdown',muscle:'Triceps',sets:'3',reps:'12–15'},
  {name:'JM Press',muscle:'Triceps',sets:'3',reps:'10–12'},
  {name:'Board Press',muscle:'Triceps',sets:'4',reps:'6–8'},
  {name:'Tate Press',muscle:'Triceps',sets:'3',reps:'10–12'},
  // LEGS - QUADS
  {name:'Barbell Back Squat',muscle:'Quads',sets:'4',reps:'6–8'},
  {name:'Front Squat',muscle:'Quads',sets:'4',reps:'6–8'},
  {name:'Goblet Squat',muscle:'Quads',sets:'3',reps:'12–15'},
  {name:'Bulgarian Split Squat',muscle:'Quads',sets:'3',reps:'10–12'},
  {name:'Leg Press',muscle:'Quads',sets:'4',reps:'12–15'},
  {name:'Hack Squat',muscle:'Quads',sets:'4',reps:'10–12'},
  {name:'Leg Extension',muscle:'Quads',sets:'4',reps:'12–15'},
  {name:'Sissy Squat',muscle:'Quads',sets:'3',reps:'12–15'},
  {name:'Lunge',muscle:'Quads',sets:'3',reps:'12 each'},
  {name:'Walking Lunge',muscle:'Quads',sets:'3',reps:'12 each'},
  {name:'Step-Up',muscle:'Quads',sets:'3',reps:'12 each'},
  {name:'Box Squat',muscle:'Quads',sets:'4',reps:'6–8'},
  {name:'Sumo Squat',muscle:'Quads',sets:'3',reps:'12–15'},
  // LEGS - HAMSTRINGS
  {name:'Romanian Deadlift',muscle:'Hamstrings',sets:'4',reps:'10–12'},
  {name:'Stiff-Leg Deadlift',muscle:'Hamstrings',sets:'4',reps:'10–12'},
  {name:'Lying Leg Curl',muscle:'Hamstrings',sets:'4',reps:'10–12'},
  {name:'Seated Leg Curl',muscle:'Hamstrings',sets:'4',reps:'10–12'},
  {name:'Nordic Curl',muscle:'Hamstrings',sets:'3',reps:'6–8'},
  {name:'Good Morning',muscle:'Hamstrings',sets:'3',reps:'10–12'},
  {name:'Single-Leg RDL',muscle:'Hamstrings',sets:'3',reps:'10 each'},
  {name:'Swiss Ball Leg Curl',muscle:'Hamstrings',sets:'3',reps:'10–12'},
  // LEGS - GLUTES
  {name:'Hip Thrust',muscle:'Glutes',sets:'4',reps:'10–12'},
  {name:'Barbell Glute Bridge',muscle:'Glutes',sets:'4',reps:'12–15'},
  {name:'Cable Kickback',muscle:'Glutes',sets:'3',reps:'15 each'},
  {name:'Donkey Kick',muscle:'Glutes',sets:'3',reps:'15 each'},
  {name:'Sumo Deadlift',muscle:'Glutes',sets:'4',reps:'6–8'},
  {name:'Clamshell',muscle:'Glutes',sets:'3',reps:'20 each'},
  {name:'Lateral Band Walk',muscle:'Glutes',sets:'3',reps:'15 each'},
  {name:'Reverse Hyperextension',muscle:'Glutes',sets:'3',reps:'12–15'},
  // CALVES
  {name:'Standing Calf Raise',muscle:'Calves',sets:'4',reps:'15–20'},
  {name:'Seated Calf Raise',muscle:'Calves',sets:'4',reps:'15–20'},
  {name:'Leg Press Calf Raise',muscle:'Calves',sets:'3',reps:'15–20'},
  {name:'Single-Leg Calf Raise',muscle:'Calves',sets:'3',reps:'15 each'},
  {name:'Donkey Calf Raise',muscle:'Calves',sets:'4',reps:'15–20'},
  // CORE
  {name:'Plank',muscle:'Core',sets:'3',reps:'60 sec'},
  {name:'Side Plank',muscle:'Core',sets:'3',reps:'45 sec each'},
  {name:'Ab Wheel Rollout',muscle:'Core',sets:'3',reps:'10–12'},
  {name:'Cable Crunch',muscle:'Core',sets:'4',reps:'12–15'},
  {name:'Hanging Leg Raise',muscle:'Core',sets:'3',reps:'12–15'},
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
  {name:'Woodchop',muscle:'Core',sets:'3',reps:'12 each'},
  {name:'Toe Touch Crunch',muscle:'Core',sets:'3',reps:'15–20'},
  {name:'Mountain Climber',muscle:'Core',sets:'3',reps:'20 each'},
  // CARDIO / CONDITIONING
  {name:'Treadmill Run',muscle:'Cardio',sets:'1',reps:'20–30 min'},
  {name:'Stationary Bike',muscle:'Cardio',sets:'1',reps:'20–30 min'},
  {name:'Rowing Machine',muscle:'Cardio',sets:'1',reps:'15–20 min'},
  {name:'Stairmaster',muscle:'Cardio',sets:'1',reps:'20 min'},
  {name:'Jump Rope',muscle:'Cardio',sets:'5',reps:'2 min'},
  {name:'Burpee',muscle:'Cardio',sets:'4',reps:'10–15'},
  {name:'Box Jump',muscle:'Cardio',sets:'4',reps:'8–10'},
  {name:'Assault Bike',muscle:'Cardio',sets:'5',reps:'30 sec on/30 off'},
  {name:'Sled Push',muscle:'Cardio',sets:'4',reps:'20 m'},
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
  {name:'Sandbag Clean',muscle:'Full Body',sets:'3',reps:'8–10'},
  // STRETCH / MOBILITY
  {name:'Hip Flexor Stretch',muscle:'Mobility',sets:'2',reps:'45 sec each'},
  {name:'World\'s Greatest Stretch',muscle:'Mobility',sets:'2',reps:'5 each side'},
  {name:'Pigeon Pose',muscle:'Mobility',sets:'2',reps:'60 sec each'},
  {name:'Cat-Cow',muscle:'Mobility',sets:'2',reps:'10'},
  {name:'Thoracic Rotation',muscle:'Mobility',sets:'2',reps:'10 each'},
  {name:'Band Pull-Apart',muscle:'Mobility',sets:'3',reps:'15–20'},
  {name:'Foam Roll Quads',muscle:'Mobility',sets:'1',reps:'60 sec each'},
  {name:'Foam Roll IT Band',muscle:'Mobility',sets:'1',reps:'60 sec each'},
  {name:'90/90 Hip Stretch',muscle:'Mobility',sets:'2',reps:'60 sec each'},
  {name:'Ankle Circles',muscle:'Mobility',sets:'2',reps:'10 each'},
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
    <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:1px;color:var(--muted);margin-bottom:10px;text-transform:uppercase">Choose Your Plan</div>
    <div class="signup-plan-grid" id="suPlans">
      ${SIGNUP_PLANS.map(p => `
        <div class="signup-plan-card${p.id===_signupState.plan?' selected':''}${p.featured?' signup-plan-featured':''}" onclick="selectSignupPlan('${p.id}')">
          ${p.featured ? '<div style="font-family:\'DM Mono\',monospace;font-size:8px;letter-spacing:2px;color:#ff6b35;margin-bottom:6px;text-transform:uppercase">★ Best Value</div>' : ''}
          <div class="signup-plan-price">${p.price}<span style="font-size:12px;color:var(--muted)">${p.per}</span></div>
          <div class="signup-plan-name">${p.name}</div>
          <div class="signup-plan-desc">${p.desc}</div>
        </div>`).join('')}
    </div>
    <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);margin-bottom:4px;text-align:center">Secure payment via Stripe · Cancel anytime</div>
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
    ? `<div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--muted);text-align:center;padding:30px">No signups yet</div>`
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
              <div style="font-family:'DM Mono',monospace;font-size:8px;color:var(--muted)">${new Date(l.created_at).toLocaleDateString('en',{month:'short',day:'numeric'})}</div>
              ${l.converted ? '<div style="font-family:\'DM Mono\',monospace;font-size:8px;color:#2ecc71;margin-top:4px">✓ Converted</div>' : ''}
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
      <div style="font-family:'Bebas Neue',sans-serif;font-size:24px;letter-spacing:2px;color:#ff6b35">📥 Signup Leads</div>
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
    exercisesHtml = `<div style="padding:24px 0;text-align:center;font-family:'DM Mono',monospace;font-size:12px;color:var(--muted)">😴 Rest day — recovery is part of the program</div>`;
  } else if (!allExercises.length) {
    exercisesHtml = `<div style="padding:16px 0;font-family:'DM Mono',monospace;font-size:11px;color:var(--muted)">No exercises assigned yet.</div>`;
  } else {
    exercisesHtml = allExercises.map((ex, ei) => {
      const exData = lastSession?.exercises?.[ei];
      const doneSets = exData?.sets?.filter(s => s.done || s.weight || s.reps) || [];
      const setsHtml = doneSets.length ? doneSets.map((s, si) =>
        `<div style="display:flex;gap:8px;align-items:center;padding:4px 0;border-bottom:1px solid var(--faint)">
          <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);min-width:20px">S${si+1}</div>
          <div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--text)">${s.weight ? `<span style="color:#ff6b35">${esc(s.weight)}</span>` : '<span style="color:var(--muted)">—</span>'}</div>
          <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted)">×</div>
          <div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--text)">${s.reps ? `<span style="color:${c.accent}">${esc(s.reps)} reps</span>` : '<span style="color:var(--muted)">—</span>'}</div>
          ${s.done ? '<div style="margin-left:auto;color:#2ecc71;font-size:12px">✓</div>' : ''}
        </div>`
      ).join('') : `<div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted);padding:4px 0">No sets logged yet</div>`;

      return `<div style="padding:12px 0;border-bottom:1px solid var(--border)">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <div>
            <div style="font-size:14px;font-weight:500">${esc(ex.name)}</div>
            <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);margin-top:2px">${esc(ex.sets||'')}${ex.reps?' · '+esc(ex.reps):''}${ex.rest?' · '+esc(ex.rest):''}</div>
          </div>
          ${doneSets.length ? `<div style="font-family:'DM Mono',monospace;font-size:9px;color:#2ecc71">${doneSets.length} sets done</div>` : ''}
        </div>
        <div style="padding-left:4px">${setsHtml}</div>
      </div>`;
    }).join('');
  }

  const modal = document.createElement('div');
  modal.id = 'schedDayModal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:4000;background:rgba(0,0,0,.75);display:flex;align-items:flex-end;justify-content:center';
  modal.innerHTML = `
    <div style="background:var(--surface);border-radius:20px 20px 0 0;padding:28px 24px 48px;width:100%;max-width:520px;max-height:85vh;overflow-y:auto">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:4px">
        <div>
          <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:2px;text-transform:uppercase">${esc(dayLabel)}</div>
          <div style="font-family:'Bebas Neue',sans-serif;font-size:26px;letter-spacing:1px;color:${isRest ? 'var(--muted)' : c.accent};line-height:1.1;margin-top:2px">${esc(schedDay.title)}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:4px">${esc(schedDay.sub || '')}</div>
        </div>
        <button onclick="document.getElementById('schedDayModal').remove()" style="background:none;border:none;color:var(--muted);font-size:24px;cursor:pointer;padding:0;margin-top:4px">×</button>
      </div>
      ${lastDate ? `<div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);margin-bottom:16px;padding:6px 10px;background:var(--surface2);border-radius:6px;display:inline-block">Last logged: ${lastDate}</div>` : '<div style="margin-bottom:16px"></div>'}
      <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:2px;text-transform:uppercase;margin-bottom:4px">Exercises</div>
      ${exercisesHtml}
    </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

/* ── SUPABASE SYNC ──────────────────────────────────────────── */
// Web Push — replace with your key after running: npx web-push generate-vapid-keys
// Then set VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY in Netlify env vars.
const VAPID_PUBLIC_KEY = 'BG96mHmP4m4VEkYxqLg5gnj4gXnqlf6pqixS3inIsVEAkrxiWANFRo6lQ3i57zaVU-B1S0JR2C5IukZxMU8IkOU';
const SB_URL = 'https://gfmvxfofsttuulwbvipy.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmbXZ4Zm9mc3R0dXVsd2J2aXB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NTMxODIsImV4cCI6MjA5MDQyOTE4Mn0.xiHcs79GVrs1loeygLgW7aNHN7CmwRCLDFnlG4hLIXk';
function sbInit() {
  return { url: SB_URL, key: SB_KEY };
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
  _draining = true;
  try {
    const q = _sbQueueRead();
    if (!q.length) return;
    const sentIds = new Set();
    for (const op of q) {
      const ok = await _sbSend(op).catch(() => false);
      if (ok && op._qid) sentIds.add(op._qid);
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
  const sb = sbInit();
  const url = sb.url + '/rest/v1/' + op.table + (op.filter ? '?' + op.filter : '');
  const headers = { 'apikey': sb.key, 'Authorization': 'Bearer ' + sb.key, 'Content-Type': 'application/json' };
  if (op.kind === 'upsert') headers['Prefer'] = 'resolution=merge-duplicates';
  const r = await fetch(url, {
    method: op.kind === 'upsert' ? 'POST' : 'PATCH',
    headers, body: JSON.stringify(op.data)
  });
  return r.ok;
}
window.addEventListener('online', () => drainSbQueue());
document.addEventListener('DOMContentLoaded', () => setTimeout(drainSbQueue, 1500));

async function sbUpsert(table, data) {
  const sb = sbInit(); if (!sb) return null;
  try {
    const r = await fetch(sb.url + '/rest/v1/' + table, {
      method: 'POST',
      headers: { 'apikey': sb.key, 'Authorization': 'Bearer '+sb.key, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify(data)
    });
    if (!r.ok) _sbQueuePush({ kind: 'upsert', table, data });
    return r.ok;
  } catch {
    _sbQueuePush({ kind: 'upsert', table, data });
    return null;
  }
}
async function sbSelect(table, filter) {
  const sb = sbInit(); if (!sb) return null;
  try {
    const r = await fetch(sb.url + '/rest/v1/' + table + '?' + filter, {
      headers: { 'apikey': sb.key, 'Authorization': 'Bearer '+sb.key }
    });
    return r.ok ? await r.json() : null;
  } catch { return null; }
}
async function sbPatch(table, filter, data) {
  const sb = sbInit(); if (!sb) return null;
  try {
    const r = await fetch(sb.url + '/rest/v1/' + table + '?' + filter, {
      method: 'PATCH',
      headers: { 'apikey': sb.key, 'Authorization': 'Bearer '+sb.key, 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!r.ok) _sbQueuePush({ kind: 'patch', table, filter, data });
    return r.ok;
  } catch {
    _sbQueuePush({ kind: 'patch', table, filter, data });
    return null;
  }
}
async function sbUploadPhoto(cid, date, dataUrl) {
  const sb = sbInit(); if (!sb) return null;
  try {
    // Convert base64 data URL to Blob
    const res  = await fetch(dataUrl);
    const blob = await res.blob();
    const filename = `checkins/${cid}/${Date.now()}.jpg`;
    const r = await fetch(`${sb.url}/storage/v1/object/photos/${filename}`, {
      method: 'POST',
      headers: { 'apikey': sb.key, 'Authorization': 'Bearer ' + sb.key, 'Content-Type': blob.type },
      body: blob
    });
    if (!r.ok) return null;
    return `${sb.url}/storage/v1/object/public/photos/${filename}`;
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
function sbAutoSync(cid) {
  const sb = sbInit(); if (!sb) return;
  // Push core client profile row — critical for clients onboarded before Supabase was added
  const allC = getAllClients();
  const c = allC.find(cl => cl.id === cid);
  if (c) {
    // Embed per-client data into the blob so it survives on a new device
    const _wlHist = {};
    (c.data?.workouts?.days || []).forEach(d => {
      const dayId = d.id || d.label;
      const h = getWlHistory(cid, dayId);
      if (h.length) _wlHist[dayId] = h;
    });
    const _nutr = _collectNutritionBlob(cid);
    const dataBlob = Object.assign({}, c.data || {}, {
      _prs:           getPRs(cid),
      _fitLogs:       getFitnessLogs(cid),
      _macroScores:   getCoachMacroScores(cid),
      _wtHistory:     getWtHistory(cid),
      _wtCurrent:     localStorage.getItem('wt_current_' + cid) || null,
      _wlHist,
      _mealLog:       getMealLog(cid),
      _periodization: getPeriodization(cid),
      _nutrDiary:     _nutr.diary,
      _waterLog:      _nutr.water,
      _customFoods:   _nutr.custom,
    });
    sbUpsert('clients', {
      id:           c.id,
      name:         c.name,
      pin:          c.pin || '',
      goal:         c.goal || '',
      accent:       c.accent || '#ff6b35',
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
    (c.data?.workouts?.days || []).forEach(d => {
      const dayId = d.id || d.label;
      const h = getWlHistory(c.id, dayId);
      if (h.length) _wlHistFull[dayId] = h;
    });
    const _nutrFull = _collectNutritionBlob(c.id);
    const fullBlob = Object.assign({}, c.data || {}, {
      _prs:           getPRs(c.id),
      _fitLogs:       getFitnessLogs(c.id),
      _macroScores:   getCoachMacroScores(c.id),
      _wtHistory:     getWtHistory(c.id),
      _wtCurrent:     localStorage.getItem('wt_current_' + c.id) || null,
      _wlHist:        _wlHistFull,
      _mealLog:       getMealLog(c.id),
      _periodization: getPeriodization(c.id),
      _nutrDiary:     _nutrFull.diary,
      _waterLog:      _nutrFull.water,
      _customFoods:   _nutrFull.custom,
    });
    const result = await sbUpsert('clients', {
      id:           c.id,
      name:         c.name,
      pin:          c.pin || '',
      goal:         c.goal || '',
      accent:       c.accent || '#ff6b35',
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
  // XP + milestones
  const xpRows = await sbSelect('client_xp', `client_id=eq.${cid}`);
  if (xpRows && xpRows[0]) {
    localStorage.setItem('xp_' + cid, String(xpRows[0].total_xp || 0));
    saveUnlockedMilestones(cid, xpRows[0].unlocked_milestones || []);
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
      accent:      row.accent || '#ff6b35',
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
  const existing = document.getElementById('sbSettingsModal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'sbSettingsModal';
  modal.className = 'terminate-backdrop open';
  modal.innerHTML = `<div class="terminate-modal">
    <div style="font-family:'Bebas Neue',sans-serif;font-size:24px;letter-spacing:2px;margin-bottom:14px">☁ Supabase Sync</div>
    <div class="ob-field"><label class="ob-label">Project URL</label><input class="ob-input" id="sbUrlInput" placeholder="https://xxx.supabase.co" value="${SB_URL}"></div>
    <div class="ob-field" style="margin-top:10px"><label class="ob-label">Anon Key</label><input class="ob-input" id="sbKeyInput" placeholder="eyJ..." value="${SB_KEY}"></div>
    <div style="display:flex;gap:10px;margin-top:16px">
      <button class="ob-next-btn" style="flex:1" onclick="saveSBSettings()">Save</button>
      <button class="ob-back-btn" onclick="document.getElementById('sbSettingsModal').remove()">Cancel</button>
    </div>
    <div style="display:flex;gap:8px;margin-top:10px">
      <button class="fit-log-btn" style="flex:1;font-size:12px;padding:10px" onclick="syncAllClients()">↑ Push All</button>
      <button class="fit-log-btn" style="flex:1;font-size:12px;padding:10px;background:var(--surface);color:var(--text);border:1px solid var(--border)" onclick="pullFromCloud()">↓ Pull Cloud</button>
    </div>
    <button class="fit-log-btn" style="width:100%;margin-top:8px;font-size:12px;padding:10px;background:rgba(52,152,219,.1);color:#3498db;border:1px solid #3498db" onclick="testSBConnection()">⚡ Test Connection</button>
    <div id="sbTestResult" style="margin-top:8px;font-family:'DM Mono',monospace;font-size:10px;line-height:1.6;color:var(--muted);word-break:break-all"></div>
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
      <div id="syncOverlayMsg" style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:1px;color:var(--text)"></div>`;
    document.body.appendChild(el);
  }
  document.getElementById('syncOverlayMsg').textContent = msg || 'Syncing…';
}
function hideSyncOverlay() { document.getElementById('syncOverlay')?.remove(); }
function saveSBSettings() {
  const url = document.getElementById('sbUrlInput')?.value?.trim();
  const key = document.getElementById('sbKeyInput')?.value?.trim();
  if (url) localStorage.setItem('sb_url', url);
  if (key) localStorage.setItem('sb_key', key);
  document.getElementById('sbSettingsModal')?.remove();
  showFitToast('Supabase settings saved');
}
async function testSBConnection() {
  const out = document.getElementById('sbTestResult');
  if (out) out.textContent = 'Testing…';
  const sb = sbInit();
  if (!sb) { if (out) out.textContent = '✗ No credentials'; return; }
  try {
    const r = await fetch(sb.url + '/rest/v1/clients?limit=1', {
      headers: { 'apikey': sb.key, 'Authorization': 'Bearer ' + sb.key }
    });
    const body = await r.text();
    if (r.ok) {
      if (out) out.innerHTML = `<span style="color:#2ecc71">✓ Connected (HTTP ${r.status})</span>`;
    } else {
      if (out) out.innerHTML = `<span style="color:#e74c3c">✗ HTTP ${r.status}</span><br>${body.slice(0,300)}`;
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


function buildModeBadge(mode) {
  var styles = {
    inperson:  ['rgba(46,204,113,.12)', '#2ecc71', '🏋️ In-Person'],
    remote:    ['rgba(52,152,219,.12)', '#3498db', '📡 Remote'],
    blueprint: ['rgba(255,107,53,.12)', '#ff6b35', '⚡ Blueprint'],
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


