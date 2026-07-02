'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { StatusBadge } from '@/components/StatusBadge';
import { cn } from '@/lib/utils';
import type { IncidentStatus, IncidentWithRelations } from '@/types/database';

interface IncidentDetailProps {
  incident: IncidentWithRelations & { profiles: { full_name: string | null } | null };
  signedAttachmentUrl: string | null;
}

const STATUSES: IncidentStatus[] = ['draft', 'submitted', 'reviewed', 'closed'];

export function IncidentDetail({ incident, signedAttachmentUrl }: IncidentDetailProps) {
  const t = useTranslations('dashboard.detail');
  const tForm = useTranslations('incidentForm');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('status');
  const tCategory = useTranslations('category');
  const router = useRouter();

  const [status, setStatus] = useState<IncidentStatus>(incident.status);
  const [notes, setNotes] = useState(incident.supervisor_notes ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    await supabase.from('incidents').update({ status, supervisor_notes: notes }).eq('id', incident.id);
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-mono text-xl font-bold text-ink">
            {incident.incident_reference ?? incident.id.slice(0, 8)}
          </h1>
          <p className="text-sm text-muted">
            {incident.centers?.name} · <span className="font-mono">{incident.exam_date}</span>
          </p>
        </div>
        <StatusBadge status={incident.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <DetailCard title={tForm('sectionContext')}>
            <Row label={tForm('center')} value={incident.centers?.name} />
            <Row label={tForm('roomNumber')} value={incident.room_number} />
            <Row label={tForm('exam')} value={incident.exams?.name} />
            <Row label={tForm('examCycle')} value={incident.exam_cycle} mono />
            <Row label={tForm('examDate')} value={incident.exam_date} mono />
            <Row label={tForm('session')} value={incident.session} />
          </DetailCard>

          <DetailCard title={tForm('sectionClassification')}>
            <Row
              label={tForm('code')}
              value={incident.incident_codes ? `${incident.incident_codes.code} — ${incident.incident_codes.label}` : incident.code}
              mono
            />
            <Row label={tForm('scope')} value={incident.scope} />
            {incident.incident_codes?.is_malpractice && (
              <span className="badge bg-brand-100 text-brand-700">
                {tCategory('Malpractice & Integrity')}
              </span>
            )}
          </DetailCard>

          <DetailCard title={tForm('sectionTiming')}>
            <Row label={tForm('timeStarted')} value={formatTime(incident.time_started)} mono />
            <Row label={tForm('timeResolved')} value={formatTime(incident.time_resolved)} mono />
            <Row label={tForm('durationMinutes')} value={incident.duration_minutes?.toString()} mono />
          </DetailCard>

          <DetailCard title={tForm('sectionDescription')}>
            <Row label={tForm('description')} value={incident.description} block />
            <Row label={tForm('actionTaken')} value={incident.action_taken} block />
            <Row label={tForm('remedialAction')} value={incident.remedial_action} block />
            <Row label={tForm('remedialNotes')} value={incident.remedial_notes} block />
            <Row label={tForm('questionsAffectedCount')} value={incident.questions_affected_count?.toString()} mono />
            <Row
              label={tForm('questionsAffectedList')}
              value={incident.questions_affected_list?.join(', ')}
              mono
            />
          </DetailCard>

          {incident.incident_candidates.length > 0 && (
            <DetailCard title={t('candidates')}>
              <ul className="divide-y divide-border text-sm">
                {incident.incident_candidates.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center justify-between gap-x-4 py-1.5">
                    <span>
                      {c.student_name}
                      {c.student_email && <span className="text-muted"> · {c.student_email}</span>}
                    </span>
                    <span className="font-mono text-muted">{c.student_id}</span>
                  </li>
                ))}
              </ul>
            </DetailCard>
          )}

          {incident.incident_codes?.is_malpractice && (
            <DetailCard title={tForm('sectionMalpractice')}>
              <Row label={tForm('witnesses')} value={incident.witnesses} block />
              <Row label={tForm('evidenceConfiscated')} value={incident.evidence_confiscated ? tCommon('yes') : tCommon('no')} />
            </DetailCard>
          )}

          {signedAttachmentUrl && (
            <DetailCard title={t('evidence')}>
              <a
                href={signedAttachmentUrl}
                target="_blank"
                rel="noreferrer"
                className="text-brand-700 hover:underline"
              >
                {t('viewAttachment')}
              </a>
            </DetailCard>
          )}

          <DetailCard title={tForm('sectionFollowUp')}>
            <Row label={tForm('supervisorName')} value={incident.supervisor_name} />
            <Row label={tForm('reportedToBoard')} value={incident.reported_to_board ? tCommon('yes') : tCommon('no')} />
            <Row label={tForm('boardReferenceNo')} value={incident.board_reference_no} mono />
            <Row label={tForm('followUpRequired')} value={incident.follow_up_required ? tCommon('yes') : tCommon('no')} />
            <Row label={tForm('followUpNotes')} value={incident.follow_up_notes} block />
            <Row label={t('reportedBy')} value={incident.profiles?.full_name} />
          </DetailCard>
        </div>

        <div className="card h-fit space-y-4">
          <h2 className="font-semibold text-ink">{t('changeStatus')}</h2>
          <select
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value as IncidentStatus)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {tStatus(s)}
              </option>
            ))}
          </select>

          <label className="label">{t('supervisorNotes')}</label>
          <textarea className="input" rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} />

          <button type="button" className="btn-primary w-full" disabled={saving} onClick={handleSave}>
            {saving ? tCommon('loading') : t('saveNotes')}
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card space-y-2">
      <h2 className="font-semibold text-ink">{title}</h2>
      {children}
    </div>
  );
}

function Row({
  label,
  value,
  block,
  mono,
}: {
  label: string;
  value?: string | null;
  block?: boolean;
  mono?: boolean;
}) {
  if (!value) return null;
  if (block) {
    return (
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-caption">{label}</p>
        <p className={cn('whitespace-pre-wrap text-sm text-ink', mono && 'font-mono')}>{value}</p>
      </div>
    );
  }
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted">{label}</span>
      <span className={cn('font-medium text-ink', mono && 'font-mono')}>{value}</span>
    </div>
  );
}

function formatTime(iso: string | null): string | undefined {
  if (!iso) return undefined;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
