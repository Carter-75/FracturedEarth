import {
  applyMatchAction,
  getAllCards,
  initializeMatch,
  PUBLIC_QUEUE_ID,
  type MatchAction,
  type MatchMode,
  type ServerMatchSnapshot,
} from '@fractured-earth/game-core';
import { config } from './config.js';
import { connectToDatabase, isDatabaseConnected } from './db.js';
import { ActiveMatchModel, MatchHistoryModel, RoomModel } from './models.js';

type PlayerIdentity = {
  userId: string;
  displayName: string;
  emoji: string;
  isBot?: boolean;
};

type RoomState = {
  code: string;
  mode: MatchMode;
  ownerUserId: string;
  members: PlayerIdentity[];
  started: boolean;
};

const cards = getAllCards();
const matches = new Map<string, ServerMatchSnapshot>();
const rooms = new Map<string, RoomState>();
const queue = new Map<string, PlayerIdentity>();

function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function createRoomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

async function persistSnapshot(snapshot: ServerMatchSnapshot) {
  await connectToDatabase();
  if (!isDatabaseConnected()) return;
  await ActiveMatchModel.findOneAndUpdate(
    { matchId: snapshot.matchId },
    {
      matchId: snapshot.matchId,
      mode: snapshot.mode,
      roomCode: snapshot.payload.roomCode,
      revision: snapshot.revision,
      payload: snapshot.payload,
      updatedAtEpochMs: snapshot.updatedAtEpochMs,
    },
    { upsert: true, new: true }
  );
}

async function persistRoom(room: RoomState) {
  await connectToDatabase();
  if (!isDatabaseConnected()) return;
  await RoomModel.findOneAndUpdate(
    { code: room.code },
    {
      code: room.code,
      mode: room.mode,
      ownerUserId: room.ownerUserId,
      members: room.members,
      memberIds: room.members.map((member) => member.userId),
      started: room.started,
      updatedAt: new Date(),
    },
    { upsert: true, new: true }
  );
}

function normalizeRoom(raw: any): RoomState | null {
  if (!raw?.code || !raw?.ownerUserId) return null;
  const members = Array.isArray(raw.members) && raw.members.length > 0
    ? raw.members.map((member: any) => ({
        userId: String(member.userId),
        displayName: String(member.displayName || 'Commander'),
        emoji: String(member.emoji || '🌍'),
        isBot: Boolean(member.isBot),
      }))
    : Array.isArray(raw.memberIds)
      ? raw.memberIds.map((userId: string, index: number) => ({
          userId: String(userId),
          displayName: index === 0 ? 'Commander' : `Member ${index + 1}`,
          emoji: '🌍',
          isBot: String(userId).startsWith('bot_'),
        }))
      : [];

  return {
    code: String(raw.code),
    mode: raw.mode === 'live' ? 'live' : 'private',
    ownerUserId: String(raw.ownerUserId),
    members,
    started: Boolean(raw.started),
  };
}

function normalizeSnapshot(raw: any): ServerMatchSnapshot | null {
  if (!raw?.matchId || !raw?.payload) return null;
  return {
    matchId: String(raw.matchId),
    mode: raw.mode === 'live' ? 'live' : raw.mode === 'private' ? 'private' : 'practice',
    revision: Number(raw.revision || 1),
    seed: Number(raw.seed || 0),
    payload: raw.payload as ServerMatchSnapshot['payload'],
    updatedAtEpochMs: Number(raw.updatedAtEpochMs || Date.now()),
  };
}

function shouldDropSnapshot(snapshot: ServerMatchSnapshot, currentTime = Date.now()) {
  const ageMs = currentTime - snapshot.updatedAtEpochMs;
  if (snapshot.payload.winnerId) {
    return ageMs > config.finishedMatchTtlMs;
  }
  return ageMs > config.staleMatchTtlMs;
}

function shouldDropRoom(room: RoomState, currentTime = Date.now()) {
  const relatedMatch = Array.from(matches.values()).find((snapshot) => snapshot.payload.roomCode === room.code);
  if (relatedMatch) return false;
  return room.started;
}

