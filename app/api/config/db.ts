// import mongoose from "mongoose";

// export const connectDB = async() =>{
//     try{
//         const conn = await mongoose.connect(process.env.MONGO_URI as string);
//         console.log("mongodb connected successfully\n");
//     }
//     catch(error:any){   
//         console.log("error in connecting mongodb",error.message);
//         process.exit(1);
//     }
// }
import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI;

// Reuse the connection across hot-reloads (dev) and serverless invocations
// instead of opening a brand new one on every request.
declare global {
  // eslint-disable-next-line no-var
  var _mongooseConn: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | undefined;
}

const cached = global._mongooseConn ?? { conn: null, promise: null };
global._mongooseConn = cached;

export const connectDB = async (): Promise<typeof mongoose> => {
  if (!MONGO_URI) {
    // Throwing (instead of process.exit) lets the API route return a proper
    // 500 response. Calling process.exit inside a request handler would
    // crash the entire server for every other in-flight request too.
    throw new Error("MONGO_URI is not defined in the environment.");
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGO_URI, { bufferCommands: false })
      .then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
};
