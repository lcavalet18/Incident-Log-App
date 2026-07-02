-- 0007_canonical_incident_codes.sql
-- Makes incident_codes match the Alsama design mockup's issueMap exactly —
-- same categories, same issue labels, same codes. The category -> issue
-- dropdown reads straight from this table, so this is the single source
-- of truth for what shows up there and what code gets stored on submit.
--
-- Several 3-letter codes are reused from the old seed set for a different
-- category/label (e.g. SAN was "Sanitation/toilet issue" under Facilities,
-- now it's "Missing stationery" under Materials & Stationery) — the
-- upsert below overwrites label/category/is_malpractice for every code in
-- the canonical set. Old codes that no longer appear in the mockup are
-- soft-deactivated (is_active = false) rather than deleted, since past
-- incidents may still reference them via incidents.code.
-- Idempotent: safe to re-run.

insert into public.incident_codes (code, label, category, is_malpractice, is_active) values
  ('SAN', 'Missing stationery', 'Materials & Stationery', false, true),
  ('PAP', 'Insufficient exam papers', 'Materials & Stationery', false, true),
  ('CAL', 'Faulty calculator', 'Materials & Stationery', false, true),
  ('BKL', 'Damaged answer booklet', 'Materials & Stationery', false, true),

  ('POW', 'Power outage', 'Facilities & Environment', false, true),
  ('TOI', 'Non-functioning toilet', 'Facilities & Environment', false, true),
  ('VEN', 'Ventilation / extreme heat', 'Facilities & Environment', false, true),
  ('LGT', 'Poor lighting', 'Facilities & Environment', false, true),
  ('NOI', 'Excessive noise', 'Facilities & Environment', false, true),

  ('SYS', 'Computer / device crash', 'Technology', false, true),
  ('NET', 'Network / internet failure', 'Technology', false, true),
  ('PRJ', 'Projector malfunction', 'Technology', false, true),
  ('AUD', 'Audio equipment failure', 'Technology', false, true),

  ('ILL', 'Student illness', 'Health & Safety', false, true),
  ('INJ', 'Injury', 'Health & Safety', false, true),
  ('FIR', 'Fire alarm / evacuation', 'Health & Safety', false, true),
  ('MED', 'Medical emergency', 'Health & Safety', false, true),

  ('LAT', 'Late arrival', 'Candidate Logistics', false, true),
  ('MIS', 'Missing candidate', 'Candidate Logistics', false, true),
  ('SEA', 'Seating error', 'Candidate Logistics', false, true),
  ('WRP', 'Wrong paper distributed', 'Candidate Logistics', false, true),

  ('XTM', 'Extra time not applied', 'Accessibility & Accommodations', false, true),
  ('RDR', 'Missing reader / scribe', 'Accessibility & Accommodations', false, true),
  ('AST', 'Assistive tech unavailable', 'Accessibility & Accommodations', false, true),
  ('ACC', 'Room not accessible', 'Accessibility & Accommodations', false, true),

  ('STF', 'Invigilator shortage', 'Staffing & Procedure', false, true),
  ('LST', 'Late start', 'Staffing & Procedure', false, true),
  ('TIM', 'Incorrect timing', 'Staffing & Procedure', false, true),
  ('PRC', 'Procedure not followed', 'Staffing & Procedure', false, true),

  ('UNM', 'Unauthorized materials', 'Malpractice & Integrity', true, true),
  ('COM', 'Communication between candidates', 'Malpractice & Integrity', true, true),
  ('IMP', 'Impersonation', 'Malpractice & Integrity', true, true),
  ('PHN', 'Mobile phone use', 'Malpractice & Integrity', true, true),
  ('CPY', 'Copying / plagiarism', 'Malpractice & Integrity', true, true),

  ('OTH', 'Other (describe in action)', 'Other', false, true)
on conflict (code) do update set
  label = excluded.label,
  category = excluded.category,
  is_malpractice = excluded.is_malpractice,
  is_active = excluded.is_active;

-- Soft-deactivate every code that isn't part of the canonical set above.
update public.incident_codes
set is_active = false
where code not in (
  'SAN', 'PAP', 'CAL', 'BKL',
  'POW', 'TOI', 'VEN', 'LGT', 'NOI',
  'SYS', 'NET', 'PRJ', 'AUD',
  'ILL', 'INJ', 'FIR', 'MED',
  'LAT', 'MIS', 'SEA', 'WRP',
  'XTM', 'RDR', 'AST', 'ACC',
  'STF', 'LST', 'TIM', 'PRC',
  'UNM', 'COM', 'IMP', 'PHN', 'CPY',
  'OTH'
);
