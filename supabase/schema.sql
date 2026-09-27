-- Quiz Quest schema for Supabase (PostgreSQL)
-- Run this in the Supabase SQL Editor.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text not null default '',
  category text not null default 'General',
  icon text not null default '🎯',
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  position int not null default 0,
  question text not null,
  options jsonb not null, -- string[]
  correct_index int not null,
  explanation text,
  created_at timestamptz not null default now()
);

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  score int not null,
  total int not null,
  percentage int not null,
  time_ms bigint,
  created_at timestamptz not null default now()
);

create index if not exists questions_quiz_id_idx on public.questions(quiz_id, position);
create index if not exists attempts_user_id_idx on public.attempts(user_id);
create index if not exists attempts_quiz_id_idx on public.attempts(quiz_id);

-- ---------------------------------------------------------------------------
-- Sync a profile row whenever a new auth user is created
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.quizzes enable row level security;
alter table public.questions enable row level security;
alter table public.attempts enable row level security;

-- Quizzes and questions are public to read (catalog + gameplay).
drop policy if exists "quizzes are publicly readable" on public.quizzes;
create policy "quizzes are publicly readable" on public.quizzes
  for select using (true);

drop policy if exists "questions are publicly readable" on public.questions;
create policy "questions are publicly readable" on public.questions
  for select using (true);

-- Profiles: a user can read only their own row.
drop policy if exists "profiles are visible to their owner" on public.profiles;
create policy "profiles are visible to their owner" on public.profiles
  for select using (auth.uid() = id);

-- Attempts: a user can read and insert only their own rows.
drop policy if exists "attempts are visible to their owner" on public.attempts;
create policy "attempts are visible to their owner" on public.attempts
  for select using (auth.uid() = user_id);

drop policy if exists "users can insert their own attempts" on public.attempts;
create policy "users can insert their own attempts" on public.attempts
  for insert with check (auth.uid() = user_id);

-- NOTE: quiz/question writes and cross-user reads are done with the service
-- role key from API routes, which bypasses RLS and is admin-gated in code.
