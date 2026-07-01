import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { requireStaff } from '@/lib/auth';
import { parseFilters, codesMatchingFilters } from '@/lib/incidents/filters';
import { FiltersBar } from '@/components/dashboard/FiltersBar';
import { SummaryStats } from '@/components/dashboard/SummaryStats';
import { IncidentsTable } from '@/components/dashboard/IncidentsTable';
import { ExportButton } from '@/components/dashboard/ExportButton';
import type { IncidentWithCode } from '@/types/database';

export default async function DashboardPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  await requireStaff(locale);
  const supabase = createClient();
  const filters = parseFilters(searchParams);
  const t = await getTranslations('dashboard');

  const [{ data: exams }, { data: centers }, { data: incidentCodes }] = await Promise.all([
    supabase.from('exams').select('id, name').order('name'),
    supabase.from('centers').select('id, name').order('name'),
    supabase.from('incident_codes').select('code, label, category, is_malpractice').order('category'),
  ]);

  let query = supabase
    .from('incidents')
    .select(
      '*, exams(id, name), centers(id, name), incident_codes(code, label, category, is_malpractice)'
    )
    .order('created_at', { ascending: false });

  if (filters.examId) query = query.eq('exam_id', filters.examId);
  if (filters.centerId) query = query.eq('center_id', filters.centerId);
  if (filters.dateFrom) query = query.gte('exam_date', filters.dateFrom);
  if (filters.dateTo) query = query.lte('exam_date', filters.dateTo);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.code) query = query.eq('code', filters.code);

  const codeAllowlist = codesMatchingFilters(incidentCodes ?? [], filters);
  if (codeAllowlist) query = query.in('code', codeAllowlist.length > 0 ? codeAllowlist : ['__none__']);

  const { data } = await query;
  const incidents = (data ?? []) as unknown as IncidentWithCode[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">{t('title')}</h1>
        <ExportButton incidents={incidents} />
      </div>

      <FiltersBar
        exams={exams ?? []}
        centers={centers ?? []}
        incidentCodes={incidentCodes ?? []}
        filters={filters}
      />

      <SummaryStats incidents={incidents} />

      <IncidentsTable incidents={incidents} />
    </div>
  );
}
