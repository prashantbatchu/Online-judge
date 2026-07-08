import bcrypt from "bcryptjs";
import { connectDB } from "../config/db";
import User from "../models/user.models";
import { setCookie } from "@/app/utils/setCookie";

export async function POST(req:Request) {
    await connectDB();
    const body = await req.json();
    const {username,email,password} = body;
    console.log(body);
    
    try{
        if(!email || !password || !username){
            throw new Error("All fields are required!!!...");
        }
        const userEmailExists = await User.findOne({email});
        if(userEmailExists){
            return Response.json({message:"User already exists."},{status:400})
        }
        const hashedpassword = await bcrypt.hash(password,10);

        const user = await User.create({
            username,
            email,
            password : hashedpassword
        });
        // sessions 
        console.log("User created in DB:", user._id);

    // If this function uses next/headers 'cookies()', it might be failing here
        await setCookie(user._id); 

        return Response.json({
            message: "user created successfully",
            user: { ...user.toObject(), password: undefined }
        }, { status: 201 });

    } catch (error: any) {
        // Check if it's a Mongoose Duplicate Key Error (11000)
        if (error.code === 11000) {
            return Response.json({ message: "Username or Email already exists" }, { status: 400 });
        }

        // LOG THE FULL ERROR TO YOUR TERMINAL
        console.error("FULL ERROR DETAILS:", error);

        return Response.json({ 
            success: false, 
            message: error.message || "Internal Server Error" 
        }, { status: 400 });
    }
}