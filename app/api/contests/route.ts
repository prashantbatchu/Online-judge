// app/api/contests/route.ts
import { connectDB } from "../config/db";
import { NextResponse } from "next/server";
import Contest from "../models/contest.models";
import mongoose from "mongoose";
import { requireAdmin } from "../utils/auth";

// GET all contests
export async function GET() {
  try {
    await connectDB();
    const contests = await Contest.find({})
      .populate("problems", "title difficulty")
      .sort({ startTime: -1 });

    return NextResponse.json({ success: true, contests });
  } catch (error: any) {
    console.error("Fetch contests error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch contests." },
      { status: 500 }
    );
  }
}

// POST create a new contest (admin only)
export async function POST(req: Request) {
  try {
    // The old route had no authorization check at all despite the comment
    // saying "admin only" — any logged-out visitor could create contests.
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

    const { title, description, startTime, endTime, problems } = body ?? {};

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { success: false, message: "Title is required." },
        { status: 400 }
      );
    }
    if (!startTime || !endTime) {
      return NextResponse.json(
        { success: false, message: "Start time and end time are required." },
        { status: 400 }
      );
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { success: false, message: "Start/end time must be valid dates." },
        { status: 400 }
      );
    }
    if (end <= start) {
      return NextResponse.json(
        { success: false, message: "End time must be after start time." },
        { status: 400 }
      );
    }

    const problemIds: string[] = Array.isArray(problems) ? problems : [];
    const invalidId = problemIds.find((id) => !mongoose.Types.ObjectId.isValid(id));
    if (invalidId) {
      return NextResponse.json(
        { success: false, message: `"${invalidId}" is not a valid problem id.` },
        { status: 400 }
      );
    }

    const contest = await Contest.create({
      title: title.trim(),
      description: typeof description === "string" ? description.trim() : "",
      startTime: start,
      endTime: end,
      problems: problemIds,
    });

    return NextResponse.json({ success: true, contest }, { status: 201 });
  } catch (error: any) {
    console.error("Create contest error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create contest." },
      { status: 500 }
    );
  }
}
