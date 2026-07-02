'use client';

import { useTranslations } from 'next-intl';
import { downloadCsv } from '@/lib/incidents/csv';
import type { IncidentAuditRow } from '@/types/database';

export function ExportButton({ incidents }: { incidents: IncidentAuditRow[] }) {
  const t = useTranslations('common');

  return (
    <button
      type="button"
      className="btn-secondary"
      onClick={() => downloadCsv(incidents, 'incidents')}
      disabled={incidents.length === 0}
    >
      {t('export')}
    </button>
  );
}
