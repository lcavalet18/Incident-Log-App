import type { IncidentCode } from '@/types/database';

export interface DashboardFilters {
  examId?: string;
  centerId?: string;
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  code?: string;
  status?: string;
  malpracticeOnly?: boolean;
}

export function parseFilters(searchParams: Record<string, string | string[] | undefined>): DashboardFilters {
  const get = (key: string) => {
    const v = searchParams[key];
    return Array.isArray(v) ? v[0] : v;
  };

  return {
    examId: get('exam') || undefined,
    centerId: get('center') || undefined,
    dateFrom: get('from') || undefined,
    dateTo: get('to') || undefined,
    category: get('category') || undefined,
    code: get('code') || undefined,
    status: get('status') || undefined,
    malpracticeOnly: get('malpractice') === '1',
  };
}

/** Resolves category/malpractice filters against the (small, fully-loaded) code list into a concrete code allowlist. */
export function codesMatchingFilters(
  incidentCodes: Pick<IncidentCode, 'code' | 'category' | 'is_malpractice'>[],
  filters: Pick<DashboardFilters, 'category' | 'malpracticeOnly'>
): string[] | null {
  if (!filters.category && !filters.malpracticeOnly) return null;

  return incidentCodes
    .filter(
      (c) =>
        (!filters.category || c.category === filters.category) &&
        (!filters.malpracticeOnly || c.is_malpractice)
    )
    .map((c) => c.code);
}
