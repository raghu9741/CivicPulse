import mongoose from "mongoose";
import Complaint, { CATEGORIES, PRIORITIES, STATUSES } from "../models/Complaint.js";
import ComplaintLog from "../models/ComplaintLog.js";
import Department from "../models/Department.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { AppError } from "../utils/errors.js";

async function transactional(work) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => { result = await work(session); });
    return result;
  } finally {
    await session.endSession();
  }
}

export async function createComplaint(input, citizen) {
  const { title, description, category, priority = "Normal", location } = input;
  if (typeof title !== "string" || title.trim().length < 4 || title.trim().length > 150) throw new AppError("Title must be between 4 and 150 characters", 400);
  if (typeof description !== "string" || description.trim().length < 10 || description.trim().length > 5000) throw new AppError("Description must be between 10 and 5000 characters", 400);
  if (!CATEGORIES.includes(category)) throw new AppError("Choose a valid complaint category", 400);
  if (!PRIORITIES.includes(priority)) throw new AppError("Choose a valid priority", 400);
  if (typeof location !== "string" || !location.trim() || location.length > 300) throw new AppError("Location is required and must be 300 characters or fewer", 400);

  return transactional(async (session) => {
    const [complaint] = await Complaint.create([{
      title: title.trim(), description: description.trim(), category, priority, location: location.trim(), citizenId: citizen.id
    }], { session });
    await ComplaintLog.create([{ complaintId: complaint.id, newStatus: "Submitted", remarks: "Complaint submitted", changedBy: citizen.id }], { session });
    await Notification.create([{ recipientId: citizen.id, complaintId: complaint.id, message: `Your complaint "${complaint.title}" was submitted.` }], { session });
    return complaint;
  });
}

export async function assignComplaint(complaintId, { departmentId, officerId }, admin) {
  if (!mongoose.isValidObjectId(departmentId) || !mongoose.isValidObjectId(officerId)) throw new AppError("A valid department and officer are required", 400);
  return transactional(async (session) => {
    const department = await Department.findById(departmentId).session(session);
    const officer = await User.findOne({ _id: officerId, role: "Officer" }).session(session);
    const complaint = await Complaint.findById(complaintId).session(session);
    if (!department) throw new AppError("Department not found", 404);
    if (!officer) throw new AppError("Officer not found", 404);
    if (String(officer.departmentId) !== String(department.id)) throw new AppError("Officer does not belong to the selected department", 400);
    if (!complaint) throw new AppError("Complaint not found", 404);
    if (["Resolved", "Rejected"].includes(complaint.status)) throw new AppError("Closed complaints cannot be assigned", 400);
    const previousStatus = complaint.status;
    complaint.departmentId = department.id;
    complaint.assignedOfficerId = officer.id;
    complaint.status = "Assigned";
    await complaint.save({ session });
    await ComplaintLog.create([{ complaintId, previousStatus, newStatus: "Assigned", remarks: "Complaint assigned by administrator", changedBy: admin.id }], { session });
    await Notification.create([
      { recipientId: complaint.citizenId, complaintId, message: `Your complaint "${complaint.title}" has been assigned.` },
      { recipientId: officer.id, complaintId, message: `Complaint "${complaint.title}" has been assigned to you.` }
    ], { session });
    return complaint;
  });
}

export async function updateStatus(complaintId, { status, remarks = "" }, officer) {
  if (!STATUSES.includes(status) || status === "Submitted" || status === "Assigned") throw new AppError("Choose a valid officer status", 400);
  if (typeof remarks !== "string" || remarks.length > 2000) throw new AppError("Remarks must be 2000 characters or fewer", 400);
  return transactional(async (session) => {
    const complaint = await Complaint.findById(complaintId).session(session);
    if (!complaint) throw new AppError("Complaint not found", 404);
    if (String(complaint.assignedOfficerId) !== String(officer.id)) throw new AppError("This complaint is not assigned to you", 403);
    if (["Resolved", "Rejected"].includes(complaint.status)) throw new AppError("Closed complaints cannot be updated", 400);
    const previousStatus = complaint.status;
    complaint.status = status;
    if (remarks.trim()) complaint.resolutionNotes = remarks.trim();
    complaint.resolvedAt = status === "Resolved" ? new Date() : null;
    await complaint.save({ session });
    await ComplaintLog.create([{ complaintId, previousStatus, newStatus: status, remarks: remarks.trim(), changedBy: officer.id }], { session });
    await Notification.create([{ recipientId: complaint.citizenId, complaintId, message: `Your complaint "${complaint.title}" is now ${status.toLowerCase()}.` }], { session });
    return complaint;
  });
}

export async function listComplaints(user, filters = {}) {
  const query = {};
  if (user.role === "Citizen") query.citizenId = user.id;
  if (user.role === "Officer") query.assignedOfficerId = user.id;
  for (const field of ["status", "category", "priority"]) {
    if (filters[field]) query[field] = filters[field];
  }
  if (filters.search) {
    const term = String(filters.search).trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.$or = [{ title: { $regex: term, $options: "i" } }, { location: { $regex: term, $options: "i" } }];
  }
  return Complaint.find(query)
    .populate("citizenId", "name email")
    .populate("departmentId", "departmentName")
    .populate("assignedOfficerId", "name email")
    .sort({ createdAt: -1 }).limit(200);
}

export async function getComplaint(complaintId, user) {
  const complaint = await Complaint.findById(complaintId)
    .populate("citizenId", "name email")
    .populate("departmentId", "departmentName")
    .populate("assignedOfficerId", "name email");
  if (!complaint) throw new AppError("Complaint not found", 404);
  if (user.role === "Citizen" && String(complaint.citizenId.id) !== String(user.id)) throw new AppError("Complaint not found", 404);
  if (user.role === "Officer" && String(complaint.assignedOfficerId?.id) !== String(user.id)) throw new AppError("Complaint not found", 404);
  const history = await ComplaintLog.find({ complaintId }).populate("changedBy", "name role").sort({ createdAt: 1 });
  return { complaint, history };
}

export async function dashboardStats(user) {
  const query = user.role === "Citizen" ? { citizenId: user.id } : user.role === "Officer" ? { assignedOfficerId: user.id } : {};
  const [total, groups] = await Promise.all([
    Complaint.countDocuments(query),
    Complaint.aggregate([{ $match: query }, { $group: { _id: "$status", count: { $sum: 1 } } }])
  ]);
  return { total, byStatus: Object.fromEntries(groups.map(({ _id, count }) => [_id, count])) };
}
