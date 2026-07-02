'use client';

import { useTranslations } from 'next-intl';
import type { AuditFilters } from '@/lib/incidents/filters';
import { EXAM_CYCLES } from '@/types/database';

export function AuditFiltersBar({
  exams,
  filters,
}: {
  exams: { id: string; name: string }[];
  filters: AuditFilters;
}) {
  const t = useTranslations('audit.filters');
  const tCommon = useTranslations('common');

  return (
    <form className="card grid gap-3 sm:grid-cols-2 lg:grid-cols-5" method="GET">
      <div>
        <label className="label">{t('exam')}</label>
        <select name="exam" defaultValue={filters.examId ?? ''} className="input">
          <option value="">{t('allExams')}</option>
          {exams.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">{t('examCycle')}</label>
        <select name="cycle" defaultValue={filters.examCycle ?? ''} className="input">
          <option value="">{t('allCycles')}</option>
          {EXAM_CYCLES.map((cycle) => (
            <option key={cycle} value={cycle}>
              {cycle}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">{t('student')}</label>
        <input
          name="student"
          defaultValue={filters.student ?? ''}
          placeholder={t('studentPlaceholder')}
          className="input"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="label">{t('search')}</label>
        <input
          name="q"
          defaultValue={filters.search ?? ''}
          placeholder={t('searchPlaceholder')}
          className="input"
        />
      </div>
      <div className="flex items-end gap-2 lg:col-span-5">
        <button type="submit" className="btn-primary">
          {tCommon('filter')}
        </button>
        <a href="?" className="btn-secondary">
          {tCommon('clearFilters')}
        </a>
      </div>
    </form>
  );
}
