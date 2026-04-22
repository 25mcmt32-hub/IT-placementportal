import MaterialHub from "../models/MaterialHub.js";
import { buildFileUrl } from "../config/uploads.js";

export async function getMaterials(_req, res) {
  try {
    const materials = await MaterialHub.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ materials });
  } catch (error) {
    console.error("Get materials error:", error);
    return res.status(500).json({ message: "Unable to fetch materials right now." });
  }
}

export async function createMaterial(req, res) {
  try {
    const { title, createdBy } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Material title is required." });
    }

    const material = await MaterialHub.create({
      title,
      fileName: req.file?.filename || "",
      fileOriginalName: req.file?.originalname || "",
      fileUrl: req.file ? buildFileUrl(req, "materials", req.file.filename) : "",
      createdBy,
    });

    return res.status(201).json({
      message: "Material created successfully.",
      material,
    });
  } catch (error) {
    console.error("Create material error:", error);
    return res.status(500).json({ message: "Unable to create material right now." });
  }
}

export async function deleteMaterial(req, res) {
  try {
    const material = await MaterialHub.findByIdAndDelete(req.params.id);

    if (!material) {
      return res.status(404).json({ message: "Material not found." });
    }

    return res.status(200).json({ message: "Material deleted successfully." });
  } catch (error) {
    console.error("Delete material error:", error);
    return res.status(500).json({ message: "Unable to delete material right now." });
  }
}
