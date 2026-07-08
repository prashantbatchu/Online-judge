
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export const setCookie = async (userId:any)=>{
    
    if(!process.env.JWT_SECRET){
        throw new Error("JWT_SECRET is not defined");
    }
    // generate a token
    const token = jwt.sign({userId},process.env.JWT_SECRET,{expiresIn: "7d"});
    
    const cookieStore = await cookies();
    cookieStore.set("token",token,{
        httpOnly:true,
        secure: process.env.NODE_ENV === "production",
        sameSite : "strict",
        maxAge: 7*24*60*60,
    })
    return token;
}