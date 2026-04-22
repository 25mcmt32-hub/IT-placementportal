import bcrypt from "bcryptjs";
import Student from "../models/Student.js";
import { buildFileUrl } from "../config/uploads.js";

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
    placed: student.placed,
    blacklist: student.blacklist,
    createdAt: student.createdAt,
  };
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
    } = req.body;

    if (!name || !email || !regno || !year || !branch || !degree || !password) {
      return res.status(400).json({ message: "Please fill all required fields." });
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
      resumeFileName: req.file?.filename || "",
      resumeOriginalName: req.file?.originalname || "",
      resumeUrl: req.file ? buildFileUrl(req, "resumes", req.file.filename) : "",
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

    const {
      name,
      email,
      regno,
      year,
      branch,
      degree,
      tenth,
      twelfth,
      ug,
      pg,
      password,
    } = req.body;

    const nextEmail = (email || student.email).toLowerCase();
    const nextRegno = regno || student.regno;

    const duplicateStudent = await Student.findOne({
      _id: { $ne: student._id },
      $or: [{ email: nextEmail }, { regno: nextRegno }],
    });

    if (duplicateStudent) {
      return res.status(409).json({ message: "Email or registration number is already in use." });
    }

    student.name = name || student.name;
    student.email = nextEmail;
    student.regno = nextRegno;
    student.year = year || student.year;
    student.branch = branch || student.branch;
    student.degree = degree || student.degree;
    student.tenth = tenth ?? student.tenth;
    student.twelfth = twelfth ?? student.twelfth;
    student.ug = ug ?? student.ug;
    student.pg = pg ?? student.pg;

    if (password) {
      student.password = await bcrypt.hash(password, 10);
    }

    if (req.file) {
      student.resumeFileName = req.file.filename;
      student.resumeOriginalName = req.file.originalname;
      student.resumeUrl = buildFileUrl(req, "resumes", req.file.filename);
    }

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
    const { placed, blacklist } = req.body;
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
