import { Router } from "express";
import {
  getStudentById,
  getStudents,
  registerStudent,
  updateStudentProfile,
  updateStudentStatus,
} from "../controllers/studentController.js";
import { createUploader } from "../config/uploads.js";

const router = Router();
const resumeUpload = createUploader("resumes");

router.post("/register", resumeUpload.single("resume"), registerStudent);
router.get("/", getStudents);
router.get("/:id", getStudentById);
router.patch("/:id", resumeUpload.single("resume"), updateStudentProfile);
router.patch("/:id/status", updateStudentStatus);

export default router;
