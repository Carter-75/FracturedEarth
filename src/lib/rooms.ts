import { getRedis } from '@/lib/redis';
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

export interface RoomGameState {
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
  if (EMOJI_OPTIONS.includes(next as (typeof EMOJI_OPTIONS)[number])) return next;
  return EMOJI_OPTIONS[0];
}

function isActiveMember(member: RoomMember): boolean {
  return !member.disconnectedAtEpochMs;
}

function usedEmojiSet(members: RoomMember[], excludeUserId?: string): Set<string> {
  return new Set(
    members
      .filter((member) => isActiveMember(member) && member.userId !== excludeUserId)
      .map((member) => member.emoji),
  );
}

function isEmojiAvailable(members: RoomMember[], emoji: string, excludeUserId?: string): boolean {
  return !usedEmojiSet(members, excludeUserId).has(emoji);
}

function pickAvailableEmoji(members: RoomMember[], preferred?: string, excludeUserId?: string): string {
  const normalizedPreferred = normalizeEmoji(preferred);
  if (isEmojiAvailable(members, normalizedPreferred, excludeUserId)) {
    return normalizedPreferred;
  }

  return EMOJI_OPTIONS.find((candidate) => isEmojiAvailable(members, candidate, excludeUserId)) ?? normalizedPreferred;
}

function countActiveMembers(members: RoomMember[]): number {
  return members.filter(isActiveMember).length;
}

function generateCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

function lobbyMetaKey(code: string): string {
  return `lobby:${code}:meta`;
}

function lobbyMembersKey(code: string): string {
  return `lobby:${code}:members`;
}

function lobbyStateKey(code: string): string {
  return `lobby:${code}:state`;
}

function pickNextHost(hostUserId: string, members: RoomMember[]): string {
  if (members.some((m) => m.userId === hostUserId)) return hostUserId;
  return members.find((m) => !m.disconnectedAtEpochMs)?.userId ?? members[0]?.userId ?? '';
}

function normalizeMember(raw: Partial<RoomMember>): RoomMember {
  return {
    userId: raw.userId ?? '',
    displayName: raw.displayName ?? 'Player',
    emoji: raw.emoji ?? '🌍',
    joinedAtEpochMs: Number(raw.joinedAtEpochMs ?? 0),
    lastHeartbeatEpochMs: Number(raw.lastHeartbeatEpochMs ?? raw.joinedAtEpochMs ?? 0),
    disconnectedAtEpochMs:
      typeof raw.disconnectedAtEpochMs === 'number' ? Number(raw.disconnectedAtEpochMs) : undefined,
    isBot: Boolean(raw.isBot),
  };
}

function pruneMembers(input: RoomMember[], status?: RoomStatus, now = Date.now()): RoomMember[] {
  if (status === 'IN_GAME') return input; // BUG 6 FIX: Do not drop connected players mid-match
  const pruned = input
    .map((member) => {
      if (member.isBot) return member;
      const disconnectedAt = member.disconnectedAtEpochMs;
      if (disconnectedAt) return member;
      if (now - member.lastHeartbeatEpochMs > RECONNECT_GRACE_MS) {
        return { ...member, disconnectedAtEpochMs: now };
      }
      return member;
    })
    .filter((member) => {
      if (!member.disconnectedAtEpochMs) return true;
      return now - member.disconnectedAtEpochMs <= RECONNECT_GRACE_MS;
    });

  return pruned;
}

async function generateUniqueCode(maxAttempts = 12): Promise<string> {
  const redis = await getRedis();
  for (let i = 0; i < maxAttempts; i++) {
    const code = generateCode();
    const exists = await redis.exists(lobbyMetaKey(code));
    if (!exists) return code;
  }
  throw new Error('Unable to allocate unique room code');
}

export async function createRoom(input: {
  hostUserId: string;
  hostDisplayName: string;
  hostEmoji?: string;
  maxPlayers: number;
}): Promise<RoomSnapshot> {
  const now = Date.now();
  const code = await generateUniqueCode();
  const maxPlayers = Math.min(4, Math.max(2, Number(input.maxPlayers || 4)));
  const hostDisplayName = input.hostDisplayName || 'Host';

  const members: RoomMember[] = [
    {
      userId: input.hostUserId,
      displayName: hostDisplayName,
      emoji: normalizeEmoji(input.hostEmoji),
      joinedAtEpochMs: now,
      lastHeartbeatEpochMs: now,
    },
  ];

  const redis = await getRedis();
  await redis.hSet(lobbyMetaKey(code), {
    hostUserId: input.hostUserId,
    hostDisplayName,
    mode: 'LOCAL_WIFI',
    status: 'OPEN',
    maxPlayers: String(maxPlayers),
    createdAtEpochMs: String(now),
    updatedAtEpochMs: String(now),
  });
  await redis.set(lobbyMembersKey(code), JSON.stringify(members));

  return {
    code,
    hostUserId: input.hostUserId,
    hostDisplayName,
    mode: 'LOCAL_WIFI',
    status: 'OPEN',
    maxPlayers,
    members,
    createdAtEpochMs: now,
    updatedAtEpochMs: now,
  };
}

