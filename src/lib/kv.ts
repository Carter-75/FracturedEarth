import { kv } from '@vercel/kv';

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
  const data = await kv.hgetall<Record<string, string>>(`user:${userId}`);
  if (!data) return null;
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
  await kv.hset(`user:${userId}`, rest as Record<string, string>);
}

export async function recordGameResult(
  userId: string,
  won: boolean,
  survivalPoints: number,
): Promise<void> {
  const pipe = kv.pipeline();
  pipe.hincrby(`user:${userId}`, 'totalGamesPlayed', 1);
  if (won) pipe.hincrby(`user:${userId}`, 'totalWins', 1);
  pipe.zadd('leaderboard', { score: survivalPoints, member: userId });
  await pipe.exec();
}

export async function getLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  const raw = await kv.zrange<string[]>('leaderboard', 0, limit - 1, { rev: true, withScores: true });
  const entries: LeaderboardEntry[] = [];
  for (let i = 0; i < raw.length; i += 2) {
    entries.push({ member: raw[i], score: Number(raw[i + 1]) });
  }
  return entries;
}
