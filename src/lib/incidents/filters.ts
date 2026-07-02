import type { ExamCycle, IncidentCode, IncidentStatus } from '@/types/database';

export interface AuditFilters {
  centerId?: string;
  examCycle?: ExamCycle;
  examId?: string;
  category?: string;
  status?: IncidentStatus;
  search?: string;
}

export function parseAuditFilters(searchParams: Record<string, string | string[] | undefined>): AuditFilters {
  const get = (key: string) => {
    const v = searchParams[key];
    return Array.isArray(v) ? v[0] : v;
  };

  return {
    centerId: get('center') || undefined,
    examCycle: (get('cycle') || undefined) as ExamCycle | undefined,
    examId: get('exam') || undefined,
    category: get('category') || undefined,
    status: (get('status') || undefined) as IncidentStatus | undefined,
    search: get('q') || undefined,
  };
}

/** Resolves a category filter against the (small, fully-loaded) code list into a concrete code allowlist. */
export function codesMatchingCategory(
  incidentCodes: Pick<IncidentCode, 'code' | 'category'>[],
  category: string | undefined
): string[] | null {
  if (!category) return null;
  return incidentCodes.filter((c) => c.category === category).map((c) => c.code);
}
