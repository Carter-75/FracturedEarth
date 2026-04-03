import { NextRequest, NextResponse } from 'next/server';
import { getRoom, heartbeatRoom, addBotToRoom, leaveRoom } from '@/lib/rooms';

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const roomCode = params.code;
  const userId = req.nextUrl.searchParams.get('userId');
  
  if (userId) {
    await heartbeatRoom({ code: roomCode, userId });
  }

  const room = await getRoom(roomCode);
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  return NextResponse.json(room);
}

export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  try {
    const roomCode = params.code;
    const body = await req.json();
    const { hostUserId, operation, targetUserId } = body;

    let room;
    if (operation === 'ADD_BOT') {
      room = await addBotToRoom({ code: roomCode, hostUserId });
    } else if (operation === 'REMOVE_MEMBER' && targetUserId) {
      room = await leaveRoom({ code: roomCode, userId: targetUserId });
    } else {
      throw new Error('Invalid operation');
    }

    if (!room) return NextResponse.json({ error: 'Failed to update lobby' }, { status: 400 });
    return NextResponse.json(room);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
