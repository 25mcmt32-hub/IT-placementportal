import mongoose from "mongoose";

export async function connectDatabase() {
  const mongoUri =
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/placement_portal";

  await mongoose.connect(mongoUri);
  console.log(`MongoDB connected: ${mongoUri}`);
}
