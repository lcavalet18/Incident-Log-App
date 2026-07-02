-- 0005_exam_cycle_and_students.sql
-- Adds exam_cycle to incidents, adds student email + auto-generated
-- student IDs to incident_candidates, and tidies up a couple of things
-- while we're touching this area. Idempotent: safe to re-run.

-- ---------------------------------------------------------------------------
-- exam_cycle
-- ---------------------------------------------------------------------------
alter table public.incidents add column if not exists exam_cycle text;

alter table public.incidents drop constraint if exists chk_incidents_exam_cycle;
alter table public.incidents add constraint chk_incidents_exam_cycle
  check (exam_cycle is null or exam_cycle in ('February 2026', 'May 2026'));

create index if not exists idx_incidents_exam_cycle on public.incidents (exam_cycle);

-- ---------------------------------------------------------------------------
-- student email
-- ---------------------------------------------------------------------------
alter table public.incident_candidates add column if not exists student_email text;

-- ---------------------------------------------------------------------------
-- Auto-generated, human-readable student IDs (STU-<year>-<6 digit seq>).
-- Mirrors the incident_reference generator in 0002_incidents.sql. The
-- invigilator never supplies this — it's assigned the moment a candidate
-- row is inserted.
-- ---------------------------------------------------------------------------
create table if not exists public.student_id_counters (
  year integer primary key,
  last_value integer not null default 0
);

-- Counter tables are only ever written to by the security-definer trigger
-- below (which runs as the table owner and bypasses RLS); enabling RLS
-- with no policies blocks direct read/write via the client APIs.
alter table public.student_id_counters enable row level security;
alter table public.incident_reference_counters enable row level security;

create or replace function public.generate_student_id()
returns trigger as $$
declare
  id_year integer := extract(year from now())::int;
  next_val integer;
begin
  if new.student_id is null then
    insert into public.student_id_counters (year, last_value)
    values (id_year, 1)
    on conflict (year) do update set last_value = public.student_id_counters.last_value + 1
    returning last_value into next_val;

    new.student_id := 'STU-' || id_year || '-' || lpad(next_val::text, 6, '0');
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_generate_student_id on public.incident_candidates;
create trigger trg_generate_student_id
before insert on public.incident_candidates
for each row execute function public.generate_student_id();

create unique index if not exists uq_incident_candidates_student_id
  on public.incident_candidates (student_id)
  where student_id is not null;

-- ---------------------------------------------------------------------------
-- Make sure "Non-functioning toilet" exists under Facilities & Environment
-- for the new category -> issue picker. SAN already covers this; relabel
-- it to the clearer wording rather than adding a near-duplicate code.
-- ---------------------------------------------------------------------------
update public.incident_codes
set label = 'Non-functioning toilet'
where code = 'SAN';
