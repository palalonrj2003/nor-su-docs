# Balay NORSU: MVP Specification and Lovable Build Prompts

*Automated NORSU BSC Dormitory Monitoring and Management System*

This file has two parts:

1. **Part 1: MVP specification.** The source of truth for what we are building. Paste it into Lovable as project knowledge (or keep it in the repo as `PROJECT_SPEC.md`).
2. **Part 2: Lovable prompts.** One kickoff prompt, then follow-up prompts to paste one at a time, in order.

---

# Part 1: MVP Specification

## 1. Overview

**Balay NORSU** is a web app for the NORSU BSC university dormitory. It replaces paper applications with an online process and gives the dorm supervisor one place to manage applications, rooms, beds, and residents.

- The dorm currently houses 30+ students.
- Today, applications are on paper, and staff record in/out logs in a manual logbook (logbook digitizing is Phase 2).
- The app must be simple, mobile-friendly for students, and easy for non-technical staff.

**MVP goal:** a student can apply online and upload the required documents. The dorm supervisor can review, verify consent, and approve the application. Approved students can then be assigned to a bed.

## 2. Users and roles

| Role | Who | Access |
|---|---|---|
| `student` | Applicant or resident | Own application and documents only |
| `admin` | Dorm supervisor | Everything: review, approve, assign beds, manage rooms, manage staff accounts, manage the application period, view documents |
| `staff` | People who watch the dorm | View the resident masterlist and room/bed availability. **No access to uploaded documents or application details.** |

Roles must be stored in a **separate `user_roles` table** (never on the profile row) and checked with a security-definer function in RLS policies, to prevent privilege escalation.

## 3. MVP features

### 3.1 Student account
- Register and log in with email and password. Email verification is required.
- Student sees their own application and its status.

### 3.2 Online application form
Show the **privacy notice and terms** first. The applicant must tick a consent checkbox before the form opens. Store the timestamp and the version of the notice they accepted.

**Applicant details**
- Full name (first, middle, last), sex, birthdate
- Contact number, email
- Home address with municipality
- Student ID, college/program, year level
- Guardian/parent: full name, relationship, contact number, **email** (needed for the consent form)
- Emergency contact: name, relationship, contact number
- Preferred room type or building (optional)

**Documents (uploads)**
- **Load slip** (certificate of registration): required
- **School ID or valid ID:** optional
- **Notarized parental consent:** required (see 3.3)
- Not required: 2x2 photo or any other document
- Allowed file types: PDF, JPG, PNG. Maximum size: 5 MB.

### 3.3 Notarized parental consent (Option A: the student uploads)
1. The student submits the application. Application status is **Submitted** and consent status is **Pending**.
2. The system **emails the consent PDF to the parent's email** (via an edge function). The email explains that the form must be printed, signed, notarized by an attorney, and returned to the student by a deadline.
3. The parent gets it signed and notarized offline.
4. The student logs in and uploads a scan or clear photo of the notarized form. Consent status becomes **Received**.
5. The admin checks that the names match, the signature is present, the notary seal and date are present, and the file is readable.
6. The admin marks the consent **Verified**, or **Rejected** with a reason. If rejected, the student is notified and uploads a new copy.
7. An application can be **Approved only when consent is Verified.** Enforce this in the database or backend, not just in the UI.
8. At move-in, the admin marks "original consent form received" (a checkbox on the application).

### 3.4 Statuses

| Application status | Consent status |
|---|---|
| Submitted | Pending |
| Under Review | Received |
| Approved | Verified |
| Waitlisted | Rejected |
| Rejected | |

### 3.5 Notifications
- Email the student whenever the application status or consent status changes.
- Reminder email if consent has not been uploaded after 3 days (can be a scheduled function; may be deferred).

### 3.6 Admin review
- Applications list with status tabs (All, Submitted, Under Review, Approved, Waitlisted, Rejected) and counts.
- Filters: search by name or student ID, college, year level, consent status. Sorting.
- Application detail page: all submitted info, document viewer (via signed URLs), consent verification controls, approve / waitlist / reject with remarks.
- Consent Review page: a focused queue of applications whose consent is "Received".

