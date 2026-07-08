import mongoose from "mongoose";

export const connectDB = async() =>{
    try{
        const conn = await mongoose.connect(process.env.MONGO_URI as string);
        console.log("mongodb connected successfully\n");
    }
    catch(error:any){   
        console.log("error in connecting mongodb",error.message);
        process.exit(1);
    }
}
