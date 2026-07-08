import { connectDB } from "@/app/api/config/db";
import { NextResponse } from "next/server";
import Submission from "@/app/api/models/submission.models";
import User from "@/app/api/models/user.models";
import mongoose from "mongoose";

export async function GET(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    await connectDB();
    const { userId } = await params;

    // 1. Get User Info
    const user = await User.findById(userId).select("-password");

    // 2. Get All Accepted Submissions for Heatmap
    // const submissions = await Submission.find({ 
    //   user: new mongoose.Types.ObjectId(userId),
    //   status: "Accepted" 
    // }).select("createdAt problem");

    // 3. Get Difficulty Breakdown (Requires populating problem difficulty)
    const populatedSubmissions = await Submission.find({ 
      user: new mongoose.Types.ObjectId(userId),
    //   status: "Accepted" 
    }).populate("problem", "difficulty");

    return NextResponse.json({ 
      success: true, 
      user, 
      submissions: populatedSubmissions 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message });
  }
}