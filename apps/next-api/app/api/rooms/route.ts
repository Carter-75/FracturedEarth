import { NextRequest, NextResponse } from 'next/server';
import { createRoom } from '@/lib/rooms';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const room = await createRoom({
      hostUserId: body.hostUserId,
      hostDisplayName: body.hostDisplayName,
      hostEmoji: body.hostEmoji,
      maxPlayers: body.maxPlayers || 4
    });
    return NextResponse.json(room);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
