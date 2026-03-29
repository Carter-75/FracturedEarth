import { NextRequest, NextResponse } from 'next/server';
import { startRoomMatch, putRoomGameState } from '@/lib/rooms';
import { initializeMatch } from '@/lib/matchEngine';

export async function POST(
  req: NextRequest,
  context: { params: { code: string } },
) {
  const body = await req.json().catch(() => null);
  if (!body?.hostUserId) {
    return NextResponse.json({ error: 'hostUserId required' }, { status: 400 });
  }

  const room = await startRoomMatch({
    code: context.params.code,
    hostUserId: String(body.hostUserId),
  });

  if (!room) {
    return NextResponse.json({ error: 'Unable to start room' }, { status: 409 });
  }

  // --- INITIALIZE GAME STATE ---
  const roomPlayers = room.members.filter(m => !m.disconnectedAtEpochMs).map(m => ({
    userId: m.userId,
    displayName: m.displayName,
    emoji: m.emoji,
    isBot: Boolean(m.isBot),
  }));

  const initialPayload = await initializeMatch({
    roomPlayers,
    roomCode: context.params.code,
  });

  await putRoomGameState({
    code: context.params.code,
    userId: String(body.hostUserId),
    payload: initialPayload,
  });

  return NextResponse.json(room);
}
