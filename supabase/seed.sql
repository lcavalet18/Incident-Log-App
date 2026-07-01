-- seed.sql
-- Reference data: exams, incident codes, and one test center.
-- Safe to re-run (idempotent via ON CONFLICT).

-- ---------------------------------------------------------------------------
-- exams
-- ---------------------------------------------------------------------------
insert into public.exams (name, total_questions, language) values
  ('Applicable Math', 40, 'en'),
  ('English as a Second Language', 40, 'en'),
  ('Arabic as a First Language', 40, 'ar'),
  ('Scientific Thinking', 40, 'en'),
  ('Life Success Skills', 40, 'en')
on conflict (name) do nothing;

-- ---------------------------------------------------------------------------
-- incident_codes
-- ---------------------------------------------------------------------------
insert into public.incident_codes (code, label, category, is_malpractice) values
  -- Materials & Stationery
  ('MCL', 'Missing calculator', 'Materials & Stationery', false),
  ('BCL', 'Broken/malfunctioning calculator', 'Materials & Stationery', false),
  ('MST', 'Missing stationery', 'Materials & Stationery', false),
  ('MQP', 'Question paper missing pages', 'Materials & Stationery', false),
  ('DQP', 'Question paper damaged/illegible', 'Materials & Stationery', false),
  ('WQP', 'Wrong question paper distributed', 'Materials & Stationery', false),
  ('MAS', 'Answer booklet missing pages', 'Materials & Stationery', false),
  ('DAS', 'Answer booklet damaged/illegible', 'Materials & Stationery', false),
  ('INS', 'Insufficient answer sheets', 'Materials & Stationery', false),
  ('MTL', 'General material shortage', 'Materials & Stationery', false),

  -- Facilities & Environment
  ('POW', 'Power outage', 'Facilities & Environment', false),
  ('LGT', 'Lighting failure', 'Facilities & Environment', false),
  ('VEN', 'Ventilation failure/extreme heat', 'Facilities & Environment', false),
  ('WEA', 'Weather disruption', 'Facilities & Environment', false),
  ('NSE', 'Noise/external disruption', 'Facilities & Environment', false),
  ('FUR', 'Furniture issue', 'Facilities & Environment', false),
  ('SAN', 'Sanitation/toilet issue', 'Facilities & Environment', false),
  ('WTR', 'Water shortage', 'Facilities & Environment', false),
  ('OVC', 'Overcrowded room', 'Facilities & Environment', false),
  ('SEA', 'Seating arrangement error', 'Facilities & Environment', false),

  -- Technology
  ('NET', 'Internet/WiFi failure', 'Technology', false),
  ('DEV', 'Computer/tablet/device failure', 'Technology', false),
  ('AUD', 'Audio equipment failure', 'Technology', false),
  ('SPK', 'Speaker/sound system failure', 'Technology', false),
  ('SYS', 'Exam platform/software error', 'Technology', false),

  -- Health & Safety
  ('MED', 'Medical emergency/illness', 'Health & Safety', false),
  ('INJ', 'Injury during exam', 'Health & Safety', false),
  ('FIR', 'Fire/fire alarm', 'Health & Safety', false),
  ('EVA', 'Evacuation required', 'Health & Safety', false),
  ('SEC', 'Security threat/incident', 'Health & Safety', false),

  -- Candidate Logistics
  ('LAT', 'Late arrival', 'Candidate Logistics', false),
  ('ABW', 'Absence/withdrawal mid-exam', 'Candidate Logistics', false),
  ('TRD', 'Transportation delay', 'Candidate Logistics', false),
  ('IDM', 'Missing/invalid candidate ID', 'Candidate Logistics', false),
  ('REG', 'Registration discrepancy', 'Candidate Logistics', false),

  -- Accessibility & Accommodations
  ('ACC', 'Accommodation not provided', 'Accessibility & Accommodations', false),
  ('SCR', 'Scribe/reader unavailable', 'Accessibility & Accommodations', false),
  ('EXT', 'Extra time not provided/miscalculated', 'Accessibility & Accommodations', false),
  ('LNG', 'Language clarification/translation issue', 'Accessibility & Accommodations', false),

  -- Staffing & Procedure
  ('INV', 'Invigilator shortage/absence', 'Staffing & Procedure', false),
  ('PRC', 'Invigilator procedural error', 'Staffing & Procedure', false),
  ('SCH', 'Scheduling conflict/error', 'Staffing & Procedure', false),

  -- Malpractice & Integrity
  ('CPY', 'Copying/cheating', 'Malpractice & Integrity', true),
  ('COM', 'Unauthorized communication', 'Malpractice & Integrity', true),
  ('UMP', 'Possession of unauthorized material', 'Malpractice & Integrity', true),
  ('IMP', 'Impersonation', 'Malpractice & Integrity', true),
  ('COL', 'Collusion', 'Malpractice & Integrity', true),
  ('DIS', 'Disruptive/unruly behavior', 'Malpractice & Integrity', true),
  ('REF', 'Refusal to follow instructions', 'Malpractice & Integrity', true),
  ('LVP', 'Left room without permission', 'Malpractice & Integrity', true),
  ('TMP', 'Tampering with exam materials', 'Malpractice & Integrity', true),
  ('BRB', 'Attempted bribery', 'Malpractice & Integrity', true),
  ('UAS', 'Unauthorized assistance by staff', 'Malpractice & Integrity', true),
  ('PHO', 'Photographing/recording exam content', 'Malpractice & Integrity', true),
  ('LEK', 'Exam paper leak/security breach', 'Malpractice & Integrity', true),
  ('FRD', 'Fraudulent documentation', 'Malpractice & Integrity', true),

  -- Other
  ('OTH', 'Other', 'Other', false)
on conflict (code) do update set
  label = excluded.label,
  category = excluded.category,
  is_malpractice = excluded.is_malpractice;

-- ---------------------------------------------------------------------------
-- centers (at least one test center)
-- ---------------------------------------------------------------------------
insert into public.centers (name, location) values
  ('Kakuma Refugee Camp Center 1', 'Kakuma, Turkana County, Kenya')
on conflict (name) do nothing;
