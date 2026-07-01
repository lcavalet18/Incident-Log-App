import { createClient } from '@/lib/supabase/server';
import { MyReportsList } from '@/components/incident-form/MyReportsList';

export default async function MyReportsPage() {
  const supabase = createClient();

  const { data: incidents } = await supabase
    .from('incidents')
    .select('id, incident_reference, client_generated_id, exam_date, code, status, center_id, created_at')
    .order('created_at', { ascending: false });

  const { data: centers } = await supabase.from('centers').select('id, name');
  const { data: incidentCodes } = await supabase.from('incident_codes').select('code, label, is_malpractice');

  return (
    <MyReportsList
      serverIncidents={incidents ?? []}
      centers={centers ?? []}
      incidentCodes={incidentCodes ?? []}
    />
  );
}
