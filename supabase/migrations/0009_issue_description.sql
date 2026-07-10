-- 0009_issue_description.sql
-- The form now shows a required "Issue description" textarea when the
-- invigilator picks the "Other" category, since the generic "Other
-- (describe in action)" issue label alone isn't enough to know what
-- happened. Store it in its own column rather than overloading
-- action_taken, so Audit/CSV can report on it separately.
-- Idempotent: safe to re-run.

alter table public.incidents add column if not exists issue_description text;
