
import { connectDB } from "../../config/db";
import User from "../../models/user.models";
import problemModels from "../../models/problem.models";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();

        // 1. Get user from your session/token (Assume you have a way to verify the token)
        // For now, let's say you check the email of the logged-in user:
        const adminEmail = process.env.ADMIN_EMAIL;
        
        // Logic: Verify current session user email === adminEmail
        // If not: return 403 Forbidden

        const newProblem = await problemModels.create(body);

        return NextResponse.json({ success: true, problem: newProblem });
    } catch (err) {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}