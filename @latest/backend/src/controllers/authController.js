import bcrypt from "bcryptjs";
import CoordinatorAuth from "../models/CoordinatorAuth.js";
import FacultyAuth from "../models/FacultyAuth.js";
import Student from "../models/Student.js";

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
    placed: student.placed,
    blacklist: student.blacklist,
    createdAt: student.createdAt,
  };
}

function sanitizeLoginUser(user, role) {
  return {
    id: user._id,
    role,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
  };
}

async function resetPassword(model, query, res) {
  const { newPassword } = query;

  if (!newPassword) {
    return res.status(400).json({ message: "New password is required." });
  }

  const user = await model.findOne(query.filter);

  if (!user) {
    return res.status(404).json({ message: "Account not found." });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  return res.status(200).json({ message: "Password updated successfully." });
}

export async function studentLogin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const student = await Student.findOne({ email: email.toLowerCase() });

    if (!student) {
      return res.status(401).json({ message: "Invalid login credentials." });
    }

    const isPasswordValid = await bcrypt.compare(password, student.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid login credentials." });
    }

    return res.status(200).json({
      message: "Login successful.",
      user: sanitizeStudent(student),
    });
  } catch (error) {
    console.error("Student login error:", error);
    return res.status(500).json({ message: "Unable to log in right now." });
  }
}

export async function facultyLogin(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }

    const faculty = await FacultyAuth.findOne({ username: username.toLowerCase() });

    if (!faculty) {
      return res.status(401).json({ message: "Invalid login credentials." });
    }

    const isPasswordValid = await bcrypt.compare(password, faculty.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid login credentials." });
    }

    return res.status(200).json({
      message: "Login successful.",
      user: sanitizeLoginUser(faculty, "faculty"),
    });
  } catch (error) {
    console.error("Faculty login error:", error);
    return res.status(500).json({ message: "Unable to log in right now." });
  }
}

export async function coordinatorLogin(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }

    const coordinator = await CoordinatorAuth.findOne({ username: username.toLowerCase() });

    if (!coordinator) {
      return res.status(401).json({ message: "Invalid login credentials." });
    }

    const isPasswordValid = await bcrypt.compare(password, coordinator.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid login credentials." });
    }

    return res.status(200).json({
      message: "Login successful.",
      user: sanitizeLoginUser(coordinator, "coordinator"),
    });
  } catch (error) {
    console.error("Coordinator login error:", error);
    return res.status(500).json({ message: "Unable to log in right now." });
  }
}

export async function studentForgotPassword(req, res) {
  try {
    const { email, newPassword } = req.body;
    return await resetPassword(
      Student,
      { filter: { email: (email || "").toLowerCase() }, newPassword },
      res
    );
  } catch (error) {
    console.error("Student forgot password error:", error);
    return res.status(500).json({ message: "Unable to update password right now." });
  }
}

export async function facultyForgotPassword(req, res) {
  try {
    const { username, email, newPassword } = req.body;
    return await resetPassword(
      FacultyAuth,
      {
        filter: {
          username: (username || "").toLowerCase(),
          email: (email || "").toLowerCase(),
        },
        newPassword,
      },
      res
    );
  } catch (error) {
    console.error("Faculty forgot password error:", error);
    return res.status(500).json({ message: "Unable to update password right now." });
  }
}

export async function coordinatorForgotPassword(req, res) {
  try {
    const { username, email, newPassword } = req.body;
    return await resetPassword(
      CoordinatorAuth,
      {
        filter: {
          username: (username || "").toLowerCase(),
          email: (email || "").toLowerCase(),
        },
        newPassword,
      },
      res
    );
  } catch (error) {
    console.error("Coordinator forgot password error:", error);
    return res.status(500).json({ message: "Unable to update password right now." });
  }
}
