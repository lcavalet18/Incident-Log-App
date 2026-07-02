-- 0001_init_schema.sql
-- Core lookup tables + user profiles with role.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles (extends auth.users with app-specific fields)
-- ---------------------------------------------------------------------------
create table if not exists public.centers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  location text,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'invigilator' check (role in ('invigilator', 'supervisor', 'admin')),
  center_id uuid references public.centers (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'One row per auth.users, carries role + center assignment used by RLS.';

-- Keep updated_at fresh on every update.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Auto-create a profile row whenever a new auth user signs up.
-- Role/full_name/center_id can be passed in via signUp options.data.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role, center_id)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.raw_user_meta_data ->> 'role', 'invigilator'),
    nullif(new.raw_user_meta_data ->> 'center_id', '')::uuid
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_handle_new_user on auth.users;
create trigger trg_handle_new_user
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- exams
-- ---------------------------------------------------------------------------
create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  total_questions integer,
  language text not null default 'en' check (language in ('en', 'ar')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- incident_codes
-- ---------------------------------------------------------------------------
create table if not exists public.incident_codes (
  code text primary key,
  label text not null,
  category text not null,
  is_malpractice boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_incident_codes_updated_at on public.incident_codes;
create trigger trg_incident_codes_updated_at
before update on public.incident_codes
for each row execute function public.set_updated_at();
