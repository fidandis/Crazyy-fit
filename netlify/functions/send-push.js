/**
 * send-push — Sends a web push notification to a specific client.
 *
 * POST /api/send-push
 * Body: { clientId, title, body?, url? }
 *
 * Required env vars:
 *   SUPABASE_URL           — Supabase project URL
 *   SUPABASE_SERVICE_KEY   — Supabase service role key
 *   VAPID_PUBLIC_KEY       — from: npx web-push generate-vapid-keys
 *   VAPID_PRIVATE_KEY      — from: npx web-push generate-vapid-keys
 *   FROM_EMAIL             — verified sender (used as VAPID contact)
 *   APP_URL                — your Netlify URL (for CORS)
 *
 * Setup:
 *   1. Run: npx web-push generate-vapid-keys
 *   2. Add VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY to Netlify env vars
 *   3. Add VAPID_PUBLIC_KEY to pwa/index.html (search for VAPID_PUBLIC_KEY constant)
 */

const webpush        = require('web-push');
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const appUrl      = process.env.APP_URL || '';
  const corsHeaders = {
    'Access-Control-Allow-Origin':  appUrl || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders, body: '' };
  if (event.httpMethod !== 'POST')    return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };

  const vapidPublic  = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const fromEmail    = process.env.FROM_EMAIL || '';

  if (!vapidPublic || !vapidPrivate) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'VAPID keys not configured. Run: npx web-push generate-vapid-keys' }) };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, headers: corsHeaders, body: 'Bad JSON' }; }

  const { clientId, title, body: msgBody = '', url = '/' } = body;
  if (!clientId || !title) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Missing clientId or title' }) };
  }

  // Configure VAPID
  const contact = fromEmail && fromEmail.includes('@') ? `mailto:${fromEmail.replace(/^[^<]*<|>$/g, '')}` : 'mailto:coach@crazyyfit.com';
  webpush.setVapidDetails(contact, vapidPublic, vapidPrivate);

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  // Look up push subscription for this client
  const { data: rows } = await supabase
    .from('push_subscriptions')
    .select('subscription')
    .eq('client_id', clientId)
    .single();

  if (!rows?.subscription) {
    return { statusCode: 404, headers: corsHeaders, body: JSON.stringify({ error: 'Client has no push subscription (they need to enable notifications in the app)' }) };
  }

  const payload = JSON.stringify({ title, body: msgBody, url });

  try {
    await webpush.sendNotification(rows.subscription, payload);
    console.log(`Push sent to ${clientId}: ${title}`);
    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error('web-push error:', err.statusCode, err.message);
    // Subscription expired or invalid — remove it
    if (err.statusCode === 410 || err.statusCode === 404) {
      await supabase.from('push_subscriptions').delete().eq('client_id', clientId);
      return { statusCode: 410, headers: corsHeaders, body: JSON.stringify({ error: 'Subscription expired and was removed' }) };
    }
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message }) };
  }
};
