// app/api/models/contest.models.ts
import mongoose from "mongoose";

const contestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    problems: [{ type: mongoose.Schema.Types.ObjectId, ref: "Problem" }],
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const Contest =
  mongoose.models.Contest || mongoose.model("Contest", contestSchema);

export default Contest;
