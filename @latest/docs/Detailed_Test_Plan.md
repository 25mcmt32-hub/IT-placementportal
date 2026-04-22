Detailed Test Plan — Placement Portal

Overview
- This test plan contains selected functional tests for the Placement Portal focusing on form-based flows and validations. Each test includes steps, expected result, and a sample actual output showing either pass or fail.

Test Environment
- Backend: Node/Express (backend/src)
- Database: MongoDB (collections: students, placement_drives, material_hub)
- File store: uploads/ (resumes, drives, materials)

Legend
- PASS: The system returned the expected response and state change.
- FAIL: The system returned an unexpected response or did not change state as expected.

Test Cases

TP-01: Student Registration — Successful (PASS)
- Description: Register a new student with all required fields and resume upload.
- Steps:
  1. POST /api/students/register (multipart/form-data)
  2. Fields: name, email, regno, year, branch, degree, password
  3. Optional: attach `resume` file
- Expected: 201 Created with JSON { message: "Registration successful.", user: { ... } }
- Sample Actual Output (PASS):
  HTTP/1.1 201 Created
  Content-Type: application/json
  {
    "message": "Registration successful.",
    "user": {
      "id": "6421f5...",
      "role": "student",
      "name": "Alice Student",
      "email": "alice@example.edu",
      "regno": "REG12345",
      "year": "2025",
      "branch": "CSE",
      "degree": "IMTech",
      "resumeFileName": "1682071234567-resume.pdf",
      "placed": false,
      "blacklist": false
    }
  }

TP-02: Student Registration — Missing Required Fields (FAIL)
- Description: Submit registration without `password` to trigger required-field validation.
- Steps:
  1. POST /api/students/register with missing `password` field
- Expected: 400 Bad Request with message "Please fill all required fields."
- Sample Actual Output (FAIL):
  HTTP/1.1 400 Bad Request
  Content-Type: application/json
  { "message": "Please fill all required fields." }

TP-03: Student Registration — Duplicate Email or Regno (FAIL)
- Description: Register with an email or regno already present in `students` collection.
- Steps:
  1. POST /api/students/register using an email/regno already registered
- Expected: 409 Conflict with message "A student with this email or registration number already exists."
- Sample Actual Output (FAIL):
  HTTP/1.1 409 Conflict
  Content-Type: application/json
  { "message": "A student with this email or registration number already exists." }

TP-04: Student Login — Successful (PASS)
- Description: Student logs in with correct email and password.
- Steps:
  1. POST /api/auth/student/login with { email, password }
- Expected: 200 OK with message "Login successful." and sanitized user object
- Sample Actual Output (PASS):
  HTTP/1.1 200 OK
  Content-Type: application/json
  { "message": "Login successful.", "user": { "id": "6421f5...", "role": "student", "name": "Alice Student", "email": "alice@example.edu" } }

TP-05: Student Login — Invalid Password (FAIL)
- Description: Attempt to login with wrong password.
- Steps:
  1. POST /api/auth/student/login with correct email and incorrect password
- Expected: 401 Unauthorized with message "Invalid login credentials."
- Sample Actual Output (FAIL):
  HTTP/1.1 401 Unauthorized
  Content-Type: application/json
  { "message": "Invalid login credentials." }

TP-06: Create Placement Drive — Successful (PASS)
- Description: Coordinator creates a placement drive with required fields and JD upload.
- Steps:
  1. POST /api/drives (multipart/form-data) with company, minCgpa, deadline, degree, createdBy and optional jd file
- Expected: 201 Created with message "Placement drive created successfully." and drive object
- Sample Actual Output (PASS):
  HTTP/1.1 201 Created
  Content-Type: application/json
  {
    "message": "Placement drive created successfully.",
    "drive": {
      "_id": "648a2b...",
      "company": "Acme Corp",
      "minCgpa": "7.0",
      "deadline": "2026-05-30",
      "degree": "All Degrees",
      "jdUrl": "http://localhost:5000/uploads/drives/168...-jd.pdf"
    }
  }

TP-07: Create Placement Drive — Missing Fields (FAIL)
- Description: Submit drive creation missing `company` or `minCgpa`.
- Steps:
  1. POST /api/drives with incomplete payload
- Expected: 400 Bad Request with message "Company, minimum CGPA, deadline, and degree are required."
- Sample Actual Output (FAIL):
  HTTP/1.1 400 Bad Request
  Content-Type: application/json
  { "message": "Company, minimum CGPA, deadline, and degree are required." }

TP-08: Apply For Drive — Successful (PASS)
- Description: Eligible student applies for a drive they meet criteria for.
- Steps:
  1. POST /api/drives/{driveId}/apply with body { studentId }
- Expected: 200 OK with message "Applied successfully." and updated drive object containing the new application entry
- Sample Actual Output (PASS):
  HTTP/1.1 200 OK
  Content-Type: application/json
  {
    "message": "Applied successfully.",
    "drive": {
      "_id": "648a2b...",
      "company": "Acme Corp",
      "applications": [
        { "studentId": "6421f5...", "name": "Alice Student", "email": "alice@example.edu", "regno": "REG12345", "appliedAt": "2026-04-21T10:00:00.000Z" }
      ]
    }
  }

TP-09: Apply For Drive — Insufficient CGPA (FAIL)
- Description: Student tries to apply but UG/PG CGPA is lower than drive.minCgpa.
- Steps:
  1. POST /api/drives/{driveId}/apply with { studentId }
- Expected: 400 Bad Request with message "You do not meet the minimum CGPA criteria for this drive."
- Sample Actual Output (FAIL):
  HTTP/1.1 400 Bad Request
  Content-Type: application/json
  { "message": "You do not meet the minimum CGPA criteria for this drive." }

TP-10: Export Applicants — Successful (PASS)
- Description: Coordinator exports applicants for a drive as XLSX.
- Steps:
  1. GET /api/drives/{driveId}/applications/export
- Expected: 200 OK with Content-Type for file download (attachment .xlsx)
- Sample Actual Output (PASS):
  HTTP/1.1 200 OK
  Content-Disposition: attachment; filename="drive-648a2b-applications.xlsx"
  Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
  (binary XLSX payload)

TP-11: Create Material — Missing Title (FAIL)
- Description: Coordinator attempts to create material without `title`.
- Steps:
  1. POST /api/materials with missing `title` field
- Expected: 400 Bad Request with message "Material title is required."
- Sample Actual Output (FAIL):
  HTTP/1.1 400 Bad Request
  Content-Type: application/json
  { "message": "Material title is required." }

Summary of Results (example snapshot)
- Total tests listed: 11
- Passed: TP-01, TP-04, TP-06, TP-08, TP-10 (5 passed)
- Failed: TP-02, TP-03, TP-05, TP-07, TP-09, TP-11 (6 failed)

Notes & Next Steps
- Failed test cases correspond to negative validation flows and should be verified to ensure error messages are user-friendly and correctly returned by the API.
- For automated testing, translate these cases into API tests (Mocha/Chai or Jest + Supertest) and UI E2E tests (Cypress) for critical flows.
- If you want, I can generate a runnable Postman collection or a set of `curl` commands for these tests and include expected/actual assertions.
