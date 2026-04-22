import { Router } from "express";
import {
  coordinatorForgotPassword,
  coordinatorLogin,
  facultyForgotPassword,
  facultyLogin,
  studentForgotPassword,
  studentLogin,
} from "../controllers/authController.js";

const router = Router();

router.post("/student/login", studentLogin);
router.post("/faculty/login", facultyLogin);
router.post("/coordinator/login", coordinatorLogin);
router.post("/student/forgot-password", studentForgotPassword);
router.post("/faculty/forgot-password", facultyForgotPassword);
router.post("/coordinator/forgot-password", coordinatorForgotPassword);

export default router;
