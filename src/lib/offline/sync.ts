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
 * each incident is looked up by `client_generated_id` before insert so a
 * retry after a partial failure (e.g. the incident row landed but its
 * candidate row didn't) never creates a duplicate row.
 *
 * Deliberately NOT an upsert: once an incident is created its RLS update
 * policy only allows a non-staff editor to touch it while it's still a
 * draft, and most reports are filed straight to "submitted" or later. An
 * upsert's ON CONFLICT DO UPDATE arm would then be rejected by RLS on
 * every retry (a new failure mode), so retries look up the existing row
 * and only insert what's still missing instead of re-writing it.
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

        const { data: existingIncident, error: lookupError } = await supabase
          .from('incidents')
          .select('id')
          .eq('client_generated_id', item.payload.client_generated_id)
          .maybeSingle();

        if (lookupError) throw lookupError;

        let incidentRow: { id: string };
        if (existingIncident) {
          incidentRow = existingIncident;
        } else {
          const { data: inserted, error: incidentError } = await supabase
            .from('incidents')
            .insert({
              ...item.payload,
              attachment_url: attachmentPath,
            })
            .select('id')
            .single();

          if (incidentError) throw incidentError;
          incidentRow = inserted;
        }

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
              student_email: c.student_email,
            }))
          );
          if (candidatesError) throw candidatesError;
        }

        await offlineDb.queuedIncidents.delete(item.id);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Sync failed';
        console.error(`[sync] incident ${item.id} failed to sync:`, errorMessage, err);
        await offlineDb.queuedIncidents.update(item.id, {
          status: 'error',
          errorMessage,
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
