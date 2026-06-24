-- Tab Graveyard — Supabase schema, RLS, and signup trigger.
-- Run this in the Supabase dashboard → SQL Editor → New query → Run.
-- Safe to re-run (uses IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY IF EXISTS).

-- pgvector (for AI semantic search later). Harmless if already enabled.
create extension if not exists vector;

-- ---------------------------------------------------------------------------
-- users: mirrors auth.users and stores the Pro flag.
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  is_pro boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

-- A user can read their own row.
drop policy if exists "users_select_own" on public.users;
create policy "users_select_own" on public.users
  for select using (auth.uid() = id);

-- A user can insert their own row (used by the dev "Activate Pro (test)" upsert
-- and as a fallback if the signup trigger hasn't created the row yet).
drop policy if exists "users_insert_own" on public.users;
create policy "users_insert_own" on public.users
  for insert with check (auth.uid() = id);

-- ⚠️ TEST-MODE ONLY POLICY ⚠️
-- This lets a signed-in user update their OWN row, including is_pro. That is what
-- makes the in-app "Activate Pro (test)" toggle work without Stripe.
-- BEFORE GOING TO PRODUCTION: drop this policy (or restrict it so is_pro cannot be
-- set by the client) and update is_pro only from the Stripe webhook via the
-- service-role key, which bypasses RLS. Otherwise any user could grant themselves Pro.
drop policy if exists "users_update_own" on public.users;
create policy "users_update_own" on public.users
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- closed_tabs: synced tab history for Pro users.
-- ---------------------------------------------------------------------------
create table if not exists public.closed_tabs (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.users (id) on delete cascade,
  title text,
  url text,
  domain text,
  fav_icon_url text,
  description text,               -- page meta description, embedded for AI search
  closed_at bigint,
  embedding vector(384),          -- for AI semantic search
  created_at timestamptz not null default now()
);

-- For tables created before `description` existed:
alter table public.closed_tabs add column if not exists description text;

create index if not exists closed_tabs_user_id_idx on public.closed_tabs (user_id);

alter table public.closed_tabs enable row level security;

drop policy if exists "closed_tabs_select_own" on public.closed_tabs;
create policy "closed_tabs_select_own" on public.closed_tabs
  for select using (auth.uid() = user_id);

drop policy if exists "closed_tabs_insert_own" on public.closed_tabs;
create policy "closed_tabs_insert_own" on public.closed_tabs
  for insert with check (auth.uid() = user_id);

drop policy if exists "closed_tabs_delete_own" on public.closed_tabs;
create policy "closed_tabs_delete_own" on public.closed_tabs
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Auto-create a public.users row when someone signs up.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: create rows for any users who signed up before the trigger existed.
insert into public.users (id, email)
select id, email from auth.users
on conflict (id) do nothing;
