/**
 * stripe-webhook — Handles Stripe Payment Link completions.
 *
 * BLUEPRINT ($50/mo):
 *   → Generates PIN → creates client in Supabase → emails PIN to client
 *
 * TRANSFORMATION ($350/mo):
 *   → Saves lead in Supabase → emails client "coach will contact you"
 *   → Emails coach notification so they know to reach out
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY      — Stripe secret key (sk_live_...)
 *   STRIPE_WEBHOOK_SECRET  — from Stripe → Webhooks → signing secret
 *   SUPABASE_URL           — your Supabase project URL
 *   SUPABASE_SERVICE_KEY   — Supabase service role key (bypasses RLS)
 *   RESEND_API_KEY         — from resend.com
 *   FROM_EMAIL             — verified sender (e.g. noreply@yourdomain.com)
 *   COACH_EMAIL            — coach's email address (for Transformation notifications)
 *   APP_URL                — your Netlify app URL (e.g. https://crazyy-fit.netlify.app)
 *
 * Stripe setup:
 *   - Add product metadata: plan = blueprint | transformation
 *   - Enable "Collect customer name" on each Payment Link
 *   - Point webhook at: https://your-site.netlify.app/api/stripe-webhook
 *   - Subscribe to: checkout.session.completed
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');
const crypto = require('crypto');

function generatePin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function hashPin(pin) {
  return crypto.createHash('sha256').update(pin, 'utf8').digest('hex');
}

function randomAccent() {
  const accents = ['#ff6b35', '#00d4ff', '#c8e020', '#ff00aa', '#ffd700', '#7c3aed'];
  return accents[Math.floor(Math.random() * accents.length)];
}

/* ── EMAIL: Blueprint — PIN delivery ──────────────────────────── */
function buildBlueprintEmail(name, pin, appUrl) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:40px 24px;">

    <div style="text-align:center;margin-bottom:36px;">
      <div style="font-size:28px;font-weight:900;letter-spacing:3px;color:#ffffff;">CRAZYY<span style="color:#ff6b35">FIT</span></div>
      <div style="font-size:10px;color:#555;letter-spacing:2px;margin-top:4px;text-transform:uppercase;">Your Blueprint Is Ready</div>
    </div>

    <div style="background:#111;border:1px solid #222;border-radius:16px;padding:36px;margin-bottom:20px;">
      <div style="font-size:22px;font-weight:700;color:#fff;margin-bottom:8px;">You're in, ${name}.</div>
      <div style="font-size:14px;color:#888;margin-bottom:28px;line-height:1.6;">
        Your <strong style="color:#ff6b35">Crazyy Blueprint</strong> is activated. Use the PIN below to log into the app and start your program.
      </div>

      <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
        <div style="font-size:10px;letter-spacing:3px;color:#555;text-transform:uppercase;margin-bottom:12px;">Your Login PIN</div>
        <div style="font-size:52px;font-weight:900;letter-spacing:14px;color:#ff6b35;font-family:monospace;line-height:1;">${pin}</div>
        <div style="font-size:11px;color:#444;margin-top:10px;">Keep this private — it's your personal access code</div>
      </div>

      <div style="margin-bottom:28px;">
        <div style="font-size:10px;letter-spacing:2px;color:#555;text-transform:uppercase;margin-bottom:14px;">How to get started</div>
        ${[
          'Open the app using the button below',
          'Find your name on the login screen',
          'Enter your 4-digit PIN',
          'Complete your profile — takes 2 minutes',
        ].map((s, i) => `
        <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;">
          <div style="flex-shrink:0;width:24px;height:24px;background:#ff6b35;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#000;line-height:24px;text-align:center;">${i + 1}</div>
          <div style="font-size:13px;color:#bbb;padding-top:4px;line-height:1.4;">${s}</div>
        </div>`).join('')}
      </div>

      <a href="${appUrl}" style="display:block;text-align:center;background:#ff6b35;color:#000;font-weight:700;font-size:14px;letter-spacing:2px;text-decoration:none;padding:18px;border-radius:10px;text-transform:uppercase;">
        Open CrazyyFit →
      </a>
    </div>

    <div style="text-align:center;font-size:11px;color:#444;line-height:1.8;">
      Questions? Reply to this email — your coach is watching your progress.<br>
      <span style="color:#2a2a2a;">CrazyyFit · ${new Date().getFullYear()}</span>
    </div>
  </div>
