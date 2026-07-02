import { createClient } from '@/lib/supabase/server';
import { getCurrentUserAndProfile, isStaff } from '@/lib/auth';
import { CodeListManager } from '@/components/dashboard/CodeListManager';

export default async function CodeListPage() {
  const supabase = createClient();
  const { profile } = await getCurrentUserAndProfile();

  const { data: incidentCodes } = await supabase.from('incident_codes').select('*').order('category');

  return <CodeListManager incidentCodes={incidentCodes ?? []} canManage={isStaff(profile)} />;
}
