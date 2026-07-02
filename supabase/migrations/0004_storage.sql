-- 0004_storage.sql
-- Storage bucket for incident evidence attachments (photos, scans).
-- Files are keyed as: <auth.uid()>/<incident_id>/<filename>

insert into storage.buckets (id, name, public)
values ('incident-evidence', 'incident-evidence', false)
on conflict (id) do nothing;

drop policy if exists "incident_evidence_insert_own_folder" on storage.objects;
create policy "incident_evidence_insert_own_folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'incident-evidence'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "incident_evidence_select_own_or_staff" on storage.objects;
create policy "incident_evidence_select_own_or_staff"
on storage.objects for select
to authenticated
using (
  bucket_id = 'incident-evidence'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin_or_supervisor()
  )
);

drop policy if exists "incident_evidence_delete_own_or_staff" on storage.objects;
create policy "incident_evidence_delete_own_or_staff"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'incident-evidence'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin_or_supervisor()
  )
);
