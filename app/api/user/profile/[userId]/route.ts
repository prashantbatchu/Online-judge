import { connectDB } from "@/app/api/config/db";
import { NextResponse } from "next/server";
import Submission from "@/app/api/models/submission.models";
import User from "@/app/api/models/user.models";
import mongoose from "mongoose";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, message: "Invalid user id." },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 }
      );
    }

    const submissions = await Submission.find({
      user: new mongoose.Types.ObjectId(userId),
    }).populate("problem", "difficulty title");

    // Compute this user's global rank by unique solved-problem count so the
    // profile page doesn't have to show a permanent "#---" placeholder.
    const acceptedByUser = await Submission.aggregate([
      { $match: { status: "Accepted" } },
      { $group: { _id: { user: "$user", problem: "$problem" } } },
      { $group: { _id: "$_id.user", solved: { $sum: 1 } } },
      { $sort: { solved: -1 } },
    ]);
    const rankIndex = acceptedByUser.findIndex((e) => e._id.toString() === userId);
    const rank = rankIndex >= 0 ? rankIndex + 1 : null;

    return NextResponse.json({
      success: true,
      user,
      submissions,
      rank,
    });
  } catch (error: any) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load profile." },
      { status: 500 }
    );
  }
}
