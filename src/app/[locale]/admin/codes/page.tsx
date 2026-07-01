import { createClient } from '@/lib/supabase/server';
import { requireStaff } from '@/lib/auth';
import { CodeListManager } from '@/components/dashboard/CodeListManager';

export default async function CodeListPage({ params: { locale } }: { params: { locale: string } }) {
  await requireStaff(locale);
  const supabase = createClient();

  const { data: incidentCodes } = await supabase.from('incident_codes').select('*').order('category');

  return <CodeListManager incidentCodes={incidentCodes ?? []} />;
}
