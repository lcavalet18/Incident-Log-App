'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { StatusBadge } from '@/components/StatusBadge';
import { cn } from '@/lib/utils';
import type { IncidentWithCode } from '@/types/database';

export function IncidentsTable({ incidents }: { incidents: IncidentWithCode[] }) {
  const t = useTranslations('dashboard');
  const tTable = useTranslations('dashboard.table');

  if (incidents.length === 0) {
    return <p className="text-sm text-slate-500">{t('empty')}</p>;
  }

  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full min-w-[900px] text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-start text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {[
              tTable('reference'),
              tTable('date'),
              tTable('center'),
              tTable('exam'),
              tTable('code'),
              tTable('category'),
              tTable('status'),
              tTable('malpractice'),
              tTable('duration'),
            ].map((h) => (
              <th key={h} className="px-4 py-3 text-start font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {incidents.map((incident) => (
            <tr key={incident.id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <Link href={`/dashboard/${incident.id}`} className="font-medium text-brand-700 hover:underline">
                  {incident.incident_reference ?? incident.id.slice(0, 8)}
                </Link>
              </td>
              <td className="px-4 py-3">{incident.exam_date ?? '—'}</td>
              <td className="px-4 py-3">{incident.centers?.name ?? '—'}</td>
              <td className="px-4 py-3">{incident.exams?.name ?? '—'}</td>
              <td className="px-4 py-3">{incident.code ?? '—'}</td>
              <td className="px-4 py-3">{incident.incident_codes?.category ?? '—'}</td>
              <td className="px-4 py-3">
                <StatusBadge status={incident.status} />
              </td>
              <td className="px-4 py-3">
                {incident.incident_codes?.is_malpractice && (
                  <span className={cn('badge', 'bg-malpractice-100 text-malpractice-700')}>!</span>
                )}
              </td>
              <td className="px-4 py-3">{incident.duration_minutes ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
