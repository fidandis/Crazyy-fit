/**
 * weekly-digest — Sends the coach a weekly summary every Monday at 8am UTC.
 *
 * Can also be triggered manually via POST /api/weekly-digest (coach only).
 *
 * Required env vars:
 *   SUPABASE_URL           — Supabase project URL
 *   SUPABASE_SERVICE_KEY   — Supabase service role key
 *   RESEND_API_KEY         — Resend API key
 *   FROM_EMAIL             — verified sender address
 *   COACH_EMAIL            — email address to send digest to
 *   APP_URL                — your Netlify URL
 */

const { createClient } = require('@supabase/supabase-js');
const { Resend }       = require('resend');

exports.handler = async (event) => {
  // Allow manual POST trigger from the coach dashboard
  const appUrl    = process.env.APP_URL || '';
  const corsHeaders = {
    'Access-Control-Allow-Origin':  appUrl || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders, body: '' };

  const coachEmail = process.env.COACH_EMAIL;
  const fromEmail  = process.env.FROM_EMAIL || 'CrazyyFit <onboarding@resend.dev>';

  if (!coachEmail) {
    console.error('COACH_EMAIL env var not set');
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'COACH_EMAIL not configured' }) };
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const resend   = new Resend(process.env.RESEND_API_KEY);

  // Pull all active clients
  const { data: clients, error: clientErr } = await supabase
    .from('clients')
    .select('id, name, goal, mode, data, accent');

  if (clientErr || !clients) {
    console.error('Supabase error:', clientErr);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Could not fetch clients' }) };
  }

  const now     = new Date();
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  // Pull checkins from last 7 days
  const { data: checkins } = await supabase
    .from('checkins')
    .select('client_id, checked_at, sleep, stress, energy, adherence')
    .gte('checked_at', weekAgo.toISOString());

  // Build per-client summaries
  const active = [];
  const inactive = [];

  for (const c of clients) {
    if (c.mode === 'archived') continue;
    const data     = typeof c.data === 'object' ? c.data : JSON.parse(c.data || '{}');
    const fitLogs  = (data._fitLogs || []).filter(l => l.date && new Date(l.date) >= weekAgo);
    const cCheckins = (checkins || []).filter(ch => ch.client_id === c.id);

    if (fitLogs.length === 0 && cCheckins.length === 0) {
      inactive.push(c);
      continue;
    }

    const totalKcal   = fitLogs.reduce((s, l) => s + (l.calories || 0), 0);
    const avgAdh      = cCheckins.length > 0
      ? Math.round(cCheckins.reduce((s, ch) => s + (ch.adherence || 0), 0) / cCheckins.length)
      : null;
    const avgEnergy   = cCheckins.length > 0
      ? Math.round(cCheckins.reduce((s, ch) => s + (ch.energy || 0), 0) / cCheckins.length)
      : null;

    active.push({ ...c, fitLogs, cCheckins, totalKcal, avgAdh, avgEnergy });
  }

  const html = buildDigestHtml(active, inactive, now, appUrl);

  try {
    await resend.emails.send({
      from: fromEmail,
      to:   [coachEmail],
      subject: `CrazyyFit Weekly Digest — ${now.toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}`,
      html,
    });
    console.log(`Weekly digest sent → ${coachEmail} | ${active.length} active, ${inactive.length} inactive`);
    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ ok: true, active: active.length, inactive: inactive.length }) };
  } catch (e) {
    console.error('Resend error:', e);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: e.message }) };
  }
};

