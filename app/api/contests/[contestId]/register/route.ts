// app/api/contests/[contestId]/register/route.ts
import { connectDB } from "@/app/api/config/db";
import { NextResponse } from "next/server";
import Contest from "@/app/api/models/contest.models";
import mongoose from "mongoose";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ contestId: string }> }
) {
  try {
    await connectDB();
    const { contestId } = await params;
    const { userId } = await req.json();

    if (!userId || !contestId) {
      return NextResponse.json(
        { success: false, message: "userId and contestId required." },
        { status: 400 }
      );
    }

    const contest = await Contest.findById(contestId);
    if (!contest) {
      return NextResponse.json(
        { success: false, message: "Contest not found." },
        { status: 404 }
      );
    }

    const alreadyRegistered = contest.participants.some(
      (p: mongoose.Types.ObjectId) => p.toString() === userId
    );

    if (alreadyRegistered) {
      return NextResponse.json(
        { success: false, message: "Already registered." },
        { status: 409 }
      );
    }

    contest.participants.push(new mongoose.Types.ObjectId(userId));
    await contest.save();

    return NextResponse.json({
      success: true,
      message: "Registered successfully.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
