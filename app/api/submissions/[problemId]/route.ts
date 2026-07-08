import { connectDB } from "../../config/db";
import { NextResponse } from "next/server";
import Submission from "../../models/submission.models";
import mongoose from "mongoose";

export async function GET(
  req: Request, 
  { params }: { params: Promise<{ problemId: string }> } // Define as Promise
) {
  try {
    await connectDB();

    // 1. UNWRAP the params first
    const resolvedParams = await params; 
    const problemId = resolvedParams.problemId;

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId || !problemId) {
      return NextResponse.json({ success: false, message: "Required IDs missing" }, { status: 400 });
    }

    // 2. Now use the unwrapped string
    const submissions = await Submission.find({ 
      problem: new mongoose.Types.ObjectId(problemId), 
      user: new mongoose.Types.ObjectId(userId) 
    }).sort({ createdAt: -1 });

    console.log(`Found ${submissions.length} submissions for User: ${userId} and Problem: ${problemId}`);

    return NextResponse.json({ success: true, submissions });
  } catch (error: any) {
    console.error("Submission Fetch Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}