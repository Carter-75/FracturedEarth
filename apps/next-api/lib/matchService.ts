import { Room, RoomGameState } from '@/models/Room';
import { initializeMatch, applyMatchAction } from './matchEngine';
import { MatchPayload, MatchAction, MatchCard, StateEnvelope } from '../types/game';
import cardsData from '../data/cards.json';
import dbConnect from './mongodb';

const getFullDeck = (): MatchCard[] => {
  return [
    ...(cardsData.SURVIVAL as any[]),
    ...(cardsData.POWER as any[]),
    ...(cardsData.CHAOS as any[]),
    ...(cardsData.ADAPT as any[]),
    ...(cardsData.TWIST as any[]),
    ...(cardsData.CATACLYSM as any[])
  ].map(c => ({
    ...c,
    // Ensure all required MatchCard fields exist
    primitives: c.primitives || []
  })) as MatchCard[];
};

export async function initMatchService(roomCode: string, userId: string): Promise<StateEnvelope | null> {
  await dbConnect();
  
  const room = await Room.findOne({ code: roomCode.toUpperCase() });
  if (!room || room.hostUserId !== userId) {
    throw new Error('Only the host can initialize the match');
  }

  const roomPlayers = room.members.map((m: any) => ({
    userId: m.userId,
    displayName: m.displayName,
    emoji: m.emoji,
    isBot: m.isBot
  }));

  const fullDeck = getFullDeck();
  const initialPayload = await initializeMatch({
    roomPlayers,
    roomCode,
    fullDeck,
    botCount: 0 
  });

  const envelope = {
    revision: 1,
    updatedAtEpochMs: Date.now(),
    updatedByUserId: userId,
    payload: initialPayload
  };

  // Persist to RoomGameState
  await RoomGameState.findOneAndUpdate(
    { roomCode: roomCode.toUpperCase() },
    envelope,
    { upsert: true, new: true }
  );

  // Update Room status
  room.status = 'IN_GAME';
  room.updatedAtEpochMs = Date.now();
  await room.save();

  return envelope;
}

export async function getMatchState(roomCode: string): Promise<StateEnvelope | null> {
  await dbConnect();
  const room = await Room.findOne({ code: roomCode.toUpperCase() });
  if (!room) return null;

  const gameStateDoc = await RoomGameState.findOne({ roomCode: roomCode.toUpperCase() });
  if (!gameStateDoc) return null;

  const payload = gameStateDoc.payload as MatchPayload;
  const now = Date.now();

  let isPaused = false;
  let discUserId = '';
  
  room.members.forEach((m: any) => {
    if (!m.isBot && (now - m.lastHeartbeatEpochMs > 60000)) {
      isPaused = true;
      discUserId = m.userId;
    }
  });

  return {
    revision: gameStateDoc.revision,
    updatedAtEpochMs: gameStateDoc.updatedAtEpochMs,
    updatedByUserId: gameStateDoc.updatedByUserId,
    payload: {
      ...payload,
      isPaused,
      disconnectedUserId: discUserId
    }
  };
}

export async function submitMatchAction(roomCode: string, userId: string, action: MatchAction): Promise<StateEnvelope | null> {
  await dbConnect();

  const room = await Room.findOne({ code: roomCode.toUpperCase() });
  if (!room) throw new Error('Room not found');

  const gameStateDoc = await RoomGameState.findOne({ roomCode: roomCode.toUpperCase() });
  if (!gameStateDoc) throw new Error('Game state not found');

  const currentState = await getMatchState(roomCode);
  if (currentState?.payload?.isPaused && currentState.payload.disconnectedUserId !== userId) {
    throw new Error('Game is paused until reconnection');
  }

  const roomPlayers = room.members.map((m: any) => ({
    userId: m.userId,
    displayName: m.displayName,
    emoji: m.emoji,
    isBot: m.isBot
  }));

  const nextPayload = await applyMatchAction({
    current: gameStateDoc.payload as MatchPayload,
    action,
    actorUserId: userId,
    roomPlayers,
    roomCode
  });

  // Persist
  gameStateDoc.payload = nextPayload;
  gameStateDoc.revision += 1;
  gameStateDoc.updatedAtEpochMs = Date.now();
  gameStateDoc.updatedByUserId = userId;
  await gameStateDoc.save();

  return {
    revision: gameStateDoc.revision,
    updatedAtEpochMs: gameStateDoc.updatedAtEpochMs,
    updatedByUserId: gameStateDoc.updatedByUserId,
    payload: nextPayload
  };
}
