'use client';

import { useTranslations } from 'next-intl';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from '@/i18n/navigation';
import { offlineDb } from '@/lib/offline/db';
import { StatusBadge } from '@/components/StatusBadge';
import { cn } from '@/lib/utils';
import type { ExamCycle } from '@/types/database';

interface ServerIncidentRow {
  id: string;
  incident_reference: string | null;
  client_generated_id: string | null;
  exam_date: string | null;
  exam_cycle: ExamCycle | null;
  code: string | null;
  status: 'draft' | 'submitted' | 'reviewed' | 'closed';
  center_id: string;
  created_at: string;
}

export function MyReportsList({
  serverIncidents,
  centers,
  incidentCodes,
}: {
  serverIncidents: ServerIncidentRow[];
  centers: { id: string; name: string }[];
  incidentCodes: { code: string; label: string; category: string; is_malpractice: boolean }[];
}) {
  const t = useTranslations('myReports');
  const tForm = useTranslations('incidentForm');
  const tCategory = useTranslations('category');
  const tSync = useTranslations('sync');
  const tCommon = useTranslations('common');

  const queueItems = useLiveQuery(() => offlineDb.queuedIncidents.toArray(), [], []);
  const syncedIds = new Set(serverIncidents.map((i) => i.client_generated_id).filter(Boolean));
  const pendingItems = (queueItems ?? []).filter((q) => !syncedIds.has(q.id));

  const centerName = (id: string) => centers.find((c) => c.id === id)?.name ?? '—';
  const codeInfo = (code: string | null) => incidentCodes.find((c) => c.code === code);

  async function deleteQueueItem(id: string) {
    await offlineDb.queuedIncidents.delete(id);
  }

  const isEmpty = serverIncidents.length === 0 && pendingItems.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">{t('title')}</h1>
        <Link href="/incidents/new" className="btn-primary">
          {t('newButton')}
        </Link>
      </div>

      {isEmpty && <p className="text-sm text-muted">{t('empty')}</p>}

      <div className="space-y-3">
        {pendingItems.map((item) => {
          const info = codeInfo(item.payload.code);
          return (
            <div key={item.id} className="card flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-ink">
                  {info ? `${tCategory(info.category as never)} — ${info.label}` : '—'}
                </p>
                <p className="text-sm text-muted">
                  {centerName(item.payload.center_id)}
                  {item.payload.exam_cycle ? ` · ${item.payload.exam_cycle}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'badge',
                    item.status === 'error' ? 'bg-brand-700 text-white' : 'bg-accent-tint text-brand-700'
                  )}
                >
                  {item.status === 'error' ? tSync('syncFailed') : tSync('pending')}
                </span>
                {item.payload.status === 'draft' && (
                  <button className="btn-secondary" onClick={() => deleteQueueItem(item.id)}>
                    {tForm('confirmDelete')}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {serverIncidents.map((incident) => {
          const info = codeInfo(incident.code);
          return (
            <div key={incident.id} className="card flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-ink">
                  <span className="font-mono">{incident.incident_reference ?? '—'}</span>{' '}
                  {info ? `· ${tCategory(info.category as never)} — ${info.label}` : ''}
                </p>
                <p className="text-sm text-muted">
                  {centerName(incident.center_id)}
                  {incident.exam_cycle ? ` · ${incident.exam_cycle}` : ''}
                  {incident.exam_date ? ` · ${incident.exam_date}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={incident.status} />
                {incident.status === 'draft' && (
                  <Link href={`/incidents/${incident.id}`} className="btn-secondary">
                    {tCommon('edit')}
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
