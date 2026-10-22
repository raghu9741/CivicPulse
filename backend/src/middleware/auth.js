import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { AppError, asyncHandler } from "../utils/errors.js";

export const authenticate = asyncHandler(async (req, res, next) => {
  const token = req.cookies.civicpulse_token ?? req.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new AppError("Authentication required", 401);
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new AppError("Invalid or expired session", 401);
  }
  const user = await User.findById(payload.sub).select("-passwordHash");
  if (!user) throw new AppError("Account no longer exists", 401);
  req.user = user;
  next();
});

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return next(new AppError("You are not authorized to do that", 403));
    next();
  };
}