</body>
</html>`;
}

/* ── EMAIL: Transformation — coach will contact you ───────────── */
function buildTransformationClientEmail(name) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:40px 24px;">

    <div style="text-align:center;margin-bottom:36px;">
      <div style="font-size:28px;font-weight:900;letter-spacing:3px;color:#ffffff;">CRAZYY<span style="color:#ff6b35">FIT</span></div>
      <div style="font-size:10px;color:#555;letter-spacing:2px;margin-top:4px;text-transform:uppercase;">Purchase Confirmed</div>
    </div>

    <div style="background:#111;border:1px solid #ff6b35;border-radius:16px;padding:36px;margin-bottom:20px;">
      <div style="font-size:22px;font-weight:700;color:#fff;margin-bottom:8px;">We've got you, ${name}.</div>
      <div style="font-size:14px;color:#888;margin-bottom:28px;line-height:1.6;">
        Your <strong style="color:#ff6b35">Full Transformation</strong> package is confirmed. Your coach will be reaching out personally within <strong style="color:#fff;">24 hours</strong> to get everything set up.
      </div>

      <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:24px;margin-bottom:28px;">
        <div style="font-size:10px;letter-spacing:2px;color:#555;text-transform:uppercase;margin-bottom:16px;">What happens next</div>
        ${[
          ['Your coach reviews your purchase', 'They\'ll look at any info you provided during signup.'],
          ['You\'ll get a personal message', 'Expect a message from your coach within 24 hours to introduce themselves and gather your goals.'],
          ['Your program gets built', 'Your coach builds a custom plan and sets up your app access — tailored specifically to you.'],
          ['You log in and get to work', 'You\'ll receive your PIN and app access once your program is ready.'],
        ].map(([title, desc], i) => `
        <div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:18px;">
          <div style="flex-shrink:0;width:28px;height:28px;background:#ff6b35;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#000;line-height:28px;text-align:center;">${i + 1}</div>
          <div>
            <div style="font-size:13px;font-weight:600;color:#fff;margin-bottom:3px;">${title}</div>
            <div style="font-size:12px;color:#666;line-height:1.5;">${desc}</div>
          </div>
        </div>`).join('')}
      </div>

      <div style="background:rgba(255,107,53,0.06);border:1px solid rgba(255,107,53,0.2);border-radius:10px;padding:18px;text-align:center;">
        <div style="font-size:12px;color:#ff6b35;font-weight:600;margin-bottom:4px;">CHECK YOUR INBOX</div>
        <div style="font-size:12px;color:#666;line-height:1.5;">Your coach will reach out to this email address. Keep an eye out — including your spam folder.</div>
      </div>
    </div>

    <div style="text-align:center;font-size:11px;color:#444;line-height:1.8;">
      Didn't expect this email? Reply and we'll sort it out.<br>
      <span style="color:#2a2a2a;">CrazyyFit · ${new Date().getFullYear()}</span>
    </div>
  </div>
</body>
</html>`;
}

/* ── EMAIL: Coach notification for new Transformation purchase ── */
function buildCoachNotificationEmail(clientName, clientEmail, sessionId) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:40px 24px;">
    <div style="background:#111;border:1px solid #ff6b35;border-radius:12px;padding:32px;">
      <div style="font-size:14px;font-weight:700;color:#ff6b35;letter-spacing:2px;text-transform:uppercase;margin-bottom:16px;">🔥 New Transformation Purchase</div>
      <div style="font-size:20px;font-weight:700;color:#fff;margin-bottom:20px;">${clientName} just bought the Full Transformation package.</div>
      <div style="background:#1a1a1a;border-radius:8px;padding:16px;margin-bottom:20px;">
        <div style="font-size:11px;color:#555;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Client Details</div>
        <div style="font-size:13px;color:#ccc;">Name: <strong style="color:#fff;">${clientName}</strong></div>
        <div style="font-size:13px;color:#ccc;margin-top:4px;">Email: <strong style="color:#fff;">${clientEmail}</strong></div>
        <div style="font-size:11px;color:#444;margin-top:8px;">Stripe Session: ${sessionId}</div>
      </div>
      <div style="font-size:13px;color:#888;line-height:1.6;">
        Reach out to them within <strong style="color:#fff;">24 hours</strong>. Once you've spoken to them, set up their profile in the coach dashboard and send their PIN through the app.
      </div>
    </div>
  </div>
