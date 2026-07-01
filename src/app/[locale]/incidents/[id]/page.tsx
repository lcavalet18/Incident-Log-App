import { createClient } from '@/lib/supabase/server';
import { getCurrentUserAndProfile } from '@/lib/auth';
import { redirect } from '@/i18n/navigation';
import { IncidentForm } from '@/components/incident-form/IncidentForm';

export default async function EditIncidentPage({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  const supabase = createClient();
  const { user, profile } = await getCurrentUserAndProfile();

  const [{ data: incident }, { data: exams }, { data: incidentCodes }, { data: centers }] = await Promise.all([
    supabase
      .from('incidents')
      .select('*, incident_candidates(*)')
      .eq('id', id)
      .single(),
    supabase.from('exams').select('*').order('name'),
    supabase.from('incident_codes').select('*').eq('is_active', true).order('category'),
    supabase.from('centers').select('*').order('name'),
  ]);

  if (!incident || incident.status !== 'draft' || incident.reporting_invigilator_id !== user!.id) {
    redirect({ href: '/incidents', locale });
  }

  return (
    <IncidentForm
      exams={exams ?? []}
      incidentCodes={incidentCodes ?? []}
      centers={centers ?? []}
      currentUserId={user!.id}
      currentUserName={profile?.full_name ?? null}
      initialIncident={incident}
    />
  );
}
