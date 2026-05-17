import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

const MAX_RETRIES = 3;
const RETRY_BASE_MS = 500;

async function connectWithRetry(uri: string, attempt = 1): Promise<typeof mongoose> {
  try {
    return await mongoose.connect(uri, {
      bufferCommands: false,
      maxPoolSize: 10,
    });
  } catch (error) {
    if (attempt >= MAX_RETRIES) {
      throw error;
    }
    const delay = RETRY_BASE_MS * 2 ** (attempt - 1);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return connectWithRetry(uri, attempt + 1);
  }
}

export async function connectMongo(): Promise<typeof mongoose> {
  const mongodbUri = process.env.MONGODB_URI;
  if (!mongodbUri) {
    throw new Error("MONGODB_URI is not defined");
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = connectWithRetry(mongodbUri);
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}
