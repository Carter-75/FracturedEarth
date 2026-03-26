import { NextRequest, NextResponse } from 'next/server';
import { applyMatchAction, initializeMatch, type MatchAction, type MatchPayload } from '@/lib/matchEngine';
import { getRoom, getRoomGameState, putRoomGameState } from '@/lib/rooms';

export async function POST(
  req: NextRequest,
  context: { params: { code: string } },
) {
  const body = await req.json().catch(() => null);
  if (!body?.userId || !body?.action?.type) {
    return NextResponse.json({ error: 'userId and action.type required' }, { status: 400 });
  }

  const code = context.params.code;
  const userId = String(body.userId);
  const action = body.action as MatchAction;

  const room = await getRoom(code);
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }
  if (!room.members.some((m) => m.userId === userId)) {
    return NextResponse.json({ error: 'User is not in room' }, { status: 403 });
  }
  if (room.status !== 'IN_GAME') {
    return NextResponse.json({ error: 'Room is not in game' }, { status: 409 });
  }

  const currentState = await getRoomGameState(code);

  try {
    let nextPayload: MatchPayload;
    const roomPlayers = room.members.map((m) => ({
      userId: m.userId,
      displayName: m.displayName,
      emoji: m.emoji,
      isBot: Boolean(m.isBot),
    }));

    if (!currentState) {
      if (action.type !== 'INIT_MATCH') {
        return NextResponse.json({ error: 'Match not initialized' }, { status: 409 });
      }
      if (room.hostUserId !== userId) {
        return NextResponse.json({ error: 'Only host can initialize match' }, { status: 403 });
      }
      nextPayload = initializeMatch({
        roomPlayers,
        roomCode: room.code,
        botCount: action.botCount,
      });
    } else {
      nextPayload = applyMatchAction({
        current: currentState.payload as MatchPayload,
        action,
        actorUserId: userId,
        roomPlayers,
        roomCode: room.code,
      });
    }

    const written = await putRoomGameState({
      code,
      userId,
      payload: nextPayload,
      expectedRevision: typeof body.expectedRevision === 'number' ? Number(body.expectedRevision) : undefined,
    });

    if (!written) {
      return NextResponse.json({ error: 'Unable to persist action result' }, { status: 409 });
    }

    if (
      typeof body.expectedRevision === 'number' &&
      written.revision !== Number(body.expectedRevision) + 1
    ) {
      return NextResponse.json({ error: 'Revision conflict', current: written }, { status: 409 });
    }

    return NextResponse.json(written);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid action';
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
