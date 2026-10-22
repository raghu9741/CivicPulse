import mongoose from "mongoose";

export const CATEGORIES = ["Water", "Electricity", "Roads", "Waste Management", "Sanitation", "Public Safety", "Other"];
export const PRIORITIES = ["Normal", "High", "Critical"];
export const STATUSES = ["Submitted", "Assigned", "In Progress", "Resolved", "Rejected"];

const complaintSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 4, maxlength: 150 },
    description: { type: String, required: true, trim: true, minlength: 10, maxlength: 5000 },
    category: { type: String, enum: CATEGORIES, required: true },
    priority: { type: String, enum: PRIORITIES, required: true, default: "Normal" },
    status: { type: String, enum: STATUSES, required: true, default: "Submitted" },
    location: { type: String, required: true, trim: true, maxlength: 300 },
    citizenId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department", default: null },
    assignedOfficerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    resolutionNotes: { type: String, trim: true, maxlength: 2000, default: "" },
    resolvedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

complaintSchema.index({ status: 1, category: 1, priority: 1 });
complaintSchema.index({ assignedOfficerId: 1, status: 1 });

export default mongoose.model("Complaint", complaintSchema);
