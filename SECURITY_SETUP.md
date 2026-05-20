# Crazyy Fit — Security Setup (single-coach, PWA)

This locks down the app so client data is no longer readable by anyone who
opens the browser console. All Supabase access now goes through
authenticated Netlify Functions instead of a public anon key in the bundle.

**You must complete all 4 steps below or sync will stop working.**

---

## What changed

| Before | After |
|---|---|
| Supabase URL + anon key hardcoded in `js/ai.js` | Removed from the bundle entirely |
| RLS = `allow_all` (anyone could read all data) | RLS denies anon; only server functions (service key) access data |
| Coach PIN `9090` in source, checked in browser | PIN checked server-side in `/api/login`, returns a signed token |
| Client PINs checked in browser against full client list | PIN checked server-side; plaintext PINs auto-upgraded to hashed |

---

## Step 1 — Set Netlify environment variables

Netlify → Site settings → Environment variables. Add:

| Variable | Value |
|---|---|
| `SUPABASE_URL` | `https://gfmvxfofsttuulwbvipy.supabase.co` (your project URL) |
| `SUPABASE_SERVICE_KEY` | Supabase → Project Settings → API → **service_role** key (NOT anon) |
| `AUTH_SECRET` | A random 32+ char string. Generate: `openssl rand -base64 32` |
| `COACH_PIN_HASH` | SHA-256 of your NEW coach PIN (see Step 2) |

> The `SUPABASE_SERVICE_KEY` and `AUTH_SECRET` are secrets — they live only
> in Netlify, never in the repo or the browser.

If you already set `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` for the Stripe
webhook, reuse them.

---

## Step 2 — Choose a new coach PIN and hash it

Pick a PIN that is **not** `9090`. Then hash it:

**Mac/Linux:**
```bash
echo -n "1234" | shasum -a 256
```

**Windows PowerShell:**
```powershell
$pin = "1234"
[BitConverter]::ToString(
  [System.Security.Cryptography.SHA256]::Create().ComputeHash(
    [Text.Encoding]::UTF8.GetBytes($pin)
  )
).Replace("-","").ToLower()
```

Copy the 64-character hex output into the `COACH_PIN_HASH` env var.
(Replace `1234` with your real PIN. 4–8 digits supported.)

---

## Step 3 — Run the lockdown SQL

Supabase → SQL Editor → New Query → paste the contents of
[`pwa/schema-lockdown.sql`](pwa/schema-lockdown.sql) → **Run**.

This removes the `allow_all` policies. After this, the old anon key is
useless — confirm by opening the SQL editor's "anon" role and running
`select * from clients limit 1;` — it should return nothing.

---

## Step 4 — Deploy + verify

1. Deploy the site (push to your connected branch, or `netlify deploy --prod`).
2. Open the app, enter your **new** coach PIN → should reach the dashboard.
3. In the dashboard, tap **☁ Sync** → status should read
   "● Authenticated — sync active". Tap **⚡ Test Connection** → expect
   "✓ Connected".
4. Open browser DevTools → Network. Confirm calls go to `/api/sb` and
   `/api/login`, **not** directly to `*.supabase.co`.
5. View source on `js/ai.js` → confirm there is no `SB_KEY` / anon key.

---

## Verifying the leak is closed

Before this change, anyone could run this in their console on your site and
get every client's data:

```js
fetch('https://YOURPROJECT.supabase.co/rest/v1/clients?select=*', {
  headers: { apikey: 'THE_ANON_KEY_FROM_THE_BUNDLE' }
}).then(r => r.json()).then(console.log)
```

After Step 3, that returns `[]` or a permission error — the anon key has no
table access. The only path to data is through `/api/sb` with a valid
session token, which requires knowing a PIN.

---

## Rotating the coach PIN later

Re-run Step 2 with the new PIN, update `COACH_PIN_HASH` in Netlify, redeploy.
No code change needed.

---

## Notes / limitations (acceptable for single-coach)

- **Client 4-digit PINs are low-entropy.** The server rate-limits to 10
  failed attempts per IP per 10 minutes, which makes brute force slow, but
  a determined attacker with many IPs could still try. If you want
  stronger client auth later, switch to magic email links (bigger change).
- **The session token is a bearer token in localStorage.** If a device is
  compromised, the token is valid until it expires (14 days). Logging out
  clears it.
- **Photo uploads** now go through `/api/upload-photo` (5MB cap, scoped to
  the authenticated client).
- The legacy "paste your Supabase URL/key" sync settings screen is gone —
  sync is automatic once authenticated.

---

## Files added/changed this pass

- `netlify/functions/login.js` — PIN → signed token
- `netlify/functions/sb.js` — authenticated Supabase proxy
- `netlify/functions/upload-photo.js` — authenticated photo upload
- `pwa/schema-lockdown.sql` — RLS lockdown migration
- `pwa/js/ai.js` — proxy client (anon key removed)
- `pwa/js/core.js` — login flow + fresh-device hydration + logout clears token
- `pwa/js/macros.js` — page-load pull gated behind auth