export async function getRoom(codeRaw: string): Promise<RoomSnapshot | null> {
  const code = normalizeCode(codeRaw);
  const redis = await getRedis();
  const meta = await redis.hGetAll(lobbyMetaKey(code));
  if (!meta || Object.keys(meta).length === 0) return null;

  const membersRaw = (await redis.get(lobbyMembersKey(code))) ?? '[]';
  const parsedMembers = (JSON.parse(membersRaw) as Array<Partial<RoomMember>>).map(normalizeMember);
  const members = pruneMembers(parsedMembers, (meta.status as RoomStatus) ?? 'OPEN');
  const hostUserId = pickNextHost(meta.hostUserId ?? '', members);
  const updatedAtEpochMs = Date.now();

  if (
    hostUserId !== (meta.hostUserId ?? '') ||
    members.length !== parsedMembers.length ||
    JSON.stringify(members) !== JSON.stringify(parsedMembers)
  ) {
    await redis.set(lobbyMembersKey(code), JSON.stringify(members));
    await redis.hSet(lobbyMetaKey(code), {
      hostUserId,
      updatedAtEpochMs: String(updatedAtEpochMs),
      status: members.length === 0 ? 'CLOSED' : (meta.status ?? 'OPEN'),
    });
  }

  return {
    code,
    hostUserId,
    hostDisplayName: meta.hostDisplayName ?? 'Host',
    mode: 'LOCAL_WIFI',
    status: members.length === 0 ? 'CLOSED' : ((meta.status as RoomStatus) ?? 'OPEN'),
    maxPlayers: Number(meta.maxPlayers ?? 4),
    members,
    createdAtEpochMs: Number(meta.createdAtEpochMs ?? 0),
    updatedAtEpochMs: Number(meta.updatedAtEpochMs ?? 0) || updatedAtEpochMs,
  };
}

export async function joinRoom(input: {
  code: string;
  userId: string;
  displayName: string;
  emoji?: string;
}): Promise<RoomSnapshot | null> {
  const current = await getRoom(input.code);
  if (!current || current.status !== 'OPEN') return null;

  const exists = current.members.some((m) => m.userId === input.userId);
  if (!exists && countActiveMembers(current.members) >= current.maxPlayers) return null;

  const requestedEmoji = normalizeEmoji(input.emoji);
  if (!isEmojiAvailable(current.members, requestedEmoji, exists ? input.userId : undefined)) {
    throw new Error('Emoji already taken');
  }

  const nextMembers = exists
    ? current.members.map((m) =>
        m.userId === input.userId
          ? {
              ...m,
              displayName: input.displayName || m.displayName,
              emoji: requestedEmoji,
              disconnectedAtEpochMs: undefined,
              lastHeartbeatEpochMs: Date.now(),
            }
          : m,
      )
    : [
        ...current.members,
        {
          userId: input.userId,
          displayName: input.displayName || 'Player',
          emoji: requestedEmoji,
          joinedAtEpochMs: Date.now(),
          lastHeartbeatEpochMs: Date.now(),
        },
      ];

  const code = normalizeCode(input.code);
  const updatedAtEpochMs = Date.now();
  const redis = await getRedis();
  await redis.set(lobbyMembersKey(code), JSON.stringify(nextMembers));
  await redis.hSet(lobbyMetaKey(code), { updatedAtEpochMs: String(updatedAtEpochMs) });

  return { ...current, members: nextMembers, updatedAtEpochMs };
}

export async function leaveRoom(input: {
  code: string;
  userId: string;
}): Promise<RoomSnapshot | null> {
  const current = await getRoom(input.code);
  if (!current) return null;

  const code = normalizeCode(input.code);
  const nextMembers = current.members.map((m) =>
    m.userId === input.userId
      ? {
          ...m,
          disconnectedAtEpochMs: Date.now(),
        }
      : m,
  );
  const prunedMembers = pruneMembers(nextMembers, current.status);
  const nextHostUserId = pickNextHost(current.hostUserId, prunedMembers);
  const updatedAtEpochMs = Date.now();

  const redis = await getRedis();
  await redis.set(lobbyMembersKey(code), JSON.stringify(prunedMembers));
  await redis.hSet(lobbyMetaKey(code), {
    updatedAtEpochMs: String(updatedAtEpochMs),
    hostUserId: nextHostUserId,
    status: prunedMembers.length === 0 ? 'CLOSED' : current.status,
  });

  return {
    ...current,
    hostUserId: nextHostUserId,
    status: prunedMembers.length === 0 ? 'CLOSED' : current.status,
    members: prunedMembers,
    updatedAtEpochMs,
  };
}

export async function startRoomMatch(input: {
  code: string;
  hostUserId: string;
}): Promise<RoomSnapshot | null> {
  const current = await getRoom(input.code);
  if (!current) return null;
  if (current.hostUserId !== input.hostUserId) return null;
  const activeMembers = current.members.filter(isActiveMember);
  if (activeMembers.length < 2 || activeMembers.length > 4) return null;

  const code = normalizeCode(input.code);
  const updatedAtEpochMs = Date.now();
  const redis = await getRedis();
  await redis.hSet(lobbyMetaKey(code), {
    status: 'IN_GAME',
    updatedAtEpochMs: String(updatedAtEpochMs),
  });

  return {
    ...current,
    status: 'IN_GAME',
    updatedAtEpochMs,
  };
}

