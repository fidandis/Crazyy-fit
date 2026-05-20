# Crazyy Fit — App Store / Multi-Tenant SaaS Roadmap

Audit done 2026-05-15. Target: **B2B SaaS for coaches, iOS App Store submission.**

---

## TL;DR — the gap

You have a polished single-coach PWA that's been hand-deployed for one user (you).
To ship as a multi-tenant SaaS in the App Store you need to rebuild the trust
boundary, add real auth, partition data per coach, charge coaches, and wrap
the PWA in a native shell. None of that exists today.

**Honest estimate**: 6–10 weeks of focused work to a defensible v1 launch.
**Critical blockers** are listed first — none of them can be skipped.

---

## 🔴 CRITICAL — fix before any coach beyond you uses this

### 1. Data leak: anon key is in published JavaScript
[ai.js:2216-2217](pwa/js/ai.js#L2216-L2217) ships the Supabase URL + anon
key in the bundle. Combined with **every RLS policy being `allow_all`**
([schema.sql:168-178](pwa/schema.sql#L168-L178)), any visitor to the site
can pull every client's data — workouts, weights, photos, messages, PINs
(plaintext in old rows).

**Fix:** rewrite schema with `coach_id` on every row, RLS policies scoped
to `auth.uid()`. Remove anon-key client writes; route through
authenticated requests only.

### 2. Coach PIN is hardcoded to `9090` for every install
[core.js:18](pwa/js/core.js#L18). Any deploy of this codebase has the
same coach PIN. PIN is checked client-side after a SHA-256 hash but the
check itself runs in JS so it's bypassable.

**Fix:** drop coach PIN entirely once real auth lands. Until then,
acknowledge this is dev mode only.

### 3. No `coach_id` foreign key anywhere
[schema.sql](pwa/schema.sql) has no `coaches` table and no `coach_id`
column on `clients`. Schema cannot represent "Coach A's clients vs Coach
B's clients." Every coach who connects to your Supabase project sees
every client.

**Fix:** add `coaches` table, `clients.coach_id` FK, migrate existing rows.

### 4. PINs may be plaintext in cloud
`clients.pin` is `text` ([schema.sql:14](pwa/schema.sql#L14)). The signup
flow in `stripe-webhook.js` does hash with SHA-256 — but legacy rows from
manual onboarding may be plaintext, and SHA-256 unsalted is fast to
brute-force a 4-digit PIN regardless.

**Fix:** server-side bcrypt/argon2 PIN hashing, or replace PIN with a
proper passwordless link (magic email link).

---

## 🟡 SHIP-BLOCKERS for iOS App Store specifically

### 5. No privacy policy, no terms of service
Apple rejects without both. Need URLs accessible from inside the app and
on your marketing site. Apple also requires a
[Privacy "Nutrition Label"](https://developer.apple.com/app-store/app-privacy-details/)
declaring exactly what data you collect — given the app handles weight,
body fat %, photos, messages, this is non-trivial.

### 6. In-App Purchase (IAP) for coach subscriptions
Apple takes 15–30% of digital subscriptions and you **cannot** use Stripe
for coach billing inside the iOS app. You can:
- Use Apple IAP in-app + Stripe on the web (parallel billing systems)
- Or use Stripe on the web only and have the app be "subscription-managed
  elsewhere" (Apple usually allows this for B2B "reader apps" but
  enforcement is inconsistent)

The existing Stripe webhook ([stripe-webhook.js](netlify/functions/stripe-webhook.js))
is for **clients paying the coach** for "Blueprint" / "Transformation"
plans — that's a different revenue stream. You'll need a second one for
**coaches paying you**.

### 7. Native wrapper required
PWAs can't be submitted to iOS App Store directly. You'll use
[Capacitor](https://capacitorjs.com/) (recommended; from the Ionic team).
This wraps the existing PWA in a native shell, adds proper iOS push
notifications via APNs (web push doesn't work reliably on iOS in
standalone mode), and lets you submit a real `.ipa` file.

### 8. No account deletion in-app
Apple requires accounts created in-app be deletable in-app. Currently
there's no concept of "account" — only PIN-based access.

### 9. Manifest is minimal
[manifest.json](pwa/manifest.json) is missing: `id`, `scope`, `lang`,
`screenshots` (required for richer Add-to-Home-Screen prompts and Play
Store TWA install).

### 10. No analytics / crash reporting
Without these you can't tell if your app is broken in production. Plan
Plausible (analytics) + Sentry (crash) — both have generous free tiers.

---

## 🟢 ARCHITECTURE — what the multi-tenant version looks like

### New Supabase tables

```sql
-- Coaches own everything beneath them
create table coaches (
  id uuid primary key references auth.users on delete cascade,
  email text unique not null,
  name text,
  plan text default 'trial',           -- 'trial'|'starter'|'pro'|'studio'
  stripe_customer_id text,
  stripe_subscription_id text,
  trial_ends_at timestamptz,
  created_at timestamptz default now()
);

-- Every existing client-data table gets coach_id
alter table clients add column coach_id uuid references coaches(id) on delete cascade;
-- ... repeat for fitness_logs, checkins, etc. (cascade through clients FK is OK if clients.coach_id exists)

-- Per-coach client-count limit enforcement
create function check_client_limit() returns trigger language plpgsql as $$
declare cnt int; max_clients int;
begin
  select count(*) into cnt from clients where coach_id = new.coach_id;
  select case plan when 'trial' then 3 when 'starter' then 15 when 'pro' then 50 when 'studio' then 999 end
    into max_clients from coaches where id = new.coach_id;
  if cnt >= max_clients then raise exception 'Client limit reached for your plan'; end if;
  return new;
end $$;
```

### New RLS policies

```sql
-- Replace every "allow_all" with:
create policy "coach_owns_clients" on clients
  for all using (coach_id = auth.uid()) with check (coach_id = auth.uid());

-- Clients (the trainees, not the coaches) authenticate via a separate
-- magic-link flow scoped to a single row. Their access is read-mostly on
-- their own data + write on their own logs/checkins.
```

### New auth flow

| Actor | Today | Proposed |
|---|---|---|
| Coach | Hardcoded PIN 9090 | Email + password via Supabase Auth, magic link option |
| Client | 4-digit PIN | Magic email link → JWT cookie → access only their own data |
| App   | Anon key in JS | Auth'd Supabase calls; service-role only in Netlify Functions |

### New billing flow

```
Coach signup → 14-day trial (3 clients max) → Stripe Checkout →
  Stripe webhook updates coaches.plan + .stripe_subscription_id →
  RLS plan limits enforce client-count
```

iOS path: a second flow via Apple IAP that hits the same `coaches.plan`
column via the App Store Server API.

---

## 📋 PHASED ROADMAP

### Phase 1 — Security + multi-tenancy backbone (2–3 weeks)
- [ ] Add `coaches` table + Supabase Auth (email/password)
- [ ] Add `coach_id` to every client-owned table; backfill your existing
      data onto your own coach row
- [ ] Replace all `allow_all` RLS policies with `coach_id = auth.uid()`
- [ ] Replace hardcoded SB_URL/SB_KEY with auth'd Supabase client
- [ ] Move all PIN hashing server-side via Netlify Function (bcrypt)
- [ ] Add client magic-link auth (replace 4-digit PIN gradually)
- [ ] Remove the coach hardcoded PIN; route through Supabase Auth
- [ ] **Acceptance:** open the published JS, try to read another coach's
      data. Must fail.

### Phase 2 — Coach onboarding + billing (2 weeks)
- [ ] Coach signup page (email/password, EULA checkbox)
- [ ] Stripe Checkout for coach subscriptions (separate from existing
      client-billing flow)
- [ ] Three plans: Starter $29/mo (15 clients), Pro $79/mo (50), Studio
      $199/mo (unlimited). Numbers are sketches — research competitors.
- [ ] 14-day trial, 3-client limit during trial
- [ ] Billing portal (Stripe customer portal embed)
- [ ] Account deletion endpoint
- [ ] Plan upgrade/downgrade with prorated billing
- [ ] **Acceptance:** stranger can sign up, trial, pay, get downgraded
      when canceled, delete account.

### Phase 3 — App Store packaging (1–2 weeks)
- [ ] Wrap PWA in Capacitor (`npm install @capacitor/core @capacitor/ios`)
- [ ] Set up `capacitor.config.ts` with bundle id, server URL
- [ ] Configure APNs for iOS push (replace web push for iOS)
- [ ] Build screenshots for 6.7", 6.5", 5.5" iPhone, 12.9" iPad
- [ ] Privacy policy + terms of service (hosted; both linked from app)
- [ ] App Privacy Nutrition Label
- [ ] App Store Connect listing + screenshots + preview video
- [ ] Apple IAP integration for coach subscriptions (alongside Stripe)
- [ ] First TestFlight build → invite 5 coaches for beta
- [ ] **Acceptance:** submitted to App Store, accepted reviewers.

### Phase 4 — Operational readiness (1 week)
- [ ] Sentry crash reporting (web + iOS)
- [ ] Plausible or Posthog analytics (event tracking — signup, first
      client added, first workout logged, churned)
- [ ] Status page / uptime monitoring (Better Uptime free tier)
- [ ] Support inbox (help@yourdomain.com → Helpscout or just IMAP)
- [ ] Automated daily Supabase backups (already free-tier, just verify)
- [ ] Marketing site copy refresh — currently the existing
      [landing.html](pwa/landing.html) + [pricing.html](pwa/pricing.html)
      target your client-side pricing, not coach acquisition
- [ ] Onboarding emails (Day 0 welcome, Day 1 "add your first client",
      Day 7 trial check-in, Day 13 "trial ending tomorrow")

### Phase 5 — Post-launch polish (ongoing)
- [ ] Android version via TWA (very cheap once iOS done)
- [ ] Web push for iOS Safari 16.4+ (works in PWA-installed mode only)
- [ ] Team/studio mode (multiple coaches under one billing entity)
- [ ] White-label option for studios
- [ ] Public API (let coaches export their own data via REST)

---

## 💰 ROUGH COST TO RUN AT LAUNCH

| Service | Plan | Cost |
|---|---|---|
| Apple Developer | required | $99/yr |
| Supabase | Pro (you'll outgrow free fast) | $25/mo |
| Netlify | Pro (for functions + bandwidth) | $19/mo |
| Stripe | usage-based | 2.9% + $0.30/txn |
| Resend (email) | Pro | $20/mo |
| Sentry | Developer | free |
| Plausible | starter | $9/mo |
| Domain + SSL | annual | $15/yr |
| **Total monthly** | | **~$75/mo + Apple cut** |

Margin sanity check: at $29/mo per coach, you need ~3 paying coaches to
cover infra. The Apple 30% cut on iOS sales hits hard until you can argue
"reader app" exemption.

---

## ❓ OPEN DECISIONS I NEED FROM YOU

1. **Pricing model.** Is $29 / $79 / $199 in the ballpark, or are you
   thinking different tiers? Per-client pricing vs flat?
2. **Do trainees (clients of the coach) pay anything?** Current setup has
   client-side Blueprint/Transformation plans. Does that stay, or do
   coaches now bill their clients off-platform?
3. **Apple IAP — bite the 30% or fight for "reader app" status?** Reader
   app exemption is for content apps; we'd argue Crazyy Fit is a
   "business management tool" that coaches access externally. Risky.
4. **Existing Supabase project — keep and migrate, or fresh project?**
   Migrating preserves your real client data but you carry forward the
   permissive RLS history. Fresh is cleaner but loses your data.
5. **PIN-based client login — keep or remove?** Magic email link is
   safer and more standard but adds friction for clients who don't check
   email often. Hybrid (magic link to set up, then 6-digit PIN for daily
   access) is what most fitness apps do.
6. **What's the URL/brand?** Current marketing site is at the
   Netlify URL. App Store listing needs a real domain + branded landing
   page (not the current client-targeted one).

---

## 🚫 WHAT I'M EXPLICITLY NOT RECOMMENDING

- **Rewrite in React/Next.js.** The vanilla JS architecture is fine and
  you'd lose months. Capacitor wraps the existing PWA as-is.
- **Move off Supabase.** Free tier limits are fine for v1; Pro tier
  scales to thousands of coaches.
- **Build your own auth.** Use Supabase Auth or Clerk. Auth is the
  fastest way to ship a security incident.
- **Skip Phase 1.** The current data isolation is a lawsuit waiting to
  happen the moment a second coach onboards.
- **Build Android first.** Apple gates the harder review; doing iOS first
  surfaces the bigger compliance issues early.

---

## 🎯 SUGGESTED NEXT SESSION

Phase 1, item 1: stand up the `coaches` table + Supabase Auth + new RLS
policies in a separate Supabase project, prove the auth flow works
end-to-end, then plan the migration of your existing data. This is the
unblocker for everything else and 3–5 sessions of focused work on its
own.

Reply with which open decision answers you want to nail down first, or
say "Phase 1 go" and I'll start on the schema + auth wire-up.
