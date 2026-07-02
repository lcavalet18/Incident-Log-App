'use client';

import { useTranslations } from 'next-intl';
import type { QueuedCandidate } from '@/lib/offline/db';

export function CandidateRows({
  candidates,
  onChange,
}: {
  candidates: QueuedCandidate[];
  onChange: (next: QueuedCandidate[]) => void;
}) {
  const t = useTranslations('incidentForm');

  function updateRow(index: number, field: keyof QueuedCandidate, value: string) {
    const next = candidates.slice();
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  }

  function addRow() {
    onChange([...candidates, { student_name: '', student_email: null }]);
  }

  function removeRow(index: number) {
    onChange(candidates.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {candidates.length === 0 && <p className="text-sm text-muted">{t('noCandidates')}</p>}

      {candidates.map((candidate, index) => (
        <div key={index} className="flex flex-wrap items-end gap-3 rounded-lg border border-border p-3">
          <div className="min-w-[10rem] flex-1">
            <label className="label">{t('studentName')}</label>
            <input
              className="input"
              value={candidate.student_name}
              onChange={(e) => updateRow(index, 'student_name', e.target.value)}
            />
          </div>
          <div className="min-w-[10rem] flex-1">
            <label className="label">{t('studentEmail')}</label>
            <input
              type="email"
              className="input"
              value={candidate.student_email ?? ''}
              onChange={(e) => updateRow(index, 'student_email', e.target.value)}
            />
          </div>
          <button type="button" className="btn-secondary" onClick={() => removeRow(index)}>
            {t('removeCandidate')}
          </button>
        </div>
      ))}

      <button type="button" className="btn-secondary" onClick={addRow}>
        + {t('addCandidate')}
      </button>
    </div>
  );
}
