import mongoose, { Connection } from "mongoose";

const mongodbUrl = process.env.MONGODB_URL;

// Correcting the Global interface for TypeScript
declare global {
  var mongoose: { conn: Connection | null; promise: Promise<Connection> | null } | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDb = async (): Promise<Connection> => {
  if (!mongodbUrl) {
    throw new Error("Please define the MONGODB_URL environment variable");
  }

  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
    };

    // FIX: Return the .connection property to match the type
    cached!.promise = mongoose.connect(mongodbUrl, opts).then((mongooseInstance) => {
      return mongooseInstance.connection;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
};

export default connectDb;