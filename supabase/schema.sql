-- FixScan AI - Supabase schema
-- Run this whole file in Supabase > SQL Editor > New query.
-- Demo Mode works without Supabase. This is only needed for a shared database.

create extension if not exists pgcrypto;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('plumbing','seepage','electrical','structural','paint','carpentry','appliance','other')),
  location text not null,
  description text not null,
  image_url text,
  after_image_url text,
  ai_diagnosis text,
  problem_type text,
  probable_cause text,
  severity text check (severity in ('low','medium','high')),
  priority text check (priority in ('low','medium','high')),
  sla_due timestamptz,
  duplicate_of uuid references public.tasks(id),
  similarity_score numeric,
  report_count int not null default 1,
  assignee_suggestion text,
  estimated_cost_min int,
  estimated_cost_max int,
  action_steps text[] default '{}',
  status text not null default 'open' check (status in ('open','in_progress','resolved')),
  reporter_name text,
  reporter_contact text,
  needs_review boolean not null default false,
  notes text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_status_idx on public.tasks(status);
create index if not exists tasks_priority_idx on public.tasks(priority);
create index if not exists tasks_location_idx on public.tasks(location);
create index if not exists tasks_created_at_idx on public.tasks(created_at desc);

-- Storage bucket for photos. Create it in Supabase > Storage, or run:
-- insert into storage.buckets (id, name, public) values ('task-images', 'task-images', true)
--   on conflict (id) do nothing;

-- Row Level Security note for the hackathon demo:
-- Enable RLS and use a permissive demo policy for reads/writes from the anon key,
-- and state that choice in the README. Production would use authenticated
-- policies per property. Do not leave RLS off silently.
alter table public.tasks enable row level security;

-- Demo policy only. Replace this with authenticated policies before any real use.
drop policy if exists "demo read" on public.tasks;
create policy "demo read" on public.tasks for select using (true);
drop policy if exists "demo write" on public.tasks;
create policy "demo write" on public.tasks for all using (true) with check (true);
