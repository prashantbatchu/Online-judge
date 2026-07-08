// import { connectDB } from "@/app/api/config/db";
// import { NextResponse } from "next/server";
// import Submission from "@/app/api/models/submission.models";
// import mongoose from "mongoose";

// export async function GET(req: Request, { params }: { params: Promise<{ userId: string }> }) {
//   try {
//     await connectDB();
//     const { userId } = await params;

//     // Fetch only 'Accepted' submissions to count solved problems
//     const submissions = await Submission.find({ 
//       user: new mongoose.Types.ObjectId(userId),
//       status: "Accepted" 
//     }).sort({ createdAt: -1 });

//     return NextResponse.json({ success: true, submissions });
//   } catch (error: any) {
//     return NextResponse.json({ success: false, message: error.message });
//   }
// }

// app/api/submissions/user/[userId]/route.ts
// Returns ALL submissions for a user (for solved status on problems page)
import { connectDB } from "@/app/api/config/db";
import { NextResponse } from "next/server";
import Submission from "@/app/api/models/submission.models";
import mongoose from "mongoose";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await connectDB();
    const { userId } = await params;

    const submissions = await Submission.find({
      user: new mongoose.Types.ObjectId(userId),
    })
      .populate("problem", "_id title difficulty")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, submissions });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}