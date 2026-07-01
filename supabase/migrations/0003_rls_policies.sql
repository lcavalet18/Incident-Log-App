-- 0003_rls_policies.sql
-- Row Level Security: invigilators see/edit only their own drafts,
-- supervisors/admins see and manage everything.

-- ---------------------------------------------------------------------------
-- Helper functions (security definer so they can read profiles without
-- recursing into the RLS policy that is being evaluated on profiles itself).
-- ---------------------------------------------------------------------------
create or replace function public.current_role_name()
returns text as $$
  select role from public.profiles where id = auth.uid();
$$ language sql stable security definer set search_path = public;

create or replace function public.is_admin_or_supervisor()
returns boolean as $$
  select coalesce(public.current_role_name() in ('admin', 'supervisor'), false);
$$ language sql stable security definer set search_path = public;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy "profiles_select_own_or_staff"
on public.profiles for select
using (id = auth.uid() or public.is_admin_or_supervisor());

create policy "profiles_update_own"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "profiles_admin_manage"
on public.profiles for all
using (public.is_admin_or_supervisor())
with check (public.is_admin_or_supervisor());

-- ---------------------------------------------------------------------------
-- centers
-- ---------------------------------------------------------------------------
alter table public.centers enable row level security;

create policy "centers_select_authenticated"
on public.centers for select
to authenticated
using (true);

create policy "centers_manage_staff"
on public.centers for insert
to authenticated
with check (public.is_admin_or_supervisor());

create policy "centers_update_staff"
on public.centers for update
to authenticated
using (public.is_admin_or_supervisor())
with check (public.is_admin_or_supervisor());

create policy "centers_delete_staff"
on public.centers for delete
to authenticated
using (public.is_admin_or_supervisor());

-- ---------------------------------------------------------------------------
-- exams
-- ---------------------------------------------------------------------------
alter table public.exams enable row level security;

create policy "exams_select_authenticated"
on public.exams for select
to authenticated
using (true);

create policy "exams_manage_staff"
on public.exams for insert
to authenticated
with check (public.is_admin_or_supervisor());

create policy "exams_update_staff"
on public.exams for update
to authenticated
using (public.is_admin_or_supervisor())
with check (public.is_admin_or_supervisor());

create policy "exams_delete_staff"
on public.exams for delete
to authenticated
using (public.is_admin_or_supervisor());

-- ---------------------------------------------------------------------------
-- incident_codes (supervisors/admins manage the code list)
-- ---------------------------------------------------------------------------
alter table public.incident_codes enable row level security;

create policy "incident_codes_select_authenticated"
on public.incident_codes for select
to authenticated
using (true);

create policy "incident_codes_insert_staff"
on public.incident_codes for insert
to authenticated
with check (public.is_admin_or_supervisor());

create policy "incident_codes_update_staff"
on public.incident_codes for update
to authenticated
using (public.is_admin_or_supervisor())
with check (public.is_admin_or_supervisor());

create policy "incident_codes_delete_staff"
on public.incident_codes for delete
to authenticated
using (public.is_admin_or_supervisor());

-- ---------------------------------------------------------------------------
-- incidents
-- ---------------------------------------------------------------------------
alter table public.incidents enable row level security;

-- Invigilators can see their own reports (draft or submitted); staff see all.
create policy "incidents_select_own_or_staff"
on public.incidents for select
to authenticated
using (reporting_invigilator_id = auth.uid() or public.is_admin_or_supervisor());

-- Invigilators may only create reports attributed to themselves.
create policy "incidents_insert_own"
on public.incidents for insert
to authenticated
with check (
  reporting_invigilator_id = auth.uid()
  or public.is_admin_or_supervisor()
);

-- Invigilators may edit only their own drafts; staff may edit any report
-- (status transitions, supervisor notes, etc).
create policy "incidents_update_own_draft_or_staff"
on public.incidents for update
to authenticated
using (
  (reporting_invigilator_id = auth.uid() and status = 'draft')
  or public.is_admin_or_supervisor()
)
with check (
  (reporting_invigilator_id = auth.uid()) or public.is_admin_or_supervisor()
);

-- Invigilators may delete only their own drafts; staff may delete any report.
create policy "incidents_delete_own_draft_or_staff"
on public.incidents for delete
to authenticated
using (
  (reporting_invigilator_id = auth.uid() and status = 'draft')
  or public.is_admin_or_supervisor()
);

-- ---------------------------------------------------------------------------
-- incident_candidates (inherit access from the parent incident)
-- ---------------------------------------------------------------------------
alter table public.incident_candidates enable row level security;

create policy "incident_candidates_select"
on public.incident_candidates for select
to authenticated
using (
  exists (
    select 1 from public.incidents i
    where i.id = incident_candidates.incident_id
      and (i.reporting_invigilator_id = auth.uid() or public.is_admin_or_supervisor())
  )
);

create policy "incident_candidates_insert"
on public.incident_candidates for insert
to authenticated
with check (
  exists (
    select 1 from public.incidents i
    where i.id = incident_candidates.incident_id
      and (
        (i.reporting_invigilator_id = auth.uid() and i.status = 'draft')
        or public.is_admin_or_supervisor()
      )
  )
);

create policy "incident_candidates_update"
on public.incident_candidates for update
to authenticated
using (
  exists (
    select 1 from public.incidents i
    where i.id = incident_candidates.incident_id
      and (
        (i.reporting_invigilator_id = auth.uid() and i.status = 'draft')
        or public.is_admin_or_supervisor()
      )
  )
);

create policy "incident_candidates_delete"
on public.incident_candidates for delete
to authenticated
using (
  exists (
    select 1 from public.incidents i
    where i.id = incident_candidates.incident_id
      and (
        (i.reporting_invigilator_id = auth.uid() and i.status = 'draft')
        or public.is_admin_or_supervisor()
      )
  )
);
