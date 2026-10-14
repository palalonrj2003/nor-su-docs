# Balay NORSU — Product Requirements Document

Last updated: 2026-10-14

## 1. Overview

Balay NORSU is the dormitory application and management system for the Negros
Oriental State University (NORSU) BSC dormitory. Students apply for a bed
through a multi-step form (privacy consent, personal data, documents);
dormitory staff and supervisors review applications, consent forms, rooms, and
residents in an admin area.

The build follows the uploaded MVP specification (`PROJECT_SPEC.md`)
incrementally, one prompt at a time. Phase 2 features from the spec are
explicitly out of scope.

## 2. Tech stack

- TanStack Start v1 (React 19, SSR) with Vite 7; file-based routing in
  `src/routes/`.
- Tailwind CSS v4 via `src/styles.css` (native CSS `@import`, theme tokens).
- shadcn/ui component set in `src/components/ui/`.
- Lovable Cloud backend (Supabase): Postgres database, Auth (email/password
  with email verification), Storage.
- TanStack Query for data fetching; TanStack Router for routing.
- zod for form validation (`src/lib/application.ts`).
- Vitest for tests (`src/test/`).
- TypeScript throughout; path alias `@/` → `src/`.

## 3. Folder structure

```text
src/
  assets/            norsu-seal.png.asset.json (official seal asset pointer)
  components/        brand, auth-page, dorm-shell, empty-page, legal-page, ui/
  hooks/             use-mobile
  integrations/
    supabase/        generated clients, auth middleware/attacher, types (do not edit)
  lib/               access, application, identity, metadata, utils, error helpers
  routes/            TanStack file routes (see Routes)
  test/              vitest suites
  start.ts           server start: CSRF + error middleware, Supabase bearer attacher
  styles.css         design tokens (NORSU palette, Inter)
PROJECT_SPEC.md      uploaded MVP specification (source of truth)
roadmap.md           incremental task list
PRD.md               this file
```

## 4. Features and status

| Feature | Status |
|---|---|
| Branded sign-in / verified signup (email confirmation) | Done |
| Profiles + separate `user_roles` (student/admin/staff), `has_role()` | Done |
| Protected shells: student header, admin sidebar shell with role-filtered nav | Done |
| Role-based routing (student → `/my-application`, staff/admin → `/admin`) | Done |
| Empty MVP admin pages (dashboard, applications, consent review, rooms, residents, staff, settings) | Done (placeholders) |
| Privacy Notice and Terms pages (`/privacy`, `/terms`) | Done |
| Student application form (`/apply`): 7 steps, zod validation, file upload, review, submit | Done |
| Student "My application" page showing latest submission | Done |
| Password sign-in end-to-end verification | Blocked: needs an email-confirmed real account |
| Admin application review, consent review, rooms/residents management | Not started (Prompts 2–7) |

## 5. Database schema (Lovable Cloud / Postgres)

Enums: `app_role` (student, admin, staff), `application_status` (submitted,
under_review, approved, waitlisted, rejected), `consent_status` (pending,
received, verified, rejected), `document_type` (load_slip, school_id,
parental_consent).

Tables (all in `public`, RLS enabled):

- **profiles** — `id` (FK auth.users), `full_name`, `contact_number`,
  `created_at`. Policies: read own or admin; update own.
- **user_roles** — `id`, `user_id` (FK auth.users), `role`. Policies: read own
  or admin. Never written by clients.
- **application_periods** — `id`, `name`, `opens_at`, `closes_at`, `is_active`.
  Policy: signed-in users read.
- **applications** — full student application (personal, address, guardian,
  emergency contact, `preferred_building`, `status`, `consent_status`,
  privacy fields, review fields). Policies: read own or admin; insert own in
  an open period (`is_period_open`); update own or admin. Trigger
  `protect_application_fields()` guards protected columns.
