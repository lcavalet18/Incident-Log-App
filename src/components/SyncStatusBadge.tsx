'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useLiveQuery } from 'dexie-react-hooks';
import { offlineDb } from '@/lib/offline/db';
import { initSyncListeners, syncQueue } from '@/lib/offline/sync';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { cn } from '@/lib/utils';

export function SyncStatusBadge() {
  const t = useTranslations('sync');
  const isOnline = useOnlineStatus();

  const queueItems = useLiveQuery(() => offlineDb.queuedIncidents.toArray(), [], []);
  const pendingCount = queueItems?.length ?? 0;
  const hasErrors = queueItems?.some((i) => i.status === 'error') ?? false;

  useEffect(() => initSyncListeners(), []);

  if (pendingCount === 0) {
    return (
      <span
        className={cn(
          'badge',
          isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
        )}
      >
        <span
          className={cn('h-1.5 w-1.5 rounded-full', isOnline ? 'bg-emerald-500' : 'bg-slate-400')}
        />
        {isOnline ? t('online') : t('offline')}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void syncQueue()}
      title={hasErrors ? t('syncFailed') : t('offline')}
      className={cn(
        'badge cursor-pointer',
        hasErrors ? 'bg-amber-100 text-amber-800' : 'bg-brand-100 text-brand-700'
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', hasErrors ? 'bg-amber-500' : 'bg-brand-500')} />
      {t('pendingCount', { count: pendingCount })}
    </button>
  );
}
