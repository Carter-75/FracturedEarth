import { NextRequest, NextResponse } from 'next/server';
import { createLanRoom } from '@/lib/lanRooms';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.hostUserId) {
    return NextResponse.json({ error: 'hostUserId required' }, { status: 400 });
  }

  const room = createLanRoom({
    hostUserId: String(body.hostUserId),
    hostDisplayName: String(body.hostDisplayName ?? 'Host'),
    maxPlayers: Number(body.maxPlayers ?? 4),
  });

  return NextResponse.json(room);
}