- **application_documents** — `application_id` FK, `type`, `storage_path`,
  `file_name`. Policies: read own/admin; insert own with path prefixed by
  `auth.uid()`.

Functions/triggers: `handle_new_user()` (creates profile + student role on
signup), `has_role(user, role)` (security definer; executable by authenticated
and service_role only), `is_period_open(period_id)`, `protect_application_fields()`.

Storage: private bucket `application-documents` holds uploaded files under
`<user_id>/<application_id>/...`.

## 6. Routes

Public (SSR):

- `/` — welcome/sign-in landing.
- `/auth` — sign in / sign up (email + password, email verification).
- `/privacy`, `/terms` — legal pages.

Authenticated (`src/routes/_authenticated/`, `ssr: false`, gated by
`getIdentity()` in `_authenticated/route.tsx`):

- `/my-application` — student home; latest application status or CTA to apply.
- `/apply` — 7-step application form (students only; staff/admin redirected).
- `/admin` — dashboard (admin + staff).
- `/admin/applications`, `/admin/consent-review`, `/admin/staff`,
  `/admin/settings` — admin only.
- `/admin/rooms`, `/admin/residents` — admin + staff.

## 7. Key logic

- `src/lib/access.ts` — `homeForRoles()` and `canAccessAdminPage()`; staff can
  access only dashboard, rooms, residents.
- `src/lib/identity.ts` — `getIdentity()`: user + roles + display name.
- `src/lib/application.ts` — `PRIVACY_NOTICE_VERSION = '1.0'`, per-step zod
  schemas, `validateFile()` (PDF/JPG/PNG, ≤ 5 MB), `isPeriodOpen()`.
- `src/lib/metadata.ts` — `pageHead()` for per-route titles/descriptions.
- Apply flow (`src/routes/_authenticated/apply.tsx`): loads the open active
  period, blocks duplicates, validates per step, inserts the application, then
  uploads documents to storage and records rows in `application_documents`.
- Sign-out everywhere: cancel queries → clear cache → `signOut()` →
  replace-navigate to `/auth`.
- `src/start.ts` — CSRF middleware on server functions + Supabase bearer
  attacher; root route invalidates router/queries on SIGNED_IN/SIGNED_OUT/
  USER_UPDATED only.

## 8. Setup

- Lovable Cloud is enabled; env vars are managed (`VITE_SUPABASE_URL`,
  `VITE_SUPABASE_PUBLISHABLE_KEY`, server-only keys). No manual setup needed.
- Run tests: `bunx vitest run`.
- First supervisor: sign up, confirm email, then an admin role row must be
  added manually to `user_roles`.

## 9. Changelog (newest first)

- 2026-10-14 — Prompt 2: student application flow. Added `applications`,
  `application_periods`, `application_documents` tables with RLS, private
  `application-documents` storage bucket, 7-step `/apply` form with privacy
  consent, validation and document upload, `/privacy` and `/terms` pages, and
  an updated `/my-application` page showing the latest submission. Added
  `src/lib/application.ts` and `src/test/application.test.ts`.
- 2026-10-13 — Prompt 1: NORSU-branded design (seal, palette, Inter),
  email-verified signup/sign-in, `profiles` + `user_roles` with `has_role()`,
  protected student/admin shells, role-based navigation and empty MVP pages,
  access tests and signed-in role checks.

## 10. Known issues

- Password sign-in not yet verified end-to-end (test account email was never
  confirmed).
- First real supervisor must be granted the admin role manually after signup.
- Admin pages are placeholders; no review workflows yet.
- Document upload failure after application insert leaves an application
  without documents (user is told to retry from the application page, but no
  retry UI exists yet).

## 11. Next / possible changes

- Prompts 3–7 from `PROJECT_SPEC.md` (admin review, consent review,
  rooms/beds, residents, staff management) — awaiting the next prompt.
- Retry/add-documents UI on `/my-application`.
- Verify password sign-in with a confirmed account.

---
*Update the Changelog and Next sections after every change.*
