import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    departmentName: { type: String, required: true, trim: true, unique: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 500 }
  },
  { timestamps: true }
);

export default mongoose.model("Department", departmentSchema);
