import { createClient } from '@/lib/supabase/client';
import { offlineDb, type QueuedCandidate, type QueuedIncidentPayload } from './db';

let syncInFlight = false;

export async function enqueueIncident(
  payload: QueuedIncidentPayload,
  candidates: QueuedCandidate[],
  attachmentFile: File | null
) {
  await offlineDb.queuedIncidents.put({
    id: payload.client_generated_id,
    payload,
    candidates,
    attachmentFile: attachmentFile ?? null,
    attachmentName: attachmentFile?.name ?? null,
    status: 'pending',
    errorMessage: null,
    retryCount: 0,
    createdAt: new Date().toISOString(),
  });

  if (typeof navigator !== 'undefined' && navigator.onLine) {
    void syncQueue();
  }
}

/**
 * Pushes every queued incident to Supabase, one at a time. Safe to call
 * repeatedly/concurrently: a module-level lock skips overlapping runs, and
 * each incident upserts on `client_generated_id` so a retry after a partial
 * failure never creates a duplicate row.
 */
export async function syncQueue(): Promise<void> {
  if (syncInFlight) return;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;

  syncInFlight = true;
  try {
    const supabase = createClient();
    const pending = await offlineDb.queuedIncidents
      .where('status')
      .anyOf(['pending', 'error'])
      .toArray();

    for (const item of pending) {
      await offlineDb.queuedIncidents.update(item.id, { status: 'syncing' });

      try {
        let attachmentPath: string | null = null;

        if (item.attachmentFile) {
          const path = `${item.payload.reporting_invigilator_id}/${item.id}/${item.attachmentName ?? 'evidence'}`;
          const { error: uploadError } = await supabase.storage
            .from('incident-evidence')
            .upload(path, item.attachmentFile, { upsert: true });

          if (uploadError) throw uploadError;
          attachmentPath = path;
        }

        const { data: incidentRow, error: incidentError } = await supabase
          .from('incidents')
          .upsert(
            {
              ...item.payload,
              attachment_url: attachmentPath,
            },
            { onConflict: 'client_generated_id' }
          )
          .select('id')
          .single();

        if (incidentError) throw incidentError;

        if (item.candidates.length > 0) {
          const { error: deleteError } = await supabase
            .from('incident_candidates')
            .delete()
            .eq('incident_id', incidentRow.id);
          if (deleteError) throw deleteError;

          const { error: candidatesError } = await supabase.from('incident_candidates').insert(
            item.candidates.map((c) => ({
              incident_id: incidentRow.id,
              student_name: c.student_name,
              student_id: c.student_id,
            }))
          );
          if (candidatesError) throw candidatesError;
        }

        await offlineDb.queuedIncidents.delete(item.id);
      } catch (err) {
        await offlineDb.queuedIncidents.update(item.id, {
          status: 'error',
          errorMessage: err instanceof Error ? err.message : 'Sync failed',
          retryCount: item.retryCount + 1,
        });
      }
    }
  } finally {
    syncInFlight = false;
  }
}

export function initSyncListeners() {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = () => void syncQueue();
  window.addEventListener('online', handleOnline);

  if (navigator.onLine) void syncQueue();

  return () => window.removeEventListener('online', handleOnline);
}
