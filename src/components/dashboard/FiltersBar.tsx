'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import type { DashboardFilters } from '@/lib/incidents/filters';

interface FiltersBarProps {
  exams: { id: string; name: string }[];
  centers: { id: string; name: string }[];
  incidentCodes: { code: string; label: string; category: string; is_malpractice: boolean }[];
  filters: DashboardFilters;
}

export function FiltersBar({ exams, centers, incidentCodes, filters }: FiltersBarProps) {
  const t = useTranslations('dashboard.filters');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const pathname = usePathname();

  const categories = Array.from(new Set(incidentCodes.map((c) => c.category)));

  function update(key: string, value: string) {
    const params = new URLSearchParams(window.location.search);
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearAll() {
    router.push(pathname);
  }

  return (
    <div className="card">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FilterSelect
          label={t('exam')}
          value={filters.examId ?? ''}
          onChange={(v) => update('exam', v)}
          allLabel={t('allExams')}
          options={exams.map((e) => ({ value: e.id, label: e.name }))}
        />
        <FilterSelect
          label={t('center')}
          value={filters.centerId ?? ''}
          onChange={(v) => update('center', v)}
          allLabel={t('allCenters')}
          options={centers.map((c) => ({ value: c.id, label: c.name }))}
        />
        <FilterSelect
          label={t('category')}
          value={filters.category ?? ''}
          onChange={(v) => update('category', v)}
          allLabel={t('allCategories')}
          options={categories.map((c) => ({ value: c, label: c }))}
        />
        <FilterSelect
          label={t('code')}
          value={filters.code ?? ''}
          onChange={(v) => update('code', v)}
          allLabel={t('allCodes')}
          options={incidentCodes.map((c) => ({ value: c.code, label: `${c.code} — ${c.label}` }))}
        />
        <div>
          <label className="label">{t('dateFrom')}</label>
          <input
            type="date"
            className="input font-mono"
            defaultValue={filters.dateFrom ?? ''}
            onChange={(e) => update('from', e.target.value)}
          />
        </div>
        <div>
          <label className="label">{t('dateTo')}</label>
          <input
            type="date"
            className="input font-mono"
            defaultValue={filters.dateTo ?? ''}
            onChange={(e) => update('to', e.target.value)}
          />
        </div>
        <FilterSelect
          label={t('status')}
          value={filters.status ?? ''}
          onChange={(v) => update('status', v)}
          allLabel={t('allStatuses')}
          options={['draft', 'submitted', 'reviewed', 'closed'].map((s) => ({ value: s, label: s }))}
        />
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={Boolean(filters.malpracticeOnly)}
            onChange={(e) => update('malpractice', e.target.checked ? '1' : '')}
          />
          {t('malpracticeOnly')}
        </label>
      </div>
      <button type="button" className="btn-secondary mt-3" onClick={clearAll}>
        {tCommon('clearFilters')}
      </button>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  allLabel,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  allLabel: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
