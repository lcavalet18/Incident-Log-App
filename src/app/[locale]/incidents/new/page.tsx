import { createClient } from '@/lib/supabase/server';
import { getCurrentUserAndProfile } from '@/lib/auth';
import { IncidentForm } from '@/components/incident-form/IncidentForm';

export default async function NewIncidentPage() {
  const supabase = createClient();
  const { user, profile } = await getCurrentUserAndProfile();

  const [{ data: exams }, { data: incidentCodes }, { data: centers }] = await Promise.all([
    supabase.from('exams').select('*').order('name'),
    supabase.from('incident_codes').select('*').eq('is_active', true).order('category'),
    supabase.from('centers').select('*').order('name'),
  ]);

  return (
    <IncidentForm
      exams={exams ?? []}
      incidentCodes={incidentCodes ?? []}
      centers={centers ?? []}
      currentUserId={user!.id}
      currentUserName={profile?.full_name ?? null}
    />
  );
}
