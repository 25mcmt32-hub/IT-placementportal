import { Router } from "express";
import { createMaterial, deleteMaterial, getMaterials } from "../controllers/materialHubController.js";
import { createUploader } from "../config/uploads.js";

const router = Router();
const materialUpload = createUploader("materials");

router.get("/", getMaterials);
router.post("/", materialUpload.single("file"), createMaterial);
router.delete("/:id", deleteMaterial);

export default router;
