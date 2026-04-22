import bcrypt from "bcryptjs";
import CoordinatorAuth from "../models/CoordinatorAuth.js";
import FacultyAuth from "../models/FacultyAuth.js";

const demoUsers = [
  {
    role: "faculty",
    username: "faculty_admin",
    password: "faculty123",
    email: "faculty_admin@portal.local",
  },
  {
    role: "coordinator",
    username: "coordinator_admin",
    password: "coord123",
    email: "coordinator_admin@portal.local",
  },
];

export async function seedDemoUsers() {
  for (const demoUser of demoUsers) {
    const Model = demoUser.role === "faculty" ? FacultyAuth : CoordinatorAuth;
    const existingUser = await Model.findOne({ username: demoUser.username });

    if (existingUser) {
      const update = {};

      if (!existingUser.email) {
        update.email = demoUser.email;
      }

      if (Object.keys(update).length > 0) {
        await Model.updateOne({ _id: existingUser._id }, { $set: update });
        console.log(`Updated demo ${demoUser.role} user: ${demoUser.username}`);
      }

      continue;
    }

    const hashedPassword = await bcrypt.hash(demoUser.password, 10);

    await Model.create({
      username: demoUser.username,
      email: demoUser.email,
      password: hashedPassword,
    });

    console.log(`Seeded demo ${demoUser.role} user: ${demoUser.username}`);
  }
}