### 3.7 Application period
- Admin sets open and close dates.
- The application form is available only during the open period. After it closes, show a "Applications are closed" message.
- Applications without verified consent by the end of the period are flagged **incomplete**.

### 3.8 Room and bed management
- Structure: building → floor → room → bed slot.
- Admin can add, edit, and deactivate buildings, rooms, and beds.
- Assign an approved applicant to a bed, and reassign or release a bed.
- Bed status: available, occupied, unavailable.
- Only approved applicants can be assigned. A bed holds one resident at a time.

### 3.9 Room availability dashboard
- Stat cards: total residents, pending applications, consent to verify, available beds.
- Charts: applications over time (line), bed occupancy per floor (bar).
- Recent applications list, alerts panel (for example "5 consent forms waiting for verification"), and bed occupancy percentage.
- Calendar showing today and the application period close date.

### 3.10 Resident masterlist
- All current residents with room and bed.
- Search by name or student ID. Filter by college, year level, building, room.

### 3.11 Staff account management
- Admin creates, edits, and deactivates staff accounts.

## 4. Data model (Supabase / Postgres)

- `profiles`: id (FK to auth.users), full_name, contact_number, created_at
- `user_roles`: id, user_id, role (`admin` | `staff` | `student`)
- `application_periods`: id, name, opens_at, closes_at, is_active
- `applications`: id, user_id, period_id, first_name, middle_name, last_name, sex, birthdate, contact_number, email, home_address, municipality, student_id, college_program, year_level, guardian_name, guardian_relationship, guardian_contact, guardian_email, emergency_name, emergency_relationship, emergency_contact, preferred_building, status, consent_status, consent_rejection_reason, original_consent_received (bool), admin_remarks, privacy_notice_version, privacy_accepted_at, submitted_at, reviewed_by, reviewed_at
- `application_documents`: id, application_id, type (`load_slip` | `school_id` | `parental_consent`), storage_path, file_name, uploaded_at
- `buildings`: id, name, is_active
- `rooms`: id, building_id, floor, room_number, capacity, is_active
- `beds`: id, room_id, bed_label, status
- `bed_assignments`: id, bed_id, application_id, user_id, assigned_at, released_at
- `audit_logs`: id, actor_id, action, entity_type, entity_id, metadata, created_at

**Storage:** one **private** bucket `application-documents`. No public URLs, only signed URLs for admins. Students can upload and read only their own files.

## 5. Security and Data Privacy Act compliance

The app handles personal data of students (some may be minors) and guardians, so it must follow the Data Privacy Act of 2012 (Philippines). This needs review by NORSU's Data Protection Officer.

- **Privacy notice and terms and conditions** shown before collecting any data: what is collected, why, who can see it, how long it is kept, and the applicant's rights (access, correction, deletion).
- **Consent checkbox** with the accepted version and timestamp stored.
- **Row Level Security on every table.** Students see only their own rows. Staff cannot read `applications` details or `application_documents`. Admin has full access.
- **Private storage and signed URLs** for documents. HTTPS only.
- **Audit log** for viewing a document, changing a status, verifying consent, and assigning a bed.
- **Data minimization:** collect only the fields listed above.
- **Retention rule:** documents of rejected or incomplete applications are deleted after a set period (configurable, to be decided with the DPO).
- Never log or expose personal data in client-side console output.

## 6. Design system

Match the Figma mockups: https://www.figma.com/design/nGxQR3efXnI1eaUpdXARq8

