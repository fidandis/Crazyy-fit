# Crazyy Fit PWA — Setup & Coach Guide

## What's in this folder
```
crazyy-fit/pwa/
├── index.html       ← The entire app (all JS, CSS, and HTML in one file)
├── manifest.json    ← PWA config (name, icons, theme)
├── sw.js            ← Service worker (offline support)
├── schema.sql       ← Supabase database schema (optional cloud sync)
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

---

## How to host it (required once for PWA install)

The PWA needs to be served over HTTPS so clients can install it to their home screen.

### Option A — Netlify Drop (easiest, 2 minutes)
1. Go to https://app.netlify.com/drop
2. Drag the entire `pwa/` folder onto the page
3. Netlify gives you a free URL like `https://random-name.netlify.app`
4. Send that link to your clients

### Option B — GitHub Pages (free, permanent)
1. Create a free GitHub account
2. New repository → upload all files in `pwa/`
3. Settings → Pages → Deploy from main branch
4. Your URL: `https://yourusername.github.io/crazyy-fit`

### Option C — Your own domain
Upload the contents of `pwa/` to any web host (must be HTTPS).

---

## How clients install it on their phone

### iPhone / iPad (Safari only)
1. Open the URL in Safari
2. Tap the Share button (box with arrow)
3. Scroll down → tap "Add to Home Screen"
4. Tap "Add"
5. App icon appears on home screen — works offline

### Android (Chrome)
1. Open the URL in Chrome
2. Tap the 3-dot menu → "Add to Home Screen" or "Install App"
3. Tap "Install"
4. App icon appears — works offline

---

## Coach login
- Coach PIN: **9090** (change in the `COACH_PIN` constant near the top of index.html)
- Coach dashboard shows all active clients grouped by type:
  - In-Person / Remote / Crazyy Blueprint
- From the dashboard you can: add clients, view/edit programs, log notes,
  send notifications, pause access, archive clients, export/restore data

---

## Adding a new client

Use the coach dashboard — tap **+ Add Client** to launch the onboarding wizard.
The wizard collects name, PIN, goal, program type, schedule, and starting stats,
then generates the client profile automatically.

No need to edit `index.html` manually to add clients.

---

## Client types & modes

Each client card has three mode buttons:
- **In-Person** — client trains with coach at a location
- **Remote** — client follows program independently
- **Crazyy Blueprint** — client uses a self-guided blueprint plan

Mode is stored per-client and reflected in the grouped dashboard layout.

---

## Goals system

Goals are set per client and displayed as progress bars in both the client
view and the coach dashboard card. Three goal types are supported:

- **Weight** — tracks weight loss (lower is better)
- **Run Time** — tracks a timed distance goal in mm:ss (lower is better)
- **Lift** — tracks a strength PR (higher is better)

Goals are inferred automatically from onboarding data where possible.
The coach can add, edit, or remove goals via the **Manage** button on each card.

---

## PIN management
- Change a client's PIN: coach dashboard → client card → **Edit**
- Each client only sees their own program after logging in
- Coach PIN is hardcoded in `index.html` (search `COACH_PIN`)

---

## Data storage

All data is stored in `localStorage` on the device by default — no server required.

### Optional: Supabase cloud sync
If you want data backed up to the cloud:
1. Create a free Supabase project at https://supabase.com
2. Run `schema.sql` in the Supabase SQL Editor
3. Add your project URL and anon key to the `SUPABASE_URL` / `SUPABASE_ANON_KEY`
   constants near the top of `index.html`
4. The app will automatically sync on login and push changes to the cloud

### Export / Restore
- Coach dashboard header → **Export** — downloads a full JSON backup of all data
- Coach dashboard header → **Restore** — imports a previously exported JSON file

---

## Offline behaviour
- Once installed, the app works 100% offline
- Workouts, nutrition, check-ins, measurements — all stored locally
- Macro Analyzer requires internet (calls external AI API)
- Fonts are cached after first visit
