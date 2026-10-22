import mongoose from "mongoose";

const complaintLogSchema = new mongoose.Schema(
  {
    complaintId: { type: mongoose.Schema.Types.ObjectId, ref: "Complaint", required: true, index: true },
    previousStatus: { type: String, default: null },
    newStatus: { type: String, required: true },
    remarks: { type: String, trim: true, maxlength: 2000, default: "" },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

export default mongoose.model("ComplaintLog", complaintLogSchema);
