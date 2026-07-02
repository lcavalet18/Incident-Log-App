-- 0008_fix_candidate_rls_and_description_check.sql
-- Fixes two bugs that silently block real incident submissions from ever
-- reaching the database:
--
-- 1. The incident form lets an invigilator pick a status directly at
--    submission time (Draft / Submitted / Reviewed / Closed) and defaults
--    to "Submitted" -- most filed reports are never a draft. But the
--    incident_candidates INSERT policy still required the parent incident
--    to have status = 'draft' for non-staff, so the candidate row (student
--    name/email) was rejected by RLS on every non-draft submission. The
--    incidents row itself would still get created (governed by the
--    separate, unrestricted incidents_insert_own policy), but the whole
--    offline-sync attempt throws on the candidates insert and the queued
--    report is left stuck in "pending/error" state, and readers joining
--    incident_candidates would see no student name/email/ID for that row.
--    Insert should only check ownership, mirroring incidents_insert_own.
--    Update/delete stay draft-restricted so candidate details can't be
--    altered by a non-staff user after a report has been filed.
--
-- 2. chk_other_requires_description required a non-empty `description`
--    whenever code = 'OTH', but the current form no longer collects a
--    separate description field (folded into "Action taken"), so it
--    always submits description = null -- rejecting every "Other"
--    incident outright.
--
-- Idempotent: safe to re-run.

drop policy if exists "incident_candidates_insert" on public.incident_candidates;
create policy "incident_candidates_insert"
on public.incident_candidates for insert
to authenticated
with check (
  exists (
    select 1 from public.incidents i
    where i.id = incident_candidates.incident_id
      and (i.reporting_invigilator_id = auth.uid() or public.is_admin_or_supervisor())
  )
);

alter table public.incidents drop constraint if exists chk_other_requires_description;
