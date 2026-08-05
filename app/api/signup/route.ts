import bcrypt from "bcryptjs";
import { connectDB } from "../config/db";
import User from "../models/user.models";
import { setCookie } from "@/app/utils/setCookie";
import { NextResponse } from "next/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    await connectDB();

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const username = typeof body?.username === "string" ? body.username.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    // --- Real validation instead of a bare "all fields required" throw ---
    if (!username || !email || !password) {
      return NextResponse.json(
        { success: false, message: "Username, email and password are all required." },
        { status: 400 }
      );
    }
    if (username.length < 3 || username.length > 24) {
      return NextResponse.json(
        { success: false, message: "Username must be between 3 and 24 characters." },
        { status: 400 }
      );
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid email address." },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      const message =
        existing.email === email
          ? "An account with this email already exists."
          : "This username is already taken.";
      return NextResponse.json({ success: false, message }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: "user",
    });

    await setCookie(user._id.toString(), user.role);

    const userResponse = user.toObject();
    delete userResponse.password;

    return NextResponse.json(
      { success: true, message: "Account created successfully.", user: userResponse },
      { status: 201 }
    );
  } catch (error: any) {
    // Mongoose duplicate key race condition (two signups at once)
    if (error?.code === 11000) {
      return NextResponse.json(
        { success: false, message: "Username or email already exists." },
        { status: 409 }
      );
    }

    console.error("Signup API error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error during signup." },
      { status: 500 }
    );
  }
}
