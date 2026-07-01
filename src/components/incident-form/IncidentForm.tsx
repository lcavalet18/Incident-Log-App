'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { enqueueIncident } from '@/lib/offline/sync';
import { newClientGeneratedId, combineDateAndTime, calcDurationMinutes } from '@/lib/incidents/reference';
import type { QueuedCandidate } from '@/lib/offline/db';
import type { Center, Exam, Incident, IncidentCandidate, IncidentCode } from '@/types/database';
import { CandidateRows } from './CandidateRows';

interface IncidentFormProps {
  exams: Exam[];
  incidentCodes: IncidentCode[];
  centers: Center[];
  currentUserId: string;
  currentUserName: string | null;
  initialIncident?: Incident & { incident_candidates: IncidentCandidate[] };
}

type FormErrors = Partial<Record<string, string>>;

export function IncidentForm({
  exams,
  incidentCodes,
  centers,
  currentUserId,
  currentUserName,
  initialIncident,
}: IncidentFormProps) {
  const t = useTranslations('incidentForm');
  const tCommon = useTranslations('common');
  const tCategory = useTranslations('category');
  const tScope = useTranslations('scope');
  const router = useRouter();

  const isEdit = Boolean(initialIncident);
  const clientId = useMemo(
    () => initialIncident?.client_generated_id ?? newClientGeneratedId(),
    [initialIncident]
  );

  const [centerId, setCenterId] = useState(initialIncident?.center_id ?? centers[0]?.id ?? '');
  const [roomNumber, setRoomNumber] = useState(initialIncident?.room_number ?? '');
  const [examId, setExamId] = useState(initialIncident?.exam_id ?? '');
  const [examDate, setExamDate] = useState(initialIncident?.exam_date ?? '');
  const [session, setSession] = useState(initialIncident?.session ?? '');

  const [code, setCode] = useState(initialIncident?.code ?? '');
  const [scope, setScope] = useState<'individual' | 'group' | ''>(initialIncident?.scope ?? '');

  const [timeStarted, setTimeStarted] = useState(toTimeInput(initialIncident?.time_started));
  const [timeResolved, setTimeResolved] = useState(toTimeInput(initialIncident?.time_resolved));

  const [description, setDescription] = useState(initialIncident?.description ?? '');
  const [actionTaken, setActionTaken] = useState(initialIncident?.action_taken ?? '');
  const [remedialAction, setRemedialAction] = useState(initialIncident?.remedial_action ?? '');
  const [remedialNotes, setRemedialNotes] = useState(initialIncident?.remedial_notes ?? '');
  const [questionsAffectedCount, setQuestionsAffectedCount] = useState(
    initialIncident?.questions_affected_count?.toString() ?? ''
  );
  const [questionsAffectedList, setQuestionsAffectedList] = useState(
    initialIncident?.questions_affected_list?.join(', ') ?? ''
  );

  const [candidates, setCandidates] = useState<QueuedCandidate[]>(
    initialIncident?.incident_candidates.map((c) => ({ student_name: c.student_name, student_id: c.student_id })) ??
      []
  );

  const [witnesses, setWitnesses] = useState(initialIncident?.witnesses ?? '');
  const [evidenceConfiscated, setEvidenceConfiscated] = useState(initialIncident?.evidence_confiscated ?? false);

  const [reportedToBoard, setReportedToBoard] = useState(initialIncident?.reported_to_board ?? false);
  const [boardReferenceNo, setBoardReferenceNo] = useState(initialIncident?.board_reference_no ?? '');
  const [followUpRequired, setFollowUpRequired] = useState(initialIncident?.follow_up_required ?? false);
  const [followUpNotes, setFollowUpNotes] = useState(initialIncident?.follow_up_notes ?? '');
  const [supervisorName, setSupervisorName] = useState(initialIncident?.supervisor_name ?? '');

  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'offline' | 'error'; text: string } | null>(null);

  const selectedCode = incidentCodes.find((c) => c.code === code);
  const isMalpractice = selectedCode?.is_malpractice ?? false;
  const isOther = code === 'OTH';

  const startIso = combineDateAndTime(examDate || null, timeStarted || null);
  const endIso = combineDateAndTime(examDate || null, timeResolved || null);
  const durationPreview = calcDurationMinutes(startIso, endIso);

  const categories = useMemo(() => {
    const map = new Map<string, IncidentCode[]>();
    for (const c of incidentCodes) {
      if (!map.has(c.category)) map.set(c.category, []);
      map.get(c.category)!.push(c);
    }
    return Array.from(map.entries());
  }, [incidentCodes]);

  function validate(): FormErrors {
    const next: FormErrors = {};
    if (!centerId) next.centerId = tCommon('required');
    if (!examId) next.examId = tCommon('required');
    if (!code) next.code = tCommon('required');
    if (!scope) next.scope = tCommon('required');
    if (!timeStarted) next.timeStarted = tCommon('required');
    if (isOther && !description.trim()) next.description = t('descriptionRequiredOther');
    return next;
  }

  async function handleSubmit(status: 'draft' | 'submitted') {
    const validationErrors = status === 'submitted' ? validate() : {};
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      setMessage({ type: 'error', text: t('validationError') });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const parsedQuestionsList = questionsAffectedList
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
      .map(Number)
      .filter((n) => !Number.isNaN(n));

    await enqueueIncident(
      {
        client_generated_id: clientId,
        center_id: centerId,
        room_number: roomNumber || null,
        exam_id: examId || null,
        exam_date: examDate || null,
        session: session || null,
        code: code || null,
        scope: (scope || null) as 'individual' | 'group' | null,
        time_started: startIso,
        time_resolved: endIso,
        description: description || null,
        action_taken: actionTaken || null,
        remedial_action: remedialAction || null,
        remedial_notes: remedialNotes || null,
        questions_affected_count: questionsAffectedCount ? Number(questionsAffectedCount) : null,
        questions_affected_list: parsedQuestionsList.length > 0 ? parsedQuestionsList : null,
        status,
        reported_to_board: reportedToBoard,
        board_reference_no: boardReferenceNo || null,
        follow_up_required: followUpRequired,
        follow_up_notes: followUpNotes || null,
        reporting_invigilator_id: currentUserId,
        supervisor_name: supervisorName || currentUserName,
        witnesses: isMalpractice ? witnesses || null : null,
        evidence_confiscated: isMalpractice ? evidenceConfiscated : false,
      },
      candidates.filter((c) => c.student_name.trim().length > 0),
      attachmentFile
    );

    setSubmitting(false);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setMessage({ type: 'offline', text: t('queuedOffline') });
    } else {
      setMessage({ type: 'success', text: status === 'draft' ? t('draftSaved') : t('submitSuccess') });
    }

    setTimeout(() => router.push('/incidents'), 900);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900">{isEdit ? t('editTitle') : t('title')}</h1>

      {message && (
        <div
          className={
            message.type === 'error'
              ? 'rounded-md bg-malpractice-50 p-3 text-sm text-malpractice-700'
              : message.type === 'offline'
                ? 'rounded-md bg-amber-50 p-3 text-sm text-amber-800'
                : 'rounded-md bg-emerald-50 p-3 text-sm text-emerald-700'
          }
        >
          {message.text}
        </div>
      )}

      <section className="card space-y-4">
        <h2 className="font-semibold text-slate-800">{t('sectionContext')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('center')} error={errors.centerId}>
            <select className="input" value={centerId} onChange={(e) => setCenterId(e.target.value)}>
              {centers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('roomNumber')}>
            <input className="input" value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} />
          </Field>
          <Field label={t('exam')} error={errors.examId}>
            <select className="input" value={examId} onChange={(e) => setExamId(e.target.value)}>
              <option value="">{t('codePlaceholder')}</option>
              {exams.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('examDate')}>
            <input
              type="date"
              className="input"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
            />
          </Field>
          <Field label={t('session')}>
            <input
              className="input"
              placeholder={t('sessionPlaceholder')}
              value={session}
              onChange={(e) => setSession(e.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="card space-y-4">
        <h2 className="font-semibold text-slate-800">{t('sectionClassification')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('code')} error={errors.code}>
            <select className="input" value={code} onChange={(e) => setCode(e.target.value)}>
              <option value="">{t('codePlaceholder')}</option>
              {categories.map(([category, codes]) => (
                <optgroup key={category} label={tCategory(category as never)}>
                  {codes.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {c.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>
          <Field label={t('scope')} error={errors.scope}>
            <select
              className="input"
              value={scope}
              onChange={(e) => setScope(e.target.value as 'individual' | 'group')}
            >
              <option value="">{t('codePlaceholder')}</option>
              <option value="individual">{tScope('individual')}</option>
              <option value="group">{tScope('group')}</option>
            </select>
          </Field>
        </div>
        {isMalpractice && (
          <p className="badge bg-malpractice-100 text-malpractice-700">{tCategory('Malpractice & Integrity')}</p>
        )}
      </section>

      <section className="card space-y-4">
        <h2 className="font-semibold text-slate-800">{t('sectionTiming')}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t('timeStarted')} error={errors.timeStarted}>
            <input
              type="time"
              className="input"
              value={timeStarted}
              onChange={(e) => setTimeStarted(e.target.value)}
            />
          </Field>
          <Field label={t('timeResolved')}>
            <input
              type="time"
              className="input"
              value={timeResolved}
              onChange={(e) => setTimeResolved(e.target.value)}
            />
          </Field>
          <Field label={t('durationMinutes')}>
            <input className="input bg-slate-100" disabled value={durationPreview ?? ''} placeholder={t('durationAuto')} />
          </Field>
        </div>
      </section>

      <section className="card space-y-4">
        <h2 className="font-semibold text-slate-800">{t('sectionDescription')}</h2>
        <Field label={t('description')} error={errors.description}>
          <textarea
            className="input"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <Field label={t('actionTaken')}>
          <textarea className="input" rows={2} value={actionTaken} onChange={(e) => setActionTaken(e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('remedialAction')}>
            <input className="input" value={remedialAction} onChange={(e) => setRemedialAction(e.target.value)} />
          </Field>
          <Field label={t('remedialNotes')}>
            <input className="input" value={remedialNotes} onChange={(e) => setRemedialNotes(e.target.value)} />
          </Field>
          <Field label={t('questionsAffectedCount')}>
            <input
              type="number"
              min={0}
              className="input"
              value={questionsAffectedCount}
              onChange={(e) => setQuestionsAffectedCount(e.target.value)}
            />
          </Field>
          <Field label={t('questionsAffectedList')}>
            <input
              className="input"
              placeholder="1, 2, 3"
              value={questionsAffectedList}
              onChange={(e) => setQuestionsAffectedList(e.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="card space-y-4">
        <h2 className="font-semibold text-slate-800">{t('sectionCandidates')}</h2>
        <CandidateRows candidates={candidates} onChange={setCandidates} />
      </section>

      {isMalpractice && (
        <section className="card space-y-4 border-malpractice-200 bg-malpractice-50/40">
          <h2 className="font-semibold text-malpractice-700">{t('sectionMalpractice')}</h2>
          <Field label={t('witnesses')}>
            <textarea
              className="input"
              rows={2}
              placeholder={t('witnessesPlaceholder')}
              value={witnesses}
              onChange={(e) => setWitnesses(e.target.value)}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={evidenceConfiscated}
              onChange={(e) => setEvidenceConfiscated(e.target.checked)}
            />
            {t('evidenceConfiscated')}
          </label>
          <Field label={t('evidencePhoto')}>
            <input
              type="file"
              accept="image/*,.pdf"
              className="input"
              onChange={(e) => setAttachmentFile(e.target.files?.[0] ?? null)}
            />
            <p className="mt-1 text-xs text-slate-500">{t('uploadWhenOnline')}</p>
          </Field>
        </section>
      )}

      {!isMalpractice && (
        <section className="card space-y-4">
          <h2 className="font-semibold text-slate-800">{t('sectionAttachment')}</h2>
          <Field label={t('attachment')}>
            <input
              type="file"
              accept="image/*,.pdf"
              className="input"
              onChange={(e) => setAttachmentFile(e.target.files?.[0] ?? null)}
            />
            <p className="mt-1 text-xs text-slate-500">{t('uploadWhenOnline')}</p>
          </Field>
        </section>
      )}

      <section className="card space-y-4">
        <h2 className="font-semibold text-slate-800">{t('sectionFollowUp')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('supervisorName')}>
            <input className="input" value={supervisorName} onChange={(e) => setSupervisorName(e.target.value)} />
          </Field>
          <Field label={t('boardReferenceNo')}>
            <input
              className="input"
              value={boardReferenceNo}
              onChange={(e) => setBoardReferenceNo(e.target.value)}
              disabled={!reportedToBoard}
            />
          </Field>
        </div>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={reportedToBoard}
              onChange={(e) => setReportedToBoard(e.target.checked)}
            />
            {t('reportedToBoard')}
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={followUpRequired}
              onChange={(e) => setFollowUpRequired(e.target.checked)}
            />
            {t('followUpRequired')}
          </label>
        </div>
        {followUpRequired && (
          <Field label={t('followUpNotes')}>
            <textarea
              className="input"
              rows={2}
              value={followUpNotes}
              onChange={(e) => setFollowUpNotes(e.target.value)}
            />
          </Field>
        )}
      </section>

      <div className="flex flex-wrap gap-3 pb-8">
        <button
          type="button"
          className="btn-secondary"
          disabled={submitting}
          onClick={() => handleSubmit('draft')}
        >
          {tCommon('saveDraft')}
        </button>
        <button type="button" className="btn-primary" disabled={submitting} onClick={() => handleSubmit('submitted')}>
          {tCommon('submit')}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-malpractice-600">{error}</p>}
    </div>
  );
}

function toTimeInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toTimeString().slice(0, 5);
}
