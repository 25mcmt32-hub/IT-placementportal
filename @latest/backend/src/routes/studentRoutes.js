import { Router } from "express";
import {
  getStudentById,
  getStudents,
  registerStudent,
  updateStudentCgpa,
  updateStudentVerification,
  updateStudentProfile,
  updateStudentStatus,
} from "../controllers/studentController.js";

const router = Router();

router.post("/register", registerStudent);
router.get("/", getStudents);
router.get("/:id", getStudentById);
router.patch("/:id", updateStudentProfile);
router.patch("/:id/cgpa", updateStudentCgpa);
router.patch("/:id/status", updateStudentStatus);
router.patch("/:id/verification", updateStudentVerification);

export default router;
