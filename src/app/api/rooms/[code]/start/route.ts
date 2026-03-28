import { NextRequest, NextResponse } from 'next/server';
import { startRoomMatch, putRoomGameState } from '@/lib/rooms';
import { generateNamedBaseCards } from '@/lib/cardCatalog';

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
  const allCards = generateNamedBaseCards();
  const deck = [...allCards].sort(() => Math.random() - 0.5);
  
  const players = room.members.filter(m => !m.disconnectedAtEpochMs).map((m, i) => ({
    id: m.userId,
    displayName: m.displayName,
    emoji: m.emoji,
    isBot: Boolean(m.isBot),
    survivalPoints: 0,
    health: 5,
    hand: deck.splice(0, 5),
    powers: [],
  }));

  const initialPayload = {
    round: 1,
    activePlayerIndex: 0,
    players,
    drawPile: deck.slice(1),
    discardPile: [deck[0]],
    turnPile: [],
    topCard: deck[0],
    turnDirection: 1,
    isGlobalDisasterPhase: false,
    cardsPlayedThisTurn: 0,
    hasDrawnThisTurn: false,
  };

  await putRoomGameState({
    code: context.params.code,
    userId: String(body.hostUserId),
    payload: initialPayload,
  });

  return NextResponse.json(room);
}
