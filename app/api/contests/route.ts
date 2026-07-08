// app/api/contests/route.ts
import { connectDB } from "../config/db";
import { NextResponse } from "next/server";
import Contest from "../models/contest.models";

// GET all contests
export async function GET() {
  try {
    await connectDB();
    const contests = await Contest.find({})
      .populate("problems", "title difficulty")
      .sort({ startTime: -1 });

    return NextResponse.json({ success: true, contests });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}



// POST create a new contest (admin only)
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { title, description, startTime, endTime, problems } = body;

    if (!title || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, message: "Title, startTime and endTime are required." },
        { status: 400 }
      );
    }

    const contest = await Contest.create({
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      problems: problems || [],
    });

    return NextResponse.json({ success: true, contest }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
