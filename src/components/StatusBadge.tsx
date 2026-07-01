'use client';

import { useTranslations } from 'next-intl';
import type { IncidentStatus } from '@/types/database';
import { cn } from '@/lib/utils';

const COLORS: Record<IncidentStatus, string> = {
  draft: 'bg-slate-200 text-slate-700',
  submitted: 'bg-brand-100 text-brand-700',
  reviewed: 'bg-amber-100 text-amber-800',
  closed: 'bg-emerald-100 text-emerald-700',
};

export function StatusBadge({ status }: { status: IncidentStatus }) {
  const t = useTranslations('status');
  return <span className={cn('badge', COLORS[status])}>{t(status)}</span>;
}