// ── Email builder ─────────────────────────────────────────────────
function buildDigestHtml(active, inactive, date, appUrl) {
  const weekStr = date.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const clientRows = active.map(c => {
    const adherenceColor = c.avgAdh == null ? '#888' : c.avgAdh >= 80 ? '#2ecc71' : c.avgAdh >= 50 ? '#f1c40f' : '#e74c3c';
    return `
    <tr>
      <td style="padding:14px 12px;border-bottom:1px solid #222;font-size:14px;font-weight:600;color:#fff">${c.name}</td>
      <td style="padding:14px 12px;border-bottom:1px solid #222;font-family:monospace;font-size:13px;color:#ff6b35;text-align:center">${c.fitLogs.length}</td>
      <td style="padding:14px 12px;border-bottom:1px solid #222;font-family:monospace;font-size:13px;color:#fff;text-align:center">${c.totalKcal > 0 ? c.totalKcal.toLocaleString() : '—'}</td>
      <td style="padding:14px 12px;border-bottom:1px solid #222;font-family:monospace;font-size:13px;color:${adherenceColor};text-align:center">${c.avgAdh != null ? c.avgAdh + '%' : '—'}</td>
      <td style="padding:14px 12px;border-bottom:1px solid #222;font-family:monospace;font-size:13px;color:#fff;text-align:center">${c.cCheckins.length}</td>
    </tr>`;
  }).join('');

  const inactiveList = inactive.length > 0
    ? `<div style="background:#1a1a1a;border:1px solid #333;border-radius:10px;padding:16px;margin-top:20px">
        <div style="font-size:11px;letter-spacing:2px;color:#888;text-transform:uppercase;margin-bottom:10px">No Activity This Week</div>
        ${inactive.map(c => `<span style="display:inline-block;background:#222;border:1px solid #333;border-radius:6px;padding:4px 10px;font-size:12px;color:#666;margin:3px">${c.name}</span>`).join('')}
       </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'DM Sans',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:28px;font-weight:900;letter-spacing:3px;color:#fff">CRAZYY<span style="color:#ff6b35">FIT</span></div>
      <div style="font-size:11px;color:#555;letter-spacing:2px;margin-top:4px">WEEKLY COACH DIGEST</div>
    </div>

    <!-- Date card -->
    <div style="background:#111;border:1px solid #222;border-radius:12px;padding:20px 24px;margin-bottom:20px">
      <div style="font-size:22px;font-weight:700;color:#fff;margin-bottom:4px">Week ending ${weekStr}</div>
      <div style="font-size:13px;color:#888">${active.length} active client${active.length !== 1 ? 's' : ''} · ${inactive.length} with no activity</div>
    </div>

    ${active.length > 0 ? `
    <!-- Activity table -->
    <div style="background:#111;border:1px solid #222;border-radius:12px;overflow:hidden;margin-bottom:20px">
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#1a1a1a">
            <th style="padding:12px;font-family:monospace;font-size:9px;letter-spacing:2px;color:#555;text-transform:uppercase;text-align:left">Client</th>
            <th style="padding:12px;font-family:monospace;font-size:9px;letter-spacing:2px;color:#555;text-transform:uppercase;text-align:center">Sessions</th>
            <th style="padding:12px;font-family:monospace;font-size:9px;letter-spacing:2px;color:#555;text-transform:uppercase;text-align:center">Kcal</th>
            <th style="padding:12px;font-family:monospace;font-size:9px;letter-spacing:2px;color:#555;text-transform:uppercase;text-align:center">Adherence</th>
            <th style="padding:12px;font-family:monospace;font-size:9px;letter-spacing:2px;color:#555;text-transform:uppercase;text-align:center">Check-ins</th>
          </tr>
        </thead>
        <tbody>${clientRows}</tbody>
      </table>
    </div>` : `
    <div style="background:#111;border:1px solid #333;border-radius:12px;padding:40px;text-align:center;color:#555;font-family:monospace;font-size:11px;letter-spacing:1px;margin-bottom:20px">
      NO CLIENT ACTIVITY THIS WEEK
    </div>`}

    ${inactiveList}

    <!-- CTA -->
    ${appUrl ? `<div style="text-align:center;margin-top:28px">
      <a href="${appUrl}" style="display:inline-block;background:#ff6b35;color:#000;font-weight:700;font-size:13px;letter-spacing:2px;text-decoration:none;padding:14px 32px;border-radius:10px;text-transform:uppercase">Open Dashboard →</a>
    </div>` : ''}

    <!-- Footer -->
    <div style="text-align:center;font-size:11px;color:#444;margin-top:32px;line-height:1.7">
      CrazyyFit Weekly Digest · ${date.getFullYear()}<br>
      <span style="color:#333">You're receiving this as the registered coach.</span>
    </div>
  </div>
</body>
</html>`;
}
