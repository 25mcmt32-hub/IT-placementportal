import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { connectDatabase } from "./config/db.js";
import { migrateLegacyUsers } from "./config/migrateLegacyUsers.js";
import { seedDemoUsers } from "./config/seedDemoUsers.js";
import { uploadsRoot } from "./config/uploads.js";
import authRoutes from "./routes/authRoutes.js";
import materialHubRoutes from "./routes/materialHubRoutes.js";
import placementDriveRoutes from "./routes/placementDriveRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({ message: "Backend is running." });
});

app.use("/uploads", express.static(path.resolve(uploadsRoot)));
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/drives", placementDriveRoutes);
app.use("/api/materials", materialHubRoutes);

connectDatabase()
  .then(async () => {
    await migrateLegacyUsers();
    await seedDemoUsers();
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
    process.exit(1);
  });
