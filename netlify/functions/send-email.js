/**
 * send-email — Generic transactional email endpoint
 * Called by the coach dashboard and onboarding flow.
 *
 * POST /.netlify/functions/send-email  (or /api/send-email via redirect)
 * Body: { to, subject, html, type? }
 *
 * Required env vars:
 *   RESEND_API_KEY   — from resend.com
 *   FROM_EMAIL       — verified sender address (e.g. noreply@yourdomain.com)
 *   APP_URL          — your Netlify URL (for CORS / origin check)
 */

const { Resend } = require('resend');

const ALLOWED_TYPES = ['pin_delivery', 'broadcast', 'progress_report', 'custom'];

exports.handler = async (event) => {
  // ── CORS pre-flight ────────────────────────────────────────────
  const appUrl = process.env.APP_URL || '';
  const origin = event.headers['origin'] || event.headers['referer'] || '';
  const corsHeaders = {
    'Access-Control-Allow-Origin': appUrl || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };
  }

  // ── Parse body ────────────────────────────────────────────────
  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, headers: corsHeaders, body: 'Bad JSON' }; }

  const { to, subject, html, type = 'custom' } = body;

  if (!to || !subject || !html) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Missing required fields: to, subject, html' }) };
  }

  if (!ALLOWED_TYPES.includes(type)) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid type' }) };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Email service not configured' }) };
  }

  const fromEmail = process.env.FROM_EMAIL || 'CrazyyFit <onboarding@resend.dev>';

  // ── Send ──────────────────────────────────────────────────────
  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from: fromEmail,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    // Resend SDK v3 returns { data, error } instead of throwing on API errors
    if (result.error) {
      console.error('Resend API error:', result.error, '| from:', fromEmail, '| to:', to);
      const msg = result.error.message || result.error.name || 'Resend rejected the request';
      return {
        statusCode: 502,
        headers: corsHeaders,
        body: JSON.stringify({ error: msg, from: fromEmail, details: result.error }),
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ ok: true, id: result.data?.id }),
    };
  } catch (err) {
    console.error('Resend exception:', err, '| from:', fromEmail, '| to:', to);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message, from: fromEmail }),
    };
  }
};