</body>
</html>`;
}

/* ── Lambda handler ────────────────────────────────────────────── */
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // 1. Verify Stripe signature
  const sig = event.headers['stripe-signature'];
  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Stripe signature verification failed:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  if (stripeEvent.type !== 'checkout.session.completed') {
    return { statusCode: 200, body: 'OK' };
  }

  const session = stripeEvent.data.object;
  const email = session.customer_details?.email || '';
  const clientName = session.customer_details?.name || email.split('@')[0];

  if (!email) {
    console.error('No email in session:', session.id);
    return { statusCode: 200, body: 'No email — skipped' };
  }

  // 2. Determine plan from product metadata
  let plan = 'blueprint';
  try {
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1, expand: ['data.price.product'] });
    const product = lineItems.data[0]?.price?.product;
    if (product && typeof product === 'object' && product.metadata?.plan) {
      plan = product.metadata.plan;
    }
  } catch (e) {
    console.warn('Could not read line items:', e.message);
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const resend = new Resend(process.env.RESEND_API_KEY);
  const appUrl = process.env.APP_URL || 'https://your-site.netlify.app';
  const fromEmail = process.env.FROM_EMAIL || 'CrazyyFit <onboarding@resend.dev>';
  const coachEmail = process.env.COACH_EMAIL || '';

  // 3. Look up existing lead
  let lead = null;
  try {
    const { data } = await supabase
      .from('signups')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    lead = data;
  } catch (e) { /* best-effort */ }

  /* ── BLUEPRINT: create client + send PIN ──────────────────────── */
  if (plan === 'blueprint') {
    const pin = generatePin();
    const pinHash = hashPin(pin);
    const clientId = 'c_stripe_' + session.id.slice(-10);

    const clientRow = {
      id: clientId,
      name: clientName,
      pin: pinHash,
      goal: lead?.goal || '',
      accent: randomAccent(),
      program_type: 'blueprint',
      mode: 'blueprint',
      data: JSON.stringify({ weights: [], logs: [], meals: [], goals: [] }),
      meta: JSON.stringify({ email, phone: lead?.phone || '', plan: 'blueprint', stripeSession: session.id, signupSource: 'stripe' }),
      updated_at: new Date().toISOString(),
    };

    try {
      await supabase.from('clients').upsert(clientRow, { onConflict: 'id' });
    } catch (e) {
      console.error('Supabase upsert error:', e);
      return { statusCode: 500, body: 'DB error' };
    }

    if (lead?.id) {
      await supabase
        .from('signups')
        .update({ converted: true, cid: clientId, converted_at: new Date().toISOString() })
        .eq('id', lead.id);
    }

    const { error: blueprintEmailErr } = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: `Your CrazyyFit Blueprint is ready — PIN inside`,
      html: buildBlueprintEmail(clientName, pin, appUrl),
      idempotencyKey: `blueprint-welcome/${clientId}`,
    });
    if (blueprintEmailErr) console.error('Blueprint email error:', blueprintEmailErr);

    console.log(`[Blueprint] Client created: ${clientId} (${clientName} / ${email})`);
    return { statusCode: 200, body: JSON.stringify({ ok: true, clientId }) };
  }

  /* ── TRANSFORMATION: save lead + notify client + notify coach ── */
  if (plan === 'transformation') {
    const leadRow = {
      name: clientName,
      email,
      phone: lead?.phone || '',
      goal: lead?.goal || '',
      plan: 'transformation',
      converted: false,
      stripe_session: session.id,
      created_at: new Date().toISOString(),
    };

    try {
      await supabase.from('signups').upsert(leadRow, { onConflict: 'email' });
    } catch (e) {
      console.warn('Signups upsert error:', e.message);
    }

    // Email client
    const { error: transformEmailErr } = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: `Your CrazyyFit Transformation — your coach will be in touch`,
      html: buildTransformationClientEmail(clientName),
      idempotencyKey: `transformation-confirm/${session.id}`,
    });
    if (transformEmailErr) console.error('Transformation client email error:', transformEmailErr);

    // Notify coach
    if (coachEmail) {
      const { error: coachEmailErr } = await resend.emails.send({
        from: fromEmail,
        to: [coachEmail],
        subject: `New Transformation client: ${clientName}`,
        html: buildCoachNotificationEmail(clientName, email, session.id),
        idempotencyKey: `transformation-coach-notify/${session.id}`,
      });
      if (coachEmailErr) console.error('Coach notification email error:', coachEmailErr);
    }

    console.log(`[Transformation] Lead saved and coach notified: ${clientName} / ${email}`);
    return { statusCode: 200, body: JSON.stringify({ ok: true, plan: 'transformation' }) };
  }

  // Unknown plan — log and return OK so Stripe doesn't retry
  console.warn(`Unknown plan "${plan}" for session ${session.id}`);
  return { statusCode: 200, body: 'Unknown plan — skipped' };
};
