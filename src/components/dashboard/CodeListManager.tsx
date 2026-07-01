'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import type { IncidentCode } from '@/types/database';

export function CodeListManager({ incidentCodes }: { incidentCodes: IncidentCode[] }) {
  const t = useTranslations('codes');
  const tCommon = useTranslations('common');
  const router = useRouter();

  const [code, setCode] = useState('');
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState('');
  const [isMalpractice, setIsMalpractice] = useState(false);
  const [saving, setSaving] = useState(false);

  async function toggleActive(target: IncidentCode) {
    const supabase = createClient();
    await supabase.from('incident_codes').update({ is_active: !target.is_active }).eq('code', target.code);
    router.refresh();
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !label.trim() || !category.trim()) return;

    setSaving(true);
    const supabase = createClient();
    await supabase.from('incident_codes').insert({
      code: code.trim().toUpperCase(),
      label: label.trim(),
      category: category.trim(),
      is_malpractice: isMalpractice,
    });
    setSaving(false);
    setCode('');
    setLabel('');
    setCategory('');
    setIsMalpractice(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900">{t('title')}</h1>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 text-start">{t('code')}</th>
              <th className="px-4 py-3 text-start">{t('label')}</th>
              <th className="px-4 py-3 text-start">{t('category')}</th>
              <th className="px-4 py-3 text-start">{t('isMalpractice')}</th>
              <th className="px-4 py-3 text-start">{t('isActive')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {incidentCodes.map((c) => (
              <tr key={c.code} className={c.is_active ? '' : 'opacity-50'}>
                <td className="px-4 py-2 font-mono">{c.code}</td>
                <td className="px-4 py-2">{c.label}</td>
                <td className="px-4 py-2">{c.category}</td>
                <td className="px-4 py-2">{c.is_malpractice ? tCommon('yes') : tCommon('no')}</td>
                <td className="px-4 py-2">
                  <button type="button" className="btn-secondary" onClick={() => toggleActive(c)}>
                    {c.is_active ? tCommon('yes') : tCommon('no')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={handleAdd} className="card grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="label">{t('code')}</label>
          <input className="input" value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} />
        </div>
        <div>
          <label className="label">{t('label')}</label>
          <input className="input" value={label} onChange={(e) => setLabel(e.target.value)} />
        </div>
        <div>
          <label className="label">{t('category')}</label>
          <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>
        <div className="flex items-end gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isMalpractice}
              onChange={(e) => setIsMalpractice(e.target.checked)}
            />
            {t('isMalpractice')}
          </label>
          <button type="submit" className="btn-primary" disabled={saving}>
            {t('addCode')}
          </button>
        </div>
      </form>
    </div>
  );
}
