import { Room, RoomGameState } from '@/models/Room';
import { 
    initializeMatch, 
    applyMatchAction, 
    drawForActive, 
    playCard, 
    advanceTurn, 
    getPlayerMaxHand, 
    pseudoRandom 
} from './matchEngine';
import { AIBrain } from './aiBrain';
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

  const now = Date.now();
  let payload = gameStateDoc.payload as MatchPayload;

  // --- LIVE REACTIVE BOT ENGINE (HEARTBEAT) ---
  const activeIdx = payload.activePlayerIndex;
  const activePlayer = payload.players[activeIdx];
  const lastAction = payload.lastBotActionEpochMs || 0;
  
  // If it's a bot's turn, we act as the "Heartbeat"
  // Logic: 1.2s delay between single moves to make it "feel" real-time
  if (activePlayer?.isBot && !payload.winnerId && (now - lastAction > 1500)) {
     const rng = pseudoRandom(now);
     
     if (!payload.hasDrawnThisTurn) {
        // 1. Draw Move
        payload = drawForActive(payload, [], rng);
     } else {
        const brain = new AIBrain(payload, activePlayer.id);
        const move = brain.chooseBestAction();
        
        if (move && move.score > 0) {
           // 2. Play Move
           payload = playCard(payload, move.cardId!, move.targetPlayerId, rng);
        } else {
           const maxHand = getPlayerMaxHand(activePlayer);
           if (payload.players[activeIdx].hand.length > maxHand) {
              // 3. Discard Move
              const worst = brain.chooseBestDiscard();
              const cardId = worst.cardId!;
              const player = payload.players[activeIdx];
              const card = player.hand.find(c => c.id === cardId)!;
              const idx = player.hand.findIndex(c => c.id === cardId);
              const nextHand = player.hand.filter((_, i) => i !== idx);
              payload = {
                 ...payload,
                 players: payload.players.map((p, i) => i === activeIdx ? { ...p, hand: nextHand } : p),
                 discardPile: [...payload.discardPile, card],
                 topCard: card
              };
           } else {
              // 4. End Turn Move
              payload = advanceTurn(payload);
           }
        }
     }
     
     // Update persistent state for this incremental bot move
     payload.lastBotActionEpochMs = now;
     gameStateDoc.payload = payload;
     gameStateDoc.revision += 1;
     gameStateDoc.updatedAtEpochMs = now;
     gameStateDoc.updatedByUserId = 'SYSTEM_AI';
     await gameStateDoc.save();
  }

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
      disconnectedUserId: discUserId,
      revision: gameStateDoc.revision
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
    updatedByUserId: userId,
    payload: { ...nextPayload, revision: gameStateDoc.revision }
  };
}
