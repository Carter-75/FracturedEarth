import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: fileURLToPath(new URL('../../../.env.local', import.meta.url)) });
loadEnv({ path: fileURLToPath(new URL('../../../.env', import.meta.url)) });

export const config = {
  port: Number(process.env['PORT'] || 3100),
  mongoUri: process.env['MONGODB_URI'] || '',
  jwtSecret: process.env['JWT_SECRET'] || 'fractured-earth-dev-secret',
  clientOrigin: process.env['CLIENT_ORIGIN'] || 'http://localhost:4200',
  nodeEnv: process.env['NODE_ENV'] || 'development',
  googleClientId: process.env['GOOGLE_CLIENT_ID'] || '',
  cleanupIntervalMs: Number(process.env['CLEANUP_INTERVAL_MS'] || 5 * 60 * 1000),
  finishedMatchTtlMs: Number(process.env['FINISHED_MATCH_TTL_MS'] || 60 * 60 * 1000),
  staleMatchTtlMs: Number(process.env['STALE_MATCH_TTL_MS'] || 24 * 60 * 60 * 1000),
};

export const isProduction = config.nodeEnv === 'production';
