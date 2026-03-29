import { createClient } from 'redis';
import * as fs from 'fs';
import * as path from 'path';

const REDIS_DUMP_FILE = path.join(process.cwd(), '.redis-dump.json');

type RedisClient = ReturnType<typeof createClient>;

type ZRangeOptions = { REV?: boolean };

interface RedisMultiLike {
  hIncrBy(key: string, field: string, increment: number): RedisMultiLike;
  zAdd(key: string, entry: { score: number; value: string }): RedisMultiLike;
  set(key: string, value: string): RedisMultiLike;
  exec(): Promise<unknown[]>;
}

export interface RedisLike {
  isOpen: boolean;
  connect(): Promise<void>;
  exists(key: string): Promise<number>;
  hSet(key: string, values: Record<string, unknown>): Promise<number>;
  hGetAll(key: string): Promise<Record<string, string>>;
  set(key: string, value: string): Promise<string | null>;
  get(key: string): Promise<string | null>;
  zAdd(key: string, entry: { score: number; value: string }): Promise<number>;
  zRangeWithScores(key: string, start: number, stop: number, options?: ZRangeOptions): Promise<Array<{ value: string; score: number }>>;
  multi(): RedisMultiLike;
}

class InMemoryRedisClient implements RedisLike {
  isOpen = true;
  private kv = new Map<string, string>();
  private hashes = new Map<string, Map<string, string>>();
  private zsets = new Map<string, Map<string, number>>();

  constructor() {
    this.loadFromFile();
  }

  private loadFromFile() {
    try {
      if (fs.existsSync(REDIS_DUMP_FILE)) {
        const raw = fs.readFileSync(REDIS_DUMP_FILE, 'utf-8');
        const data = JSON.parse(raw);
        if (data.kv) this.kv = new Map(Object.entries(data.kv));
        if (data.hashes) {
          this.hashes = new Map();
          for (const [k, v] of Object.entries(data.hashes)) {
            this.hashes.set(k, new Map(Object.entries(v as any)));
          }
        }
        if (data.zsets) {
          this.zsets = new Map();
          for (const [k, v] of Object.entries(data.zsets)) {
            this.zsets.set(k, new Map(Object.entries(v as any)));
          }
        }
      }
    } catch (err) {
      console.error('[redis] error loading state from file', err);
    }
  }

  private saveToFile() {
    try {
      const hashesObj: any = {};
      this.hashes.forEach((map, k) => { hashesObj[k] = Object.fromEntries(map); });
      const zsetsObj: any = {};
      this.zsets.forEach((map, k) => { zsetsObj[k] = Object.fromEntries(map); });

      const data = {
        kv: Object.fromEntries(this.kv),
        hashes: hashesObj,
        zsets: zsetsObj
      };
      fs.writeFileSync(REDIS_DUMP_FILE, JSON.stringify(data), 'utf-8');
    } catch (err) {
      console.error('[redis] error saving state to file', err);
    }
  }

  async connect(): Promise<void> {
    this.isOpen = true;
  }

  async exists(key: string): Promise<number> {
    return this.kv.has(key) || this.hashes.has(key) || this.zsets.has(key) ? 1 : 0;
  }

  async hSet(key: string, values: Record<string, unknown>): Promise<number> {
    const hash = this.hashes.get(key) ?? new Map<string, string>();
    let created = 0;
    for (const [field, raw] of Object.entries(values)) {
      if (!hash.has(field)) created += 1;
      hash.set(field, String(raw));
    }
    this.hashes.set(key, hash);
    this.saveToFile();
    return created;
  }

  async hGetAll(key: string): Promise<Record<string, string>> {
    const hash = this.hashes.get(key);
    if (!hash) return {};
    return Object.fromEntries(hash.entries());
  }

  async set(key: string, value: string): Promise<string | null> {
    this.kv.set(key, value);
    this.saveToFile();
    return 'OK';
  }

  async get(key: string): Promise<string | null> {
    return this.kv.get(key) ?? null;
  }

  async zAdd(key: string, entry: { score: number; value: string }): Promise<number> {
    const zset = this.zsets.get(key) ?? new Map<string, number>();
    const existed = zset.has(entry.value);
    zset.set(entry.value, entry.score);
    this.zsets.set(key, zset);
    this.saveToFile();
    return existed ? 0 : 1;
  }

