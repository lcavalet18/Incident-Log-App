'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { StatusBadge } from '@/components/StatusBadge';
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
          <h1 className="text-xl font-bold text-slate-900">
            {incident.incident_reference ?? incident.id.slice(0, 8)}
          </h1>
          <p className="text-sm text-slate-500">
            {incident.centers?.name} · {incident.exam_date}
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
            <Row label={tForm('examDate')} value={incident.exam_date} />
            <Row label={tForm('session')} value={incident.session} />
          </DetailCard>

          <DetailCard title={tForm('sectionClassification')}>
            <Row
              label={tForm('code')}
              value={incident.incident_codes ? `${incident.incident_codes.code} — ${incident.incident_codes.label}` : incident.code}
            />
            <Row label={tForm('scope')} value={incident.scope} />
            {incident.incident_codes?.is_malpractice && (
              <span className="badge bg-malpractice-100 text-malpractice-700">
                {tCategory('Malpractice & Integrity')}
              </span>
            )}
          </DetailCard>

          <DetailCard title={tForm('sectionTiming')}>
            <Row label={tForm('timeStarted')} value={formatTime(incident.time_started)} />
            <Row label={tForm('timeResolved')} value={formatTime(incident.time_resolved)} />
            <Row label={tForm('durationMinutes')} value={incident.duration_minutes?.toString()} />
          </DetailCard>

          <DetailCard title={tForm('sectionDescription')}>
            <Row label={tForm('description')} value={incident.description} block />
            <Row label={tForm('actionTaken')} value={incident.action_taken} block />
            <Row label={tForm('remedialAction')} value={incident.remedial_action} block />
            <Row label={tForm('remedialNotes')} value={incident.remedial_notes} block />
            <Row label={tForm('questionsAffectedCount')} value={incident.questions_affected_count?.toString()} />
            <Row
              label={tForm('questionsAffectedList')}
              value={incident.questions_affected_list?.join(', ')}
            />
          </DetailCard>

          {incident.incident_candidates.length > 0 && (
            <DetailCard title={t('candidates')}>
              <ul className="divide-y divide-slate-100 text-sm">
                {incident.incident_candidates.map((c) => (
                  <li key={c.id} className="flex justify-between py-1.5">
                    <span>{c.student_name}</span>
                    <span className="text-slate-500">{c.student_id}</span>
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
            <Row label={tForm('boardReferenceNo')} value={incident.board_reference_no} />
            <Row label={tForm('followUpRequired')} value={incident.follow_up_required ? tCommon('yes') : tCommon('no')} />
            <Row label={tForm('followUpNotes')} value={incident.follow_up_notes} block />
            <Row label={t('reportedBy')} value={incident.profiles?.full_name} />
          </DetailCard>
        </div>

        <div className="card h-fit space-y-4">
          <h2 className="font-semibold text-slate-800">{t('changeStatus')}</h2>
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
      <h2 className="font-semibold text-slate-800">{title}</h2>
      {children}
    </div>
  );
}

function Row({ label, value, block }: { label: string; value?: string | null; block?: boolean }) {
  if (!value) return null;
  if (block) {
    return (
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="whitespace-pre-wrap text-sm text-slate-700">{value}</p>
      </div>
    );
  }
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}

function formatTime(iso: string | null): string | undefined {
  if (!iso) return undefined;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
