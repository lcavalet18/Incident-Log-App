import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { requireStaff } from '@/lib/auth';
import { parseAuditFilters, codesMatchingCategory } from '@/lib/incidents/filters';
import { AuditFiltersBar } from '@/components/dashboard/AuditFiltersBar';
import { AuditStats } from '@/components/dashboard/AuditStats';
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
  const tCategory = await getTranslations('category');

  const [{ data: centers }, { data: exams }, { data: incidentCodes }, { count: totalCount }] = await Promise.all([
    supabase.from('centers').select('id, name').order('name'),
    supabase.from('exams').select('id, name').order('name'),
    supabase.from('incident_codes').select('code, category').order('category'),
    supabase.from('incidents').select('id', { count: 'exact', head: true }).in('status', [
      'submitted',
      'reviewed',
      'closed',
    ]),
  ]);

  const categories = Array.from(new Set((incidentCodes ?? []).map((c) => c.category))).map((cat) => ({
    value: cat,
    label: tCategory(cat as never),
  }));

  let query = supabase
    .from('incidents')
    .select(
      '*, exams(id, name), centers(id, name), incident_codes(code, label, category, is_malpractice), incident_candidates(*), profiles(full_name)'
    )
    .in('status', ['submitted', 'reviewed', 'closed'])
    .order('created_at', { ascending: false });

  if (filters.centerId) query = query.eq('center_id', filters.centerId);
  if (filters.examCycle) query = query.eq('exam_cycle', filters.examCycle);
  if (filters.examId) query = query.eq('exam_id', filters.examId);
  if (filters.status) query = query.eq('status', filters.status);

  const codeAllowlist = codesMatchingCategory(incidentCodes ?? [], filters.category);
  if (codeAllowlist) query = query.in('code', codeAllowlist.length > 0 ? codeAllowlist : ['__none__']);

  if (filters.search) {
    const term = `%${filters.search}%`;
    const { data: matches } = await supabase
      .from('incident_candidates')
      .select('incident_id')
      .or(`student_name.ilike.${term},student_email.ilike.${term},student_id.ilike.${term}`);

    const candidateIncidentIds = Array.from(new Set((matches ?? []).map((m) => m.incident_id)));
    const idFilter =
      candidateIncidentIds.length > 0 ? `id.in.(${candidateIncidentIds.join(',')}),` : '';
    query = query.or(`${idFilter}incident_reference.ilike.${term},action_taken.ilike.${term}`);
  }

  const { data } = await query;
  const incidents = (data ?? []) as unknown as IncidentAuditRow[];

  return (
    <div>
      <div className="mb-[22px] flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-[.09em] text-brand-600">
            {t('eyebrow')}
          </div>
          <h1 className="m-0 text-[27px] font-bold tracking-[-.02em] text-ink">{t('title')}</h1>
          <p className="mt-2 text-[14.5px] text-muted">{t('subtitle')}</p>
        </div>
        <ExportButton incidents={incidents} />
      </div>

      <AuditStats incidents={incidents} />

      <AuditFiltersBar centers={centers ?? []} exams={exams ?? []} categories={categories} filters={filters} />

      <AuditTable incidents={incidents} totalCount={totalCount ?? incidents.length} />
    </div>
  );
}
