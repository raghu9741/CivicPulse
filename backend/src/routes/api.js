import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authenticate, authorize } from "../middleware/auth.js";
import { getMe, loginUser, logoutUser, registerUser, updateProfile } from "../controllers/authController.js";
import {
  assign, citizenHistory, create, createDepartment, createOfficer, departments, detail, list,
  markNotificationRead, notifications, officers, stats, update
} from "../controllers/complaintController.js";

const router = Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });

router.post("/auth/register", authLimiter, registerUser);
router.post("/auth/login", authLimiter, loginUser);
router.post("/auth/logout", logoutUser);
router.get("/auth/me", authenticate, getMe);
router.patch("/auth/profile", authenticate, updateProfile);

router.get("/dashboard/stats", authenticate, stats);
router.route("/complaints").get(authenticate, list).post(authenticate, authorize("Citizen"), create);
router.get("/complaints/:id", authenticate, detail);
router.get("/complaints/:id/history", authenticate, citizenHistory);
router.patch("/complaints/:id/assignment", authenticate, authorize("Admin"), assign);
router.patch("/complaints/:id/status", authenticate, authorize("Officer"), update);

router.get("/departments", authenticate, departments);
router.post("/departments", authenticate, authorize("Admin"), createDepartment);
router.get("/officers", authenticate, authorize("Admin"), officers);
router.post("/officers", authenticate, authorize("Admin"), createOfficer);
router.get("/notifications", authenticate, notifications);
router.patch("/notifications/:id/read", authenticate, markNotificationRead);

export default router;
