-- ═══════════════════════════════════════════════════════════
-- CRAZYY FIT — SECURITY LOCKDOWN MIGRATION
-- Run AFTER schema.sql, in: Supabase → SQL Editor → New Query
--
-- What this does:
--   • Removes the permissive "allow_all" policies that let anyone with
--     the anon key read/write every row.
--   • Leaves RLS ENABLED with NO anon policies → the anon key can do
--     nothing. All access now flows through the Netlify Functions
--     (/api/sb, /api/login, /api/upload-photo) which use the
--     service-role key and bypass RLS after validating a session token.
--
-- Safe to re-run.
-- ═══════════════════════════════════════════════════════════

-- ── Drop every permissive policy ─────────────────────────────────
drop policy if exists "allow_all" on clients;
drop policy if exists "allow_all" on fitness_logs;
drop policy if exists "allow_all" on checkins;
drop policy if exists "allow_all" on measurements;
drop policy if exists "allow_all" on personal_records;
drop policy if exists "allow_all" on client_xp;
drop policy if exists "allow_all" on meal_plans;
drop policy if exists "allow_all" on coach_notes;
drop policy if exists "allow_all" on notifications;
drop policy if exists "allow_all" on client_goals;
drop policy if exists "allow_all" on goal_progress;
drop policy if exists "allow_all" on messages;
drop policy if exists "allow_all" on push_subscriptions;
drop policy if exists "allow_all" on signups;

-- ── Ensure RLS is ON for every table (denies anon by default) ────
alter table clients            enable row level security;
alter table fitness_logs       enable row level security;
alter table checkins           enable row level security;
alter table measurements       enable row level security;
alter table personal_records   enable row level security;
alter table client_xp          enable row level security;
alter table meal_plans         enable row level security;
alter table coach_notes        enable row level security;
alter table notifications      enable row level security;
alter table client_goals       enable row level security;
alter table goal_progress      enable row level security;
alter table messages           enable row level security;
alter table push_subscriptions enable row level security;
alter table signups            enable row level security;

-- shared_foods (created lazily by the app) — lock it too if present
do $$ begin
  execute 'alter table shared_foods enable row level security';
  execute 'drop policy if exists "allow_all" on shared_foods';
exception when undefined_table then null; end $$;

-- ── Revoke the anon role's table grants for good measure ─────────
-- RLS already blocks anon (no policies), but revoking grants makes the
-- intent explicit and protects against a future policy mistake.
do $$
declare t text;
begin
  foreach t in array array[
    'clients','fitness_logs','checkins','measurements','personal_records',
    'client_xp','meal_plans','coach_notes','notifications','client_goals',
    'goal_progress','messages','push_subscriptions','signups'
  ] loop
    execute format('revoke all on table %I from anon', t);
  end loop;
end $$;

-- ═══════════════════════════════════════════════════════════
-- VERIFY (optional — run separately to confirm)
--   With the anon key, this should now return 0 rows / permission denied:
--     select * from clients limit 1;
-- ═══════════════════════════════════════════════════════════
