import { NextResponse } from "next/server";
import { connectDB } from "../../config/db";
import problemModels from "../../models/problem.models";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const index = Number(id);

    if (isNaN(index) || index < 1) {
      return NextResponse.json({ success: false, message: "Invalid ID" }, { status: 400 });
    }

    await connectDB();

    // 1. Sort by newest first
    // 2. Skip (index - 1) items to get the N-th problem
    // 3. Limit 1 to get only that problem
    const problem = await problemModels.find({})
      .sort({ createdAt: -1 }) 
      .skip(index - 1)
      .limit(1);

    if (!problem || problem.length === 0) {
      return NextResponse.json(
        { success: false, message: `Problem #${id} does not exist yet.` }, 
        { status: 404 }
      );
    }

    // Since .find().limit(1) returns an array, we take the first element
    return NextResponse.json({ success: true, problem: problem[0] });

  } catch (error) {
    return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
  }
}