import { Router } from "express";
import {
  applyForDrive,
  createPlacementDrive,
  deletePlacementDrive,
  exportDriveApplications,
  getPlacementDrives,
  updatePlacementDrive,
} from "../controllers/placementDriveController.js";
import { createUploader } from "../config/uploads.js";

const router = Router();
const driveUpload = createUploader("drives");

router.get("/", getPlacementDrives);
router.post("/", driveUpload.single("jd"), createPlacementDrive);
router.patch("/:id", driveUpload.single("jd"), updatePlacementDrive);
router.delete("/:id", deletePlacementDrive);
router.post("/:id/apply", applyForDrive);
router.get("/:id/applications/export", exportDriveApplications);

export default router;
