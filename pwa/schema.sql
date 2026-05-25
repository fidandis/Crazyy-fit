-- ═══════════════════════════════════════════════════════════
-- CRAZYY FIT — SUPABASE SCHEMA
-- Run this in: Supabase → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── CLIENTS ──────────────────────────────────────────────────────
create table if not exists clients (
  id           text primary key,          -- matches localStorage client id
  name         text not null,
  goal         text,
  pin          text not null,
  accent       text default '#3B9EFF',
  program_type text,
  data         jsonb,                      -- full program data blob
  meta         jsonb,                      -- height, weight, bf%, skinfolds etc
  weight_loss  jsonb,                      -- {start, goal, unit}
  mode         text default 'inperson',   -- 'inperson' | 'remote' | 'blueprint'
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ── FITNESS LOGS ─────────────────────────────────────────────────
create table if not exists fitness_logs (
  id         uuid primary key default uuid_generate_v4(),
  client_id  text references clients(id) on delete cascade,
  logged_at  timestamptz not null,
  type       text,
  calories   int,
  duration   int,
  avg_hr     int,
  max_hr     int,
  zone       text,
  created_at timestamptz default now()
);

-- ── CHECK-INS ────────────────────────────────────────────────────
create table if not exists checkins (
  id          uuid primary key default uuid_generate_v4(),
  client_id   text references clients(id) on delete cascade,
  checked_at  timestamptz not null,
  sleep       int,
  stress      int,
  energy      int,
  adherence   int,
  notes       text,
  photo_url   text,                        -- stored in Supabase Storage
  created_at  timestamptz default now()
);

-- ── MEASUREMENTS ─────────────────────────────────────────────────
create table if not exists measurements (
  id          uuid primary key default uuid_generate_v4(),
  client_id   text references clients(id) on delete cascade,
  measured_at timestamptz not null,
  waist       numeric(5,2),
  hips        numeric(5,2),
  chest       numeric(5,2),
  larm        numeric(5,2),
  rarm        numeric(5,2),
  lthigh      numeric(5,2),
  rthigh      numeric(5,2),
  weight_lbs  numeric(6,2),
  body_fat_pct numeric(5,2),
  created_at  timestamptz default now()
);

-- ── PERSONAL RECORDS ─────────────────────────────────────────────
create table if not exists personal_records (
  id          uuid primary key default uuid_generate_v4(),
  client_id   text references clients(id) on delete cascade,
  exercise    text not null,
  weight_lbs  numeric(6,2),
  reps        int,
  orm         numeric(6,2),               -- estimated 1RM
  recorded_at timestamptz not null,
  created_at  timestamptz default now(),
  unique(client_id, exercise)             -- one PR per exercise (upsert)
);

-- ── XP + MILESTONES ──────────────────────────────────────────────
create table if not exists client_xp (
  client_id        text primary key references clients(id) on delete cascade,
  total_xp         int default 0,
  unlocked_milestones text[] default '{}',
  updated_at       timestamptz default now()
);

-- ── MEAL PLANS ───────────────────────────────────────────────────
create table if not exists meal_plans (
  client_id  text primary key references clients(id) on delete cascade,
  plan_data  jsonb not null,              -- full weekly plan JSON
  updated_at timestamptz default now()
);

-- ── COACH NOTES ──────────────────────────────────────────────────
create table if not exists coach_notes (
  client_id  text primary key references clients(id) on delete cascade,
  notes      text,
  updated_at timestamptz default now()
);

-- ── CLIENT GOALS ─────────────────────────────────────────────────
create table if not exists client_goals (
  id          text not null,               -- e.g. 'wl_migrated', 'goal_1234'
  client_id   text references clients(id) on delete cascade,
  type        text not null,               -- 'weight' | 'runtime' | 'lift'
  label       text not null,
  start_val   numeric(8,2),
  target_val  numeric(8,2),
  unit        text,                        -- 'lbs', 'kg', 'min:sec', etc.
  created_at  timestamptz default now(),
  primary key (id, client_id)
);

-- ── GOAL PROGRESS ────────────────────────────────────────────────
create table if not exists goal_progress (
  goal_id     text not null,
  client_id   text references clients(id) on delete cascade,
  current_val numeric(8,2),
  logged_at   timestamptz default now(),
  primary key (goal_id, client_id)
);

-- ── NOTIFICATIONS LOG ─────────────────────────────────────────────
create table if not exists notifications (
  id         uuid primary key default uuid_generate_v4(),
  client_id  text references clients(id) on delete cascade,
  title      text,
  body       text,
  sent_at    timestamptz default now(),
  read       boolean default false
);

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════

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

-- Allow full access with anon key (app controls auth via PIN)
-- For production you'd lock this down further with Supabase Auth
-- DROP first so this file is safe to re-run
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

create policy "allow_all" on clients            for all using (true) with check (true);
create policy "allow_all" on fitness_logs       for all using (true) with check (true);
create policy "allow_all" on checkins           for all using (true) with check (true);
create policy "allow_all" on measurements       for all using (true) with check (true);
create policy "allow_all" on personal_records   for all using (true) with check (true);
create policy "allow_all" on client_xp          for all using (true) with check (true);
create policy "allow_all" on meal_plans         for all using (true) with check (true);
create policy "allow_all" on coach_notes        for all using (true) with check (true);
create policy "allow_all" on notifications      for all using (true) with check (true);
create policy "allow_all" on client_goals       for all using (true) with check (true);
create policy "allow_all" on goal_progress      for all using (true) with check (true);

-- ═══════════════════════════════════════════════════════════
-- REALTIME
-- ═══════════════════════════════════════════════════════════

-- Enable realtime on key tables so coach dashboard updates live
do $$ begin
  alter publication supabase_realtime add table fitness_logs;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table checkins;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table client_xp;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table measurements;
exception when duplicate_object then null; end $$;

-- ── MESSAGES (coach → client) ────────────────────────────────────
create table if not exists messages (
  id         text primary key,              -- 'msg_{cid}_{timestamp}'
  client_id  text references clients(id) on delete cascade,
  from_coach boolean default true,
  body       text not null,
  read       boolean default false,
  sent_at    timestamptz default now()
);

-- ── PUSH SUBSCRIPTIONS ───────────────────────────────────────────
create table if not exists push_subscriptions (
  client_id    text primary key references clients(id) on delete cascade,
  subscription jsonb not null,
  updated_at   timestamptz default now()
);

-- ── SIGNUPS (lead capture) ───────────────────────────────────────
create table if not exists signups (
  id           text primary key,
  name         text,
  email        text,
  phone        text,
  age          text,
  goal         text,
  plan         text,
  converted    boolean default false,
  cid          text,
  converted_at timestamptz,
  created_at   timestamptz default now()
);

alter table messages            enable row level security;
alter table push_subscriptions  enable row level security;
alter table signups             enable row level security;

drop policy if exists "allow_all" on messages;
drop policy if exists "allow_all" on push_subscriptions;
drop policy if exists "allow_all" on signups;

create policy "allow_all" on messages            for all using (true) with check (true);
create policy "allow_all" on push_subscriptions  for all using (true) with check (true);
create policy "allow_all" on signups             for all using (true) with check (true);

-- ═══════════════════════════════════════════════════════════
-- INDEXES for performance
-- ═══════════════════════════════════════════════════════════

create index if not exists idx_fitness_logs_client    on fitness_logs(client_id, logged_at desc);
create index if not exists idx_checkins_client        on checkins(client_id, checked_at desc);
create index if not exists idx_measurements_client    on measurements(client_id, measured_at desc);
create index if not exists idx_notifications_client   on notifications(client_id, sent_at desc);
create index if not exists idx_client_goals_client    on client_goals(client_id);
create index if not exists idx_goal_progress_client   on goal_progress(client_id);
create index if not exists idx_messages_client        on messages(client_id, sent_at desc);
