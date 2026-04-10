# Crazyy Fit — Backend Setup Guide

## Stack: Supabase (free tier)

Supabase gives you a Postgres database + REST API + realtime.
Free tier: 500MB storage, unlimited API calls, 50,000 monthly active users.

---

## Step 1 — Create your Supabase project

1. Go to https://supabase.com and sign up (free)
2. Click "New Project"
3. Name it: `crazyy-fit`
4. Set a strong database password (save it)
5. Choose the region closest to you
6. Wait ~2 minutes for it to spin up

---

## Step 2 — Run the schema

Go to: **Project → SQL Editor → New Query**
Paste the contents of `schema.sql` → click **Run**

This creates all tables, enables Row Level Security, and sets up realtime.
The schema is safe to re-run (uses `IF NOT EXISTS` + `DROP POLICY IF EXISTS`).

---

## Step 3 — Get your credentials

Go to: **Project Settings → API**

Copy these two values:
- **Project URL** — looks like `https://xxxxx.supabase.co`
- **anon/public key** — long string starting with `eyJ...`

---

## Step 4 — Connect the app

1. Log in as Coach (PIN: 9090)
2. Tap **☁ Sync** in the coach dashboard header (top-right)
3. Paste your Project URL and Anon Key → tap **Save**
4. Tap **↑ Push All** to upload all client profiles + data to the cloud
5. Tap **↓ Pull Cloud** to restore everything on a new device

The header shows **● CLOUD** in green when connected, **○ LOCAL** when not.

---

## What syncs

### On every save (automatic)
| Data | Trigger |
|------|---------|
| Fitness logs | After each workout logged |
| Check-ins | After each check-in submitted |
| Measurements | After each measurement saved |
| Goals + progress | After each goal value logged |
| Coach notes | After each note save |

### On Push All / Pull Cloud (manual)
| Data | Notes |
|------|-------|
| Client profiles (name, PIN hash, goal, mode, program data) | Full upsert |
| All per-client data above | Pushed/pulled for every client |

### Not synced (localStorage only)
- XP / milestones (add `syncClientData` extension if needed)
- Terminated clients list

---

## PIN security

PINs are hashed with SHA-256 before storage. The app supports backward-compat:
existing plaintext PINs still work at login. New clients created via onboarding
automatically get hashed PINs stored in Supabase.

---

## Brute-force protection

After 5 consecutive wrong PIN attempts, the login screen locks for 30 seconds.
The counter resets on a successful login.

---

## Export / Restore (offline backup)

Even without Supabase, you can back up all data:
- Coach dashboard header → **⬇ Export** — downloads a full JSON file
- Coach dashboard header → **⬆ Restore** — imports a previously exported file

Recommended: export weekly as a manual backup.

---

## Realtime

The schema enables realtime on `fitness_logs`, `checkins`, `measurements`, and `client_xp`.
The coach dashboard currently refreshes on load and after sync actions.

---

## Resetting / starting fresh

To wipe all Supabase data:
```sql
truncate clients cascade;
```
Then use **Push All** from the app to re-populate.
