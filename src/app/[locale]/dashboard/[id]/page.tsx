import { createClient } from '@/lib/supabase/server';
import { requireStaff } from '@/lib/auth';
import { redirect } from '@/i18n/navigation';
import { IncidentDetail } from '@/components/dashboard/IncidentDetail';
import type { IncidentWithRelations } from '@/types/database';

export default async function IncidentDetailPage({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  await requireStaff(locale);
  const supabase = createClient();

  const { data } = await supabase
    .from('incidents')
    .select(
      '*, exams(id, name, language), centers(id, name), incident_codes(code, label, category, is_malpractice), incident_candidates(*), profiles(full_name)'
    )
    .eq('id', id)
    .single();

  if (!data) {
    redirect({ href: '/dashboard', locale });
  }

  const incident = data as unknown as IncidentWithRelations & { profiles: { full_name: string | null } | null };

  let signedAttachmentUrl: string | null = null;
  if (incident.attachment_url) {
    const { data: signed } = await supabase.storage
      .from('incident-evidence')
      .createSignedUrl(incident.attachment_url, 3600);
    signedAttachmentUrl = signed?.signedUrl ?? null;
  }

  return <IncidentDetail incident={incident} signedAttachmentUrl={signedAttachmentUrl} />;
}
