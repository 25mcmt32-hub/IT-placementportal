import PlacementDrive from "../models/PlacementDrive.js";
import Student from "../models/Student.js";
import { buildFileUrl } from "../config/uploads.js";
import XLSX from "xlsx";

const DRIVE_DEGREE_OPTIONS = ["All Degrees", "IMTech", "MTech(CS)", "MTech(AI)"];
const COLLEGE_NAME = "University of Hyderabad";
const STUDENT_FIELD_EXPORTERS = {
  name: { label: "Name", getValue: (application) => application.name },
  email: { label: "Email", getValue: (application) => application.email },
  regno: { label: "RegistrationNumber", getValue: (application) => application.regno },
  year: { label: "Year", getValue: (application) => application.year },
  branch: { label: "Branch", getValue: (application) => application.branch },
  degree: { label: "Degree", getValue: (application) => application.degree },
  tenth: { label: "TenthPercentage", getValue: (application) => application.tenth },
  twelfth: { label: "TwelfthPercentage", getValue: (application) => application.twelfth },
  ug: { label: "UGCGPA", getValue: (application) => application.ug },
  pg: { label: "PGCGPA", getValue: (application) => application.pg },
  collegeName: {
    label: "CollegeName",
    getValue: (application) => application.collegeName || COLLEGE_NAME,
  },
  resumeUrl: { label: "ResumeUrl", getValue: (application) => application.resumeUrl },
};

function isValidDriveDegree(degree) {
  return DRIVE_DEGREE_OPTIONS.includes(degree);
}

function isStudentEligibleForDriveDegree(studentDegree, driveDegree) {
  if (!driveDegree || driveDegree === "All Degrees") {
    return true;
  }

  return studentDegree === driveDegree;
}

function normalizeCustomKey(label) {
  return String(label || "")
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function parseApplicationFields(rawFields) {
  if (!rawFields) {
    return [];
  }

  try {
    const fields = JSON.parse(rawFields);

    if (!Array.isArray(fields)) {
      return [];
    }

    return fields
      .map((field) => {
        const source = field.source === "student" ? "student" : "custom";
        const label = String(field.label || "").trim();
        const key = source === "student" ? field.key : normalizeCustomKey(label || field.key);
        const order = Number.parseInt(field.order, 10);

        if (!key || !label) {
          return null;
        }

        if (source === "student" && !STUDENT_FIELD_EXPORTERS[key]) {
          return null;
        }

        return {
          key,
          label,
          source,
          required: field.required !== false,
          order: Number.isFinite(order) && order > 0 ? order : 1,
        };
      })
      .filter(Boolean)
      .sort((firstField, secondField) => firstField.order - secondField.order);
  } catch {
    return [];
  }
}

function buildCompanyFields(applicationFields, applicationDetails = {}) {
  const companyFields = {};

  applicationFields
    .filter((field) => field.source === "custom")
    .forEach((field) => {
      companyFields[field.key] = String(applicationDetails[field.key] || "").trim();
    });

  return companyFields;
}

export async function getPlacementDrives(_req, res) {
  try {
    const drives = await PlacementDrive.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ drives });
  } catch (error) {
    console.error("Get drives error:", error);
    return res.status(500).json({ message: "Unable to fetch drives right now." });
  }
}

export async function createPlacementDrive(req, res) {
  try {
    const { company, minCgpa, deadline, createdBy, degree, applicationFields } = req.body;

    if (!company || !minCgpa || !deadline || !degree) {
      return res.status(400).json({ message: "Company, minimum CGPA, deadline, and degree are required." });
    }

    if (!isValidDriveDegree(degree)) {
      return res.status(400).json({ message: "Please choose a valid degree option for the drive." });
    }

    const drive = await PlacementDrive.create({
      company,
      minCgpa,
      deadline,
      degree,
      jdFileName: req.file?.filename || "",
      jdOriginalName: req.file?.originalname || "",
      jdUrl: req.file ? buildFileUrl(req, "drives", req.file.filename) : "",
      applicationFields: parseApplicationFields(applicationFields),
      createdBy,
    });

    return res.status(201).json({
      message: "Placement drive created successfully.",
      drive,
    });
  } catch (error) {
    console.error("Create drive error:", error);
    return res.status(500).json({ message: "Unable to create drive right now." });
  }
}

export async function updatePlacementDrive(req, res) {
  try {
    const drive = await PlacementDrive.findById(req.params.id);

    if (!drive) {
      return res.status(404).json({ message: "Placement drive not found." });
    }

    const { company, minCgpa, deadline, createdBy, degree, applicationFields } = req.body;

    if (degree && !isValidDriveDegree(degree)) {
      return res.status(400).json({ message: "Please choose a valid degree option for the drive." });
    }

    drive.company = company || drive.company;
    drive.minCgpa = minCgpa || drive.minCgpa;
    drive.deadline = deadline || drive.deadline;
    drive.createdBy = createdBy || drive.createdBy;
    drive.degree = degree || drive.degree;

    if (applicationFields) {
      drive.applicationFields = parseApplicationFields(applicationFields);
    }

    if (req.file) {
      drive.jdFileName = req.file.filename;
      drive.jdOriginalName = req.file.originalname;
      drive.jdUrl = buildFileUrl(req, "drives", req.file.filename);
    }

    await drive.save();

    return res.status(200).json({
      message: "Placement drive updated successfully.",
      drive,
    });
  } catch (error) {
    console.error("Update drive error:", error);
    return res.status(500).json({ message: "Unable to update drive right now." });
  }
}

