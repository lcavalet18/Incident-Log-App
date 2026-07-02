export type UserRole = 'invigilator' | 'supervisor' | 'admin';
export type IncidentStatus = 'draft' | 'submitted' | 'reviewed' | 'closed';
export type IncidentScope = 'individual' | 'group';
export type ExamCycle = 'February 2026' | 'May 2026';
export const EXAM_CYCLES: ExamCycle[] = ['February 2026', 'May 2026'];

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  center_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Center {
  id: string;
  name: string;
  location: string | null;
  created_at: string;
}

export interface Exam {
  id: string;
  name: string;
  total_questions: number | null;
  language: 'en' | 'ar';
  created_at: string;
}

export interface IncidentCode {
  code: string;
  label: string;
  category: string;
  is_malpractice: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface IncidentCandidate {
  id: string;
  incident_id: string;
  student_name: string;
  student_email: string | null;
  /** Auto-generated on insert (e.g. STU-2026-000123) — never entered by the invigilator. */
  student_id: string | null;
  created_at: string;
}

export interface Incident {
  id: string;
  incident_reference: string | null;
  center_id: string;
  room_number: string | null;
  exam_id: string | null;
  exam_date: string | null;
  exam_cycle: ExamCycle | null;
  session: string | null;
  code: string | null;
  scope: IncidentScope | null;
  time_started: string | null;
  time_resolved: string | null;
  duration_minutes: number | null;
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
  supervisor_notes: string | null;
  witnesses: string | null;
  evidence_confiscated: boolean;
  attachment_url: string | null;
  client_generated_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface IncidentWithCode extends Incident {
  exams: Pick<Exam, 'id' | 'name' | 'language'> | null;
  centers: Pick<Center, 'id' | 'name'> | null;
  incident_codes: Pick<IncidentCode, 'code' | 'label' | 'category' | 'is_malpractice'> | null;
}

export interface IncidentWithRelations extends IncidentWithCode {
  incident_candidates: IncidentCandidate[];
}

export interface IncidentAuditRow extends IncidentWithRelations {
  profiles: Pick<Profile, 'full_name'> | null;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      centers: { Row: Center; Insert: Partial<Center>; Update: Partial<Center>; Relationships: [] };
      exams: { Row: Exam; Insert: Partial<Exam>; Update: Partial<Exam>; Relationships: [] };
      incident_codes: {
        Row: IncidentCode;
        Insert: Partial<IncidentCode>;
        Update: Partial<IncidentCode>;
        Relationships: [];
      };
      incidents: {
        Row: Incident;
        Insert: Partial<Incident> & { center_id: string; reporting_invigilator_id: string };
        Update: Partial<Incident>;
        Relationships: [
          {
            foreignKeyName: 'incidents_center_id_fkey';
            columns: ['center_id'];
            isOneToOne: false;
            referencedRelation: 'centers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'incidents_exam_id_fkey';
            columns: ['exam_id'];
            isOneToOne: false;
            referencedRelation: 'exams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'incidents_code_fkey';
            columns: ['code'];
            isOneToOne: false;
            referencedRelation: 'incident_codes';
            referencedColumns: ['code'];
          },
        ];
      };
      incident_candidates: {
        Row: IncidentCandidate;
        Insert: Partial<IncidentCandidate> & { incident_id: string; student_name: string };
        Update: Partial<IncidentCandidate>;
        Relationships: [
          {
            foreignKeyName: 'incident_candidates_incident_id_fkey';
            columns: ['incident_id'];
            isOneToOne: false;
            referencedRelation: 'incidents';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
