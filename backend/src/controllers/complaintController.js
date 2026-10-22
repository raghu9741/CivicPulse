import Complaint from "../models/Complaint.js";
import ComplaintLog from "../models/ComplaintLog.js";
import Notification from "../models/Notification.js";
import Department from "../models/Department.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { assignComplaint, createComplaint, dashboardStats, getComplaint, listComplaints, updateStatus } from "../services/complaintService.js";
import { asyncHandler, AppError } from "../utils/errors.js";

export const create = asyncHandler(async (req, res) => res.status(201).json({ complaint: await createComplaint(req.body, req.user) }));
export const list = asyncHandler(async (req, res) => res.json({ complaints: await listComplaints(req.user, req.query) }));
export const detail = asyncHandler(async (req, res) => res.json(await getComplaint(req.params.id, req.user)));
export const assign = asyncHandler(async (req, res) => res.json({ complaint: await assignComplaint(req.params.id, req.body, req.user) }));
export const update = asyncHandler(async (req, res) => res.json({ complaint: await updateStatus(req.params.id, req.body, req.user) }));
export const stats = asyncHandler(async (req, res) => res.json(await dashboardStats(req.user)));

export const departments = asyncHandler(async (req, res) => res.json({ departments: await Department.find().sort({ departmentName: 1 }) }));
export const createDepartment = asyncHandler(async (req, res) => {
  const { departmentName, description = "" } = req.body;
  if (typeof departmentName !== "string" || !departmentName.trim() || departmentName.length > 100) throw new AppError("Department name is required and must be 100 characters or fewer", 400);
  if (typeof description !== "string" || description.length > 500) throw new AppError("Description must be 500 characters or fewer", 400);
  res.status(201).json({ department: await Department.create({ departmentName: departmentName.trim(), description: description.trim() }) });
});
export const officers = asyncHandler(async (req, res) => {
  const query = { role: "Officer" };
  if (req.query.departmentId) query.departmentId = req.query.departmentId;
  const users = await User.find(query).select("name email role departmentId").populate("departmentId", "departmentName").sort({ name: 1 });
  res.json({ officers: users });
});
export const createOfficer = asyncHandler(async (req, res) => {
  const { name, email, password, departmentId } = req.body;
  if (typeof name !== "string" || name.trim().length < 2 || name.length > 100) throw new AppError("Officer name must be between 2 and 100 characters", 400);
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AppError("Enter a valid email address", 400);
  if (typeof password !== "string" || password.length < 8 || password.length > 72) throw new AppError("Password must be between 8 and 72 characters", 400);
  if (!await Department.exists({ _id: departmentId })) throw new AppError("Department not found", 404);
  const officer = await User.create({ name: name.trim(), email: email.trim().toLowerCase(), passwordHash: await bcrypt.hash(password, 12), role: "Officer", departmentId });
  res.status(201).json({ officer: { id: officer.id, name: officer.name, email: officer.email, role: officer.role, departmentId: officer.departmentId } });
});
export const notifications = asyncHandler(async (req, res) => {
  res.json({ notifications: await Notification.find({ recipientId: req.user.id }).sort({ createdAt: -1 }).limit(100) });
});
export const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipientId: req.user.id }, { isRead: true }, { new: true }
  );
  if (!notification) throw new AppError("Notification not found", 404);
  res.json({ notification });
});
export const citizenHistory = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findOne({ _id: req.params.id, citizenId: req.user.id });
  if (!complaint) throw new AppError("Complaint not found", 404);
  res.json({ history: await ComplaintLog.find({ complaintId: complaint.id }).populate("changedBy", "name role").sort({ createdAt: 1 }) });
});
