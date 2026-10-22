import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { AppError } from "../utils/errors.js";

export async function register({ name, email, password }) {
  if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100) throw new AppError("Name must be between 2 and 100 characters", 400);
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AppError("Enter a valid email address", 400);
  if (typeof password !== "string" || password.length < 8 || password.length > 72) throw new AppError("Password must be between 8 and 72 characters", 400);
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name: name.trim(), email: email.trim().toLowerCase(), passwordHash, role: "Citizen" });
  return publicUser(user);
}

export async function login({ email, password }) {
  if (typeof email !== "string" || typeof password !== "string") throw new AppError("Email and password are required", 400);
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+passwordHash");
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new AppError("Email or password is incorrect", 401);
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "1d" });
  return { token, user: publicUser(user) };
}

export function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, departmentId: user.departmentId };
}
