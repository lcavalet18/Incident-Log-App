'use client';

import { useTranslations } from 'next-intl';
import { downloadCsv } from '@/lib/incidents/csv';
import type { IncidentAuditRow } from '@/types/database';

export function ExportButton({ incidents }: { incidents: IncidentAuditRow[] }) {
  const t = useTranslations('common');

  return (
    <button
      type="button"
      className="btn-primary"
      onClick={() => downloadCsv(incidents, 'exam-incidents')}
      disabled={incidents.length === 0}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v12M7 10l5 5 5-5M4 21h16" />
      </svg>
      {t('export')}
    </button>
  );
}
