/**
 * Seeds exams, incident codes, and a test center via the Supabase service
 * role key. Alternative to running supabase/seed.sql directly in the SQL
 * editor -- useful for CI or repeatable local resets.
 *
 * Usage: npm run seed
 */
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const exams = [
  { name: 'Applicable Math', total_questions: 40, language: 'en' },
  { name: 'English as a Second Language', total_questions: 40, language: 'en' },
  { name: 'Arabic as a First Language', total_questions: 40, language: 'ar' },
  { name: 'Scientific Thinking', total_questions: 40, language: 'en' },
  { name: 'Life Success Skills', total_questions: 40, language: 'en' },
];

const incidentCodes = [
  ['MCL', 'Missing calculator', 'Materials & Stationery', false],
  ['BCL', 'Broken/malfunctioning calculator', 'Materials & Stationery', false],
  ['MST', 'Missing stationery', 'Materials & Stationery', false],
  ['MQP', 'Question paper missing pages', 'Materials & Stationery', false],
  ['DQP', 'Question paper damaged/illegible', 'Materials & Stationery', false],
  ['WQP', 'Wrong question paper distributed', 'Materials & Stationery', false],
  ['MAS', 'Answer booklet missing pages', 'Materials & Stationery', false],
  ['DAS', 'Answer booklet damaged/illegible', 'Materials & Stationery', false],
  ['INS', 'Insufficient answer sheets', 'Materials & Stationery', false],
  ['MTL', 'General material shortage', 'Materials & Stationery', false],
  ['POW', 'Power outage', 'Facilities & Environment', false],
  ['LGT', 'Lighting failure', 'Facilities & Environment', false],
  ['VEN', 'Ventilation failure/extreme heat', 'Facilities & Environment', false],
  ['WEA', 'Weather disruption', 'Facilities & Environment', false],
  ['NSE', 'Noise/external disruption', 'Facilities & Environment', false],
  ['FUR', 'Furniture issue', 'Facilities & Environment', false],
  ['SAN', 'Sanitation/toilet issue', 'Facilities & Environment', false],
  ['WTR', 'Water shortage', 'Facilities & Environment', false],
  ['OVC', 'Overcrowded room', 'Facilities & Environment', false],
  ['SEA', 'Seating arrangement error', 'Facilities & Environment', false],
  ['NET', 'Internet/WiFi failure', 'Technology', false],
  ['DEV', 'Computer/tablet/device failure', 'Technology', false],
  ['AUD', 'Audio equipment failure', 'Technology', false],
  ['SPK', 'Speaker/sound system failure', 'Technology', false],
  ['SYS', 'Exam platform/software error', 'Technology', false],
  ['MED', 'Medical emergency/illness', 'Health & Safety', false],
  ['INJ', 'Injury during exam', 'Health & Safety', false],
  ['FIR', 'Fire/fire alarm', 'Health & Safety', false],
  ['EVA', 'Evacuation required', 'Health & Safety', false],
  ['SEC', 'Security threat/incident', 'Health & Safety', false],
  ['LAT', 'Late arrival', 'Candidate Logistics', false],
  ['ABW', 'Absence/withdrawal mid-exam', 'Candidate Logistics', false],
  ['TRD', 'Transportation delay', 'Candidate Logistics', false],
  ['IDM', 'Missing/invalid candidate ID', 'Candidate Logistics', false],
  ['REG', 'Registration discrepancy', 'Candidate Logistics', false],
  ['ACC', 'Accommodation not provided', 'Accessibility & Accommodations', false],
  ['SCR', 'Scribe/reader unavailable', 'Accessibility & Accommodations', false],
  ['EXT', 'Extra time not provided/miscalculated', 'Accessibility & Accommodations', false],
  ['LNG', 'Language clarification/translation issue', 'Accessibility & Accommodations', false],
  ['INV', 'Invigilator shortage/absence', 'Staffing & Procedure', false],
  ['PRC', 'Invigilator procedural error', 'Staffing & Procedure', false],
  ['SCH', 'Scheduling conflict/error', 'Staffing & Procedure', false],
  ['CPY', 'Copying/cheating', 'Malpractice & Integrity', true],
  ['COM', 'Unauthorized communication', 'Malpractice & Integrity', true],
  ['UMP', 'Possession of unauthorized material', 'Malpractice & Integrity', true],
  ['IMP', 'Impersonation', 'Malpractice & Integrity', true],
  ['COL', 'Collusion', 'Malpractice & Integrity', true],
  ['DIS', 'Disruptive/unruly behavior', 'Malpractice & Integrity', true],
  ['REF', 'Refusal to follow instructions', 'Malpractice & Integrity', true],
  ['LVP', 'Left room without permission', 'Malpractice & Integrity', true],
  ['TMP', 'Tampering with exam materials', 'Malpractice & Integrity', true],
  ['BRB', 'Attempted bribery', 'Malpractice & Integrity', true],
  ['UAS', 'Unauthorized assistance by staff', 'Malpractice & Integrity', true],
  ['PHO', 'Photographing/recording exam content', 'Malpractice & Integrity', true],
  ['LEK', 'Exam paper leak/security breach', 'Malpractice & Integrity', true],
  ['FRD', 'Fraudulent documentation', 'Malpractice & Integrity', true],
  ['OTH', 'Other', 'Other', false],
].map(([code, label, category, is_malpractice]) => ({ code, label, category, is_malpractice }));

const centers = [{ name: 'Kakuma Refugee Camp Center 1', location: 'Kakuma, Turkana County, Kenya' }];

async function main() {
  console.log('Seeding exams...');
  const { error: examsError } = await supabase.from('exams').upsert(exams, { onConflict: 'name' });
  if (examsError) throw examsError;

  console.log('Seeding incident codes...');
  const { error: codesError } = await supabase.from('incident_codes').upsert(incidentCodes, { onConflict: 'code' });
  if (codesError) throw codesError;

  console.log('Seeding centers...');
  const { error: centersError } = await supabase.from('centers').upsert(centers, { onConflict: 'name' });
  if (centersError) throw centersError;

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
