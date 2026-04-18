import mongoose from 'mongoose';
import { config, isProduction } from './config.js';

let connected = false;

export async function connectToDatabase(): Promise<boolean> {
  if (connected || !config.mongoUri) return connected;

  try {
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    connected = true;
  } catch (error) {
    if (isProduction) {
      throw new Error('[db] MongoDB connection failed in production mode');
    }
    console.warn('[db] Falling back to in-memory mode:', error);
    connected = false;
  }

  return connected;
}

export function isDatabaseConnected(): boolean {
  return connected;
}
