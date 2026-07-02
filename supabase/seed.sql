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
  ('SAN', 'Missing stationery', 'Materials & Stationery', false),
  ('PAP', 'Insufficient exam papers', 'Materials & Stationery', false),
  ('CAL', 'Faulty calculator', 'Materials & Stationery', false),
  ('BKL', 'Damaged answer booklet', 'Materials & Stationery', false),

  -- Facilities & Environment
  ('POW', 'Power outage', 'Facilities & Environment', false),
  ('TOI', 'Non-functioning toilet', 'Facilities & Environment', false),
  ('VEN', 'Ventilation / extreme heat', 'Facilities & Environment', false),
  ('LGT', 'Poor lighting', 'Facilities & Environment', false),
  ('NOI', 'Excessive noise', 'Facilities & Environment', false),

  -- Technology
  ('SYS', 'Computer / device crash', 'Technology', false),
  ('NET', 'Network / internet failure', 'Technology', false),
  ('PRJ', 'Projector malfunction', 'Technology', false),
  ('AUD', 'Audio equipment failure', 'Technology', false),

  -- Health & Safety
  ('ILL', 'Student illness', 'Health & Safety', false),
  ('INJ', 'Injury', 'Health & Safety', false),
  ('FIR', 'Fire alarm / evacuation', 'Health & Safety', false),
  ('MED', 'Medical emergency', 'Health & Safety', false),

  -- Candidate Logistics
  ('LAT', 'Late arrival', 'Candidate Logistics', false),
  ('MIS', 'Missing candidate', 'Candidate Logistics', false),
  ('SEA', 'Seating error', 'Candidate Logistics', false),
  ('WRP', 'Wrong paper distributed', 'Candidate Logistics', false),

  -- Accessibility & Accommodations
  ('XTM', 'Extra time not applied', 'Accessibility & Accommodations', false),
  ('RDR', 'Missing reader / scribe', 'Accessibility & Accommodations', false),
  ('AST', 'Assistive tech unavailable', 'Accessibility & Accommodations', false),
  ('ACC', 'Room not accessible', 'Accessibility & Accommodations', false),

  -- Staffing & Procedure
  ('STF', 'Invigilator shortage', 'Staffing & Procedure', false),
  ('LST', 'Late start', 'Staffing & Procedure', false),
  ('TIM', 'Incorrect timing', 'Staffing & Procedure', false),
  ('PRC', 'Procedure not followed', 'Staffing & Procedure', false),

  -- Malpractice & Integrity
  ('UNM', 'Unauthorized materials', 'Malpractice & Integrity', true),
  ('COM', 'Communication between candidates', 'Malpractice & Integrity', true),
  ('IMP', 'Impersonation', 'Malpractice & Integrity', true),
  ('PHN', 'Mobile phone use', 'Malpractice & Integrity', true),
  ('CPY', 'Copying / plagiarism', 'Malpractice & Integrity', true),

  -- Other
  ('OTH', 'Other (describe in action)', 'Other', false)
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
