import bcrypt from "bcryptjs";
import { connectDB } from "../config/db";
import User from "../models/user.models";
import { setCookie } from "@/app/utils/setCookie";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        await connectDB();
        
        const body = await req.json();
        const { email, password } = body;

        // 1. Basic Validation
        if (!email || !password) {
            return NextResponse.json(
                { success: false, message: "Terminal ID and Access Key required." }, 
                { status: 400 }
            );
        }

        // 2. Find User
        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json(
                { success: false, message: "Invalid credentials." }, 
                { status: 401 } // 401 is more accurate for Auth failures
            );
        }

        // 3. Verify Password
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return NextResponse.json(
                { success: false, message: "Invalid credentials." }, 
                { status: 401 }
            );
        }

        // 4. Establish Session
        // Note: Make sure setCookie is compatible with API routes
        await setCookie(user._id);

        // 5. Clean response
        const userResponse = user.toObject();
        delete userResponse.password;

        return NextResponse.json({
            success: true,
            message: "Authentication successful. Welcome back.",
            user: userResponse
        }, { status: 200 });

    } catch (error: any) {
        console.error("Login API Error:", error);
        return NextResponse.json(
            { success: false, message: "Internal Server Error during authentication." }, 
            { status: 500 }
        );
    }
}