SOFTWARE REQUIREMENTS SPECIFICATION

1. INTRODUCTION

1.1 Purpose
The Placement Portal provides a web-based system to manage student profiles, placement drives, educational materials, and application workflows. It enables students to register, maintain profiles and apply for placement drives; faculty to access the system; and coordinators to create/manage drives, upload materials, and export applicant reports. The system stores records in MongoDB and manages uploaded files on the server filesystem.

1.2 Scope
The system facilitates student registration and profile management, faculty/coordinator authentication, placement drive creation and management, material hub uploads, student applications to placement drives, and administrative reporting (exporting applicants).

1.3 Definitions, Acronyms, Abbreviations
- API: Application Programming Interface
- CGPA: Cumulative Grade Point Average
- DFD: Data Flow Diagram
- JD: Job Description (file uploaded to a placement drive)
- XLSX: Microsoft Excel workbook format (used for exports)
- REST: Representational State Transfer
- JWT: JSON Web Token (not currently used in codebase)

1.4 References
- Project source files (workspace-relative):
  - Backend entry and routes: `backend/src/server.js`, `backend/src/routes/*`
  - Controllers: `backend/src/controllers/*` (notably `studentController.js`, `placementDriveController.js`, `authController.js`, `materialHubController.js`)
  - Models: `backend/src/models/*` (notably `Student.js`, `PlacementDrive.js`, `MaterialHub.js`, `CoordinatorAuth.js`, `FacultyAuth.js`)
  - Uploads/file handling: `backend/src/config/uploads.js`
  - Frontend pages: `src/pages/StudentRegister.jsx`, `src/pages/CoordinatorDashboard.jsx`
  - Frontend API client: `src/config/api.js`
- External libraries and docs referenced: Mongoose, Express, Multer, bcryptjs, xlsx

1.5 Overall Description
The Placement Portal is a web application that supports campus placement workflows for students, coordinators, and faculty. It consists of:

- Frontend (React + Vite): UI components and pages for registration, login, dashboards, drive listings, and forms. Key pages include `StudentRegister.jsx` and `CoordinatorDashboard.jsx`.
- Backend (Node.js + Express): REST API that exposes endpoints under `/api/*` and implements business logic in controller modules. Data is persisted in MongoDB using Mongoose models found in `backend/src/models`.
- File store: Uploaded files (resumes, JDs, materials) are stored on the server filesystem under `uploads/` and served by the backend (URL built by `backend/src/config/uploads.js`).

Operational notes:
- The frontend communicates with the backend via `src/config/api.js` and expects the API base URL from the environment variable `VITE_API_URL` (falls back to `http://localhost:5000/api`).
- Passwords are hashed using `bcryptjs` before persistency. There is no token-based authentication or role-enforcement middleware implemented by default in the repository.
- Exports of applicant lists are produced in-memory as XLSX files using the `xlsx` package and returned as downloadable responses.

2. OVERALL DESCRIPTION

2.1 Product perspective
The Placement Portal is a single web application with a React frontend and an Express/MongoDB backend. Features include user registration (students), login (students/faculty/coordinator), file uploads (resumes, job descriptions, materials), CRUD for placement drives and materials, and drive application workflows.

2.2 Product functions
- Student registration and profile management
- Student login and password reset
- Faculty and coordinator login and password reset
- Coordinator: create/update/delete placement drives; upload JD file; export applicants
- Coordinator: upload/delete educational materials
- Students: view drives, apply for drives (resume used), view profile
- Admin functions: mark student placed/blacklist

2.3 User characteristics
- Students
  - Role: primary users who register, upload resumes, complete academic fields, and apply to placement drives.
  - Expected behavior: use a browser to fill forms and upload files; expect immediate client-side feedback for basic validation (e.g., password confirmation) and server-side validation for uniqueness and completeness.

- Faculty
  - Role: authenticate using `FacultyAuth` credentials; limited to viewing placement drives and possibly collaborating with coordinators.

- Coordinators
  - Role: administrative users who manage placement drives and the material hub; create, update, delete drives; upload JDs and materials; export applicant spreadsheets and update student statuses.