  async zRangeWithScores(
    key: string,
    start: number,
    stop: number,
    options?: ZRangeOptions,
  ): Promise<Array<{ value: string; score: number }>> {
    const zset = this.zsets.get(key) ?? new Map<string, number>();
    const sorted = Array.from(zset.entries())
      .map(([value, score]) => ({ value, score }))
      .sort((a, b) => a.score - b.score);
    const ordered = options?.REV ? sorted.reverse() : sorted;
    const safeStop = stop < 0 ? ordered.length - 1 : stop;
    return ordered.slice(start, safeStop + 1);
  }

  multi(): RedisMultiLike {
    const operations: Array<() => Promise<unknown>> = [];
    return {
      hIncrBy: (key: string, field: string, increment: number) => {
        operations.push(async () => {
          const current = await this.hGetAll(key);
          const next = Number(current[field] ?? 0) + increment;
          await this.hSet(key, { [field]: String(next) });
          return next;
        });
        return this.multiProxy(operations);
      },
      zAdd: (key: string, entry: { score: number; value: string }) => {
        operations.push(async () => this.zAdd(key, entry));
        return this.multiProxy(operations);
      },
      set: (key: string, value: string) => {
        operations.push(async () => this.set(key, value));
        return this.multiProxy(operations);
      },
      exec: async () => {
        const results: unknown[] = [];
        for (const operation of operations) {
          results.push(await operation());
        }
        return results;
      },
    };
  }

  private multiProxy(operations: Array<() => Promise<unknown>>): RedisMultiLike {
    return {
      hIncrBy: (key: string, field: string, increment: number) => {
        operations.push(async () => {
          const current = await this.hGetAll(key);
          const next = Number(current[field] ?? 0) + increment;
          await this.hSet(key, { [field]: String(next) });
          return next;
        });
        return this.multiProxy(operations);
      },
      zAdd: (key: string, entry: { score: number; value: string }) => {
        operations.push(async () => this.zAdd(key, entry));
        return this.multiProxy(operations);
      },
      set: (key: string, value: string) => {
        operations.push(async () => this.set(key, value));
        return this.multiProxy(operations);
      },
      exec: async () => {
        const results: unknown[] = [];
        for (const operation of operations) {
          results.push(await operation());
        }
        return results;
      },
    };
  }
}

class RedisAdapter implements RedisLike {
  constructor(private readonly client: RedisClient) {}

  get isOpen(): boolean {
    return this.client.isOpen;
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  async exists(key: string): Promise<number> {
    return this.client.exists(key);
  }

  async hSet(key: string, values: Record<string, unknown>): Promise<number> {
    return this.client.hSet(key, values as Record<string, string>);
  }

  async hGetAll(key: string): Promise<Record<string, string>> {
    return this.client.hGetAll(key);
  }

  async set(key: string, value: string): Promise<string | null> {
    return this.client.set(key, value);
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async zAdd(key: string, entry: { score: number; value: string }): Promise<number> {
    return this.client.zAdd(key, entry);
  }

  async zRangeWithScores(
    key: string,
    start: number,
    stop: number,
    options?: ZRangeOptions,
  ): Promise<Array<{ value: string; score: number }>> {
    return this.client.zRangeWithScores(key, start, stop, options as { REV?: boolean });
  }

  multi(): RedisMultiLike {
    return this.client.multi() as unknown as RedisMultiLike;
  }
}

// In development, Next.js hot-reloads modules, so we preserve the client on
// the global object to avoid opening a new TCP connection on every reload.
const g = global as { _redisClient?: RedisLike; _warnedMemoryRedis?: boolean };

function buildClient(): RedisLike {
  const url = process.env.REDIS_URL;
  if (!url) {
    if (!g._warnedMemoryRedis) {
      console.warn('[redis] REDIS_URL not set; using in-memory store');
      g._warnedMemoryRedis = true;
    }
    return new InMemoryRedisClient();
  }
  const client = createClient({ url });
  client.on('error', (err) => console.error('[redis] client error', err));
  return new RedisAdapter(client);
}

export async function getRedis(): Promise<RedisLike> {
  if (!g._redisClient) {
    g._redisClient = buildClient();
  }
  if (!g._redisClient.isOpen) {
    await g._redisClient.connect();
  }
  return g._redisClient;
}
