'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  clearRoomPin,
  loadLocalSettings,
  loadRoomPin,
  saveLocalSettings,
  saveRoomPin,
} from '@/lib/localProfile';

type Room = {
  code: string;
  hostUserId: string;
  hostDisplayName: string;
  mode: 'LOCAL_WIFI';
  status: 'OPEN' | 'IN_GAME' | 'CLOSED';
  maxPlayers: number;
  members: Array<{ userId: string; displayName: string; emoji: string; joinedAtEpochMs: number }>;
  createdAtEpochMs: number;
  updatedAtEpochMs: number;
};

const EMOJIS = ['🌍', '🔥', '⚡', '🌊', '🪨', '🌪️', '🌙', '☀️', '🛰️', '🦾'];

export default function LanRoomsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('web_player');
  const [displayName, setDisplayName] = useState('Web Player');
  const [emoji, setEmoji] = useState('🌍');
  const [theme, setTheme] = useState('Obsidian');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [roomCode, setRoomCode] = useState('');
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string>('');
  const [isStarting, setIsStarting] = useState(false);

  const roomLabel = useMemo(() => (room ? `${room.code} (${room.status})` : 'No active room'), [room]);
  const amHost = room?.hostUserId === userId;

  useEffect(() => {
    const settings = loadLocalSettings();
    setUserId(settings.userId);
    setDisplayName(settings.displayName);
    setEmoji(settings.emoji);
    setTheme(settings.theme);
    setSoundEnabled(settings.soundEnabled);

    const pin = loadRoomPin();
    if (pin) {
      setRoomCode(pin.code);
      setUserId(pin.userId || settings.userId);
      setDisplayName(pin.displayName || settings.displayName);
      setEmoji(pin.emoji || settings.emoji);
    }
  }, []);

  useEffect(() => {
    saveLocalSettings({ userId, displayName, emoji, theme, soundEnabled });
  }, [userId, displayName, emoji, theme, soundEnabled]);

  useEffect(() => {
    if (!room) return;
    const me = room.members.some((m) => m.userId === userId);
    if (me && room.status !== 'CLOSED') {
      saveRoomPin({
        code: room.code,
        userId,
        displayName,
        emoji,
        ttlMs: 60_000,
      });
      return;
    }
    clearRoomPin();
  }, [room, userId, displayName, emoji]);

  async function createRoom() {
    setError('');
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostUserId: userId, hostDisplayName: displayName, hostEmoji: emoji, maxPlayers: 4 }),
    });
    if (!res.ok) {
      setError('Failed to create room');
      return;
    }
    const data = (await res.json()) as Room;
    setRoom(data);
    setRoomCode(data.code);
  }

  async function joinRoom() {
    setError('');
    const code = roomCode.trim().toUpperCase();
    const res = await fetch(`/api/rooms/${code}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, displayName, emoji }),
    });
    if (!res.ok) {
      setError('Unable to join room');
      return;
    }
    const data = (await res.json()) as Room;
    setRoom(data);
    setRoomCode(data.code);
  }

  async function rejoinSavedRoom() {
    const pin = loadRoomPin();
    if (!pin) {
      setError('No saved room code available');
      return;
    }

    setUserId(pin.userId);
    setDisplayName(pin.displayName || displayName);
    setEmoji(pin.emoji || emoji);
    setRoomCode(pin.code);
    setError('');

    const res = await fetch(`/api/rooms/${pin.code}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: pin.userId,
        displayName: pin.displayName || displayName,
        emoji: pin.emoji || emoji,
      }),
    });
    if (!res.ok) {
      clearRoomPin();
      setError('Saved room has expired or is unavailable');
      return;
    }
    const data = (await res.json()) as Room;
    setRoom(data);
  }

  async function refreshRoom() {
    if (!roomCode.trim()) return;
    const code = roomCode.trim().toUpperCase();
    const res = await fetch(`/api/rooms/${code}`);
    if (!res.ok) {
      setError('Room not found');
      return;
    }
    setError('');
    setRoom((await res.json()) as Room);
  }

  async function startRoom() {
    if (!room || !amHost) return;
    setError('');
    setIsStarting(true);
    const code = room.code.trim().toUpperCase();
    try {
      const res = await fetch(`/api/rooms/${code}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostUserId: userId }),
      });
      if (!res.ok) {
        setError('Unable to start room. Need 2 to 4 players.');
        return;
      }
      router.push(`/tabletop/${code}?userId=${encodeURIComponent(userId)}`);
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Cross-Platform Rooms</h1>
      <p className="text-sm text-gray-400">
        Create or join with room code. Any player on app or web can join this room.
      </p>

      <section className="bg-gray-800 rounded-xl p-4 space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <input
            className="bg-gray-900 rounded px-3 py-2"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="user id"
          />
          <input
            className="bg-gray-900 rounded px-3 py-2"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="display name"
          />
          <select className="bg-gray-900 rounded px-3 py-2" value={emoji} onChange={(e) => setEmoji(e.target.value)}>
            {EMOJIS.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
          <input
            className="bg-gray-900 rounded px-3 py-2"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="theme"
          />
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-gray-300">
          <input type="checkbox" checked={soundEnabled} onChange={(e) => setSoundEnabled(e.target.checked)} />
          Sound enabled
        </label>

        <div className="flex flex-wrap gap-2">
          <button onClick={createRoom} className="px-4 py-2 rounded bg-emerald-700 hover:bg-emerald-600">Create Room</button>
          <input
            className="bg-gray-900 rounded px-3 py-2"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            placeholder="ROOMCODE"
          />
          <button onClick={joinRoom} className="px-4 py-2 rounded bg-blue-700 hover:bg-blue-600">Join Room</button>
          <button onClick={rejoinSavedRoom} className="px-4 py-2 rounded bg-teal-700 hover:bg-teal-600">Rejoin Saved</button>
          <button onClick={refreshRoom} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600">Refresh</button>
          <button
            onClick={startRoom}
            disabled={!room || !amHost || isStarting}
            className="px-4 py-2 rounded bg-orange-700 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStarting ? 'Starting...' : 'Play'}
          </button>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </section>

      <section className="bg-gray-800 rounded-xl p-4 space-y-3">
        <h2 className="font-semibold">Current Room: {roomLabel}</h2>
        {room && (
          <ul className="space-y-2">
            {room.members.map((m) => (
              <li key={m.userId} className="bg-gray-900 rounded px-3 py-2 flex justify-between">
                <span>{m.emoji} {m.displayName}</span>
                <span className="text-gray-400 text-sm">{m.userId}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
