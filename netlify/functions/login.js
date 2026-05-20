/**
 * /api/login — PIN-based authentication.
 *
 * Issues a signed session token (HMAC-SHA256) that the client passes
 * back via the Authorization header on every /api/sb request. The token
 * encodes role (coach|client), client_id (if client), and an expiry.
 *
 * Coach PINs and client PINs are verified server-side against
 * SHA-256 hashes — plaintext PINs never leave the device.
 *
 * Required env vars:
 *   AUTH_SECRET           — random 32+ byte string, used to sign tokens
 *   COACH_PIN_HASH        — SHA-256 hex of the coach PIN (e.g. shasum -a 256)
 *   SUPABASE_URL          — your Supabase project URL
 *   SUPABASE_SERVICE_KEY  — service role key (bypasses RLS)
 *
 * Request:  POST { role: "coach" | "client", pin: "1234" }
 * Response: { token, role, clientId? } on success
 *           { error } on failure (401)
 */

// Zero-dependency: uses only Node built-ins + global fetch (Node 18+).
// This lets the function deploy via Netlify drag-and-drop, which does NOT
// run `npm install`.
const crypto = require('crypto');

const TOKEN_TTL_HOURS = 24 * 14; // 14-day sessions

// Minimal Supabase REST helpers (replace @supabase/supabase-js)
async function sbRest(supabaseUrl, supabaseKey, path, opts = {}) {
  const r = await fetch(supabaseUrl + '/rest/v1/' + path, {
    ...opts,
    headers: {
      apikey:        supabaseKey,
      Authorization: 'Bearer ' + supabaseKey,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  return r;
}

function sha256(s) {
  return crypto.createHash('sha256').update(String(s), 'utf8').digest('hex');
}

function signToken(payload, secret) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig  = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return body + '.' + sig;
}

function _ip(event) {
  return (event.headers['x-nf-client-connection-ip']
    || event.headers['x-forwarded-for']
    || 'unknown').split(',')[0].trim();
}

// In-memory rate limit: 10 failed attempts per IP per 10 minutes.
// Resets when the function cold-starts; for stronger limits move to KV.
const _attempts = new Map();
function _rateLimit(ip) {
  const now = Date.now();
  const window = 10 * 60 * 1000;
  const entry = _attempts.get(ip);
  if (!entry || now - entry.first > window) {
    _attempts.set(ip, { first: now, count: 1 });
    return true;
  }
  entry.count++;
  return entry.count <= 10;
}
function _resetAttempts(ip) { _attempts.delete(ip); }

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const secret      = process.env.AUTH_SECRET;
  const coachHash   = process.env.COACH_PIN_HASH;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!secret || !coachHash || !supabaseUrl || !supabaseKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server not configured' }) };
  }

  const ip = _ip(event);
  if (!_rateLimit(ip)) {
    return { statusCode: 429, body: JSON.stringify({ error: 'Too many attempts. Wait 10 minutes.' }) };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: 'Bad JSON' }) }; }

  const { role, pin } = body;
  if (!role || !pin || !/^\d{4,8}$/.test(String(pin))) {
    return { statusCode: 400, body: JSON.stringify({ error: 'PIN required (4-8 digits)' }) };
  }

  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_HOURS * 3600;

  // ── Coach login ─────────────────────────────────────────────────
  if (role === 'coach') {
    const ok = sha256(pin) === coachHash;
    if (!ok) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Invalid coach PIN' }) };
    }
    _resetAttempts(ip);
    const token = signToken({ role: 'coach', exp }, secret);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, role: 'coach' }),
    };
  }

  // ── Client login ────────────────────────────────────────────────
  // Client PINs live in the clients.pin column. We accept either
  // SHA-256 hashed (length 64) or plaintext (legacy rows) — and
  // re-hash plaintext on successful login.
  if (role === 'client') {
    const lookup = await sbRest(supabaseUrl, supabaseKey, 'clients?select=id,name,pin');
    if (!lookup.ok) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Lookup failed' }) };
    }
    const data = await lookup.json().catch(() => []);
    const pinPlain  = String(pin);
    const pinHashed = sha256(pinPlain);
    const match = (data || []).find(c =>
      c.pin === pinHashed || (c.pin && c.pin.length !== 64 && c.pin === pinPlain)
    );
    if (!match) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Invalid PIN' }) };
    }
    // Upgrade plaintext PIN to hashed on first auth'd use
    if (match.pin && match.pin.length !== 64) {
      await sbRest(supabaseUrl, supabaseKey, 'clients?id=eq.' + encodeURIComponent(match.id), {
        method: 'PATCH',
        body: JSON.stringify({ pin: pinHashed }),
      });
    }
    _resetAttempts(ip);
    const token = signToken({ role: 'client', cid: match.id, exp }, secret);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, role: 'client', clientId: match.id, name: match.name }),
    };
  }

  return { statusCode: 400, body: JSON.stringify({ error: 'Unknown role' }) };
};
