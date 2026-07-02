-- 0006_reference_on_any_non_draft.sql
-- The incident form now lets the invigilator pick a Status directly
-- (Draft/Submitted/Reviewed/Closed) instead of only ever landing on
-- "submitted" first. Widen the reference-number trigger so a reference
-- is assigned the moment a report leaves draft, regardless of which
-- status it lands on -- otherwise a report saved straight to
-- "Reviewed"/"Closed" would never get an INC-... reference. Idempotent
-- (CREATE OR REPLACE).

create or replace function public.generate_incident_reference()
returns trigger as $$
declare
  ref_year integer := extract(year from now())::int;
  next_val integer;
begin
  if new.status <> 'draft' and new.incident_reference is null then
    insert into public.incident_reference_counters (year, last_value)
    values (ref_year, 1)
    on conflict (year) do update set last_value = public.incident_reference_counters.last_value + 1
    returning last_value into next_val;

    new.incident_reference := 'INC-' || ref_year || '-' || lpad(next_val::text, 6, '0');
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;
