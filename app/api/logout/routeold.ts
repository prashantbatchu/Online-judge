import { cookies } from "next/headers";
import { connectDB } from "../config/db";

export async function POST(request:Request){
    await connectDB();
    try{
        const cookiestore =await cookies();
        cookiestore.delete("token");
        return Response.json({
            message:"logout succesfully",
        },{
            status:200
        })
    }catch(er){
        return Response.json({message:"Error looged out"},{status:400})
    }
}