**Brand colors (the university's):** azure blue and lily white.

| Token | Hex | Use |
|---|---|---|
| azure | `#007FFF` | Primary buttons, active nav, links, header accents |
| azure tint | `#E8F2FF` | Info banners, alert rows, hover |
| azure soft | `#BFDDFF` | Secondary chart series, borders on tinted cards |
| lily white | `#F7F8F3` | Page background |
| white | `#FFFFFF` | Cards, sidebar |
| ink | `#10294A` | Body text and headings |
| muted | `#6A7A90` | Secondary text |
| line | `#E4EAF1` | Borders and dividers |
| success | `#15803D` on `#DCFCE7` | Approved, Verified |
| warning | `#B45309` on `#FEF3C7` | Pending, Waitlisted |
| danger | `#DC2626` on `#FEE2E2` | Rejected, Missing |

- **Font:** Inter.
- **Style:** clean, rounded cards (12–16px radius), subtle shadows, generous spacing.
- **Admin and staff layout:** left sidebar (Dashboard, Applications, Consent Review, Rooms & Beds, Residents, Staff, Settings), top bar with search, notifications, and avatar, content area on lily white.
- **Student layout:** mobile-first, simple top header with the logo, single-column forms, a progress indicator on the multi-step application.
- **Status badges:** pill-shaped, using the success/warning/danger colors above, not blue alone.
- **Logo:** the official NORSU seal goes in the sidebar and in the student header. Use a placeholder until `public/norsu-seal.png` is added.

## 7. Out of scope for the MVP (do NOT build yet)

**Phase 2: monitoring**
- Attendance, curfew, and in/out logs (facial recognition or manual guard entry). Facial recognition is biometric data and needs explicit consent and a privacy impact assessment first.
- AI chatbot agent for residents
- Visitor log
- Violation and incident records
- Announcements board

**Phase 2: management**
- Monthly billing and payments
- Maintenance requests
- Room inspection checklist
- End-of-semester clearance

**Later**
- Reports and analytics, roommate matching, printable forms, renewal applications

## 8. Open questions

- Are there separate male and female buildings, and should bed assignment enforce that?
- How long should rejected or incomplete applications be kept before deletion?
- Which email provider will send system emails (for example Resend)?
- Who will be the data protection contact for the system?

---

# Part 2: Lovable Prompts

**How to use:** paste **Prompt 1** first. Wait for it to finish and test it. Then paste Prompts 2 to 7 one at a time, in order. Small steps work better than one huge prompt.

**Before you start:** connect Supabase to the Lovable project (for auth, database, and storage). For emails you will also need an email provider key (for example Resend) added as a secret later.

---

## Prompt 1: Kickoff (project, design, auth, roles)

```
Build a web app called "Balay NORSU": the dormitory management system for the Negros Oriental State University (NORSU) BSC campus dormitory. It replaces paper applications with an online process and lets the dorm supervisor manage applications, rooms, beds, and residents. The dorm houses about 30+ students.

TECH: React + TypeScript + Tailwind + shadcn/ui, Supabase for auth, Postgres, and private file storage. Use React Router.

USERS AND ROLES
- student: applies online and tracks their own application
- admin (the dorm supervisor): full access
- staff: limited access (can view the resident masterlist and room/bed availability, but can NOT see application details or uploaded documents)
Store roles in a separate user_roles table (never on the profile table) and check them with a security-definer function (has_role) inside RLS policies. Enable Row Level Security on every table.

DESIGN
- Brand colors are the university's: azure blue #007FFF (primary) and lily white #F7F8F3 (page background). Cards are white. Text ink color #10294A, muted text #6A7A90, borders #E4EAF1.
- Status colors: success green #15803D on #DCFCE7, warning amber #B45309 on #FEF3C7, danger red #DC2626 on #FEE2E2. Never rely on blue alone for status.
- Font: Inter. Rounded cards (12–16px radius), subtle shadows, generous spacing, clean and professional.
- Admin/staff layout: white left sidebar (240px) with the logo "Balay NORSU / NORSU Dormitory" and nav items Dashboard, Applications, Consent Review, Rooms & Beds, Residents, Staff, Settings, plus the signed-in user and a Sign Out button at the bottom. Top bar with a search input, notification bell, and avatar. Active nav item is filled azure with white text.
- Student layout: mobile-first, simple header with the logo, single-column content.
- Put a placeholder logo for now; I will add the official NORSU seal at public/norsu-seal.png later.

FOR THIS FIRST STEP, BUILD ONLY:
1. The design tokens (Tailwind/CSS variables) above.
2. Auth: register and login with email and password (with email verification). New sign-ups get the "student" role by default. The first admin will be created manually in the database.
3. The profiles and user_roles tables with RLS and the has_role function.
4. Role-based routing: students go to /my-application, admin and staff go to /admin. Protect routes by role.
5. The admin/staff shell (sidebar + top bar) and the student shell, with empty placeholder pages for each route.

Do not build any feature beyond this yet. Do not build visitor logs, billing, maintenance, facial recognition, or a chatbot; those are later phases.
```

---

## Prompt 2: Privacy notice and the student application form

```
Now build the student application flow.

1. Create /privacy and /terms pages with a clear privacy notice and terms and conditions for Balay NORSU, written in plain English. Cover: what personal data is collected, why, who can see it (only the dorm supervisor), how long it is kept, how it is protected, and the applicant's rights under the Philippine Data Privacy Act of 2012 (access, correction, deletion, complaint). Add a version number to the notice (start with "1.0"). Mark it as a draft for review by NORSU's Data Protection Officer.

2. Create the database tables: application_periods, applications, application_documents (see fields below), with RLS so a student can only create, read, and update their OWN application, and cannot change status fields.
   applications fields: id, user_id, period_id, first_name, middle_name, last_name, sex, birthdate, contact_number, email, home_address, municipality, student_id, college_program, year_level, guardian_name, guardian_relationship, guardian_contact, guardian_email, emergency_name, emergency_relationship, emergency_contact, preferred_building (optional), status (submitted | under_review | approved | waitlisted | rejected, default submitted), consent_status (pending | received | verified | rejected, default pending), consent_rejection_reason, original_consent_received (boolean), admin_remarks, privacy_notice_version, privacy_accepted_at, submitted_at, reviewed_by, reviewed_at.
   application_documents fields: id, application_id, type (load_slip | school_id | parental_consent), storage_path, file_name, uploaded_at.

3. Build /apply as a multi-step form with a progress indicator:
   Step 0: privacy notice with a required consent checkbox ("I have read and agree to the Privacy Notice and Terms"). Save the accepted version and timestamp.
   Step 1: Personal details (name, sex, birthdate, contact number, email).
   Step 2: Address and school info (home address, municipality, student ID, college/program, year level).
   Step 3: Guardian and emergency contact (guardian name, relationship, contact number, guardian EMAIL, emergency contact).
   Step 4: Preferred room type or building (optional).
   Step 5: Upload documents: Load slip (required) and School ID (optional). No 2x2 photo. Accept PDF, JPG, PNG up to 5 MB.
   Step 6: Review and submit.
   Validate every field. The form is only available while an active application period is open; otherwise show an "Applications are closed" page.

4. Create a PRIVATE Supabase storage bucket called "application-documents". No public URLs. Students may upload and read only files in their own folder.

Use the azure/lily white design. Keep it mobile-friendly.
```

---

## Prompt 3: Student status page and notarized parental consent

```
Build the student's /my-application page and the notarized parental consent flow (Option A: the student uploads the signed copy).

1. /my-application shows the student's application summary and two status badges: Application status (Submitted, Under Review, Approved, Waitlisted, Rejected) and Consent status (Pending, Received, Verified, Rejected). Use a clear step tracker. Show admin remarks and any consent rejection reason.

2. Consent flow:
   - When an application is submitted, a Supabase Edge Function emails the parent/guardian (guardian_email) a downloadable consent form PDF. The email explains the form must be printed, signed, NOTARIZED by an attorney, and returned to the student. Store a template consent form PDF in a private storage bucket and attach it. Use Resend for sending (I will add the API key as a secret).
   - On /my-application, show an "Upload notarized consent form" card (PDF, JPG, or PNG, max 5 MB). After upload, set consent_status to "received".
   - If the admin rejects the consent, show the reason and let the student upload a new copy.
   - Enforce in the database (trigger or check) that an application cannot be set to "approved" unless consent_status is "verified".

3. Send an email to the student whenever application_status or consent_status changes (Edge Function).

Keep the design consistent with the azure blue and lily white system.
```

---

## Prompt 4: Admin dashboard and applications

```
Build the admin side for applications. Only the admin role can access application details and documents; staff cannot.

1. /admin Dashboard: four stat cards (Total Residents, Pending Applications, Consent to Verify, Available Beds), a line chart of applications over time (Submitted vs Approved), a bar chart of bed occupancy per floor (Occupied vs Available), a Recent Applications list with status badges, an Alerts & Notifications panel (for example "5 consent forms waiting for verification"), a bed occupancy percentage card, a calendar showing today and the application close date, and an upcoming tasks panel. Use Recharts. Layout: main content plus a 320px right column.

2. /admin/applications: a page with an "Application period is open" banner (dates, days left, Manage Period button), status tabs with counts (All, Submitted, Under Review, Approved, Waitlisted, Rejected), a search box (name or student ID), filters (college, year level, consent status), sorting, and a table with columns: Applicant (avatar initials + name + student ID), Program, Year, Submitted date, Load slip (Uploaded / Missing), Consent badge, Status badge, and a "Review" button. Add pagination and an Export List button (CSV).

3. /admin/applications/:id: the review page. Show all submitted info, a document viewer for the load slip, school ID, and notarized consent (use short-lived signed URLs), and controls to Verify or Reject consent (reject requires a reason), plus Approve, Waitlist, or Reject the application with remarks. Disable Approve until consent is verified. Add an "Original consent form received" checkbox.

4. /admin/consent-review: a focused queue of applications whose consent_status is "received".

5. Write an audit_logs entry whenever an admin views a document, changes a status, or verifies consent.
```

---

## Prompt 5: Rooms, beds, and assignments

```
Build room and bed management for admin (staff can view availability but not edit).

1. Tables: buildings, rooms (building_id, floor, room_number, capacity, is_active), beds (room_id, bed_label, status: available | occupied | unavailable), bed_assignments (bed_id, application_id, user_id, assigned_at, released_at). RLS: admin full access, staff read-only on buildings, rooms, beds.

2. /admin/rooms: manage buildings, floors, rooms, and beds. Admin can add, edit, and deactivate. Show an availability overview (total beds, occupied, available) per building and floor, and a room view showing who is in each bed.

3. Assign an approved applicant to an available bed (only approved applicants are eligible, one resident per bed). Allow reassigning and releasing a bed. Occupancy numbers on the dashboard must come from this data.

Optional: add a gender_restriction field on buildings (male, female, any) and warn if an assignment would violate it. Make this easy to switch off.
```

---

## Prompt 6: Residents, staff, and settings

```
Build the remaining MVP admin pages.

1. /admin/residents: the resident masterlist (all current residents with room and bed). Search by name or student ID, and filter by college, year level, building, and room. Staff can view this list but must NOT see documents or application details beyond name, student ID, program, year level, and room/bed.

2. /admin/staff: admin can create, edit, and deactivate staff accounts (assign the "staff" role). Include a role-permissions summary.

3. /admin/settings: manage the application period (name, open date, close date, active toggle). The application form must open and close automatically based on these dates. Applications without verified consent after the period closes are flagged "incomplete" in the admin list.

Keep the consistent azure blue and lily white design.
```

---

## Prompt 7: Security, privacy, and polish

```
Do a security and polish pass.

1. Review every table and storage policy. Confirm RLS is enabled everywhere, students can only access their own data, staff cannot read applications or documents, and only admin can view documents via signed URLs. Fix anything that is too permissive.
2. Make sure the has_role function is security definer and roles can't be changed by non-admins.
3. Add a data-retention setting (default: delete documents of rejected or incomplete applications after a configurable number of days) as a scheduled Edge Function. Log deletions in audit_logs.
4. Add a simple audit log viewer for admin.
5. Add loading states, empty states, error messages, and form validation messages everywhere. Make all student pages fully responsive on mobile and admin pages usable on tablet.
6. Check accessibility: color contrast, focus states, and labels on all inputs.
7. Replace the placeholder logo with public/norsu-seal.png if it exists.

Do not add any Phase 2 features.
```

---

## Tips for vibe coding this in Lovable

- **One prompt at a time.** Test after each step before moving on.
- **Create the first admin manually.** After you sign up, open the Supabase table editor and add a row in `user_roles` for your user with role `admin`.
- **Use real test accounts:** one admin, one staff, one student, to check that each role sees only what it should.
- **Connect Resend** (or another email provider) before testing Prompt 3 emails.
- **Add the NORSU seal** to `public/norsu-seal.png` and ask Lovable to use it in the sidebar and student header. Check NORSU's rules on using the seal.
- **Have NORSU's Data Protection Officer review** the privacy notice and terms before going live.
- If Lovable drifts from the design, paste the Figma link or a screenshot and say "match this layout exactly, only change the content."