export async function loadPersistedState(): Promise<void> {
  await connectToDatabase();
  if (!isDatabaseConnected()) return;

  const [persistedRooms, persistedMatches] = await Promise.all([
    RoomModel.find().lean(),
    ActiveMatchModel.find().lean(),
  ]);

  rooms.clear();
  matches.clear();

  persistedMatches
    .map(normalizeSnapshot)
    .filter((snapshot): snapshot is ServerMatchSnapshot => Boolean(snapshot))
    .filter((snapshot) => !shouldDropSnapshot(snapshot))
    .forEach((snapshot) => matches.set(snapshot.matchId, snapshot));

  persistedRooms
    .map(normalizeRoom)
    .filter((room): room is RoomState => Boolean(room))
    .filter((room) => !shouldDropRoom(room))
    .forEach((room) => rooms.set(room.code, room));
}

export async function createPracticeMatch(player: PlayerIdentity): Promise<ServerMatchSnapshot> {
  const roomCode = createRoomCode();
  const payload = await initializeMatch({
    roomPlayers: [
      player,
      { userId: 'bot_alpha', displayName: 'Ash Core', emoji: '🤖', isBot: true },
      { userId: 'bot_beta', displayName: 'Flood Mind', emoji: '🛰️', isBot: true },
    ],
    roomCode,
    fullDeck: cards,
  });

  const snapshot: ServerMatchSnapshot = {
    matchId: createId('practice'),
    mode: 'practice',
    revision: 1,
    seed: roomCode.split('').reduce((total, char) => total + char.charCodeAt(0), 0),
    payload: { ...payload, mode: 'practice', roomCode },
    updatedAtEpochMs: Date.now(),
  };

  matches.set(snapshot.matchId, snapshot);
  await persistSnapshot(snapshot);
  return snapshot;
}

export async function createPrivateRoom(owner: PlayerIdentity): Promise<RoomState> {
  const room: RoomState = {
    code: createRoomCode(),
    mode: 'private',
    ownerUserId: owner.userId,
    members: [owner],
    started: false,
  };
  rooms.set(room.code, room);
  await persistRoom(room);
  return room;
}

export async function joinPrivateRoom(code: string, player: PlayerIdentity): Promise<RoomState | null> {
  const room = await getRoom(code);
  if (!room || room.started) return null;
  if (!room.members.some((member) => member.userId === player.userId)) {
    room.members.push(player);
  }
  await persistRoom(room);
  return room;
}

export async function addBotToRoom(code: string): Promise<RoomState | null> {
  const room = await getRoom(code);
  if (!room || room.started || room.members.length >= 4) return null;
  room.members.push({
    userId: createId('bot'),
    displayName: `Bot ${room.members.filter((member) => member.isBot).length + 1}`,
    emoji: '🤖',
    isBot: true,
  });
  await persistRoom(room);
  return room;
}

export async function startRoomMatch(code: string): Promise<ServerMatchSnapshot | null> {
  const room = await getRoom(code);
  if (!room) return null;
  room.started = true;

  const payload = await initializeMatch({
    roomPlayers: room.members,
    roomCode: room.code,
    fullDeck: cards,
  });

  const snapshot: ServerMatchSnapshot = {
    matchId: createId(code),
    mode: room.mode,
    revision: 1,
    seed: room.code.split('').reduce((total, char) => total + char.charCodeAt(0), 0),
    payload: { ...payload, mode: room.mode, roomCode: room.code },
    updatedAtEpochMs: Date.now(),
  };

  matches.set(snapshot.matchId, snapshot);
  await persistRoom(room);
  await persistSnapshot(snapshot);
  return snapshot;
}

export async function applyRealtimeAction(matchId: string, actorUserId: string, action: MatchAction): Promise<ServerMatchSnapshot> {
  const current = await getMatch(matchId);
  if (!current) {
    throw new Error('Match not found');
  }

  const nextPayload = await applyMatchAction({
    current: current.payload,
    action,
    actorUserId,
    roomPlayers: current.payload.players.map((player) => ({
      userId: player.id,
      displayName: player.displayName,
      emoji: player.emoji,
      isBot: player.isBot,
    })),
    roomCode: current.payload.roomCode,
  });

  const snapshot: ServerMatchSnapshot = {
    ...current,
    revision: current.revision + 1,
    payload: nextPayload,
    updatedAtEpochMs: Date.now(),
  };

  matches.set(matchId, snapshot);
  await persistSnapshot(snapshot);

  if (snapshot.payload.winnerId) {
    await connectToDatabase();
    if (isDatabaseConnected()) {
      await MatchHistoryModel.findOneAndUpdate(
        { matchId },
        {
          matchId,
          mode: snapshot.mode,
          winnerUserId: snapshot.payload.winnerId,
          participantIds: snapshot.payload.players.map((player) => player.id),
          createdAt: new Date(),
        },
        { upsert: true, new: true }
      );
    }
  }

  return snapshot;
}

