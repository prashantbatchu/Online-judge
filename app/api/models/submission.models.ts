import mongoose, { Schema, model, models } from "mongoose";

const SubmissionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User", // References your User model
      required: true,
    },
    problem: {
      type: Schema.Types.ObjectId,
      ref: "Problem", // References your Problem model
      required: true,
    },
    language: {
      type: String,
      required: true,
      enum: ["cpp", "java", "python", "javascript"], // Supported languages
    },
    code: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["Pending", "Accepted", "Wrong Answer", "TLE", "Runtime Error", "Compilation Error"],
      default: "Pending",
    },
    // Performance metrics
    executionTime: {
      type: Number, // in milliseconds
      default: 0,
    },
    memory: {
      type: Number, // in KB or MB
      default: 0,
    },
    // For debugging/UI: which test case failed?
    failedTestCaseIndex: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true } // This automatically gives us 'createdAt' for streak logic
);

const Submission = models.Submission || model("Submission", SubmissionSchema);

export default Submission;