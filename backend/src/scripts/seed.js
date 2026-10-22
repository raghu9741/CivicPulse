import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDatabase } from "../config/db.js";
import Department from "../models/Department.js";
import User from "../models/User.js";

if (process.env.NODE_ENV !== "development") {
  throw new Error("The demo seed script can only run when NODE_ENV=development");
}
await connectDatabase();
const department = await Department.findOneAndUpdate(
  { departmentName: "Public Works" },
  { departmentName: "Public Works", description: "Roads, sanitation, and public infrastructure" },
  { upsert: true, new: true, setDefaultsOnInsert: true }
);

for (const account of [
  { name: "CivicPulse Admin", email: "admin@example.com", role: "Admin", departmentId: null },
  { name: "Demo Officer", email: "officer@example.com", role: "Officer", departmentId: department.id }
]) {
  const existing = await User.findOne({ email: account.email });
  if (!existing) {
    await User.create({ ...account, passwordHash: await bcrypt.hash("DemoPass123!", 12) });
    console.log(`Created ${account.role}: ${account.email}`);
  } else {
    console.log(`Kept existing account: ${account.email}`);
  }
}
await mongoose.disconnect();