export async function getMatch(matchId: string): Promise<ServerMatchSnapshot | null> {
  const cached = matches.get(matchId);
  if (cached) return cached;

  await connectToDatabase();
  if (!isDatabaseConnected()) return null;
  const persisted = await ActiveMatchModel.findOne({ matchId }).lean();
  const normalized = normalizeSnapshot(persisted);
  if (normalized) {
    matches.set(matchId, normalized);
  }
  return normalized;
}

export async function getRoom(code: string): Promise<RoomState | null> {
  const cached = rooms.get(code);
  if (cached) return cached;

  await connectToDatabase();
  if (!isDatabaseConnected()) return null;
  const persisted = await RoomModel.findOne({ code }).lean();
  const normalized = normalizeRoom(persisted);
  if (normalized) {
    rooms.set(code, normalized);
  }
  return normalized;
}

export async function pruneExpiredState(): Promise<{ prunedMatches: number; prunedRooms: number }> {
  const currentTime = Date.now();
  const staleMatchIds = Array.from(matches.values())
    .filter((snapshot) => shouldDropSnapshot(snapshot, currentTime))
    .map((snapshot) => snapshot.matchId);

  staleMatchIds.forEach((matchId) => matches.delete(matchId));

  const staleRoomCodes = Array.from(rooms.values())
    .filter((room) => shouldDropRoom(room, currentTime))
    .map((room) => room.code);

  staleRoomCodes.forEach((code) => rooms.delete(code));

  await connectToDatabase();
  if (isDatabaseConnected()) {
    const finishedCutoff = currentTime - config.finishedMatchTtlMs;
    const staleCutoff = currentTime - config.staleMatchTtlMs;
    await ActiveMatchModel.deleteMany({
      $or: [
        { 'payload.winnerId': { $exists: true, $ne: null }, updatedAtEpochMs: { $lt: finishedCutoff } },
        { updatedAtEpochMs: { $lt: staleCutoff } },
      ],
    });
    if (staleRoomCodes.length > 0) {
      await RoomModel.deleteMany({ code: { $in: staleRoomCodes } });
    }
  }

  return {
    prunedMatches: staleMatchIds.length,
    prunedRooms: staleRoomCodes.length,
  };
}

export function getBootstrap() {
  return {
    queueId: PUBLIC_QUEUE_ID,
    gameModes: ['practice', 'live', 'private'],
    maxPlayers: 4,
    cardCount: cards.length,
    googleClientId: config.googleClientId || null,
  };
}

export function getCatalogCards() {
  return cards;
}

export function enqueuePlayer(player: PlayerIdentity) {
  queue.set(player.userId, player);
  return Array.from(queue.values());
}

export function dequeuePlayer(userId: string) {
  queue.delete(userId);
  return Array.from(queue.values());
}

export function getQueueState() {
  return Array.from(queue.values());
}

export async function maybeStartPublicMatch(): Promise<ServerMatchSnapshot | null> {
  const players = Array.from(queue.values()).slice(0, 2);
  if (players.length < 2) return null;
  players.forEach((player) => queue.delete(player.userId));

  const roomCode = createRoomCode();
  const payload = await initializeMatch({
    roomPlayers: players,
    roomCode,
    fullDeck: cards,
  });

  const snapshot: ServerMatchSnapshot = {
    matchId: createId('live'),
    mode: 'live',
    revision: 1,
    seed: roomCode.split('').reduce((total, char) => total + char.charCodeAt(0), 0),
    payload: { ...payload, mode: 'live', roomCode },
    updatedAtEpochMs: Date.now(),
  };

  matches.set(snapshot.matchId, snapshot);
  await persistSnapshot(snapshot);
  return snapshot;
}
