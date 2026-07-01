# G12++ Exam Incident Log

A mobile-first, offline-capable web app for logging technical issues and malpractice incidents during G12++ exam sittings. Built for invigilators and center supervisors working in low-connectivity contexts, with full English/Arabic (RTL) support.

## Tech stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS**
- **Supabase** (Postgres + Auth + Storage, with Row Level Security)
- **Dexie.js** (IndexedDB) for offline queueing, synced automatically when connectivity returns
- **next-intl** for English/Arabic i18n with RTL layout switching
- A hand-rolled service worker (`public/sw.js`) for PWA installability and offline page caching
- Deployed on **Vercel**

## Project structure

```
supabase/
  migrations/          -- SQL migrations (schema, RLS policies, storage bucket)
  seed.sql             -- reference data (exams, incident codes, test center)
src/
  app/[locale]/        -- routes, one locale segment ("en" | "ar") wraps everything
    login/             -- sign-in page
    incidents/         -- invigilator "my reports" list, new/edit incident form
    dashboard/          -- supervisor/admin incident table + detail view
    admin/codes/        -- incident code list management
  components/          -- UI components (form, dashboard, shared chrome)
  lib/
    supabase/          -- browser/server Supabase clients + middleware session refresh
    offline/           -- Dexie schema + sync queue processor
    incidents/         -- form/filter helper functions
  i18n/                -- next-intl config + navigation helpers
  types/database.ts    -- hand-written types matching the SQL schema
messages/en.json, ar.json  -- UI translations
scripts/seed.ts        -- optional seed script using the service role key
public/
  manifest.json, sw.js, offline.html, icons/  -- PWA assets
```

## Environment variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase project's values (Project Settings → API):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Only needed locally to run `npm run seed`. Never expose this in client code.
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

On Vercel, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as project environment variables. `SUPABASE_SERVICE_ROLE_KEY` is not needed in production — it's only used by the local seed script.

## Setting up Supabase

1. Create a new Supabase project.
2. In the SQL editor, run the migrations in order from `supabase/migrations/`:
   1. `0001_init_schema.sql` — profiles, centers, exams, incident_codes
   2. `0002_incidents.sql` — incidents + incident_candidates, auto reference/duration triggers
   3. `0003_rls_policies.sql` — Row Level Security policies
   4. `0004_storage.sql` — evidence attachment storage bucket + policies
3. Run `supabase/seed.sql` to load the 5 exams, ~57 incident codes, and one test center. (Alternatively, `npm run seed` does the same via the service role key — handy if you want to re-seed from CI.)
4. In **Authentication → Providers**, email/password should already be enabled. For a low-connectivity pilot, consider disabling "Confirm email" under **Authentication → Settings** so invigilator accounts can be created and used immediately without a confirmation round-trip.
5. Create your first users under **Authentication → Users**. Every new user automatically gets a `profiles` row with `role = 'invigilator'` (see the `handle_new_user` trigger). To promote someone to supervisor/admin, run:
   ```sql
   update public.profiles set role = 'admin' where id = '<user-uuid>';
   ```
   Roles are `invigilator`, `supervisor`, or `admin` — supervisor and admin have identical elevated permissions (see the RLS policies).

## Running locally

```bash
npm install
cp .env.local.example .env.local   # then fill in your Supabase values
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/en/login` (or `/ar/login`).

Other scripts:

- `npm run build` / `npm run start` — production build/serve
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript, no emit
- `npm run seed` — seed exams/codes/centers via the service role key

## Roles & permissions

| Role | Can do |
|---|---|
| **Invigilator** | Create incident reports; view/edit their own **drafts**; view (read-only) their own submitted reports |
| **Supervisor** / **Admin** | View all incidents across all centers; filter/export; change status (Submitted → Reviewed → Closed) and add supervisor notes; manage the incident code list |

All of this is enforced at the database level via Postgres Row Level Security (see `supabase/migrations/0003_rls_policies.sql`), not just in the UI — a signed-in invigilator's Supabase client literally cannot read another invigilator's draft or another center's data.

## Offline behavior

The incident form is offline-first by design:

- Submitting (draft or final) always writes first to an IndexedDB queue (via Dexie), tagged with a locally-generated `client_generated_id`.
- If the browser is online, the queue is flushed to Supabase immediately (insert incident → upload attachment → insert candidate rows), using `client_generated_id` as an upsert key so a retried sync never creates a duplicate.
- If offline, the report stays queued and a **pending sync** badge (in the top bar and on the "My reports" list) shows the count. Sync retries automatically on the browser's `online` event, or can be triggered manually by tapping the badge.
- The service worker (`public/sw.js`) caches the app shell and static assets so a previously-visited page (e.g., the incident form) can still be reopened while offline. A fresh page that was never visited online will fall back to a static "you're offline" screen — this is an inherent limit of server-rendered pages without a local server, not something a service worker can fully paper over.

## Known tradeoffs / follow-ups

- The app is pinned to **Next.js 14.2.35** as requested. A handful of Next.js advisories (mostly self-hosted DoS/edge-case issues, see `npm audit`) are only fixed in Next 15/16; since Vercel's managed platform mitigates most of the self-hosted-specific vectors, this was judged an acceptable tradeoff to stay on Next 14 rather than a breaking major upgrade. Revisit if self-hosting.
- Incident code labels are English-only in the seed data; the UI chrome (labels, statuses, categories) is fully bilingual, but translating all ~57 code labels into Arabic was left out of scope — add an `ar` label column to `incident_codes` if needed later.
- PWA icons are SVG for simplicity; add PNG fallbacks (`icons/icon-192.png`, `icon-512.png`) if you need broader home-screen icon support on older Android/iOS versions.
