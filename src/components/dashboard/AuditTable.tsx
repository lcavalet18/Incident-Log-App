'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { StatusBadge } from '@/components/StatusBadge';
import { formatIssueText } from '@/lib/incidents/format';
import { cn } from '@/lib/utils';
import type { IncidentAuditRow } from '@/types/database';

function formatTime(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function AuditTable({
  incidents,
  totalCount,
  canViewDetail = false,
}: {
  incidents: IncidentAuditRow[];
  totalCount: number;
  canViewDetail?: boolean;
}) {
  const t = useTranslations('audit');
  const tTable = useTranslations('audit.table');
  const tScope = useTranslations('scope');

  if (incidents.length === 0) {
    return <p className="text-sm text-muted">{t('empty')}</p>;
  }

  return (
    <div className="overflow-hidden rounded-[10px] border border-border bg-surface shadow-[0_1px_2px_rgba(31,42,49,.04)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1900px] text-[13px]">
          <thead>
            <tr className="border-b border-border bg-[#f8fafb]">
              {[
                tTable('reference'),
                tTable('center'),
                tTable('examCycle'),
                tTable('exam'),
                tTable('category'),
                tTable('scope'),
                tTable('issue'),
                tTable('issueDescription'),
                tTable('code'),
                tTable('studentName'),
                tTable('studentEmail'),
                tTable('studentId'),
                tTable('timeStarted'),
                tTable('timeResolved'),
                tTable('duration'),
                tTable('actionTaken'),
                tTable('status'),
              ].map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap px-3.5 py-[11px] text-start text-[11px] font-semibold uppercase tracking-[.04em] text-muted"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {incidents.map((incident) => {
              const mal = incident.incident_codes?.is_malpractice ?? false;
              const candidate = incident.incident_candidates[0];
              return (
                <tr
                  key={incident.id}
                  className={cn('border-b border-divider', mal ? 'bg-brand-600/[0.045]' : 'bg-surface')}
                >
                  <td className="whitespace-nowrap px-3.5 py-[13px] align-top font-mono text-[12.5px] font-medium text-ink">
                    {canViewDetail ? (
                      <Link href={`/dashboard/${incident.id}`} className="hover:underline">
                        {incident.incident_reference ?? incident.id.slice(0, 8)}
                      </Link>
                    ) : (
                      incident.incident_reference ?? incident.id.slice(0, 8)
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3.5 py-[13px] align-top text-ink">
                    {incident.centers?.name ?? '—'}
                  </td>
                  <td className="whitespace-nowrap px-3.5 py-[13px] align-top font-mono text-xs text-secondary">
                    {incident.exam_cycle ?? '—'}
                  </td>
                  <td className="min-w-[150px] px-3.5 py-[13px] align-top text-ink">{incident.exams?.name ?? '—'}</td>
                  <td className="whitespace-nowrap px-3.5 py-[13px] align-top">
                    {incident.incident_codes ? (
                      <span
                        className={
                          mal
                            ? 'inline-block whitespace-nowrap rounded-full bg-brand-600 px-2.5 py-[3px] text-[11.5px] font-semibold text-white'
                            : 'text-[13px] text-secondary'
                        }
                      >
                        {incident.incident_codes.category}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3.5 py-[13px] align-top text-ink">
                    {incident.scope ? tScope(incident.scope) : '—'}
                  </td>
                  <td className="whitespace-nowrap px-3.5 py-[13px] align-top text-ink">
                    {formatIssueText(incident)}
                  </td>
                  <td className="min-w-[180px] px-3.5 py-[13px] align-top text-[12.5px] leading-[1.45] text-secondary">
                    {incident.issue_description ?? '—'}
                  </td>
                  <td className="px-3.5 py-[13px] align-top">
                    <span
                      className={cn(
                        'rounded-[5px] px-[7px] py-[2px] font-mono text-xs font-semibold tracking-[.03em]',
                        mal ? 'bg-accent-tint text-brand-600' : 'bg-neutral-bg text-secondary'
                      )}
                    >
                      {incident.code ?? '—'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3.5 py-[13px] align-top text-ink">
                    {candidate?.student_name ?? '—'}
                  </td>
                  <td className="whitespace-nowrap px-3.5 py-[13px] align-top text-[12.5px] text-secondary">
                    {candidate?.student_email ?? '—'}
                  </td>
                  <td className="whitespace-nowrap px-3.5 py-[13px] align-top font-mono text-xs text-secondary">
                    {candidate?.student_id ?? '—'}
                  </td>
                  <td className="whitespace-nowrap px-3.5 py-[13px] align-top font-mono text-[12.5px] text-ink">
                    {formatTime(incident.time_started)}
                  </td>
                  <td className="whitespace-nowrap px-3.5 py-[13px] align-top font-mono text-[12.5px] text-ink">
                    {formatTime(incident.time_resolved)}
                  </td>
                  <td className="whitespace-nowrap px-3.5 py-[13px] align-top font-mono text-[12.5px] font-medium text-ink">
                    {incident.duration_minutes != null ? `${incident.duration_minutes} min` : '—'}
                  </td>
                  <td className="min-w-[220px] px-3.5 py-[13px] align-top text-[12.5px] leading-[1.45] text-secondary">
                    {incident.action_taken ?? '—'}
                  </td>
                  <td className="whitespace-nowrap px-3.5 py-[13px] align-top">
                    <StatusBadge status={incident.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-divider bg-page px-4 py-3">
        <span className="text-[12.5px] text-muted">
          {t.rich('showing', {
            shown: incidents.length,
            total: totalCount,
            b: (chunks) => <strong className="font-mono font-semibold text-secondary">{chunks}</strong>,
            m: (chunks) => <span className="font-mono">{chunks}</span>,
          })}
        </span>
        <span className="flex items-center gap-[7px] text-xs text-muted">
          <span className="inline-block h-[9px] w-[9px] rounded-sm bg-brand-600" />
          {t('malpracticeLegend')}
        </span>
      </div>
    </div>
  );
}
