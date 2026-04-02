import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/kv';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 25)));

  const leaders = await getLeaderboard(limit);
  return NextResponse.json({ leaders });
}
