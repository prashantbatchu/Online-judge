// app/api/submissions/user/[userId]/route.ts
// Returns ALL submissions for a user (used to compute solved status on the
// problems page and profile page).
import { connectDB } from "@/app/api/config/db";
import { NextResponse } from "next/server";
import Submission from "@/app/api/models/submission.models";
import mongoose from "mongoose";
import { getSessionUser } from "@/app/api/utils/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ success: false, message: "Invalid user id." }, { status: 400 });
    }

    // A user's full submission history (including their code/failure
    // messages) is private — only that user (or an admin) may fetch it.
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ success: false, message: "You must be logged in." }, { status: 401 });
    }
    if (sessionUser.userId !== userId && sessionUser.role !== "admin") {
      return NextResponse.json({ success: false, message: "Forbidden." }, { status: 403 });
    }

    await connectDB();

    const submissions = await Submission.find({
      user: new mongoose.Types.ObjectId(userId),
    })
      .populate("problem", "_id title difficulty")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, submissions });
  } catch (error: any) {
    console.error("User submissions fetch error:", error);
    return NextResponse.json(
      { success: false, message: "Server error." },
      { status: 500 }
    );
  }
}
