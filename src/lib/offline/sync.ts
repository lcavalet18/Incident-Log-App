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
 * each incident is looked up by `client_generated_id` first so a retry
 * after a partial failure never creates a duplicate row.
 *
 * Deliberately NOT an upsert: once an incident is created, its RLS update
 * policy only allows a non-staff editor to touch it while it's still a
 * draft, and most reports are filed straight to "submitted" or later. An
 * upsert's ON CONFLICT DO UPDATE arm would then be rejected by RLS on a
 * background retry of an already-submitted report (a new failure mode).
 *
 * When a row already exists (editing a draft, or retrying a partial
 * failure), candidates are replaced *before* the incidents row update:
 * editing a draft can promote its status straight to "submitted" in the
 * same request, and incident_candidates writes are only permitted while
 * the parent incident is still a draft for non-staff -- doing it in this
 * order means the candidate replace still sees the pre-update status.
 * The incidents update itself is a plain UPDATE (not upsert), so if the
 * row already left "draft" and nothing actually changed (a background
 * retry, not a user edit), RLS just leaves it as a harmless no-op instead
 * of erroring.
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

        let incidentId: string;

        if (existingIncident) {
          incidentId = existingIncident.id;

          // Replace candidates first, while the row's *current* status
          // (still 'draft' if this is a draft edit) still permits it.
          const { error: deleteError } = await supabase
            .from('incident_candidates')
            .delete()
            .eq('incident_id', incidentId);
          if (deleteError) throw deleteError;

          if (item.candidates.length > 0) {
            const { error: candidatesError } = await supabase.from('incident_candidates').insert(
              item.candidates.map((c) => ({
                incident_id: incidentId,
                student_name: c.student_name,
                student_email: c.student_email,
              }))
            );
            if (candidatesError) throw candidatesError;
          }

          const { error: updateError } = await supabase
            .from('incidents')
            .update({ ...item.payload, attachment_url: attachmentPath })
            .eq('id', incidentId);
          if (updateError) throw updateError;
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
          incidentId = inserted.id;

          if (item.candidates.length > 0) {
            const { error: candidatesError } = await supabase.from('incident_candidates').insert(
              item.candidates.map((c) => ({
                incident_id: incidentId,
                student_name: c.student_name,
                student_email: c.student_email,
              }))
            );
            if (candidatesError) throw candidatesError;
          }
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
