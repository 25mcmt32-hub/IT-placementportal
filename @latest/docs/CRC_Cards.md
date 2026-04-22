CRC Cards — Placement Portal (key classes)

1) Student
- Responsibilities:
  - Store student profile information (name, email, regno, year, branch, degree).
  - Manage academic records and resume metadata (tenth, twelfth, ug, pg, resumeUrl).
  - Provide status flags (placed, blacklist) used in application eligibility checks.
  - Authenticate via password comparison (handled in controllers).
- Collaborators:
  - `PlacementDrive` (as applicant via `DriveApplication`)
  - `StudentController` / `authController` (business logic)

2) PlacementDrive
- Responsibilities:
  - Store drive metadata (company, minCgpa, deadline, degree, createdBy).
  - Manage JD file metadata and download URL (jdFileName, jdUrl).
  - Maintain list of `DriveApplication` entries (applications array).
  - Enforce drive-level validation (degree enum, minCgpa checks in controllers).
- Collaborators:
  - `DriveApplication` (embedded application records)
  - `Student` (applicants referenced by studentId)
  - `placementDriveController` (business logic)

3) DriveApplication (embedded schema)
- Responsibilities:
  - Capture a snapshot of student details at application time (name, email, regno, year, branch, degree, ug/pg, resumeUrl).
  - Record `studentId` reference and `appliedAt` timestamp.
- Collaborators:
  - `PlacementDrive` (owner container)
  - `Student` (referenced actor)

4) MaterialHub
- Responsibilities:
  - Store material metadata (title, fileName, fileUrl, createdBy).
  - Support upload and delete operations for learning materials.
- Collaborators:
  - `materialHubController` (business logic)

5) FacultyAuth
- Responsibilities:
  - Store faculty login credentials (username, email, hashed password).
  - Provide identity records for faculty login flows.
- Collaborators:
  - `authController` (login / password reset handlers)

6) CoordinatorAuth
- Responsibilities:
  - Store coordinator login credentials (username, email, hashed password).
  - Provide identity records for coordinator login flows and UI access.
- Collaborators:
  - `authController` and `CoordinatorDashboard` UI

7) User (generic model)
- Responsibilities:
  - Represent a generalized user record supporting roles (student/faculty/coordinator).
  - Provide common fields and conditional required constraints (e.g., email/regno required for role student).
- Collaborators:
  - Controllers that manage auth and user lifecycle

Notes:
- Controllers (`studentController`, `placementDriveController`, `authController`, `materialHubController`) implement most behavior; models are primarily data holders with schema-level constraints.
- File handling is delegated to `uploads.js` (Multer disk storage) which collaborates with models by providing file URLs persisted into model documents.