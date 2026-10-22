import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    complaintId: { type: mongoose.Schema.Types.ObjectId, ref: "Complaint", default: null },
    message: { type: String, required: true, maxlength: 300 },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
