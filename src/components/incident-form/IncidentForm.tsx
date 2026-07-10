'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { enqueueIncident } from '@/lib/offline/sync';
import { newClientGeneratedId, combineDateAndTime, calcDurationMinutes } from '@/lib/incidents/reference';
import { cn } from '@/lib/utils';
import {
  EXAM_CYCLES,
  type Center,
  type Exam,
  type ExamCycle,
  type Incident,
  type IncidentCandidate,
  type IncidentCode,
  type IncidentScope,
} from '@/types/database';

interface IncidentFormProps {
  exams: Exam[];
  incidentCodes: IncidentCode[];
  centers: Center[];
  currentUserId: string;
  currentUserName: string | null;
  initialIncident?: Incident & { incident_candidates: IncidentCandidate[] };
}

type Affect = 'student' | 'group';

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
  const router = useRouter();

  const isEdit = Boolean(initialIncident);
  const clientId = useMemo(
    () => initialIncident?.client_generated_id ?? newClientGeneratedId(),
    [initialIncident]
  );
  const existingCandidate = initialIncident?.incident_candidates[0];

  const [centerId, setCenterId] = useState(initialIncident?.center_id ?? centers[0]?.id ?? '');
  const [examCycle, setExamCycle] = useState<ExamCycle | ''>(initialIncident?.exam_cycle ?? '');
  const [examDate, setExamDate] = useState(initialIncident?.exam_date ?? '');
  const [examId, setExamId] = useState(initialIncident?.exam_id ?? '');

  const [category, setCategory] = useState(
    () => incidentCodes.find((c) => c.code === initialIncident?.code)?.category ?? ''
  );
  const [code, setCode] = useState(initialIncident?.code ?? '');
  const [issueDescription, setIssueDescription] = useState(initialIncident?.issue_description ?? '');

  const [affect, setAffect] = useState<Affect>(initialIncident?.scope === 'group' ? 'group' : 'student');
  const [studentName, setStudentName] = useState(existingCandidate?.student_name ?? '');
  const [studentEmail, setStudentEmail] = useState(existingCandidate?.student_email ?? '');

  const [timeStarted, setTimeStarted] = useState(toTimeInput(initialIncident?.time_started));
  const [timeResolved, setTimeResolved] = useState(toTimeInput(initialIncident?.time_resolved));

  const [actionTaken, setActionTaken] = useState(initialIncident?.action_taken ?? '');
  const [questionsAffectedCount, setQuestionsAffectedCount] = useState(
    initialIncident?.questions_affected_count?.toString() ?? ''
  );
  const [questionsAffectedList, setQuestionsAffectedList] = useState(
    initialIncident?.questions_affected_list?.join(', ') ?? ''
  );

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'offline'; text: string } | null>(null);

  const startIso = combineDateAndTime(examDate || null, timeStarted || null);
  const endIso = combineDateAndTime(examDate || null, timeResolved || null);
  const durationMinutes = calcDurationMinutes(startIso, endIso);

  const categories = useMemo(() => Array.from(new Set(incidentCodes.map((c) => c.category))), [incidentCodes]);
  const issuesForCategory = useMemo(
    () => incidentCodes.filter((c) => c.category === category),
    [incidentCodes, category]
  );
  const isOther = category === 'Other';
  const affectStudent = affect === 'student';

  function clear<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setFormError('');
    };
  }

  function handleCategoryChange(next: string) {
    setCategory(next);
    setCode('');
    setFormError('');
  }

  function validate(): string | null {
    const missingStudent = affect === 'student' && !studentName.trim();
    const missingOther = isOther && !issueDescription.trim();
    if (
      !centerId ||
      !examCycle ||
      !examDate ||
      !examId ||
      !category ||
      !code ||
      !timeStarted ||
      !actionTaken.trim() ||
      missingStudent ||
      missingOther
    ) {
      return t('requiredFieldsError');
    }
    return null;
  }

  async function handleSubmit(finalStatus: 'draft' | 'submitted') {
    if (finalStatus === 'submitted') {
      const error = validate();
      if (error) {
        setFormError(error);
        return;
      }
    }
    setFormError('');
    setSubmitting(true);
    setMessage(null);

    const parsedQuestionsList = questionsAffectedList
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
      .map(Number)
      .filter((n) => !Number.isNaN(n));

    const scope: IncidentScope = affect === 'student' ? 'individual' : 'group';
    const candidates =
      affect === 'student' && studentName.trim()
        ? [{ student_name: studentName.trim(), student_email: studentEmail.trim() || null }]
        : [];

    await enqueueIncident(
      {
        client_generated_id: clientId,
        center_id: centerId,
        room_number: null,
        exam_id: examId || null,
        exam_date: examDate || null,
        exam_cycle: (examCycle || null) as ExamCycle | null,
        session: null,
        code: code || null,
        scope,
        time_started: startIso,
        time_resolved: endIso,
        description: null,
        issue_description: isOther ? issueDescription.trim() || null : null,
        action_taken: actionTaken || null,
        remedial_action: null,
        remedial_notes: null,
        questions_affected_count: questionsAffectedCount ? Number(questionsAffectedCount) : null,
        questions_affected_list: parsedQuestionsList.length > 0 ? parsedQuestionsList : null,
        status: finalStatus,
        reported_to_board: false,
        board_reference_no: null,
        follow_up_required: false,
        follow_up_notes: null,
        reporting_invigilator_id: currentUserId,
        supervisor_name: currentUserName,
        witnesses: null,
        evidence_confiscated: false,
      },
      candidates,
      null
    );

    setSubmitting(false);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setMessage({ type: 'offline', text: t('queuedOffline') });
    } else {
      setMessage({ type: 'success', text: finalStatus === 'draft' ? t('draftSaved') : t('submitSuccess') });
    }

    setTimeout(() => router.push(finalStatus === 'draft' ? '/incidents' : '/audit'), 900);
  }

  return (
    <div className="mx-auto max-w-[860px]">
      <div className="mb-[22px]">
        <div className="mb-1.5 text-xs font-semibold uppercase tracking-[.09em] text-brand-600">
          {t('eyebrow')}
        </div>
        <h1 className="m-0 text-[27px] font-bold tracking-[-.02em] text-ink">
          {isEdit ? t('editTitle') : t('title')}
        </h1>
        <p className="mt-2 max-w-[560px] text-[14.5px] text-muted">{t('subtitle')}</p>
      </div>

      {message && (
        <div
          className={
            message.type === 'offline'
              ? 'mb-4 rounded-lg bg-accent-tint p-3 text-sm text-brand-700'
              : 'mb-4 rounded-lg bg-page p-3 text-sm text-ink ring-1 ring-inset ring-border'
          }
        >
          {message.text}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit('submitted');
        }}
        className="rounded-[10px] border border-border bg-surface p-7 shadow-[0_1px_2px_rgba(31,42,49,.04),0_6px_24px_rgba(31,42,49,.04)]"
      >
        <SectionLabel>{t('sectionContext')}</SectionLabel>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-x-5 gap-y-[18px]">
          <Field label={t('center')} required>
            <select className="input" value={centerId} onChange={(e) => clear(setCenterId)(e.target.value)}>
              <option value="" disabled>
                {t('centerPlaceholder')}
              </option>
              {centers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('examCycle')} required>
            <select
              className="input"
              value={examCycle}
              onChange={(e) => clear(setExamCycle)(e.target.value as ExamCycle)}
            >
              <option value="" disabled>
                {t('examCyclePlaceholder')}
              </option>
              {EXAM_CYCLES.map((cycle) => (
                <option key={cycle} value={cycle}>
                  {cycle}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('examDate')} required>
            <input
              type="date"
              className="input py-[9px] font-mono"
              value={examDate}
              onChange={(e) => clear(setExamDate)(e.target.value)}
            />
          </Field>
        </div>

        <Divider />

        <SectionLabel>{t('sectionIssue')}</SectionLabel>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-x-5 gap-y-[18px]">
          <Field label={t('exam')} required>
            <select className="input" value={examId} onChange={(e) => clear(setExamId)(e.target.value)}>
              <option value="" disabled>
                {t('examPlaceholder')}
              </option>
              {exams.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('categoryField')} required>
            <select className="input" value={category} onChange={(e) => handleCategoryChange(e.target.value)}>
              <option value="" disabled>
                {t('categoryPlaceholder')}
              </option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {tCategory(cat as never)}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label={
              <span className="flex items-center gap-2">
                {t('issue')}
                <span className="text-[11.5px] font-medium text-muted">{t('issueHint')}</span>
              </span>
            }
            required
          >
            <select
              className={category ? 'input' : 'input cursor-not-allowed bg-[#f6f8f9] text-faint'}
              value={code}
              onChange={(e) => clear(setCode)(e.target.value)}
              disabled={!category}
            >
              <option value="" disabled>
                {category ? t('issuePlaceholder') : t('issuePlaceholderNoCategory')}
              </option>
              {issuesForCategory.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {isOther && (
          <div className="mt-[18px]">
            <Field label={t('issueDescription')} required>
              <textarea
                rows={3}
                placeholder={t('issueDescriptionPlaceholder')}
                className="input resize-y py-[11px] leading-[1.5]"
                value={issueDescription}
                onChange={(e) => clear(setIssueDescription)(e.target.value)}
              />
            </Field>
          </div>
        )}

        <Divider />

        <SectionLabel>{t('sectionCandidate')}</SectionLabel>
        <div className="mb-[18px]">
          <span className="mb-2 block text-[13px] font-semibold text-ink">
            {t('whoAffected')}
            <span className="text-brand-600"> *</span>
          </span>
          <div className="flex flex-wrap gap-[10px]">
            <button
              type="button"
              onClick={() => clear(setAffect)('student')}
              className={cn(
                'rounded-[7px] border px-4 py-[10px] text-sm font-semibold transition-colors',
                affectStudent
                  ? 'border-brand-600 bg-brand-600 text-white shadow-[0_2px_8px_rgba(193,44,104,.22)]'
                  : 'border-border bg-surface text-secondary'
              )}
            >
              {t('affectStudent')}
            </button>
            <button
              type="button"
              onClick={() => clear(setAffect)('group')}
              className={cn(
                'rounded-[7px] border px-4 py-[10px] text-sm font-semibold transition-colors',
                !affectStudent
                  ? 'border-brand-600 bg-brand-600 text-white shadow-[0_2px_8px_rgba(193,44,104,.22)]'
                  : 'border-border bg-surface text-secondary'
              )}
            >
              {t('affectRoom')}
            </button>
          </div>
        </div>
        {affectStudent ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-x-5 gap-y-[18px]">
            <Field label={t('studentName')} required>
              <input
                type="text"
                placeholder={t('studentNamePlaceholder')}
                className="input"
                value={studentName}
                onChange={(e) => clear(setStudentName)(e.target.value)}
              />
            </Field>
            <Field label={t('studentEmail')}>
              <input
                type="email"
                placeholder={t('studentEmailPlaceholder')}
                className="input"
                value={studentEmail}
                onChange={(e) => clear(setStudentEmail)(e.target.value)}
              />
            </Field>
          </div>
        ) : (
          <div className="flex items-start gap-[10px] rounded-[7px] border border-[#f0d7e2] bg-[#faf2f6] px-[14px] py-3">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#c12c68"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mt-px shrink-0"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            <span className="text-[13.5px] leading-[1.5] text-secondary">{t('roomWideNote')}</span>
          </div>
        )}

        <Divider />

        <SectionLabel>{t('sectionTiming')}</SectionLabel>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] items-end gap-x-5 gap-y-[18px]">
          <Field label={t('timeStarted')} required>
            <input
              type="time"
              className="input py-[9px] font-mono"
              value={timeStarted}
              onChange={(e) => clear(setTimeStarted)(e.target.value)}
            />
          </Field>
          <Field label={t('timeResolved')}>
            <input
              type="time"
              className="input py-[9px] font-mono"
              value={timeResolved}
              onChange={(e) => clear(setTimeResolved)(e.target.value)}
            />
          </Field>
          <div className="rounded-[7px] border border-[#f0d7e2] bg-[#faf2f6] px-[14px] py-[9px]">
            <div className="mb-0.5 text-[11px] font-semibold uppercase tracking-[.04em] text-brand-600">
              {t('duration')} <span className="normal-case tracking-normal text-[#c99ab0]">{t('durationAuto')}</span>
            </div>
            <div className="font-mono text-[19px] font-semibold text-ink">
              {durationMinutes == null ? '—' : t('durationValue', { count: durationMinutes })}
            </div>
          </div>
        </div>

        <Divider />

        <SectionLabel>{t('sectionResolution')}</SectionLabel>
        <Field label={t('actionTaken')} required>
          <textarea
            rows={3}
            placeholder={t('actionTakenPlaceholder')}
            className="input resize-y py-[11px] leading-[1.5]"
            value={actionTaken}
            onChange={(e) => clear(setActionTaken)(e.target.value)}
          />
        </Field>
        <div className="mt-[18px] grid grid-cols-[130px_1fr] gap-x-5 gap-y-[18px]">
          <Field label={t('questionsAffectedCount')}>
            <input
              type="number"
              min={0}
              placeholder="0"
              className="input font-mono"
              value={questionsAffectedCount}
              onChange={(e) => clear(setQuestionsAffectedCount)(e.target.value)}
            />
          </Field>
          <Field
            label={
              <span>
                {t('questionsAffectedList')}{' '}
                <span className="font-medium text-muted">{tCommon('optionalHint')}</span>
              </span>
            }
          >
            <input
              placeholder={t('questionsAffectedListPlaceholder')}
              className="input font-mono"
              value={questionsAffectedList}
              onChange={(e) => clear(setQuestionsAffectedList)(e.target.value)}
            />
          </Field>
        </div>

        <div className="mt-[30px] flex flex-wrap items-center gap-3 border-t border-divider pt-6">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {t('submitIncident')}
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={submitting}
            onClick={() => void handleSubmit('draft')}
          >
            {t('saveAsDraft')}
          </button>
          {formError && <span className="ms-1 text-[13px] font-medium text-brand-600">{formError}</span>}
          <span className="ms-auto text-[12.5px] text-muted">{t('auditHint')}</span>
        </div>
      </form>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 text-xs font-semibold uppercase tracking-[.06em] text-muted">{children}</div>
  );
}

function Divider() {
  return <div className="my-[26px] h-px bg-divider" />;
}

function Field({
  label,
  required,
  children,
}: {
  label: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold text-ink">
        {label}
        {required && <span className="text-brand-600"> *</span>}
      </span>
      {children}
    </label>
  );
}

function toTimeInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toTimeString().slice(0, 5);
}
