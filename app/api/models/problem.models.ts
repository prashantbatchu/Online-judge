import mongoose from "mongoose";

const problemSchema = new mongoose.Schema({
  // A stable, human-friendly number (like LeetCode's #1, #2...) that never
  // changes even as problems are filtered/sorted/added/removed elsewhere.
  number: { type: Number, unique: true, sparse: true },
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