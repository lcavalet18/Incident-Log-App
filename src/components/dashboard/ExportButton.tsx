'use client';

import { useTranslations } from 'next-intl';
import type { IncidentWithCode } from '@/types/database';

const COLUMNS: { key: keyof IncidentWithCode | string; header: string; get: (i: IncidentWithCode) => string }[] = [
  { key: 'incident_reference', header: 'Reference', get: (i) => i.incident_reference ?? '' },
  { key: 'exam_date', header: 'Exam date', get: (i) => i.exam_date ?? '' },
  { key: 'center', header: 'Center', get: (i) => i.centers?.name ?? '' },
  { key: 'exam', header: 'Exam', get: (i) => i.exams?.name ?? '' },
  { key: 'code', header: 'Code', get: (i) => i.code ?? '' },
  { key: 'category', header: 'Category', get: (i) => i.incident_codes?.category ?? '' },
  { key: 'is_malpractice', header: 'Malpractice', get: (i) => (i.incident_codes?.is_malpractice ? 'Yes' : 'No') },
  { key: 'scope', header: 'Scope', get: (i) => i.scope ?? '' },
  { key: 'status', header: 'Status', get: (i) => i.status },
  { key: 'duration_minutes', header: 'Duration (min)', get: (i) => i.duration_minutes?.toString() ?? '' },
  { key: 'description', header: 'Description', get: (i) => i.description ?? '' },
  { key: 'action_taken', header: 'Action taken', get: (i) => i.action_taken ?? '' },
  { key: 'reported_to_board', header: 'Reported to board', get: (i) => (i.reported_to_board ? 'Yes' : 'No') },
  { key: 'follow_up_required', header: 'Follow-up required', get: (i) => (i.follow_up_required ? 'Yes' : 'No') },
  { key: 'created_at', header: 'Created at', get: (i) => i.created_at },
];

function escapeCsvValue(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toCsv(incidents: IncidentWithCode[]): string {
  const header = COLUMNS.map((c) => escapeCsvValue(c.header)).join(',');
  const rows = incidents.map((incident) => COLUMNS.map((c) => escapeCsvValue(c.get(incident))).join(','));
  return [header, ...rows].join('\n');
}

export function ExportButton({ incidents }: { incidents: IncidentWithCode[] }) {
  const t = useTranslations('common');

  function handleExport() {
    const csv = toCsv(incidents);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incidents-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <button type="button" className="btn-secondary" onClick={handleExport} disabled={incidents.length === 0}>
      {t('export')}
    </button>
  );
}
