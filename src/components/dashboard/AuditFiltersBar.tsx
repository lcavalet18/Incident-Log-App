'use client';

import { useTranslations } from 'next-intl';
import type { AuditFilters } from '@/lib/incidents/filters';
import { EXAM_CYCLES } from '@/types/database';

export function AuditFiltersBar({
  centers,
  exams,
  categories,
  filters,
}: {
  centers: { id: string; name: string }[];
  exams: { id: string; name: string }[];
  categories: { value: string; label: string }[];
  filters: AuditFilters;
}) {
  const t = useTranslations('audit.filters');
  const tStatus = useTranslations('status');
  const tCommon = useTranslations('common');

  return (
    <form
      method="GET"
      className="mb-[18px] rounded-[10px] border border-border bg-surface px-[18px] py-4"
    >
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] items-end gap-x-[14px] gap-y-3">
        <Select name="center" label={t('center')} defaultValue={filters.centerId} allLabel={t('allCenters')}>
          {centers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select name="cycle" label={t('examCycle')} defaultValue={filters.examCycle} allLabel={t('allCycles')}>
          {EXAM_CYCLES.map((cycle) => (
            <option key={cycle} value={cycle}>
              {cycle}
            </option>
          ))}
        </Select>
        <Select name="exam" label={t('exam')} defaultValue={filters.examId} allLabel={t('allExams')}>
          {exams.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </Select>
        <Select name="category" label={t('category')} defaultValue={filters.category} allLabel={t('allCategories')}>
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
        <Select name="status" label={t('status')} defaultValue={filters.status} allLabel={t('allStatuses')}>
          {(['draft', 'submitted', 'reviewed', 'closed'] as const).map((s) => (
            <option key={s} value={s}>
              {tStatus(s)}
            </option>
          ))}
        </Select>
        <div>
          <label className="mb-[5px] block text-[11.5px] font-semibold text-muted">{t('search')}</label>
          <input
            name="q"
            defaultValue={filters.search ?? ''}
            placeholder={t('searchPlaceholder')}
            className="w-full rounded-md border border-border bg-surface px-2.5 py-2 text-[13.5px] text-ink outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <button type="submit" className="btn-primary rounded-md px-4 py-2 text-[13px]">
            {tCommon('filter')}
          </button>
          <a href="?" className="btn-secondary whitespace-nowrap rounded-md px-3.5 py-2 text-[13px]">
            {tCommon('clearFilters')}
          </a>
        </div>
      </div>
    </form>
  );
}

function Select({
  name,
  label,
  defaultValue,
  allLabel,
  children,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  allLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-[5px] block text-[11.5px] font-semibold text-muted">{label}</label>
      <select
        name={name}
        defaultValue={defaultValue ?? ''}
        className="w-full rounded-md border border-border bg-surface px-2.5 py-2 text-[13.5px] text-ink outline-none"
      >
        <option value="">{allLabel}</option>
        {children}
      </select>
    </div>
  );
}
