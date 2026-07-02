'use client';

import { useTranslations } from 'next-intl';
import type { IncidentStatus } from '@/types/database';
import { cn } from '@/lib/utils';

const COLORS: Record<IncidentStatus, string> = {
  draft: 'bg-neutral-bg text-muted',
  submitted: 'bg-brand-50 text-brand-600',
  reviewed: 'bg-success-bg text-success',
  closed: 'bg-neutral-bg text-secondary',
};

export function StatusBadge({ status }: { status: IncidentStatus }) {
  const t = useTranslations('status');
  return <span className={cn('badge', COLORS[status])}>{t(status)}</span>;
}
