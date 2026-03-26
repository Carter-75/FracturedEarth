import { NextRequest, NextResponse } from 'next/server';
import { createRoom } from '@/lib/rooms';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.hostUserId) {
    return NextResponse.json({ error: 'hostUserId required' }, { status: 400 });
  }

  const room = await createRoom({
    hostUserId: String(body.hostUserId),
    hostDisplayName: String(body.hostDisplayName ?? 'Host'),
    hostEmoji: String(body.hostEmoji ?? '🌍'),
    maxPlayers: Number(body.maxPlayers ?? 4),
  });

  return NextResponse.json(room);
}
