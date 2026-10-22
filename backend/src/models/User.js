import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["Citizen", "Officer", "Admin"], default: "Citizen" },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department", default: null }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
