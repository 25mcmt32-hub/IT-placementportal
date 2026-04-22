import fs from "fs";
import path from "path";
import multer from "multer";

const uploadsRoot = path.resolve(process.cwd(), "uploads");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function createStorage(folderName) {
  const targetDir = path.join(uploadsRoot, folderName);
  ensureDir(targetDir);

  return multer.diskStorage({
    destination: (_req, _file, callback) => {
      callback(null, targetDir);
    },
    filename: (_req, file, callback) => {
      const safeName = file.originalname.replace(/\s+/g, "_");
      callback(null, `${Date.now()}-${safeName}`);
    },
  });
}

export function createUploader(folderName) {
  return multer({ storage: createStorage(folderName) });
}

export function buildFileUrl(req, folderName, fileName) {
  if (!fileName) {
    return "";
  }

  return `${req.protocol}://${req.get("host")}/uploads/${folderName}/${fileName}`;
}

export { uploadsRoot };
