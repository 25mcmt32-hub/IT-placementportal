import PlacementDrive from "../models/PlacementDrive.js";
import Student from "../models/Student.js";
import { buildFileUrl } from "../config/uploads.js";
import XLSX from "xlsx";

const DRIVE_DEGREE_OPTIONS = ["All Degrees", "IMTech", "MTech(CS)", "MTech(AI)"];

function isValidDriveDegree(degree) {
  return DRIVE_DEGREE_OPTIONS.includes(degree);
}

function isStudentEligibleForDriveDegree(studentDegree, driveDegree) {
  if (!driveDegree || driveDegree === "All Degrees") {
    return true;
  }

  return studentDegree === driveDegree;
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
    const { company, minCgpa, deadline, createdBy, degree } = req.body;

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

    const { company, minCgpa, deadline, createdBy, degree } = req.body;

    if (degree && !isValidDriveDegree(degree)) {
      return res.status(400).json({ message: "Please choose a valid degree option for the drive." });
    }

    drive.company = company || drive.company;
    drive.minCgpa = minCgpa || drive.minCgpa;
    drive.deadline = deadline || drive.deadline;
    drive.createdBy = createdBy || drive.createdBy;
    drive.degree = degree || drive.degree;

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
  const cgpaValue = parseFloat(student.ug || student.pg || "0");
  return Number.isFinite(cgpaValue) ? cgpaValue : 0;
}

export async function applyForDrive(req, res) {
  try {
    const { studentId } = req.body;

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
      resumeUrl: student.resumeUrl,
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

    const rows = drive.applications.map((application) => ({
      Name: application.name,
      Email: application.email,
      RegistrationNumber: application.regno,
      Year: application.year,
      Branch: application.branch,
      Degree: application.degree,
      TenthPercentage: application.tenth,
      TwelfthPercentage: application.twelfth,
      UGCGPA: application.ug,
      PGCGPA: application.pg,
      ResumeUrl: application.resumeUrl,
      AppliedAt: application.appliedAt,
    }));

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
