import type { IncidentAuditRow } from '@/types/database';

const COLUMNS: { header: string; get: (i: IncidentAuditRow) => string }[] = [
  { header: 'Reference', get: (i) => i.incident_reference ?? '' },
  { header: 'Exam Cycle', get: (i) => i.exam_cycle ?? '' },
  { header: 'Exam', get: (i) => i.exams?.name ?? '' },
  { header: 'Exam Date', get: (i) => i.exam_date ?? '' },
  { header: 'Session', get: (i) => i.session ?? '' },
  { header: 'Center', get: (i) => i.centers?.name ?? '' },
  { header: 'Room', get: (i) => i.room_number ?? '' },
  { header: 'Category', get: (i) => i.incident_codes?.category ?? '' },
  { header: 'Code', get: (i) => i.code ?? '' },
  { header: 'Specific Issue', get: (i) => i.incident_codes?.label ?? '' },
  { header: 'Scope', get: (i) => i.scope ?? '' },
  { header: 'Status', get: (i) => i.status },
  { header: 'Malpractice', get: (i) => (i.incident_codes?.is_malpractice ? 'Yes' : 'No') },
  { header: 'Student Names', get: (i) => i.incident_candidates.map((c) => c.student_name).join('; ') },
  { header: 'Student Emails', get: (i) => i.incident_candidates.map((c) => c.student_email ?? '').join('; ') },
  { header: 'Student IDs', get: (i) => i.incident_candidates.map((c) => c.student_id ?? '').join('; ') },
  { header: 'Time Started', get: (i) => formatIsoTime(i.time_started) },
  { header: 'Time Resolved', get: (i) => formatIsoTime(i.time_resolved) },
  { header: 'Duration (min)', get: (i) => i.duration_minutes?.toString() ?? '' },
  { header: 'Description', get: (i) => i.description ?? '' },
  { header: 'Action Taken', get: (i) => i.action_taken ?? '' },
  { header: 'Remedial Action', get: (i) => i.remedial_action ?? '' },
  { header: 'Remedial Notes', get: (i) => i.remedial_notes ?? '' },
  { header: 'Questions Affected (count)', get: (i) => i.questions_affected_count?.toString() ?? '' },
  { header: 'Questions Affected (list)', get: (i) => i.questions_affected_list?.join(', ') ?? '' },
  { header: 'Witnesses', get: (i) => i.witnesses ?? '' },
  { header: 'Evidence Confiscated', get: (i) => (i.evidence_confiscated ? 'Yes' : 'No') },
  { header: 'Reported To Board', get: (i) => (i.reported_to_board ? 'Yes' : 'No') },
  { header: 'Board Reference No', get: (i) => i.board_reference_no ?? '' },
  { header: 'Follow-up Required', get: (i) => (i.follow_up_required ? 'Yes' : 'No') },
  { header: 'Follow-up Notes', get: (i) => i.follow_up_notes ?? '' },
  { header: 'Supervisor Name', get: (i) => i.supervisor_name ?? '' },
  { header: 'Supervisor Notes', get: (i) => i.supervisor_notes ?? '' },
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
