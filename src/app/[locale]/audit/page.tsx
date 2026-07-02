import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { requireStaff } from '@/lib/auth';
import { parseAuditFilters } from '@/lib/incidents/filters';
import { AuditFiltersBar } from '@/components/dashboard/AuditFiltersBar';
import { AuditTable } from '@/components/dashboard/AuditTable';
import { ExportButton } from '@/components/dashboard/ExportButton';
import type { IncidentAuditRow } from '@/types/database';

export default async function AuditPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  await requireStaff(locale);
  const supabase = createClient();
  const filters = parseAuditFilters(searchParams);
  const t = await getTranslations('audit');

  const { data: exams } = await supabase.from('exams').select('id, name').order('name');

  let query = supabase
    .from('incidents')
    .select(
      '*, exams(id, name), centers(id, name), incident_codes(code, label, category, is_malpractice), incident_candidates(*), profiles(full_name)'
    )
    .in('status', ['submitted', 'reviewed', 'closed'])
    .order('created_at', { ascending: false });

  if (filters.examId) query = query.eq('exam_id', filters.examId);
  if (filters.examCycle) query = query.eq('exam_cycle', filters.examCycle);

  if (filters.search) {
    const term = `%${filters.search}%`;
    query = query.or(
      `incident_reference.ilike.${term},description.ilike.${term},action_taken.ilike.${term},room_number.ilike.${term},supervisor_name.ilike.${term}`
    );
  }

  if (filters.student) {
    const term = `%${filters.student}%`;
    const { data: matches } = await supabase
      .from('incident_candidates')
      .select('incident_id')
      .or(`student_name.ilike.${term},student_email.ilike.${term},student_id.ilike.${term}`);

    const incidentIds = Array.from(new Set((matches ?? []).map((m) => m.incident_id)));
    query = query.in('id', incidentIds.length > 0 ? incidentIds : ['__none__']);
  }

  const { data } = await query;
  const incidents = (data ?? []) as unknown as IncidentAuditRow[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink">{t('title')}</h1>
          <p className="text-sm text-muted">{t('subtitle')}</p>
        </div>
        <ExportButton incidents={incidents} />
      </div>

      <AuditFiltersBar exams={exams ?? []} filters={filters} />

      <AuditTable incidents={incidents} />
    </div>
  );
}
