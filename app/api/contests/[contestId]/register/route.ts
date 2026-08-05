// app/api/contests/[contestId]/register/route.ts
import { connectDB } from "@/app/api/config/db";
import { NextResponse } from "next/server";
import Contest from "@/app/api/models/contest.models";
import mongoose from "mongoose";
import { getSessionUser } from "@/app/api/utils/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ contestId: string }> }
) {
  try {
    // Registering "as" another user was previously possible by just sending
    // their userId in the body. Use the authenticated session instead.
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, message: "You must be logged in to register." },
        { status: 401 }
      );
    }

    await connectDB();
    const { contestId } = await params;

    if (!mongoose.Types.ObjectId.isValid(contestId)) {
      return NextResponse.json(
        { success: false, message: "Invalid contest id." },
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

    if (new Date(contest.endTime) < new Date()) {
      return NextResponse.json(
        { success: false, message: "This contest has already ended." },
        { status: 409 }
      );
    }

    const alreadyRegistered = contest.participants.some(
      (p: mongoose.Types.ObjectId) => p.toString() === sessionUser.userId
    );

    if (alreadyRegistered) {
      return NextResponse.json(
        { success: false, message: "Already registered." },
        { status: 409 }
      );
    }

    contest.participants.push(new mongoose.Types.ObjectId(sessionUser.userId));
    await contest.save();

    return NextResponse.json({
      success: true,
      message: "Registered successfully.",
    });
  } catch (error: any) {
    console.error("Contest registration error:", error);
    return NextResponse.json(
      { success: false, message: "Registration failed." },
      { status: 500 }
    );
  }
}
