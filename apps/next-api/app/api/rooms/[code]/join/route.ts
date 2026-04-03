import { NextRequest, NextResponse } from 'next/server';
import { joinRoom } from '@/lib/rooms';

export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  try {
    const body = await req.json();
    const roomCode = params.code;
    const room = await joinRoom({
      code: roomCode,
      userId: body.userId,
      displayName: body.displayName,
      emoji: body.emoji
    });
    
    if (!room) return NextResponse.json({ error: 'Room full or closed' }, { status: 400 });
    return NextResponse.json(room);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
