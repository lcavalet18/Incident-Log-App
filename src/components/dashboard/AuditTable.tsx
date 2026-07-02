'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { StatusBadge } from '@/components/StatusBadge';
import { cn } from '@/lib/utils';
import type { IncidentAuditRow } from '@/types/database';

function formatTime(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function AuditTable({ incidents }: { incidents: IncidentAuditRow[] }) {
  const t = useTranslations('audit');
  const tTable = useTranslations('audit.table');

  if (incidents.length === 0) {
    return <p className="text-sm text-muted">{t('empty')}</p>;
  }

  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full min-w-[1600px] text-sm">
        <thead className="border-b border-border bg-page text-start text-xs uppercase tracking-wide text-muted">
          <tr>
            {[
              tTable('reference'),
              tTable('examCycle'),
              tTable('exam'),
              tTable('date'),
              tTable('center'),
              tTable('category'),
              tTable('code'),
              tTable('issue'),
              tTable('status'),
              tTable('malpractice'),
              tTable('students'),
              tTable('studentIds'),
              tTable('timeStarted'),
              tTable('timeResolved'),
              tTable('duration'),
              tTable('actionTaken'),
              tTable('invigilator'),
            ].map((h) => (
              <th key={h} className="px-4 py-3 text-start font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {incidents.map((incident) => (
            <tr key={incident.id} className="hover:bg-page">
              <td className="px-4 py-4">
                <Link
                  href={`/dashboard/${incident.id}`}
                  className="font-mono font-medium text-brand-700 hover:underline"
                >
                  {incident.incident_reference ?? incident.id.slice(0, 8)}
                </Link>
              </td>
              <td className="px-4 py-4 font-mono">{incident.exam_cycle ?? '—'}</td>
              <td className="px-4 py-4">{incident.exams?.name ?? '—'}</td>
              <td className="px-4 py-4 font-mono">{incident.exam_date ?? '—'}</td>
              <td className="px-4 py-4">{incident.centers?.name ?? '—'}</td>
              <td className="px-4 py-4">{incident.incident_codes?.category ?? '—'}</td>
              <td className="px-4 py-4 font-mono">{incident.code ?? '—'}</td>
              <td className="px-4 py-4">{incident.incident_codes?.label ?? '—'}</td>
              <td className="px-4 py-4">
                <StatusBadge status={incident.status} />
              </td>
              <td className="px-4 py-4">
                {incident.incident_codes?.is_malpractice && (
                  <span className={cn('badge', 'bg-brand-100 text-brand-700')}>!</span>
                )}
              </td>
              <td className="px-4 py-4">
                {incident.incident_candidates.map((c) => c.student_name).join('; ') || '—'}
              </td>
              <td className="px-4 py-4 font-mono">
                {incident.incident_candidates.map((c) => c.student_id).filter(Boolean).join('; ') || '—'}
              </td>
              <td className="px-4 py-4 font-mono">{formatTime(incident.time_started)}</td>
              <td className="px-4 py-4 font-mono">{formatTime(incident.time_resolved)}</td>
              <td className="px-4 py-4 font-mono">{incident.duration_minutes ?? '—'}</td>
              <td className="max-w-xs truncate px-4 py-4" title={incident.action_taken ?? ''}>
                {incident.action_taken ?? '—'}
              </td>
              <td className="px-4 py-4">{incident.profiles?.full_name ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
