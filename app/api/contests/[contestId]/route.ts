// app/api/contests/[contestId]/route.ts
import { connectDB } from "@/app/api/config/db";
import { NextResponse } from "next/server";
import Contest from "@/app/api/models/contest.models";
import mongoose from "mongoose";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ contestId: string }> }
) {
  try {
    const { contestId } = await params;

    if (!mongoose.Types.ObjectId.isValid(contestId)) {
      return NextResponse.json({ success: false, message: "Invalid contest id." }, { status: 400 });
    }

    await connectDB();

    const contest = await Contest.findById(contestId).populate(
      "problems",
      "title difficulty tags"
    );

    if (!contest) {
      return NextResponse.json({ success: false, message: "Contest not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, contest });
  } catch (error: any) {
    console.error("Fetch contest error:", error);
    return NextResponse.json({ success: false, message: "Server error." }, { status: 500 });
  }
}
