import mongoose from "mongoose";

const problemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true }, // The story/rules
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Easy' },
  tags: [String], // e.g., ["DP", "Graphs"]
  inputFormat: String,
  outputFormat: String,
  constraints: String,
  // The hidden test cases for the Judge
  testCases: [
    {
      input: { type: String, required: true },
      output: { type: String, required: true },
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Problem || mongoose.model("Problem", problemSchema);