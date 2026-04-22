Sprint Plans — Placement Portal

Overview
- Timeline: 3 sprints (one sprint per week). Each sprint includes frontend, backend, database tasks, acceptance criteria, and tests mapped to project validations.

Sprint 1 — Student Coordinator Dashboard (Week 1)
- Goal: Deliver Coordinator Dashboard UI + backend APIs + DB support to manage placement drives and materials, and basic student status management.

Backlog (high level stories)
1. Coordinator Authentication
  - Frontend: Coordinator login page and form (username/password), store auth state in localStorage (or keep simple as current repo).
  - Backend: `/api/auth/coordinator/login` already exists; integrate UI with API.
  - DB: `student_coordinators` collection used by `CoordinatorAuth` model.
  - Acceptance: Coordinator can log in and see dashboard; invalid credentials show error.
  - Tests: login requires username & password; invalid creds return 401.

2. Drive Management (Create/Update/Delete)
  - Frontend: Drive form (company, minCgpa, deadline, degree, JD file upload), list of drives with edit/delete actions in `CoordinatorDashboard.jsx`.
  - Backend: `/api/drives` POST, PATCH, DELETE implemented in `placementDriveController` and `placementDriveRoutes`.
  - DB: `placement_drives` collection with fields `company,minCgpa,deadline,degree,jdUrl,applications`.
  - Acceptance: Create/Update/Delete operations reflect immediately in UI; file upload stores JD and returns URL.
  - Tests: required fields validated; degree must be one of enum values; uploaded JD produces `jdUrl`.

3. Material Hub (Upload/Delete)
  - Frontend: Material upload form (title + file) and list with delete action.
  - Backend: `/api/materials` POST and DELETE provided by `materialHubController`.
  - DB: `material_hub` collection stores title, fileUrl.
  - Acceptance: Materials uploaded appear in list with download link; delete removes item.
  - Tests: title required; file saved to `uploads/materials` and URL built.

4. Student Status Management
  - Frontend: coordinator can mark student `placed` or `blacklist` from student list UI.
  - Backend: `/api/students/:id/status` implemented by `studentController.updateStudentStatus`.
  - DB: updates `students.placed` and `students.blacklist` booleans.
  - Acceptance: status updates persist and affect application eligibility.
  - Tests: status update requires valid boolean; appropriate 404 for missing student.

Validation & Tests (Sprint 1)
- Required-field checks: drive and material creation must enforce required fields (backend unit tests or manual API tests).
- Degree enum validation: create/update drives must reject invalid degree values.
- File handling: JD and material file should be saved; `buildFileUrl` returns a valid URL.

Sprint 2 — Student Dashboard (Week 2)
- Goal: Deliver student registration, login, profile management, resume upload, viewing drives, and applying to drives.

Backlog (high level stories)
1. Student Registration
  - Frontend: `StudentRegister.jsx` form with password + confirm password, resume upload.
  - Backend: `/api/students/register` route implemented in `studentController.registerStudent`.
  - DB: `students` collection with required unique `email` and `regno`.
  - Acceptance: Student can register; duplicate email/regno returns 409; password stored hashed.
  - Tests: password confirmation mismatch prevented on client; server rejects missing required fields.

2. Student Login & Profile
  - Frontend: student login page and profile edit UI; resume display/download.
  - Backend: `/api/auth/student/login` and `/api/students/:id` patch implemented.
  - Acceptance: Student can log in and update profile; updates honor uniqueness checks for email/regno.
  - Tests: invalid login returns 401; updating to an email already used returns 409.

3. Drive Application
  - Frontend: student can view drives and apply; UI disables application when student `placed` or `blacklist` is true.
  - Backend: `/api/drives/:id/apply` implemented; controller enforces CGPA, degree eligibility, placed/blacklist and duplicate application checks.
  - Acceptance: Eligible students can apply; application appended to drive `applications`.
  - Tests: applying without `studentId` returns 400; CGPA check rejects insufficient CGPA; duplicate application returns 409.

Validation & Tests (Sprint 2)
- Uniqueness: registration and profile update duplicates tested.
- Password hashing: ensure stored password is hashed (bcrypt comparison tests).
- Application eligibility rules: placed/blacklist, degree, CGPA comparisons.

Sprint 3 — Faculty Dashboard & Testing (Week 3)
- Goal: Add faculty login view and finalize testing suite for validations across the app.

Backlog (high level stories)
1. Faculty Login
  - Frontend: faculty login page (username/password).
  - Backend: `/api/auth/faculty/login` uses `FacultyAuth` model.
  - Acceptance: Faculty can log in; invalid credentials handled.
  - Tests: required fields and invalid credential handling.

2. End-to-end Validation Testing
  - Create test cases (manual or automated) covering:
    - Registration and profile uniqueness and required-field validations
    - Login validation flows for student/faculty/coordinator
    - Drive creation and degree enum validation
    - File upload and URL generation
    - Application eligibility rules (placed, blacklist, degree, CGPA)
    - Export applicants produces XLSX with expected columns
  - Map each validation to a test (API-level preferred): expected status codes and response messages.

3. Regression & Acceptance
  - Run manual acceptance tests through UI or cURL.
  - Produce test-report (pass/fail) and list of defects.

Deliverables per sprint
- Sprint 1: `CoordinatorDashboard` UI, drive/material CRUD APIs, DB collections seeded (if needed), basic validation tests.
- Sprint 2: `StudentRegister` UI, student profile APIs, apply-to-drive flow, validation tests for registration/apply.
- Sprint 3: `Faculty Login` UI, consolidated test suite, bug fixes, final acceptance report.

How I'll update the Excel sheets
- I will create CSV exports of these sprint backlogs so you can open/import them into the two Excel files you added. The CSVs will contain story, tasks, area (frontend/backend/db), acceptance criteria, estimated points, status.

