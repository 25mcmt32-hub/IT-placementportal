import bcrypt from "bcryptjs";
import Student from "../models/Student.js";

function isPublicResumeUrl(value) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    const privateIpPattern =
      /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|0\.|169\.254\.)/;

    return ["http:", "https:"].includes(url.protocol) && !privateIpPattern.test(hostname);
  } catch {
    return false;
  }
}

function sanitizeStudent(student) {
  return {
    id: student._id,
    role: "student",
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
    resumeFileName: student.resumeFileName,
    resumeOriginalName: student.resumeOriginalName,
    resumeUrl: student.resumeUrl,
    verificationStatus: student.verificationStatus || "pending",
    academicVerificationStatus: student.academicVerificationStatus || "approved",
    cgpaEditAccess: Boolean(student.cgpaEditAccess),
    placed: student.placed,
    blacklist: student.blacklist,
    createdAt: student.createdAt,
  };
}

function getCgpaFieldForDegree(degree) {
  return degree === "IMTech" ? "ug" : "pg";
}

function isValidCgpa(value) {
  const cgpa = Number.parseFloat(value);
  return Number.isFinite(cgpa) && cgpa >= 0 && cgpa <= 10;
}

export async function registerStudent(req, res) {
  try {
    const {
      name,
      email,
      regno,
      year,
      branch,
      degree,
      password,
      tenth,
      twelfth,
      ug,
      pg,
      resumeUrl,
    } = req.body;

    if (!name || !email || !regno || !year || !branch || !degree || !password || !resumeUrl) {
      return res.status(400).json({ message: "Please fill all required fields." });
    }

    if (!isPublicResumeUrl(resumeUrl)) {
      return res.status(400).json({ message: "Please provide a valid public resume URL." });
    }

    const existingStudent = await Student.findOne({
      $or: [{ email: email.toLowerCase() }, { regno }],
    });

    if (existingStudent) {
      return res
        .status(409)
        .json({ message: "A student with this email or registration number already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const student = await Student.create({
      name,
      email,
      regno,
      year,
      branch,
      degree,
      password: hashedPassword,
      tenth,
      twelfth,
      ug,
      pg,
      resumeFileName: resumeUrl,
      resumeOriginalName: resumeUrl,
      resumeUrl,
    });

    return res.status(201).json({
      message: "Registration successful.",
      user: sanitizeStudent(student),
    });
  } catch (error) {
    console.error("Register student error:", error);
    return res.status(500).json({ message: "Unable to register student right now." });
  }
}

export async function updateStudentProfile(req, res) {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    const { resumeUrl } = req.body;

    if (!resumeUrl) {
      return res.status(400).json({ message: "Please provide a resume URL." });
    }

    if (!isPublicResumeUrl(resumeUrl)) {
      return res.status(400).json({ message: "Please provide a valid public resume URL." });
    }

    student.resumeFileName = resumeUrl;
    student.resumeOriginalName = resumeUrl;
    student.resumeUrl = resumeUrl;

    await student.save();

    return res.status(200).json({
      message: "Student profile updated successfully.",
      user: sanitizeStudent(student),
    });
  } catch (error) {
    console.error("Update student profile error:", error);
    return res.status(500).json({ message: "Unable to update student profile right now." });
  }
}

export async function updateStudentCgpa(req, res) {
  try {
    const { cgpa } = req.body;
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    if (!student.cgpaEditAccess) {
      return res.status(403).json({ message: "Faculty approval is required to edit CGPA." });
    }

    if (!isValidCgpa(cgpa)) {
      return res.status(400).json({ message: "Please enter a valid CGPA between 0 and 10." });
    }

    const cgpaField = getCgpaFieldForDegree(student.degree);
    student[cgpaField] = String(cgpa).trim();
    student.cgpaEditAccess = false;
    student.academicVerificationStatus = "pending";

    await student.save();

    return res.status(200).json({
      message: "CGPA updated. Faculty verification is required before applying for drives.",
      user: sanitizeStudent(student),
    });
  } catch (error) {
    console.error("Update student CGPA error:", error);
    return res.status(500).json({ message: "Unable to update CGPA right now." });
  }
}

export async function getStudents(_req, res) {
  try {
    const students = await Student.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ students: students.map(sanitizeStudent) });
  } catch (error) {
    console.error("Get students error:", error);
    return res.status(500).json({ message: "Unable to fetch students right now." });
  }
}

export async function getStudentById(req, res) {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    return res.status(200).json({ user: sanitizeStudent(student) });
  } catch (error) {
    console.error("Get student error:", error);
    return res.status(500).json({ message: "Unable to fetch student details right now." });
  }
}

export async function updateStudentStatus(req, res) {
  try {
    const { placed, blacklist, cgpaEditAccess, academicVerificationStatus } = req.body;
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    if (typeof placed === "boolean") {
      student.placed = placed;
    }

    if (typeof blacklist === "boolean") {
      student.blacklist = blacklist;
    }

    if (typeof cgpaEditAccess === "boolean") {
      student.cgpaEditAccess = cgpaEditAccess;
    }

    if (academicVerificationStatus === "approved") {
      student.academicVerificationStatus = "approved";
      student.cgpaEditAccess = false;
    }

    await student.save();

    return res.status(200).json({
      message: "Student status updated.",
      user: sanitizeStudent(student),
    });
  } catch (error) {
    console.error("Update student status error:", error);
    return res.status(500).json({ message: "Unable to update student status right now." });
  }
}

export async function updateStudentVerification(req, res) {
  try {
    const { verificationStatus } = req.body;

    if (!["approved", "rejected"].includes(verificationStatus)) {
      return res.status(400).json({ message: "Please choose a valid verification action." });
    }

    if (verificationStatus === "rejected") {
      const rejectedStudent = await Student.findByIdAndDelete(req.params.id);

      if (!rejectedStudent) {
        return res.status(404).json({ message: "Student not found." });
      }

      return res.status(200).json({ message: "Student registration rejected and deleted." });
    }

    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    student.verificationStatus = "approved";
    await student.save();

    return res.status(200).json({
      message: "Student registration approved.",
      user: sanitizeStudent(student),
    });
  } catch (error) {
    console.error("Update student verification error:", error);
    return res.status(500).json({ message: "Unable to update student verification right now." });
  }
}
