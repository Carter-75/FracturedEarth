type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

function now() {
  return Date.now();
}

function hitBucket(key: string, limit: number, windowMs: number) {
  const current = buckets.get(key);
  const currentTime = now();

  if (!current || current.resetAt <= currentTime) {
    const next = { count: 1, resetAt: currentTime + windowMs };
    buckets.set(key, next);
    return { allowed: true, remaining: limit - 1, resetAt: next.resetAt };
  }

  current.count += 1;
  buckets.set(key, current);

  return {
    allowed: current.count <= limit,
    remaining: Math.max(0, limit - current.count),
    resetAt: current.resetAt,
  };
}

export function consumeRateLimit(key: string, limit: number, windowMs: number) {
  return hitBucket(key, limit, windowMs);
}

export function getClientKey(ip: string | undefined, scope: string) {
  return `${scope}:${ip || 'unknown'}`;
}

export function getSocketKey(userId: string | undefined, socketId: string, scope: string) {
  return `${scope}:${userId || socketId}`;
}
