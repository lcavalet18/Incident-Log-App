import type { IncidentAuditRow } from '@/types/database';

const COLUMNS: { header: string; get: (i: IncidentAuditRow) => string }[] = [
  { header: 'Reference', get: (i) => i.incident_reference ?? '' },
  { header: 'Exam Cycle', get: (i) => i.exam_cycle ?? '' },
  { header: 'Subject', get: (i) => i.exams?.name ?? '' },
  { header: 'Exam Date', get: (i) => i.exam_date ?? '' },
  { header: 'Partner Center', get: (i) => i.centers?.name ?? '' },
  { header: 'Category', get: (i) => i.incident_codes?.category ?? '' },
  { header: 'Issue', get: (i) => i.incident_codes?.label ?? '' },
  { header: 'Code', get: (i) => i.code ?? '' },
  { header: 'Student Name', get: (i) => i.incident_candidates[0]?.student_name ?? '' },
  { header: 'Student Email', get: (i) => i.incident_candidates[0]?.student_email ?? '' },
  { header: 'Student ID', get: (i) => i.incident_candidates[0]?.student_id ?? '' },
  { header: 'Time Started', get: (i) => formatIsoTime(i.time_started) },
  { header: 'Time Resolved', get: (i) => formatIsoTime(i.time_resolved) },
  { header: 'Duration (min)', get: (i) => i.duration_minutes?.toString() ?? '' },
  { header: 'Action Taken', get: (i) => i.action_taken ?? '' },
  { header: 'Questions Affected (count)', get: (i) => i.questions_affected_count?.toString() ?? '' },
  { header: 'Questions Affected (list)', get: (i) => i.questions_affected_list?.join(', ') ?? '' },
  { header: 'Status', get: (i) => i.status },
  { header: 'Invigilator', get: (i) => i.profiles?.full_name ?? '' },
  { header: 'Created At', get: (i) => i.created_at },
];

function formatIsoTime(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escapeCsvValue(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function incidentsToCsv(incidents: IncidentAuditRow[]): string {
  const header = COLUMNS.map((c) => escapeCsvValue(c.header)).join(',');
  const rows = incidents.map((incident) => COLUMNS.map((c) => escapeCsvValue(c.get(incident))).join(','));
  return [header, ...rows].join('\n');
}

export function downloadCsv(incidents: IncidentAuditRow[], filenamePrefix: string) {
  const csv = incidentsToCsv(incidents);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
