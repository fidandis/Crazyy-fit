/**
 * stripe-webhook — Handles Stripe Payment Link completions.
 *
 * When a client pays via a Payment Link:
 *  1. Verifies the Stripe signature
 *  2. Looks up the lead in Supabase by email
 *  3. Generates a 4-digit PIN + SHA-256 hash
 *  4. Creates the client record in Supabase
 *  5. Sends a welcome email with the PIN via Resend
 *  6. Marks the lead as converted
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY      — Stripe secret key (sk_live_...)
 *   STRIPE_WEBHOOK_SECRET  — from Stripe → Webhooks → signing secret
 *   SUPABASE_URL           — your Supabase project URL
 *   SUPABASE_SERVICE_KEY   — Supabase service role key (bypasses RLS)
 *   RESEND_API_KEY         — from resend.com
 *   FROM_EMAIL             — verified sender (e.g. noreply@yourdomain.com)
 *   APP_URL                — your Netlify app URL (e.g. https://crazyy-fit.netlify.app)
 *
 * Stripe setup required:
 *  - Enable "Collect customer name" on each Payment Link
 *  - Add product metadata: plan = blueprint | coaching | transformation
 *  - Point webhook at: https://your-site.netlify.app/api/stripe-webhook
 *  - Subscribe to event: checkout.session.completed
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');
const crypto = require('crypto');

// ── Plan labels (for the email) ────────────────────────────────
const PLAN_LABELS = {
  blueprint:      'Crazyy Blueprint',
  blueprintv2:    'BlueprintV2',
  transformation: 'Full Transformation',
};

// ── Helpers ────────────────────────────────────────────────────
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

// ── Welcome email HTML ─────────────────────────────────────────
function buildWelcomeEmail(name, pin, appUrl, plan) {
  const planLabel = PLAN_LABELS[plan] || plan;
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'DM Sans',Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:40px 24px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:28px;font-weight:900;letter-spacing:3px;color:#ffffff;">
        CRAZYY<span style="color:#ff6b35">FIT</span>
      </div>
      <div style="font-size:11px;color:#555;letter-spacing:2px;margin-top:4px;">YOUR PERSONAL TRAINING HUB</div>
    </div>

    <!-- Welcome card -->
    <div style="background:#111;border:1px solid #222;border-radius:16px;padding:32px;margin-bottom:20px;">
      <div style="font-size:22px;font-weight:700;color:#fff;margin-bottom:6px;">Welcome, ${name}!</div>
      <div style="font-size:13px;color:#888;margin-bottom:24px;">Your <strong style="color:#ff6b35">${planLabel}</strong> is activated. Here's everything you need to get started.</div>

      <!-- PIN box -->
      <div style="background:#1a1a1a;border:1px solid #333;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
        <div style="font-size:10px;letter-spacing:2px;color:#666;text-transform:uppercase;margin-bottom:8px;">Your App PIN</div>
        <div style="font-size:48px;font-weight:900;letter-spacing:12px;color:#ff6b35;font-family:monospace;">${pin}</div>
        <div style="font-size:11px;color:#555;margin-top:8px;">Keep this private — it's your personal login</div>
      </div>

      <!-- Steps -->
      <div style="margin-bottom:24px;">
        <div style="font-size:11px;letter-spacing:1px;color:#666;text-transform:uppercase;margin-bottom:12px;">How to log in</div>
        ${['Open the app below', 'Tap your name on the login screen', 'Enter your 4-digit PIN'].map((s, i) => `
        <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:10px;">
          <div style="flex-shrink:0;width:22px;height:22px;background:#ff6b35;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#000;">${i+1}</div>
          <div style="font-size:13px;color:#ccc;padding-top:2px;">${s}</div>
        </div>`).join('')}
      </div>

      <!-- CTA button -->
      <a href="${appUrl}" style="display:block;text-align:center;background:#ff6b35;color:#000;font-weight:700;font-size:15px;letter-spacing:2px;text-decoration:none;padding:16px;border-radius:10px;text-transform:uppercase;">
        Open CrazyyFit →
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;font-size:11px;color:#444;line-height:1.7;">
      Questions? Reply to this email — your coach is here.<br>
      <span style="color:#333">CrazyyFit · ${new Date().getFullYear()}</span>
    </div>
  </div>
</body>
</html>`;
}

// ── Lambda handler ─────────────────────────────────────────────
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // 1. Verify Stripe signature
  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, webhookSecret);
  } catch (err) {
    console.error('Stripe signature verification failed:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  // 2. Only handle completed checkouts
  if (stripeEvent.type !== 'checkout.session.completed') {
    return { statusCode: 200, body: 'OK' };
  }

  const session = stripeEvent.data.object;
  const email = session.customer_details?.email || '';
  const clientName = session.customer_details?.name || session.client_reference_id || email.split('@')[0];

  if (!email) {
    console.error('No email in session:', session.id);
    return { statusCode: 200, body: 'No email — skipped' };
  }

  // 3. Determine plan from product metadata (set plan=blueprint|coaching|transformation on each Stripe product)
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

  // 4. Set up Supabase + Resend
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
  const resend = new Resend(process.env.RESEND_API_KEY);
  const appUrl = process.env.APP_URL || 'https://your-site.netlify.app';
  const fromEmail = process.env.FROM_EMAIL || 'CrazyyFit <onboarding@resend.dev>';

  // 5. Look up the lead for extra info (phone, goal)
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
  } catch (e) { /* lead lookup is best-effort */ }

  // 6. Generate PIN + hash
  const pin = generatePin();
  const pinHash = hashPin(pin);
  const clientId = 'c_stripe_' + session.id.slice(-10);

  // 7. Upsert client into Supabase
  const clientRow = {
    id: clientId,
    name: clientName,
    pin: pinHash,
    goal: lead?.goal || '',
    accent: randomAccent(),
    program_type: plan,
    mode: 'active',
    data: JSON.stringify({ weights: [], logs: [], meals: [], goals: [] }),
    meta: JSON.stringify({
      email,
      phone: lead?.phone || '',
      plan,
      stripeSession: session.id,
      signupSource: 'stripe',
    }),
    updated_at: new Date().toISOString(),
  };

  try {
    await supabase.from('clients').upsert(clientRow, { onConflict: 'id' });
  } catch (e) {
    console.error('Supabase upsert error:', e);
    return { statusCode: 500, body: 'DB error' };
  }

  // 8. Mark lead as converted
  if (lead?.id) {
    await supabase
      .from('signups')
      .update({ converted: true, cid: clientId, converted_at: new Date().toISOString() })
      .eq('id', lead.id);
  }

  // 9. Send welcome email
  try {
    await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: `Welcome to CrazyyFit — Your PIN is inside`,
      html: buildWelcomeEmail(clientName, pin, appUrl, plan),
    });
  } catch (e) {
    console.error('Email send error:', e);
    // Don't fail the webhook if email fails — client is already created
  }

  console.log(`Client created: ${clientId} (${clientName} / ${email}) on plan ${plan}`);
  return { statusCode: 200, body: JSON.stringify({ ok: true, clientId }) };
};