2.4 User constraints
- Authentication and Authorization: authentication is credential-based (username/email + password). There is no built-in JWT/session management or fine-grained role middleware by default; role assumptions are enforced by UI workflows rather than a central auth guard.
- Data entry constraints: `email` and `regno` must be unique for students; `degree` values are constrained to the enum `All Degrees | IMTech | MTech(CS) | MTech(AI)`.
- File constraints: uploaded files are stored on disk under `uploads/` subfolders (`resumes`, `drives`, `materials`). The code does not currently validate file size, mime-type, or automatically remove stale files.
- Browser compatibility: designed for modern evergreen browsers (Chrome, Edge, Firefox). No support guarantees for legacy browsers.

2.5 Assumptions & dependencies
- MongoDB available for persistence
- Node/Express backend runs on port 5000 (default env)
- Frontend configured to call backend at VITE_API_URL or localhost:5000/api

2.6 Apportioning requirements
- Advanced authentication (tokens/roles enforcement) and rate-limiting are out-of-scope for this release.

3. SPECIFIC REQUIREMENTS

3.1 Interface requirements
3.1.1 External Interface
- REST API endpoints under `/api/*` (see backend/src/routes):
  - `/api/students` (register, list, get, update)
  - `/api/drives` (list, create, update, delete, apply, export)
  - `/api/materials` (list, create, delete)
  - `/api/auth` routes for login/forgot-password (student/faculty/coordinator)

3.1.2 Hardware Interface
- Standard web server and file storage on server filesystem (uploads/)

3.1.3 Software Interface
- Frontend communicates via fetch to backend API. Backend uses Mongoose to communicate with MongoDB.

3.1.4 Communication Interface
- HTTP(S) REST over JSON or multipart/form-data for file uploads.

3.2 Functional requirements

3.2.1 Use Case Model
Actors: Student, Faculty, Coordinator
Primary use cases:
- Student: Register, Login, Update Profile, Upload Resume, Apply for Drive, View Drives
- Faculty: Login
- Coordinator: Login, Create Drive, Update Drive, Delete Drive, Upload Material, Delete Material, Export Applicants, Update Student Status

High-level relationships:
- Student -> Apply for Drive (preconditions: registered, not placed, not blacklisted, meets min CGPA and degree eligibility)
- Coordinator -> Create Drive (preconditions: authenticated coordinator)

3.2.2 Use Case Specifications (examples)
Use Case: Register Student
- Actor: Student
- Trigger: Student submits registration form
- Preconditions: None
- Main flow: Validate required fields -> check duplicate email/regno -> hash password -> save Student record -> return success
- Postconditions: Student record created; resume saved if uploaded

Use Case: Apply For Drive
- Actor: Student
- Trigger: Student requests to apply for a drive
- Preconditions: Student registered and authenticated in UI; drive exists
- Main flow: Verify student eligibility (placed/blacklist), check CGPA >= drive.minCgpa, verify degree match, ensure not already applied -> add application to drive -> save
- Postconditions: Application entry added to drive.applications

3.2.3 Analysis Classes / Data Dictionary (conceptual)
- Student: { _id, name, email, regno, year, branch, degree, password, tenth, twelfth, ug, pg, resumeFileName, resumeUrl, placed, blacklist }
- PlacementDrive: { _id, company, minCgpa, deadline, degree, jdFileName, jdUrl, applications[] }
- Application (embedded): { studentId, name, email, regno, year, branch, degree, tenth, twelfth, ug, pg, resumeUrl, appliedAt }
- Material: { _id, title, fileName, fileUrl, createdBy }
- CoordinatorAuth / FacultyAuth: { username, email, password }

3.3 Use Case Specifications / Process description
(Use cases specified above; replicate for other flows such as login, password reset, drive CRUD.)

3.4 Performance requirements
- Typical web app performance; no explicit SLAs. Export uses XLSX and streams a file for download.

3.5 Logical database requirements
- MongoDB collections: students, placement_drives, material_hub, faculty_logins, student_coordinators
- Indexes: unique on email and regno for student; unique on username/email for login collections

3.6 Design Constraints
- Server stores uploaded files on disk under `uploads/`.
- Degree values constrained to enum: ["All Degrees","IMTech","MTech(CS)","MTech(AI)"]

3.6.1 Reliability
- Basic try/catch blocks in controllers; no retry or queueing mechanisms.

3.6.2 Availability
- Depends on backend deployment and MongoDB availability.

3.6.3 Security
- Passwords hashed with bcrypt. No token-based auth enforced in codebase by default.

3.6.4 Maintainability
- Controllers and models separated; code is modular for straightforward maintenance.

3.6.5 Portability
- Node.js + MongoDB stack; should run on common server OSes with Node support.

Appendix: Endpoints reference (see routes under backend/src/routes)