export async function addBotToRoom(input: {
  code: string;
  hostUserId: string;
}): Promise<RoomSnapshot | null> {
  const current = await getRoom(input.code);
  if (!current || current.status !== 'OPEN') return null;
  if (current.hostUserId !== input.hostUserId) return null;

  const activeMembers = current.members.filter(isActiveMember);
  if (activeMembers.length >= current.maxPlayers) return null;

  const botIndex = current.members.filter((member) => member.isBot).length + 1;
  const now = Date.now();
  const nextMembers = [
    ...current.members,
    {
      userId: `bot_${botIndex}_${now}`,
      displayName: `Bot ${botIndex}`,
      emoji: pickAvailableEmoji(current.members),
      joinedAtEpochMs: now,
      lastHeartbeatEpochMs: now,
      isBot: true,
    },
  ];

  const code = normalizeCode(input.code);
  const updatedAtEpochMs = Date.now();
  const redis = await getRedis();
  await redis.set(lobbyMembersKey(code), JSON.stringify(nextMembers));
  await redis.hSet(lobbyMetaKey(code), { updatedAtEpochMs: String(updatedAtEpochMs) });

  return { ...current, members: nextMembers, updatedAtEpochMs };
}

export async function removeRoomMember(input: {
  code: string;
  hostUserId: string;
  targetUserId: string;
}): Promise<RoomSnapshot | null> {
  const current = await getRoom(input.code);
  if (!current || current.status !== 'OPEN') return null;
  if (current.hostUserId !== input.hostUserId) return null;
  if (input.targetUserId === current.hostUserId) return null;
  if (!current.members.some((member) => member.userId === input.targetUserId)) return null;

  const nextMembers = current.members.filter((member) => member.userId !== input.targetUserId);
  const nextHostUserId = pickNextHost(current.hostUserId, nextMembers);
  const updatedAtEpochMs = Date.now();
  const code = normalizeCode(input.code);
  const redis = await getRedis();
  await redis.set(lobbyMembersKey(code), JSON.stringify(nextMembers));
  await redis.hSet(lobbyMetaKey(code), {
    updatedAtEpochMs: String(updatedAtEpochMs),
    hostUserId: nextHostUserId,
    status: nextMembers.length === 0 ? 'CLOSED' : current.status,
  });

  return {
    ...current,
    hostUserId: nextHostUserId,
    status: nextMembers.length === 0 ? 'CLOSED' : current.status,
    members: nextMembers,
    updatedAtEpochMs,
  };
}

export async function getRoomGameState(codeRaw: string): Promise<RoomGameState | null> {
  const code = normalizeCode(codeRaw);
  const redis = await getRedis();
  const raw = await redis.get(lobbyStateKey(code));
  if (!raw) return null;

  return JSON.parse(raw) as RoomGameState;
}

export async function putRoomGameState(input: {
  code: string;
  userId: string;
  payload: unknown;
  expectedRevision?: number;
}): Promise<RoomGameState | null> {
  const room = await getRoom(input.code);
  if (!room) return null;
  if (!room.members.some((m) => m.userId === input.userId)) return null;
  if (room.status !== 'IN_GAME') return null;

  const code = normalizeCode(input.code);
  const currentState = await getRoomGameState(code);
  const currentRevision = currentState?.revision ?? 0;

  if (typeof input.expectedRevision === 'number' && input.expectedRevision !== currentRevision) {
    return currentState;
  }

  const nextState: RoomGameState = {
    roomCode: code,
    revision: currentRevision + 1,
    updatedAtEpochMs: Date.now(),
    updatedByUserId: input.userId,
    payload: input.payload,
  };

  const redis = await getRedis();
  await redis.set(lobbyStateKey(code), JSON.stringify(nextState));
  await redis.hSet(lobbyMetaKey(code), { updatedAtEpochMs: String(nextState.updatedAtEpochMs) });
  return nextState;
}

export async function heartbeatRoom(input: {
  code: string;
  userId: string;
}): Promise<RoomSnapshot | null> {
  const room = await getRoom(input.code);
  if (!room) return null;
  const updatedAtEpochMs = Date.now();

  const nextMembers = room.members.map((m) =>
    m.userId === input.userId
      ? {
          ...m,
          disconnectedAtEpochMs: undefined,
          lastHeartbeatEpochMs: updatedAtEpochMs,
        }
      : m,
  );
  if (!nextMembers.some((m) => m.userId === input.userId)) return null;

  const code = normalizeCode(input.code);
  const redis = await getRedis();
  await redis.set(lobbyMembersKey(code), JSON.stringify(nextMembers));
  await redis.hSet(lobbyMetaKey(code), { updatedAtEpochMs: String(updatedAtEpochMs) });

  return {
    ...room,
    members: nextMembers,
    updatedAtEpochMs,
  };
}
