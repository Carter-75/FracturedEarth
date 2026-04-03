import dbConnect from '@/lib/mongodb';
import { Room, RoomGameState } from '@/models/Room';
import { EMOJI_OPTIONS } from '@/lib/gameConfig';

export type RoomStatus = 'OPEN' | 'IN_GAME' | 'CLOSED';
export type RoomMode = 'LOCAL_WIFI';
export const RECONNECT_GRACE_MS = 60_000;

export interface RoomMember {
  userId: string;
  displayName: string;
  emoji: string;
  joinedAtEpochMs: number;
  lastHeartbeatEpochMs: number;
  disconnectedAtEpochMs?: number;
  isBot?: boolean;
}

export interface RoomSnapshot {
  code: string;
  hostUserId: string;
  hostDisplayName: string;
  mode: RoomMode;
  status: RoomStatus;
  maxPlayers: number;
  members: RoomMember[];
  createdAtEpochMs: number;
  updatedAtEpochMs: number;
}

export interface RoomGameStateSnapshot {
  roomCode: string;
  revision: number;
  updatedAtEpochMs: number;
  updatedByUserId: string;
  payload: unknown;
}

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

function normalizeEmoji(emoji?: string): string {
  const next = String(emoji ?? '').trim();
  const optionsArray = EMOJI_OPTIONS as any as string[];
  if (optionsArray.includes(next)) return next;
  return optionsArray[0];
}

function isActiveMember(member: any): boolean {
  return !member.disconnectedAtEpochMs;
}

function generateCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

function pickAvailableEmoji(members: any[], preferred?: string, excludeUserId?: string): string {
  const normalizedPreferred = normalizeEmoji(preferred);
  const used = new Set(
    members
      .filter((m) => isActiveMember(m) && m.userId !== excludeUserId)
      .map((m) => m.emoji)
  );

  if (!used.has(normalizedPreferred)) return normalizedPreferred;
  const optionsArray = EMOJI_OPTIONS as any as string[];
  return optionsArray.find((candidate) => !used.has(candidate)) ?? normalizedPreferred;
}

function pickNextHost(hostUserId: string, members: any[]): string {
  if (members.some((m) => m.userId === hostUserId && !m.disconnectedAtEpochMs)) return hostUserId;
  return members.find((m) => !m.disconnectedAtEpochMs)?.userId ?? members[0]?.userId ?? '';
}

function pruneMembers(input: any[], status?: string, now = Date.now()): any[] {
  if (status === 'IN_GAME') return input; 
  return input
    .map((member) => {
      if (member.isBot) return member;
      if (member.disconnectedAtEpochMs) return member;
      if (now - member.lastHeartbeatEpochMs > RECONNECT_GRACE_MS) {
        return { ...member, disconnectedAtEpochMs: now };
      }
      return member;
    })
    .filter((member) => {
      if (!member.disconnectedAtEpochMs) return true;
      return now - member.disconnectedAtEpochMs <= RECONNECT_GRACE_MS;
    });
}

export async function createRoom(input: {
  hostUserId: string;
  hostDisplayName: string;
  hostEmoji?: string;
  maxPlayers: number;
}): Promise<RoomSnapshot> {
  await dbConnect();
  const now = Date.now();
  let code = '';
  let unique = false;
  
  for (let i = 0; i < 10; i++) {
    code = generateCode();
    const existing = await Room.findOne({ code });
    if (!existing) {
       unique = true;
       break;
    }
  }
  if (!unique) throw new Error('Unable to generate unique room code');

  const maxPlayers = Math.min(4, Math.max(2, Number(input.maxPlayers || 4)));
  const hostDisplayName = input.hostDisplayName || 'Host';

  const room = await Room.create({
    code,
    hostUserId: input.hostUserId,
    hostDisplayName,
    mode: 'LOCAL_WIFI',
    status: 'OPEN',
    maxPlayers,
    members: [{
      userId: input.hostUserId,
      displayName: hostDisplayName,
      emoji: normalizeEmoji(input.hostEmoji),
      joinedAtEpochMs: now,
      lastHeartbeatEpochMs: now,
    }],
    createdAtEpochMs: now,
    updatedAtEpochMs: now,
  });

  return room.toObject();
}

export async function getRoom(codeRaw: string): Promise<RoomSnapshot | null> {
  await dbConnect();
  const code = normalizeCode(codeRaw);
  const room = await Room.findOne({ code });
  if (!room) return null;

  const now = Date.now();
  const originalMembers = room.members.toObject();
  const prunedMembers = pruneMembers(originalMembers, room.status, now);
  const nextHostUserId = pickNextHost(room.hostUserId, prunedMembers);

  if (
    nextHostUserId !== room.hostUserId || 
    prunedMembers.length !== originalMembers.length
  ) {
    room.members = prunedMembers;
    room.hostUserId = nextHostUserId;
    room.updatedAtEpochMs = now;
    if (prunedMembers.length === 0) room.status = 'CLOSED';
    await room.save();
  }

  return room.toObject();
}

