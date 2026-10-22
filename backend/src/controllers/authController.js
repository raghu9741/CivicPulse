import { login, register, publicUser } from "../services/authService.js";
import { asyncHandler, AppError } from "../utils/errors.js";

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 24 * 60 * 60 * 1000
});

export const registerUser = asyncHandler(async (req, res) => {
  const user = await register(req.body);
  res.status(201).json({ user });
});

export const loginUser = asyncHandler(async (req, res) => {
  const result = await login(req.body);
  res.cookie("civicpulse_token", result.token, cookieOptions());
  res.json({ user: result.user });
});

export const logoutUser = (req, res) => {
  res.clearCookie("civicpulse_token", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" });
  res.status(204).end();
};

export const getMe = (req, res) => res.json({ user: publicUser(req.user) });

export const updateProfile = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100) throw new AppError("Name must be between 2 and 100 characters", 400);
  req.user.name = name.trim();
  await req.user.save();
  res.json({ user: publicUser(req.user) });
});
