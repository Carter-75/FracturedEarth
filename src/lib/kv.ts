import { getRedis } from '@/lib/redis';

export interface UserProfile {
  userId: string;
  displayName: string;
  email: string;
  theme: string;
  totalGamesPlayed: number;
  totalWins: number;
}

export interface LeaderboardEntry {
  member: string;
  score: number;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!userId) return null;
  const redis = await getRedis();
  const data = await redis.hGetAll(`user:${userId}`);
  if (!data || Object.keys(data).length === 0) return null;
  return {
    userId,
    displayName: data.displayName ?? '',
    email: data.email ?? '',
    theme: data.theme ?? 'Obsidian',
    totalGamesPlayed: Number(data.totalGamesPlayed ?? 0),
    totalWins: Number(data.totalWins ?? 0),
  };
}

export async function upsertUserProfile(
  profile: Partial<UserProfile> & { userId: string },
): Promise<void> {
  const { userId, ...rest } = profile;
  const redis = await getRedis();
  await redis.hSet(`user:${userId}`, rest as Record<string, string>);
}

export async function recordGameResult(
  userId: string,
  won: boolean,
  survivalPoints: number,
): Promise<void> {
  const redis = await getRedis();
  const pipe = redis.multi();
  pipe.hIncrBy(`user:${userId}`, 'totalGamesPlayed', 1);
  if (won) pipe.hIncrBy(`user:${userId}`, 'totalWins', 1);
  pipe.zAdd('leaderboard', { score: survivalPoints, value: userId });
  await pipe.exec();
}

export async function getLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  const redis = await getRedis();
  const raw = await redis.zRangeWithScores('leaderboard', 0, limit - 1, { REV: true });
  return raw.map((entry) => ({ member: entry.value, score: entry.score }));
}
