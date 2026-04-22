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
- XLSX: Excel Workbook format used for exports
- REST: Representational State Transfer

1.4 References
- Project source files (workspace-relative):
	- Backend entry and routes: `backend/src/server.js`, `backend/src/routes/*`
	- Controllers: `backend/src/controllers/*` (notably `placementDriveController.js`, `studentController.js`, `authController.js`, `materialHubController.js`)
	- Models: `backend/src/models/*` (notably `PlacementDrive.js`, `Student.js`, `MaterialHub.js`)
	- Uploads/file handling: `backend/src/config/uploads.js`
	- Frontend pages: `src/pages/CoordinatorDashboard.jsx`, `src/pages/StudentRegister.jsx`

1.5 Overall Description
This document contains DFDs and process descriptions for the Placement Portal (React frontend + Express/MongoDB backend). The portal handles student registration and profiles, placement drive lifecycle management, material uploads, drive applications and applicant reporting. Files are uploaded to disk using Multer and their URLs are recorded in the MongoDB documents.

2. OVERALL DESCRIPTION

2.1 Product perspective
React frontend + Express/MongoDB backend; supports multipart uploads for files and REST API endpoints for CRUD operations.

2.2 Product functions
- Student registration and profile management
- Student login and password reset
- Faculty and coordinator login and password reset
- Coordinator: create/update/delete placement drives; upload JD file; export applicants
- Coordinator: upload/delete educational materials
- Students: view drives, apply for drives
- Admin functions: mark student placed/blacklist


2.3 User characteristics
- Students
	- Primary users who register, upload resumes, and apply to placement drives; expect straightforward forms and clear validation messages.

- Faculty
	- Login via `FacultyAuth` credentials; generally read-only interaction with limited administrative responsibilities.

- Coordinators
	- Administrative users who manage placement drives and materials, can export applicant lists, and modify student statuses.

2.4 User constraints
- File storage: uploads are stored locally under `uploads/` and served via generated URLs; there is no cloud storage integration.
- API base path: frontend expects `VITE_API_URL` or `http://localhost:5000/api` by default.
- Limitations: no enforced file size or content-type validation in code; no token-based auth by default; large exports are generated in-memory.

2.5 Assumptions & dependencies
- MongoDB, Node.js present; environment variables for API URL optional

2.6 Apportioning requirements
- Token-based auth and advanced validations out-of-scope for current release

3. SPECIFIC REQUIREMENTS

3.1 Interface requirements
3.1.1 External Interface
- REST API endpoints under `/api/*` (see backend/src/routes)

3.1.2 Hardware Interface
- Standard web server and file storage

3.1.3 Software Interface
- Fetch-based HTTP client in frontend; Mongoose ODM in backend

3.1.4 Communication Interface
- HTTP/HTTPS; multipart/form-data for uploads

3.2 Functional requirements

3.2.1 Information Flows (DFD)
Level 0 (context): User <-> Placement Portal Web App <-> Database + File Store

Level 1 (major processes):
- P1: User Management (register, login, profile updates) -> reads/writes `students` collection
- P2: Drive Management (create/update/delete drives, upload JD) -> `placement_drives` collection + file store
- P3: Material Hub (upload/delete materials) -> `material_hub` collection + file store
- P4: Application Processing (student applies to drive) -> append to drive.applications
- P5: Reporting (export applicants) -> reads placement_drives and produces XLSX file

Data stores:
- D1: Database (MongoDB collections students, placement_drives, material_hub, faculty_logins, student_coordinators)
- D2: File Store (`uploads/` folder for resumes, drives, materials)

3.2.2 Process Description
P1: User Management (Register / Login / Profile Update / Password Reset)
- Input: forms or JSON payloads containing user fields (name, email, regno, year, branch, degree, password) or login credentials; password-reset requests include new password and identifying fields.
- Steps:
	- Registration: validate required fields; normalize email/regno; check duplicates (email/regno); hash password; save Student record; store resume file (if provided) and record URL.
	- Login: validate credentials; lookup user by normalized identifier; compare hashed password; return sanitized user data on success.
	- Profile Update: validate new data; ensure email/regno uniqueness against other accounts; update fields; save new resume file if uploaded.
	- Password Reset: validate presence of new password; lookup account using provided identifiers; hash and save new password.
- Output: success or error responses and updated/sanitized user objects as appropriate.

P2: Drive Management (Create / Update / Delete Drives)
- Input: drive payload (company, minCgpa, deadline, degree, createdBy) and optional JD file upload.
- Steps: validate required fields (company, minCgpa, deadline, degree); verify `degree` is one of the allowed enum values; save or update `placement_drives` record; store JD file under the `uploads/drives` folder and persist generated URL; on delete, remove drive record (note: file cleanup may be required separately).
- Output: created or updated `placement_drives` record, or deletion confirmation.

P3: Material Hub (Upload / Delete Materials)
- Input: material payload (title, createdBy) and optional file upload.
- Steps: validate `title` presence; store uploaded file under `uploads/materials` and record file metadata and URL in `material_hub` collection; delete operation removes the material record (server-side file deletion may not be implemented automatically).
- Output: created material record or deletion confirmation.

P4: Application Processing (Apply For Drive)
- Input: studentId and drive id (via endpoint)
- Steps: fetch drive and student; validate existence; check student placed/blacklist status; compute student CGPA from `ug` or `pg` as available; parse and compare CGPA with drive.minCgpa; verify degree eligibility (drive.degree vs student.degree); ensure student hasn't already applied; append application record to `placement_drives.applications` and save.
- Output: updated drive object with the new application entry.

P5: Reporting (Export Applicants)
- Input: drive id
- Steps: fetch the drive and its `applications` array; map applications to spreadsheet rows; build an XLSX workbook in memory and stream it as a downloadable file in the response.
- Output: downloadable XLSX file containing applicant details.

3.2.3 Data Dictionary (selected fields)
- Student.email: string (college email), indexed unique
- Student.regno: string, indexed unique
- Student.ug/pg: string containing CGPA (parsed to float in controller)
- PlacementDrive.minCgpa: string (numeric semantics; parsed to float)
- PlacementDrive.degree: enum [All Degrees, IMTech, MTech(CS), MTech(AI)]
- PlacementDrive.applications: array of application objects { studentId:ObjectId, name, email, regno, year, branch, degree, ug, pg, resumeUrl, appliedAt }

3.3 Use Case Specifications / Process description
(Refer to processes above for P1..P5; replicate login, password reset, CRUD flows analogously.)

Analysis Classes / Data Dictionary
- (Mirror of the entities described in 3.2.3.)

Performance requirements
- No explicit SLAs; reasonably sized drives and application exports expected to operate in-memory for moderate workloads.

Logical database requirements
- Collections and indexes as described in Use Cases doc.

Design Constraints
- File uploads are stored on disk; no cloud storage configured.

Software System attributes
3.6.1 Reliability: Basic error handling; controllers use try/catch.
3.6.2 Availability: Dependent on server and DB uptime.
3.6.3 Security: Passwords hashed with bcrypt; no JWT or session enforcement currently.
3.6.4 Maintainability: Modular controllers/models.
3.6.5 Portability: Node + MongoDB stack.

