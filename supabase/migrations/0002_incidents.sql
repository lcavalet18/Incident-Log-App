-- 0002_incidents.sql
-- Incident reports + repeatable candidate rows.

create table if not exists public.incident_reference_counters (
  year integer primary key,
  last_value integer not null default 0
);

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  incident_reference text unique,

  center_id uuid not null references public.centers (id),
  room_number text,
  exam_id uuid references public.exams (id),
  exam_date date,
  session text,

  code text references public.incident_codes (code),
  scope text check (scope in ('individual', 'group')),

  time_started timestamptz,
  time_resolved timestamptz,
  duration_minutes integer,

  description text,
  action_taken text,
  remedial_action text,
  remedial_notes text,

  questions_affected_count integer,
  questions_affected_list integer[],

  status text not null default 'draft' check (status in ('draft', 'submitted', 'reviewed', 'closed')),

  reported_to_board boolean not null default false,
  board_reference_no text,
  follow_up_required boolean not null default false,
  follow_up_notes text,

  reporting_invigilator_id uuid not null references public.profiles (id),
  supervisor_name text,
  supervisor_notes text,

  witnesses text,
  evidence_confiscated boolean not null default false,
  attachment_url text,

  client_generated_id text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint chk_other_requires_description
    check (code is distinct from 'OTH' or (description is not null and length(trim(description)) > 0))
);

comment on column public.incidents.client_generated_id is
  'UUID generated on-device at creation time; lets the offline sync queue upsert idempotently instead of double-inserting after a retry.';

create unique index if not exists uq_incidents_client_generated_id
  on public.incidents (client_generated_id)
  where client_generated_id is not null;

create index if not exists idx_incidents_center on public.incidents (center_id);
create index if not exists idx_incidents_exam on public.incidents (exam_id);
create index if not exists idx_incidents_status on public.incidents (status);
create index if not exists idx_incidents_code on public.incidents (code);
create index if not exists idx_incidents_invigilator on public.incidents (reporting_invigilator_id);
create index if not exists idx_incidents_created_at on public.incidents (created_at desc);
create index if not exists idx_incidents_exam_date on public.incidents (exam_date);

drop trigger if exists trg_incidents_updated_at on public.incidents;
create trigger trg_incidents_updated_at
before update on public.incidents
for each row execute function public.set_updated_at();

-- Auto-calculate duration_minutes from time_started/time_resolved.
create or replace function public.calculate_incident_duration()
returns trigger as $$
begin
  if new.time_started is not null and new.time_resolved is not null then
    new.duration_minutes := greatest(
      0,
      round(extract(epoch from (new.time_resolved - new.time_started)) / 60)::int
    );
  else
    new.duration_minutes := null;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_incidents_duration on public.incidents;
create trigger trg_incidents_duration
before insert or update on public.incidents
for each row execute function public.calculate_incident_duration();

-- Auto-generate incident_reference (INC-<year>-<6 digit seq>) the moment a
-- report moves into 'submitted' status (draft reports stay unnumbered).
create or replace function public.generate_incident_reference()
returns trigger as $$
declare
  ref_year integer := extract(year from now())::int;
  next_val integer;
begin
  if new.status = 'submitted' and new.incident_reference is null then
    insert into public.incident_reference_counters (year, last_value)
    values (ref_year, 1)
    on conflict (year) do update set last_value = public.incident_reference_counters.last_value + 1
    returning last_value into next_val;

    new.incident_reference := 'INC-' || ref_year || '-' || lpad(next_val::text, 6, '0');
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_incidents_reference on public.incidents;
create trigger trg_incidents_reference
before insert or update on public.incidents
for each row execute function public.generate_incident_reference();

-- ---------------------------------------------------------------------------
-- incident_candidates (repeatable rows for room-wide / multi-student incidents)
-- ---------------------------------------------------------------------------
create table if not exists public.incident_candidates (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents (id) on delete cascade,
  student_name text not null,
  student_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_incident_candidates_incident on public.incident_candidates (incident_id);
