'use client';

import { useTranslations } from 'next-intl';
import type { IncidentStatus } from '@/types/database';
import { cn } from '@/lib/utils';

const COLORS: Record<IncidentStatus, string> = {
  draft: 'bg-page text-muted ring-1 ring-inset ring-border',
  submitted: 'bg-brand-50 text-brand-700',
  reviewed: 'bg-ink/10 text-ink',
  closed: 'bg-border text-ink',
};

export function StatusBadge({ status }: { status: IncidentStatus }) {
  const t = useTranslations('status');
  return <span className={cn('badge', COLORS[status])}>{t(status)}</span>;
}
