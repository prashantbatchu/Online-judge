import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "../../config/db";
import problemModels from "../../models/problem.models";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // The old implementation treated `id` as a 1-based position in a
    // `.sort().skip().limit(1)` query. That's fragile: the "index" of a
    // problem shifts every time a problem is added/removed, and it breaks
    // entirely once the frontend filters/sorts the list differently from
    // the backend. Look problems up by their real, stable Mongo _id instead.
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid problem id." },
        { status: 400 }
      );
    }

    await connectDB();

    const problem = await problemModels.findById(id);

    if (!problem) {
      return NextResponse.json(
        { success: false, message: "Problem not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, problem });
  } catch (error) {
    console.error("Fetch problem error:", error);
    return NextResponse.json({ success: false, message: "Server error." }, { status: 500 });
  }
}
