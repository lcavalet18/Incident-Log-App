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
      <span className="flex items-center gap-[7px]">
        <span
          className={cn(
            'h-2 w-2 rounded-full',
            isOnline ? 'bg-online shadow-[0_0_0_3px_rgba(47,158,107,.16)]' : 'bg-faint'
          )}
        />
        <span className="text-[13px] font-medium text-secondary">{isOnline ? t('online') : t('offline')}</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void syncQueue()}
      title={hasErrors ? t('syncFailed') : t('offline')}
      className={cn(
        'badge cursor-pointer font-mono',
        hasErrors ? 'bg-brand-700 text-white' : 'bg-brand-50 text-brand-700'
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', hasErrors ? 'bg-white' : 'bg-brand-500')} />
      {t('pendingCount', { count: pendingCount })}
    </button>
  );
}