export async function joinRoom(input: {
  code: string;
  userId: string;
  displayName: string;
  emoji?: string;
}): Promise<RoomSnapshot | null> {
  await dbConnect();
  const room = await Room.findOne({ code });
  if (!room) return null;

  // Block join if user was kicked
  if (room.kickedUserIds && room.kickedUserIds.includes(input.userId)) {
    throw new Error('You have been kicked from this room.');
  }

  // Handle joining/rejoining based on room status
  const exists = room.members.find((m: any) => m.userId === input.userId);
  if (room.status === 'IN_GAME') {
    if (!exists) throw new Error('Game in progress. New players cannot join.');
    // Allow rejoining
  } else if (room.status === 'OPEN') {
    const activeCount = room.members.filter(isActiveMember).length;
    if (!exists && activeCount >= room.maxPlayers) return null;
  } else {
    return null;
  }

  const emoji = pickAvailableEmoji(room.members, input.emoji, input.userId);
  const now = Date.now();

  if (exists) {
    exists.displayName = input.displayName || exists.displayName;
    exists.emoji = emoji;
    exists.disconnectedAtEpochMs = undefined;
    exists.lastHeartbeatEpochMs = now;
  } else {
    room.members.push({
      userId: input.userId,
      displayName: input.displayName || 'Player',
      emoji,
      joinedAtEpochMs: now,
      lastHeartbeatEpochMs: now,
    });
  }

  room.updatedAtEpochMs = now;
  await room.save();
  return room.toObject();
}

export async function leaveRoom(input: {
  code: string;
  userId: string;
}): Promise<RoomSnapshot | null> {
  const room = await getRoom(input.code);
  if (!room) return null;

  await dbConnect();
  const doc = await Room.findOne({ code: room.code });
  if (!doc) return null;

  const member = doc.members.find((m: any) => m.userId === input.userId);
  if (member) {
    member.disconnectedAtEpochMs = Date.now();
    doc.updatedAtEpochMs = Date.now();
    await doc.save();
  }

  return getRoom(room.code);
}

export async function startRoomMatch(input: {
  code: string;
  hostUserId: string;
}): Promise<RoomSnapshot | null> {
  await dbConnect();
  const code = normalizeCode(input.code);
  const room = await Room.findOne({ code });
  if (!room || room.hostUserId !== input.hostUserId) return null;

  const activeCount = room.members.filter(isActiveMember).length;
  if (activeCount < 2) return null;

  room.status = 'IN_GAME';
  room.updatedAtEpochMs = Date.now();
  await room.save();

  return room.toObject();
}

export async function addBotToRoom(input: {
  code: string;
  hostUserId: string;
}): Promise<RoomSnapshot | null> {
  await dbConnect();
  const code = normalizeCode(input.code);
  const room = await Room.findOne({ code });
  if (!room || room.status !== 'OPEN' || room.hostUserId !== input.hostUserId) return null;

  const activeCount = room.members.filter(isActiveMember).length;
  if (activeCount >= room.maxPlayers) return null;

  const botIndex = room.members.filter((m: any) => m.isBot).length + 1;
  const now = Date.now();
  
  room.members.push({
    userId: `bot_${botIndex}_${now}`,
    displayName: `Bot ${botIndex}`,
    emoji: pickAvailableEmoji(room.members),
    joinedAtEpochMs: now,
    lastHeartbeatEpochMs: now,
    isBot: true,
  });

  room.updatedAtEpochMs = now;
  await room.save();
  return room.toObject();
}

export async function heartbeatRoom(input: {
  code: string;
  userId: string;
}): Promise<RoomSnapshot | null> {
  await dbConnect();
  const code = normalizeCode(input.code);
  const room = await Room.findOne({ code });
  if (!room) return null;

  const member = room.members.find((m: any) => m.userId === input.userId);
  if (!member) return null;

  const now = Date.now();
  member.lastHeartbeatEpochMs = now;
  member.disconnectedAtEpochMs = undefined;
  room.updatedAtEpochMs = now;
  
  await room.save();
  return room.toObject();
}

export async function getRoomGameState(codeRaw: string): Promise<RoomGameStateSnapshot | null> {
  await dbConnect();
  const roomCode = normalizeCode(codeRaw);
  const state = await RoomGameState.findOne({ roomCode });
  return state ? state.toObject() : null;
}

export async function putRoomGameState(input: {
  code: string;
  userId: string;
  payload: unknown;
  expectedRevision?: number;
}): Promise<RoomGameStateSnapshot | null> {
  await dbConnect();
  const roomCode = normalizeCode(input.code);
  
  // Optimistic concurrency check
  const existing = await RoomGameState.findOne({ roomCode });
  const currentRevision = existing?.revision ?? 0;

  if (typeof input.expectedRevision === 'number' && input.expectedRevision !== currentRevision) {
    return existing ? existing.toObject() : null;
  }

  const now = Date.now();
  const result = await RoomGameState.findOneAndUpdate(
    { roomCode },
    {
      $inc: { revision: 1 },
      $set: {
        updatedAtEpochMs: now,
        updatedByUserId: input.userId,
        payload: input.payload,
      }
    },
    { upsert: true, new: true }
  );

  return result.toObject();
}

/**
 * Kick a player from a room (Host only)
 */
export async function kickMember(input: {
  code: string;
  hostUserId: string;
  targetUserId: string;
}): Promise<RoomSnapshot | null> {
  await dbConnect();
  const code = normalizeCode(input.code);
  const room = await Room.findOne({ code });
  if (!room || room.hostUserId !== input.hostUserId) return null;
  if (input.hostUserId === input.targetUserId) return null; // Cannot kick self

  const member = room.members.find((m: any) => m.userId === input.targetUserId);
  if (member) {
    member.disconnectedAtEpochMs = Date.now();
  }

  if (!room.kickedUserIds.includes(input.targetUserId)) {
    room.kickedUserIds.push(input.targetUserId);
  }

  room.updatedAtEpochMs = Date.now();
  await room.save();
  return getRoom(code);
}

/**
 * Get all rooms by their mode (e.g. LOCAL_WIFI)
 */
export async function getRoomsByMode(mode: string): Promise<any[]> {
  await dbConnect();
  try {
    return Room.find({ mode }).sort({ updatedAtEpochMs: -1 }).limit(10);
  } catch (e) {
    return [];
  }
}
