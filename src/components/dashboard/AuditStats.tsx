'use client';

import { useTranslations } from 'next-intl';
import type { IncidentAuditRow } from '@/types/database';

export function AuditStats({ incidents }: { incidents: IncidentAuditRow[] }) {
  const t = useTranslations('audit');
  const tCategory = useTranslations('category');

  const total = incidents.length;
  const malpracticeCount = incidents.filter((i) => i.incident_codes?.is_malpractice).length;
  const technicalCount = incidents.filter((i) => i.incident_codes?.category === 'Technology').length;
  const malPct = total > 0 ? Math.round((malpracticeCount / total) * 100) : 0;
  const techPct = total > 0 ? Math.round((technicalCount / total) * 100) : 0;

  const categoryCounts = new Map<string, number>();
  for (const i of incidents) {
    const cat = i.incident_codes?.category;
    if (!cat) continue;
    categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
  }
  let topCategory: string | null = null;
  let topCount = 0;
  for (const [cat, count] of categoryCounts) {
    if (count > topCount) {
      topCategory = cat;
      topCount = count;
    }
  }

  const durations = incidents.map((i) => i.duration_minutes).filter((d): d is number => d != null);
  const avgDuration =
    durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null;

  return (
    <div className="mb-5 grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-[14px]">
      <StatCard label={t('totalIncidents')}>
        <span className="font-mono text-[28px] font-semibold leading-none text-ink">{total}</span>
      </StatCard>

      <StatCard label={t('malpracticeVsTechnical')}>
        <div className="flex items-baseline gap-3">
          <div>
            <span className="font-mono text-[28px] font-semibold leading-none text-brand-600">{malPct}%</span>
            <span className="ms-[3px] text-xs text-muted">{t('malpr')}</span>
          </div>
          <div>
            <span className="font-mono text-[22px] font-semibold leading-none text-secondary">{techPct}%</span>
            <span className="ms-[3px] text-xs text-muted">{t('tech')}</span>
          </div>
        </div>
      </StatCard>

      <StatCard label={t('mostCommonCategory')}>
        <span className="text-base font-semibold leading-tight text-ink">
          {topCategory ? tCategory(topCategory as never) : '—'}
        </span>
      </StatCard>

      <StatCard label={t('avgResolutionTime')}>
        <span className="font-mono text-[28px] font-semibold leading-none text-ink">
          {avgDuration != null ? `${avgDuration} ${t('minutesShort')}` : '—'}
        </span>
      </StatCard>
    </div>
  );
}

function StatCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[10px] border border-border bg-surface px-[18px] py-4">
      <div className="mb-2 text-xs font-semibold text-muted">{label}</div>
      {children}
    </div>
  );
}
