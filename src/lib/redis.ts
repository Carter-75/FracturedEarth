import { createClient } from 'redis';

type RedisClient = ReturnType<typeof createClient>;

// In development, Next.js hot-reloads modules, so we preserve the client on
// the global object to avoid opening a new TCP connection on every reload.
const g = global as { _redisClient?: RedisClient };

function buildClient(): RedisClient {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error('REDIS_URL environment variable is not set');
  }
  const client = createClient({ url });
  client.on('error', (err) => console.error('[redis] client error', err));
  return client;
}

export async function getRedis(): Promise<RedisClient> {
  if (!g._redisClient) {
    g._redisClient = buildClient();
  }
  if (!g._redisClient.isOpen) {
    await g._redisClient.connect();
  }
  return g._redisClient;
}
