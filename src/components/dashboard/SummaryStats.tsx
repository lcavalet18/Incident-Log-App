'use client';

import { useTranslations } from 'next-intl';
import type { IncidentWithCode } from '@/types/database';

export function SummaryStats({ incidents }: { incidents: IncidentWithCode[] }) {
  const t = useTranslations('dashboard');

  const total = incidents.length;
  const malpracticeCount = incidents.filter((i) => i.incident_codes?.is_malpractice).length;
  const malpracticePct = total > 0 ? Math.round((malpracticeCount / total) * 100) : 0;

  const codeCounts = new Map<string, number>();
  for (const i of incidents) {
    if (!i.code) continue;
    codeCounts.set(i.code, (codeCounts.get(i.code) ?? 0) + 1);
  }
  const mostCommon = Array.from(codeCounts.entries()).sort((a, b) => b[1] - a[1])[0];
  const mostCommonLabel = mostCommon
    ? `${mostCommon[0]} (${mostCommon[1]})`
    : '—';

  const durations = incidents.map((i) => i.duration_minutes).filter((d): d is number => d != null);
  const avgDuration =
    durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null;

  const cards = [
    { label: t('totalIncidents'), value: total.toString() },
    { label: t('malpracticeRate'), value: `${malpracticePct}% / ${100 - malpracticePct}%` },
    { label: t('mostCommonCode'), value: mostCommonLabel },
    { label: t('avgResolutionTime'), value: avgDuration != null ? `${avgDuration} ${t('minutesShort')}` : '—' },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="card">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{card.label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
