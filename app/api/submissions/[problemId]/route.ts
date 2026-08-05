import { connectDB } from "../../config/db";
import { NextResponse } from "next/server";
import Submission from "../../models/submission.models";
import mongoose from "mongoose";
import { getSessionUser } from "../../utils/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ problemId: string }> }
) {
  try {
    // Submissions are private — a user's code and status for a problem
    // should only be visible to that user (or an admin), never fetchable
    // for an arbitrary userId passed in the query string.
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ success: false, message: "You must be logged in." }, { status: 401 });
    }

    const resolvedParams = await params;
    const problemId = resolvedParams.problemId;

    if (!mongoose.Types.ObjectId.isValid(problemId)) {
      return NextResponse.json({ success: false, message: "Invalid problem id." }, { status: 400 });
    }

    await connectDB();

    const submissions = await Submission.find({
      problem: new mongoose.Types.ObjectId(problemId),
      user: new mongoose.Types.ObjectId(sessionUser.userId),
    }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, submissions });
  } catch (error: any) {
    console.error("Submission Fetch Error:", error);
    return NextResponse.json({ success: false, message: "Server error." }, { status: 500 });
  }
}
