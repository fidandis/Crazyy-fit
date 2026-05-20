/**
 * /api/upload-photo — authenticated check-in / progress photo upload.
 *
 * Replaces the old direct browser → Supabase Storage call (which needed
 * the service key in the bundle). Validates the session token, then
 * uploads the image to the `photos` bucket using the service role key.
 *
 * Required env vars:
 *   AUTH_SECRET, SUPABASE_URL, SUPABASE_SERVICE_KEY
 *
 * Request:  POST { cid, dataUrl }  (dataUrl = "data:image/jpeg;base64,...")
 * Response: { url } public URL on success, { error } otherwise
 */

const crypto = require('crypto');

function verifyToken(authHeader, secret) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const dot = token.lastIndexOf('.');
  if (dot < 0) return null;
  const body = token.slice(0, dot);
  const sig  = token.slice(dot + 1);
  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  let payload;
  try { payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')); }
  catch { return null; }
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  const secret      = process.env.AUTH_SECRET;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!secret || !supabaseUrl || !supabaseKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server not configured' }) };
  }

  const claims = verifyToken(event.headers.authorization || event.headers.Authorization, secret);
  if (!claims) return { statusCode: 401, body: JSON.stringify({ error: 'Invalid token' }) };

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: 'Bad JSON' }) }; }

  let { cid, dataUrl } = body;
  if (!cid || !dataUrl || !/^data:image\//.test(dataUrl)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'cid and image dataUrl required' }) };
  }
  // A client token can only upload to its own folder
  if (claims.role === 'client' && cid !== claims.cid) {
    return { statusCode: 403, body: JSON.stringify({ error: 'Cannot upload for another client' }) };
  }

  // Decode the data URL → raw bytes
  const m = dataUrl.match(/^data:(image\/[a-z+]+);base64,(.+)$/i);
  if (!m) return { statusCode: 400, body: JSON.stringify({ error: 'Malformed dataUrl' }) };
  const contentType = m[1];
  const buf = Buffer.from(m[2], 'base64');
  // Cap upload size at 5MB to stop abuse
  if (buf.length > 5 * 1024 * 1024) {
    return { statusCode: 413, body: JSON.stringify({ error: 'Image too large (max 5MB)' }) };
  }

  const ext = contentType === 'image/png' ? 'png' : 'jpg';
  const filename = `checkins/${cid}/${Date.now()}.${ext}`;

  const resp = await fetch(`${supabaseUrl}/storage/v1/object/photos/${filename}`, {
    method: 'POST',
    headers: {
      apikey:        supabaseKey,
      Authorization: 'Bearer ' + supabaseKey,
      'Content-Type': contentType,
      'x-upsert':     'true',
    },
    body: buf,
  });

  if (!resp.ok) {
    const t = await resp.text();
    return { statusCode: resp.status, body: JSON.stringify({ error: 'Upload failed', detail: t.slice(0, 200) }) };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: `${supabaseUrl}/storage/v1/object/public/photos/${filename}` }),
  };
};
