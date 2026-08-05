import { connectDB } from "../../config/db";
import problemModels from "../../models/problem.models";
import { NextResponse } from "next/server";
import { requireAdmin } from "../../utils/auth";

const ALLOWED_DIFFICULTIES = ["Easy", "Medium", "Hard"];

export async function POST(req: Request) {
  try {
    // Real, server-side admin check — the old version only had a comment
    // saying to check this and never actually verified anything, so any
    // authenticated (or even unauthenticated) client could create problems.
    const auth = await requireAdmin();
    if (!auth.ok) {
      return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    await connectDB();

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, message: "Invalid JSON body." }, { status: 400 });
    }

    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const description = typeof body?.description === "string" ? body.description.trim() : "";
    const difficulty = ALLOWED_DIFFICULTIES.includes(body?.difficulty) ? body.difficulty : "Easy";
    const tags = Array.isArray(body?.tags) ? body.tags.filter((t: any) => typeof t === "string" && t.trim()) : [];
    const testCases = Array.isArray(body?.testCases) ? body.testCases : [];

    if (!title) {
      return NextResponse.json({ success: false, message: "Title is required." }, { status: 400 });
    }
    if (!description) {
      return NextResponse.json({ success: false, message: "Description is required." }, { status: 400 });
    }
    if (testCases.length === 0) {
      return NextResponse.json(
        { success: false, message: "At least one test case is required." },
        { status: 400 }
      );
    }
    const invalidCase = testCases.find(
      (tc: any) => typeof tc?.input !== "string" || typeof tc?.output !== "string" || tc.output.trim() === ""
    );
    if (invalidCase) {
      return NextResponse.json(
        { success: false, message: "Every test case needs an input and a non-empty expected output." },
        { status: 400 }
      );
    }

    const problemCount = await problemModels.countDocuments();

    const newProblem = await problemModels.create({
      number: problemCount + 1,
      title,
      description,
      difficulty,
      tags,
      inputFormat: typeof body?.inputFormat === "string" ? body.inputFormat : "",
      outputFormat: typeof body?.outputFormat === "string" ? body.outputFormat : "",
      constraints: typeof body?.constraints === "string" ? body.constraints : "",
      testCases,
    });

    return NextResponse.json({ success: true, problem: newProblem }, { status: 201 });
  } catch (err: any) {
    console.error("Create problem error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to create problem." },
      { status: 500 }
    );
  }
}
