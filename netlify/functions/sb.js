/**
 * /api/sb — authenticated proxy to Supabase.
 *
 * Replaces every direct browser → Supabase call. All requests must
 * include `Authorization: Bearer {token}` where token comes from
 * /api/login. The function:
 *
 *   1. Verifies the HMAC signature on the token
 *   2. Checks expiry
 *   3. For role=client, automatically scopes every table query to
 *      `client_id = {token.cid}` so a stolen client token can't read
 *      anyone else's data
 *   4. Forwards the operation to Supabase using the service role key
 *
 * Required env vars (same as login.js):
 *   AUTH_SECRET, SUPABASE_URL, SUPABASE_SERVICE_KEY
 *
 * Request body:
 *   { op: 'select'|'upsert'|'patch', table, query?, data?, filter? }
 *
 * Response: passthrough from Supabase REST API
 */

const crypto = require('crypto');

// Tables a client (vs. coach) is allowed to touch, and whether each is
// scoped by client_id (most are; a few are global like shared_foods).
const CLIENT_TABLE_RULES = {
  clients:            { scope: 'id'        }, // client can read/update their own row
  fitness_logs:       { scope: 'client_id' },
  checkins:           { scope: 'client_id' },
  measurements:       { scope: 'client_id' },
  personal_records:   { scope: 'client_id' },
  client_xp:          { scope: 'client_id' },
  meal_plans:         { scope: 'client_id' },
  client_goals:       { scope: 'client_id' },
  goal_progress:      { scope: 'client_id' },
  notifications:      { scope: 'client_id' },
  messages:           { scope: 'client_id' },
  push_subscriptions: { scope: 'client_id' },
  shared_foods:       { scope: null        }, // shared across all
};

function verifyToken(authHeader, secret) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const dot = token.lastIndexOf('.');
  if (dot < 0) return null;
  const body = token.slice(0, dot);
  const sig  = token.slice(dot + 1);
  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  // Constant-time compare to defeat timing attacks
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  let payload;
  try { payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')); }
  catch { return null; }
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

// Build a Supabase REST URL: /rest/v1/{table}?{query}
// For client tokens, we *force-inject* the scope filter so the client
// can't read/write anyone else's rows even with crafted requests.
function buildUrl(base, table, op, query, filter, claims) {
  let qs = '';
  if (op === 'select' && query) qs = query;
  if (op === 'patch' && filter) qs = filter;

  // Enforce client scope
  if (claims.role === 'client') {
    const rule = CLIENT_TABLE_RULES[table];
    if (!rule) throw new Error('Table not accessible to client');
    if (rule.scope) {
      const scopeFilter = rule.scope + '=eq.' + encodeURIComponent(claims.cid);
      qs = qs ? qs + '&' + scopeFilter : scopeFilter;
    }
  }

  return base + '/rest/v1/' + encodeURIComponent(table) + (qs ? '?' + qs : '');
}

// For client upserts, ensure the row's client_id (or id, for the
// clients table) matches their token claim. Coaches can write anything.
function enforceClientWriteScope(table, data, claims) {
  if (claims.role !== 'client') return data;
  const rule = CLIENT_TABLE_RULES[table];
  if (!rule) throw new Error('Table not writable by client');
  if (!rule.scope) return data;
  const rows = Array.isArray(data) ? data : [data];
  rows.forEach(row => {
    if (table === 'clients' && row.id && row.id !== claims.cid) {
      throw new Error('Cannot modify another client');
    }
    if (rule.scope === 'client_id' && row.client_id && row.client_id !== claims.cid) {
      throw new Error('Cannot write to another client');
    }
    // Force the scope field if missing
    if (rule.scope === 'client_id' && !row.client_id) row.client_id = claims.cid;
    if (table === 'clients' && !row.id) row.id = claims.cid;
  });
  return rows;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const secret      = process.env.AUTH_SECRET;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!secret || !supabaseUrl || !supabaseKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server not configured' }) };
  }

  const claims = verifyToken(event.headers.authorization || event.headers.Authorization, secret);
  if (!claims) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid or expired token' }) };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: 'Bad JSON' }) }; }

  const { op, table, query, data, filter } = body;
  if (!op || !table) {
    return { statusCode: 400, body: JSON.stringify({ error: 'op and table required' }) };
  }

  let url, method = 'GET', payload = null;
  const headers = {
    apikey:        supabaseKey,
    Authorization: 'Bearer ' + supabaseKey,
    'Content-Type': 'application/json',
  };

  try {
    if (op === 'select') {
      url = buildUrl(supabaseUrl, table, 'select', query, null, claims);
      method = 'GET';
    } else if (op === 'upsert') {
      url = buildUrl(supabaseUrl, table, 'upsert', null, null, claims);
      method = 'POST';
      headers.Prefer = 'resolution=merge-duplicates,return=representation';
      payload = JSON.stringify(enforceClientWriteScope(table, data, claims));
    } else if (op === 'patch') {
      url = buildUrl(supabaseUrl, table, 'patch', null, filter, claims);
      method = 'PATCH';
      payload = JSON.stringify(data);
    } else if (op === 'delete') {
      if (claims.role !== 'coach') {
        return { statusCode: 403, body: JSON.stringify({ error: 'Delete is coach-only' }) };
      }
      url = buildUrl(supabaseUrl, table, 'patch', null, filter, claims);
      method = 'DELETE';
    } else {
      return { statusCode: 400, body: JSON.stringify({ error: 'Unknown op' }) };
    }
  } catch (e) {
    return { statusCode: 403, body: JSON.stringify({ error: e.message }) };
  }

  const resp = await fetch(url, { method, headers, body: payload });
  const text = await resp.text();
  return {
    statusCode: resp.status,
    headers: { 'Content-Type': resp.headers.get('content-type') || 'application/json' },
    body: text,
  };
};
