/* ══════════════════════════════════════════════════════════════
   CLIENT MANAGEMENT — dynamic clients stored in localStorage
══════════════════════════════════════════════════════════════ */

// Microtask-scoped cache. Cleared after the current synchronous render frame
// (queueMicrotask fires before the next paint), and on any write to the
// underlying keys via invalidateClientsCache().
let _clientsCache = null;
let _dynamicCache = null;
function invalidateClientsCache() { _clientsCache = null; _dynamicCache = null; }

function getAllClients() {
  if (_clientsCache) return _clientsCache;
  const terminated = getLS('terminated_clients', []);
  const dynamic = getDynamicClients();
  const hardcodedIds = CLIENTS.map(c => c.id);
  const newOnes = dynamic.filter(c => !hardcodedIds.includes(c.id));
  _clientsCache = [...CLIENTS, ...newOnes].filter(c => !terminated.includes(c.id));
  queueMicrotask(() => { _clientsCache = null; });
  return _clientsCache;
}

function getDynamicClients() {
  if (_dynamicCache) return _dynamicCache;
  try { _dynamicCache = getLS('dynamic_clients', []); }
  catch { _dynamicCache = []; }
  queueMicrotask(() => { _dynamicCache = null; });
  return _dynamicCache;
}

function saveDynamicClients(list) {
  // Quota-safe (safeSetItem in core.js, loaded first). Losing dynamic_clients
  // silently would drop the entire client roster, so surface a toast on failure.
  if (typeof safeSetItem === 'function') safeSetItem('dynamic_clients', JSON.stringify(list));
  else localStorage.setItem('dynamic_clients', JSON.stringify(list));
  invalidateClientsCache();
}

// Auto-invalidate getAllClients() cache whenever any client-list key is written
// directly via localStorage.setItem (many sites do this rather than calling
// saveDynamicClients). One-time monkey-patch at module init.
(function() {
  const _origSet = localStorage.setItem.bind(localStorage);
  const watched = new Set(['dynamic_clients','terminated_clients','paused_clients','archived_clients']);
  localStorage.setItem = function(k, v) {
    _origSet(k, v);
    if (watched.has(k)) invalidateClientsCache();
  };
})();

function addDynamicClient(client) {
  const list = getDynamicClients();
  list.push(client);
  saveDynamicClients(list);
}

function deleteDynamicClient(id) {
  const list = getDynamicClients().filter(c => c.id !== id);
  saveDynamicClients(list);
}

function updateDynamicClient(id, updatedClient) {
  const list = getDynamicClients().map(c => c.id === id ? updatedClient : c);
  saveDynamicClients(list);
}

/* ══════════════════════════════════════════════════════════════
   DATA EXPORT & BACKUP — Coach functions for data safety
══════════════════════════════════════════════════════════════ */

function exportAllData() {
  try {
    const allClients = getAllClients();
    const backup = {
      exportDate: new Date().toISOString(),
      appVersion: '2.0',
      coach: { name: COACH.name, initialsOnly: COACH.initials },
      clients: allClients.map(c => ({
        id: c.id, name: c.name, pin: c.pin, goal: c.goal,
        initials: c.initials, accent: c.accent, avatarBg: c.avatarBg,
        avatarColor: c.avatarColor, programType: c.programType,
        weightLoss: c.weightLoss || null, _meta: c._meta || {},
        data: c.data || {}
      })),
      data: {},
      modes: {},
      terminated: getLS('terminated_clients', []),
    };

    allClients.forEach(c => {
      backup.modes[c.id] = getClientMode(c.id);
      backup.data[c.id] = {
        fitLogs:      getFitnessLogs(c.id),
        checkins:     getCheckins(c.id),
        measurements: getMeasurements(c.id),
        goals:        getClientGoals(c.id),
        xp:           getXP(c.id),
        milestones:   getUnlockedMilestones(c.id),
        macroScores:  getCoachMacroScores(c.id),
        coachNotes:   localStorage.getItem('coach_notes_' + c.id) || '',
        lastSeen:     localStorage.getItem('last_seen_' + c.id) || null,
      };
      // Include goal progress history
      backup.data[c.id].goalProgress = {};
      getClientGoals(c.id).forEach(g => {
        backup.data[c.id].goalProgress[g.id] = getGoalHistory(c.id, g.id);
      });
    });

    backup.archived = getArchivedClients();

    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `crazyy-fit-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showFitToast('✓ Backup downloaded');
    return true;
  } catch (e) {
    console.error('Error exporting data:', e);
    return false;
  }
}

function restoreFromBackup(jsonFile) {
  if (!confirm('Restore from backup? This will merge backup data with current data. Existing client records will be overwritten.')) return;
  try {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const backup = safeJSON(e.target.result, null);
        if (!backup || !backup.clients) { alert('Invalid backup file format'); return; }

        // Restore client profiles
        const existing = getLS('dynamic_clients', []);
        backup.clients.forEach(c => {
          const idx = existing.findIndex(x => x.id === c.id);
          if (idx >= 0) existing[idx] = c; else existing.push(c);
          // Restore mode
          if (backup.modes && backup.modes[c.id]) localStorage.setItem('client_mode_' + c.id, backup.modes[c.id]);
        });
        localStorage.setItem('dynamic_clients', JSON.stringify(existing));

        // Restore per-client data
        backup.clients.forEach(c => {
          const d = backup.data?.[c.id];
          if (!d) return;
          if (d.fitLogs)      saveFitnessLogs(c.id, d.fitLogs);
          if (d.checkins)     saveCheckins(c.id, d.checkins);
          if (d.measurements) saveMeasurements(c.id, d.measurements);
          if (d.goals)        saveClientGoals(c.id, d.goals);
          if (d.xp !== undefined) localStorage.setItem('xp_' + c.id, String(d.xp));
          if (d.milestones)   saveUnlockedMilestones(c.id, d.milestones);
          if (d.coachNotes)   localStorage.setItem('coach_notes_' + c.id, d.coachNotes);
          if (d.lastSeen)     localStorage.setItem('last_seen_' + c.id, d.lastSeen);
          if (d.goalProgress) {
            Object.entries(d.goalProgress).forEach(([gid, hist]) => {
              localStorage.setItem('goal_cur_' + c.id + '_' + gid, JSON.stringify(hist));
            });
          }
        });

        if (backup.archived) localStorage.setItem('archived_clients', JSON.stringify(backup.archived));
        if (backup.terminated) localStorage.setItem('terminated_clients', JSON.stringify(backup.terminated));

        alert(`✓ Restored ${backup.clients.length} clients from ${backup.exportDate?.split('T')[0] || 'backup'}`);
        location.reload();
      } catch (parseError) {
        console.error('Error parsing backup:', parseError);
        alert('Error reading backup file.');
      }
    };
    reader.readAsText(jsonFile);
  } catch (e) {
    console.error('Error restoring backup:', e);
  }
}

