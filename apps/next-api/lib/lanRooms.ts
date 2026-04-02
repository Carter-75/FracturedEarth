export type LanLobbyStatus = 'OPEN' | 'IN_GAME' | 'CLOSED';

export interface LanLobbyMember {
  userId: string;
  displayName: string;
  joinedAtEpochMs: number;
}

export interface LanLobbySnapshot {
  code: string;
  hostUserId: string;
  hostDisplayName: string;
  mode: 'LOCAL_WIFI';
  status: LanLobbyStatus;
  maxPlayers: number;
  members: LanLobbyMember[];
  createdAtEpochMs: number;
  updatedAtEpochMs: number;
}

const rooms = new Map<string, LanLobbySnapshot>();

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

function generateCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export function createLanRoom(input: {
  hostUserId: string;
  hostDisplayName: string;
  maxPlayers: number;
}): LanLobbySnapshot {
  const now = Date.now();
  const code = generateCode();
  const maxPlayers = Math.min(4, Math.max(2, input.maxPlayers));

  const snapshot: LanLobbySnapshot = {
    code,
    hostUserId: input.hostUserId,
    hostDisplayName: input.hostDisplayName || 'Host',
    mode: 'LOCAL_WIFI',
    status: 'OPEN',
    maxPlayers,
    members: [
      {
        userId: input.hostUserId,
        displayName: input.hostDisplayName || 'Host',
        joinedAtEpochMs: now,
      },
    ],
    createdAtEpochMs: now,
    updatedAtEpochMs: now,
  };

  rooms.set(code, snapshot);
  return snapshot;
}

export function getLanRoom(code: string): LanLobbySnapshot | null {
  return rooms.get(normalizeCode(code)) ?? null;
}

export function joinLanRoom(input: {
  code: string;
  userId: string;
  displayName: string;
}): LanLobbySnapshot | null {
  const code = normalizeCode(input.code);
  const room = rooms.get(code);
  if (!room || room.status !== 'OPEN') return null;

  const exists = room.members.some((m) => m.userId === input.userId);
  if (!exists && room.members.length >= room.maxPlayers) return null;

  const nextMembers = exists
    ? room.members
    : [
        ...room.members,
        {
          userId: input.userId,
          displayName: input.displayName || 'Player',
          joinedAtEpochMs: Date.now(),
        },
      ];

  const updated: LanLobbySnapshot = {
    ...room,
    members: nextMembers,
    updatedAtEpochMs: Date.now(),
  };
  rooms.set(code, updated);
  return updated;
}

export function leaveLanRoom(input: {
  code: string;
  userId: string;
}): LanLobbySnapshot | null {
  const code = normalizeCode(input.code);
  const room = rooms.get(code);
  if (!room) return null;

  const members = room.members.filter((m) => m.userId !== input.userId);
  if (members.length === 0) {
    const closed: LanLobbySnapshot = {
      ...room,
      status: 'CLOSED',
      members,
      updatedAtEpochMs: Date.now(),
    };
    rooms.set(code, closed);
    return closed;
  }

  const updated: LanLobbySnapshot = {
    ...room,
    members,
    updatedAtEpochMs: Date.now(),
  };
  rooms.set(code, updated);
  return updated;
}

export function startLanMatch(input: {
  code: string;
  hostUserId: string;
}): LanLobbySnapshot | null {
  const code = normalizeCode(input.code);
  const room = rooms.get(code);
  if (!room) return null;
  if (room.hostUserId !== input.hostUserId) return null;
  if (room.members.length < 2 || room.members.length > 4) return null;

  const updated: LanLobbySnapshot = {
    ...room,
    status: 'IN_GAME',
    updatedAtEpochMs: Date.now(),
  };
  rooms.set(code, updated);
  return updated;
}
