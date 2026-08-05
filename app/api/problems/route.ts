import { connectDB } from "../config/db";
import problemModels from "../models/problem.models";
import { NextResponse } from "next/server";



export async function GET() {
    try{
        await connectDB();
        const problems = await problemModels.find({}).select("-testCases").sort({ createdAt: -1 });
        // console.log(problems)
        return NextResponse.json({ 
            success: true, 
            count: problems.length,
            problems 
        });
    }
    catch (error) {
        console.error("Fetch problems error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch problems" }, 
            { status: 500 }
        );
    }
}
