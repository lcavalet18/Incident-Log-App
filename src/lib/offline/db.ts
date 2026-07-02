import Dexie, { type Table } from 'dexie';
import type { ExamCycle, IncidentStatus } from '@/types/database';

export interface QueuedCandidate {
  student_name: string;
  /** Auto-generated server-side on insert — never entered by the invigilator. */
  student_email: string | null;
}

/** Mirrors the subset of `incidents` columns collected by the form. */
export interface QueuedIncidentPayload {
  client_generated_id: string;
  center_id: string;
  room_number: string | null;
  exam_id: string | null;
  exam_date: string | null;
  exam_cycle: ExamCycle | null;
  session: string | null;
  code: string | null;
  scope: 'individual' | 'group' | null;
  time_started: string | null;
  time_resolved: string | null;
  description: string | null;
  action_taken: string | null;
  remedial_action: string | null;
  remedial_notes: string | null;
  questions_affected_count: number | null;
  questions_affected_list: number[] | null;
  status: IncidentStatus;
  reported_to_board: boolean;
  board_reference_no: string | null;
  follow_up_required: boolean;
  follow_up_notes: string | null;
  reporting_invigilator_id: string;
  supervisor_name: string | null;
  witnesses: string | null;
  evidence_confiscated: boolean;
}

export type QueueItemStatus = 'pending' | 'syncing' | 'error';

export interface QueuedIncident {
  id: string; // == client_generated_id
  payload: QueuedIncidentPayload;
  candidates: QueuedCandidate[];
  attachmentFile: Blob | null;
  attachmentName: string | null;
  status: QueueItemStatus;
  errorMessage: string | null;
  retryCount: number;
  createdAt: string;
}

class OfflineQueueDB extends Dexie {
  queuedIncidents!: Table<QueuedIncident, string>;

  constructor() {
    super('g12-incident-log-offline');
    this.version(1).stores({
      queuedIncidents: 'id, status, createdAt',
    });
  }
}

export const offlineDb = new OfflineQueueDB();
