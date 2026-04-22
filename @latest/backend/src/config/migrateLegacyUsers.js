import CoordinatorAuth from "../models/CoordinatorAuth.js";
import FacultyAuth from "../models/FacultyAuth.js";
import Student from "../models/Student.js";
import User from "../models/User.js";

export async function migrateLegacyUsers() {
  const legacyUsers = await User.find({}).lean();

  for (const legacyUser of legacyUsers) {
    if (legacyUser.role === "faculty") {
      await FacultyAuth.updateOne(
        { username: legacyUser.username },
        {
          $setOnInsert: {
            username: legacyUser.username,
            email: legacyUser.email,
            password: legacyUser.password,
          },
        },
        { upsert: true }
      );
      continue;
    }

    if (legacyUser.role === "coordinator") {
      await CoordinatorAuth.updateOne(
        { username: legacyUser.username },
        {
          $setOnInsert: {
            username: legacyUser.username,
            email: legacyUser.email,
            password: legacyUser.password,
          },
        },
        { upsert: true }
      );
      continue;
    }

    await Student.updateOne(
      { email: legacyUser.email },
      {
        $setOnInsert: {
          name: legacyUser.name,
          email: legacyUser.email,
          regno: legacyUser.regno,
          year: legacyUser.year || "",
          branch: legacyUser.branch || "",
          degree: legacyUser.degree || "",
          password: legacyUser.password,
          tenth: legacyUser.tenth || "",
          twelfth: legacyUser.twelfth || "",
          ug: legacyUser.ug || "",
          pg: legacyUser.pg || "",
          resumeFileName: legacyUser.resumeFileName || "",
          placed: legacyUser.placed || false,
          blacklist: legacyUser.blacklist || false,
        },
      },
      { upsert: true }
    );
  }

  if (legacyUsers.length > 0) {
    console.log(`Migrated legacy user records into separate collections`);
  }
}