export async function deletePlacementDrive(req, res) {
  try {
    const drive = await PlacementDrive.findByIdAndDelete(req.params.id);

    if (!drive) {
      return res.status(404).json({ message: "Placement drive not found." });
    }

    return res.status(200).json({ message: "Placement drive deleted successfully." });
  } catch (error) {
    console.error("Delete drive error:", error);
    return res.status(500).json({ message: "Unable to delete drive right now." });
  }
}

function getStudentCgpa(student) {
  const cgpaValue = parseFloat(student.degree === "IMTech" ? student.ug || "0" : student.pg || "0");
  return Number.isFinite(cgpaValue) ? cgpaValue : 0;
}

export async function applyForDrive(req, res) {
  try {
    const { studentId, applicationDetails = {} } = req.body;

    if (!studentId) {
      return res.status(400).json({ message: "Student id is required." });
    }

    const [drive, student] = await Promise.all([
      PlacementDrive.findById(req.params.id),
      Student.findById(studentId),
    ]);

    if (!drive) {
      return res.status(404).json({ message: "Placement drive not found." });
    }

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    if (student.placed) {
      return res.status(403).json({ message: "Placed students cannot apply for new drives." });
    }

    if (student.blacklist) {
      return res.status(403).json({ message: "Blacklisted students cannot apply for drives." });
    }

    if ((student.academicVerificationStatus || "approved") !== "approved") {
      return res.status(403).json({ message: "Your updated CGPA is pending faculty verification." });
    }

    const minCgpa = parseFloat(drive.minCgpa || "0");
    const studentCgpa = getStudentCgpa(student);

    if (Number.isFinite(minCgpa) && studentCgpa < minCgpa) {
      return res.status(400).json({ message: "You do not meet the minimum CGPA criteria for this drive." });
    }

    if (!isStudentEligibleForDriveDegree(student.degree, drive.degree)) {
      return res.status(403).json({ message: "This drive is not available for your degree." });
    }

    const alreadyApplied = drive.applications.some(
      (application) => String(application.studentId) === String(student._id)
    );

    if (alreadyApplied) {
      return res.status(409).json({ message: "You have already applied for this drive." });
    }

    const missingRequiredFields = (drive.applicationFields || [])
      .filter((field) => field.source === "custom" && field.required)
      .filter((field) => !String(applicationDetails[field.key] || "").trim());

    if (missingRequiredFields.length > 0) {
      return res.status(400).json({
        message: `Please fill these company fields: ${missingRequiredFields
          .map((field) => field.label)
          .join(", ")}.`,
      });
    }

    drive.applications.push({
      studentId: student._id,
      name: student.name,
      email: student.email,
      regno: student.regno,
      year: student.year,
      branch: student.branch,
      degree: student.degree,
      tenth: student.tenth,
      twelfth: student.twelfth,
      ug: student.ug,
      pg: student.pg,
      collegeName: COLLEGE_NAME,
      resumeUrl: student.resumeUrl,
      companyFields: buildCompanyFields(drive.applicationFields || [], applicationDetails),
    });

    await drive.save();

    return res.status(200).json({
      message: "Applied successfully.",
      drive,
    });
  } catch (error) {
    console.error("Apply drive error:", error);
    return res.status(500).json({ message: "Unable to apply for this drive right now." });
  }
}

export async function exportDriveApplications(req, res) {
  try {
    const drive = await PlacementDrive.findById(req.params.id).lean();

    if (!drive) {
      return res.status(404).json({ message: "Placement drive not found." });
    }

    const configuredFields = drive.applicationFields?.length
      ? [...drive.applicationFields].sort((firstField, secondField) => firstField.order - secondField.order)
      : [
          { key: "name", label: "Name", source: "student", order: 1 },
          { key: "email", label: "Email", source: "student", order: 2 },
          { key: "regno", label: "Registration Number", source: "student", order: 3 },
          { key: "year", label: "Year", source: "student", order: 4 },
          { key: "branch", label: "Branch", source: "student", order: 5 },
          { key: "degree", label: "Degree", source: "student", order: 6 },
          { key: "tenth", label: "10th Percentage", source: "student", order: 7 },
          { key: "twelfth", label: "12th Percentage", source: "student", order: 8 },
          { key: "ug", label: "UG CGPA", source: "student", order: 9 },
          { key: "pg", label: "PG CGPA", source: "student", order: 10 },
          { key: "collegeName", label: "College Name", source: "student", order: 11 },
          { key: "resumeUrl", label: "Resume URL", source: "student", order: 12 },
        ];

    const rows = drive.applications.map((application) => {
      const row = {};

      configuredFields.forEach((field) => {
        if (field.source === "student") {
          const exporter = STUDENT_FIELD_EXPORTERS[field.key];
          row[field.label || exporter?.label || field.key] = exporter?.getValue(application) || "";
          return;
        }

        row[field.label] = application.companyFields?.[field.key] || "";
      });

      row.AppliedAt = application.appliedAt;
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Applicants");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${drive.company.replace(/\s+/g, "_")}_applicants.xlsx"`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    return res.status(200).send(buffer);
  } catch (error) {
    console.error("Export drive applications error:", error);
    return res.status(500).json({ message: "Unable to export applications right now." });
  }
}
