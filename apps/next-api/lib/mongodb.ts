import '@/lib/envLoader';
import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';
import { attachDatabasePool } from '@vercel/functions';

/**
 * Mongoose Connection Management (for Models)
 */
const MONGODB_URI = process.env['MONGODB_URI'] || '';
if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      // Optimized for Vercel Functions
      const client = mongoose.connection.getClient() as unknown as MongoClient;
      if (client) {
         attachDatabasePool(client);
      }
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
