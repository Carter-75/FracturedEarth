'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EMOJI_OPTIONS, THEME_OPTIONS } from '@/lib/gameConfig';
import {
  clearRoomPin,
  loadLocalSettings,
  loadRoomPin,
  saveLocalSettings,
  saveRoomPin,
} from '@/lib/localProfile';
import { ImagePromptPlaceholder } from '@/components/ImagePromptPlaceholder';

type RoomMember = {
  userId: string;
  displayName: string;
  emoji: string;
  joinedAtEpochMs: number;
  disconnectedAtEpochMs?: number | null;
  lastHeartbeatEpochMs?: number;
  isBot?: boolean;
};

type Room = {
  code: string;
  hostUserId: string;
  hostDisplayName: string;
  mode: 'LOCAL_WIFI';
  status: 'OPEN' | 'IN_GAME' | 'CLOSED';
  maxPlayers: number;
  members: RoomMember[];
  createdAtEpochMs: number;
  updatedAtEpochMs: number;
};

type SeatPosition = 'bottom' | 'left' | 'top' | 'right';

const SEAT_ORDER: SeatPosition[] = ['bottom', 'left', 'top', 'right'];

export default function LanRoomsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('web_player');
  const [displayName, setDisplayName] = useState('Web Player');
  const [emoji, setEmoji] = useState('🌍');
  const [theme, setTheme] = useState<(typeof THEME_OPTIONS)[number]>('Obsidian');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [roomCode, setRoomCode] = useState('');
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const [copied, setCopied] = useState(false);

  const amHost = room?.hostUserId === userId;
  const activeMembers = useMemo(
    () => (room?.members ?? []).filter((member) => !member.disconnectedAtEpochMs),
    [room],
  );
  const canStart = Boolean(amHost && room?.status === 'OPEN' && activeMembers.length >= 2);
  const takenEmojis = useMemo(() => new Set(activeMembers.map((member) => member.emoji)), [activeMembers]);

  const seats = useMemo(() => {
    const orderedMembers = activeMembers.slice(0, 4);
    return SEAT_ORDER.map((position, index) => ({
      position,
      member: orderedMembers[index] ?? null,
    }));
  }, [activeMembers]);

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
    const isMember = activeMembers.some((member) => member.userId === userId);
    if (isMember && room.status !== 'CLOSED') {
      saveRoomPin({ code: room.code, userId, displayName, emoji, ttlMs: 60_000 });
    } else {
      clearRoomPin();
    }
  }, [room, activeMembers, userId, displayName, emoji]);

  useEffect(() => {
    if (!roomCode.trim()) return;

    let pollTimer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const refresh = async () => {
      try {
        const code = roomCode.trim().toUpperCase();
        const res = await fetch(`/api/rooms/${code}`, { cache: 'no-store' });
        if (!res.ok) {
          if (!cancelled) {
            setRoom(null);
          }
          return;
        }

        const nextRoom = (await res.json()) as Room;
        if (cancelled) return;
        setRoom(nextRoom);
        setError('');

        const isMember = nextRoom.members.some(
          (member) => member.userId === userId && !member.disconnectedAtEpochMs,
        );

        if (isMember) {
          await fetch(`/api/rooms/${code}/heartbeat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
          });
        }

        if (nextRoom.status === 'IN_GAME' && isMember) {
          router.push(`/tabletop/${code}?userId=${encodeURIComponent(userId)}`);
          return;
        }
      } catch {
        if (!cancelled) setError('Unable to sync room');
      } finally {
        if (!cancelled) {
          pollTimer = setTimeout(refresh, 1600);
        }
      }
    };

    refresh();
    return () => {
      cancelled = true;
      clearTimeout(pollTimer);
    };
  }, [roomCode, userId, router]);

  async function createRoom() {
    setBusyAction('create');
    setError('');
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostUserId: userId.trim(),
          hostDisplayName: displayName.trim() || 'Host',
          hostEmoji: emoji,
          maxPlayers: 4,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(String(data?.error ?? 'Failed to create room'));
      setRoom(data as Room);
      setRoomCode((data as Room).code);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to create room');
    } finally {
      setBusyAction('');
    }
  }

  async function joinRoom() {
    setBusyAction('join');
    setError('');
    try {
      const code = roomCode.trim().toUpperCase();
      const res = await fetch(`/api/rooms/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId.trim(), displayName: displayName.trim() || 'Player', emoji }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(String(data?.error ?? 'Unable to join room'));
      setRoom(data as Room);
      setRoomCode((data as Room).code);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to join room');
    } finally {
      setBusyAction('');
    }
  }

  async function rejoinSavedRoom() {
    const pin = loadRoomPin();
    if (!pin) {
      setError('No saved room code available');
      return;
    }
    setBusyAction('join');
    setError('');
    try {
      setUserId(pin.userId);
      setDisplayName(pin.displayName || displayName);
      setEmoji(pin.emoji || emoji);
      setRoomCode(pin.code);

      const res = await fetch(`/api/rooms/${pin.code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: pin.userId,
          displayName: pin.displayName || displayName,
          emoji: pin.emoji || emoji,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(String(data?.error ?? 'Unable to rejoin room'));
      setRoom(data as Room);
    } catch (nextError) {
      clearRoomPin();
      setError(nextError instanceof Error ? nextError.message : 'Unable to rejoin room');
    } finally {
      setBusyAction('');
    }
  }

  async function leaveCurrentRoom() {
    if (!room) return;
    setBusyAction('leave');
    setError('');
    try {
      const res = await fetch(`/api/rooms/${room.code}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(String(data?.error ?? 'Unable to leave room'));
      setRoom(data as Room);
      clearRoomPin();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to leave room');
    } finally {
      setBusyAction('');
    }
  }

  async function addBot() {
    if (!room || !amHost) return;
    setBusyAction('bot');
    setError('');
    try {
      const res = await fetch(`/api/rooms/${room.code}/lobby`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostUserId: userId, operation: 'ADD_BOT' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(String(data?.error ?? 'Unable to add bot'));
      setRoom(data as Room);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to add bot');
    } finally {
      setBusyAction('');
    }
  }

  async function removeMember(targetUserId: string) {
    if (!room || !amHost) return;
    setBusyAction(`kick:${targetUserId}`);
    setError('');
    try {
      const res = await fetch(`/api/rooms/${room.code}/lobby`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostUserId: userId, operation: 'REMOVE_MEMBER', targetUserId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(String(data?.error ?? 'Unable to remove member'));
      setRoom(data as Room);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to remove member');
    } finally {
      setBusyAction('');
    }
  }

  async function startRoom() {
    if (!room || !amHost) return;
    setBusyAction('start');
    setError('');
    try {
      const res = await fetch(`/api/rooms/${room.code}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostUserId: userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(String(data?.error ?? 'Need 2 to 4 players to start'));
      setRoom(data as Room);
      router.push(`/tabletop/${room.code}?userId=${encodeURIComponent(userId)}`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to start room');
    } finally {
      setBusyAction('');
    }
  }

  async function copyCode() {
    if (!room?.code) return;
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setError('Unable to copy room code');
    }
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Room Lobby</h1>
          <p className="fe-muted mt-2 max-w-2xl text-sm sm:text-base">
            Host a local Wi-Fi room, share the six-character code, fill up to four seats with friends or bots,
            and start once two or more seats are occupied.
          </p>
        </div>
        <Link href="/settings" className="fe-panel-alt rounded-xl px-4 py-2 text-sm hover:opacity-90">
          Open Settings
        </Link>
      </div>

      <section className="fe-panel rounded-3xl p-5 sm:p-6 space-y-4">
        {/* AI prompt: overhead LAN game table with four carved seats, hand-written seat tags, warm tungsten lamp glow, tactile board-game realism */}
        <ImagePromptPlaceholder label="Lobby Table Overhead Art" ratioClassName="aspect-[21/8]" />
        <div className="grid sm:grid-cols-2 gap-3">
          {/* AI prompt: close-up room code plate made of brass and enamel, engraved letters, soft tabletop shadows, premium board game component photo */}
          <ImagePromptPlaceholder label="Room Code Plate Art" ratioClassName="aspect-[16/9]" />
          {/* AI prompt: seat marker tokens with emojis painted on wood chips, arranged around green felt, handcrafted analog style */}
          <ImagePromptPlaceholder label="Seat Marker Token Art" ratioClassName="aspect-[16/9]" />
        </div>

        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                className="fe-panel-alt rounded-xl px-3 py-3 outline-none"
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                placeholder="Your player id"
              />
              <input
                className="fe-panel-alt rounded-xl px-3 py-3 outline-none"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Display name"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <select
                className="fe-panel-alt rounded-xl px-3 py-3 outline-none"
                value={emoji}
                onChange={(event) => setEmoji(event.target.value)}
              >
                {EMOJI_OPTIONS.map((candidate) => {
                  const disabled = takenEmojis.has(candidate) && !activeMembers.some((member) => member.userId === userId && member.emoji === candidate);
                  return (
                    <option key={candidate} value={candidate} disabled={disabled}>
                      {candidate} {disabled ? 'taken' : ''}
                    </option>
                  );
                })}
              </select>

              <select
                className="fe-panel-alt rounded-xl px-3 py-3 outline-none"
                value={theme}
                onChange={(event) => setTheme(event.target.value as (typeof THEME_OPTIONS)[number])}
              >
                {THEME_OPTIONS.map((candidate) => (
                  <option key={candidate} value={candidate}>
                    {candidate}
                  </option>
                ))}
              </select>
            </div>

            <label className="inline-flex items-center gap-2 text-sm fe-muted">
              <input type="checkbox" checked={soundEnabled} onChange={(event) => setSoundEnabled(event.target.checked)} />
              Sound enabled
            </label>
          </div>

          <div className="fe-panel-alt rounded-2xl p-4 space-y-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] fe-muted">Room Code</p>
              <div className="mt-2 flex items-center gap-3">
                <input
                  className="fe-panel rounded-xl px-3 py-3 w-full tracking-[0.35em] font-semibold uppercase"
                  value={roomCode}
                  onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
                  placeholder="ABC123"
                  maxLength={6}
                />
                <button onClick={joinRoom} disabled={busyAction !== ''} className="fe-button-primary rounded-xl px-4 py-3 font-semibold disabled:opacity-50">
                  Join
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={createRoom} disabled={busyAction !== ''} className="fe-button-primary rounded-xl px-4 py-3 font-semibold disabled:opacity-50">
                Create Room
              </button>
              <button onClick={rejoinSavedRoom} disabled={busyAction !== ''} className="fe-panel rounded-xl px-4 py-3 font-semibold disabled:opacity-50">
                Rejoin Saved
              </button>
              {room && (
                <button onClick={leaveCurrentRoom} disabled={busyAction !== ''} className="fe-panel rounded-xl px-4 py-3 font-semibold disabled:opacity-50">
                  Leave Room
                </button>
              )}
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-300">{error}</p>}
      </section>

      <section className="fe-panel fe-table-rail rounded-[2rem] p-5 sm:p-8 fe-seat-enter">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] fe-muted">Current Room</p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <h2 className="text-3xl font-black tracking-[0.2em]">{room?.code ?? '------'}</h2>
              {room?.code && (
                <button onClick={copyCode} className="fe-panel-alt rounded-xl px-3 py-2 text-sm font-medium">
                  {copied ? 'Copied' : 'Copy Code'}
                </button>
              )}
            </div>
            <p className="fe-muted mt-2 text-sm">
              {room ? `${activeMembers.length} / ${room.maxPlayers} seats filled` : 'Create a room or join one with a share code.'}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {amHost && room?.status === 'OPEN' && activeMembers.length < 4 && (
              <button onClick={addBot} disabled={busyAction !== ''} className="fe-panel-alt rounded-xl px-4 py-3 font-semibold disabled:opacity-50">
                Add Bot
              </button>
            )}
            <button
              onClick={startRoom}
              disabled={!canStart || busyAction !== ''}
              className={`rounded-xl px-5 py-3 font-semibold transition ${canStart ? 'fe-button-primary shadow-lg shadow-black/30' : 'fe-panel-alt opacity-60 cursor-not-allowed'}`}
            >
              {busyAction === 'start' ? 'Starting...' : 'Start Match'}
            </button>
          </div>
        </div>

        <div className="relative mx-auto max-w-4xl h-[36rem] sm:h-[42rem]">
          <div className="absolute inset-[18%] rounded-[2.5rem] fe-table-arena [transform:perspective(1200px)_rotateX(56deg)]">
            <div className="absolute inset-[12%] rounded-[2rem] border border-white/10 bg-black/10" />
          </div>

          {seats.map((seat) => (
            <SeatCard
              key={seat.position}
              seat={seat.position}
              member={seat.member}
              isHost={seat.member?.userId === room?.hostUserId}
              amHost={Boolean(amHost && room?.status === 'OPEN')}
              onKick={seat.member && seat.member.userId !== room?.hostUserId ? () => removeMember(seat.member!.userId) : undefined}
              onAddBot={seat.member ? undefined : amHost && room?.status === 'OPEN' && activeMembers.length < 4 ? addBot : undefined}
              busy={busyAction !== ''}
            />
          ))}
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-4">
          {/* AI prompt: instruction panel pinned to cork board with hand-drawn arrows showing join flow, rustic game room vibe */}
          <ImagePromptPlaceholder label="Lobby How-To Panel Art" ratioClassName="aspect-[20/6]" className="md:col-span-2" />

          <div className="fe-panel-alt rounded-2xl p-4">
            <h3 className="font-semibold text-lg">How This Lobby Works</h3>
            <ul className="mt-3 space-y-2 text-sm fe-muted">
              <li>Share the six-character code with anyone on the same local network or any reachable client.</li>
              <li>The host always owns the bottom seat and can add bots or remove occupied seats before starting.</li>
              <li>Only one player can hold each emoji. Bots auto-pick from the remaining emoji pool.</li>
              <li>The start button activates once at least two total seats are filled.</li>
            </ul>
          </div>

          <div className="fe-panel-alt rounded-2xl p-4">
            <h3 className="font-semibold text-lg">Seat Order</h3>
            <p className="mt-3 text-sm fe-muted">
              Play proceeds clockwise around the square table: bottom, left, top, then right. That seat order is the same order passed into the match engine.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function SeatCard({
  seat,
  member,
  isHost,
  amHost,
  onKick,
  onAddBot,
  busy,
}: {
  seat: SeatPosition;
  member: RoomMember | null;
  isHost: boolean;
  amHost: boolean;
  onKick?: () => void;
  onAddBot?: () => void;
  busy: boolean;
}) {
  const positionClass =
    seat === 'bottom'
      ? 'left-1/2 -translate-x-1/2 bottom-0 w-[16rem]'
      : seat === 'top'
        ? 'left-1/2 -translate-x-1/2 top-0 w-[16rem]'
        : seat === 'left'
          ? 'left-0 top-1/2 -translate-y-1/2 w-[14rem]'
          : 'right-0 top-1/2 -translate-y-1/2 w-[14rem]';

  return (
    <div className={`absolute ${positionClass}`}>
      <div className="fe-seat-plinth rounded-3xl p-4 text-center min-h-[9rem] flex flex-col justify-center gap-2 shadow-2xl shadow-black/30">
        <p className="text-[10px] uppercase tracking-[0.28em] fe-muted">{seat} seat</p>
        {member ? (
          <>
            <div className="text-4xl">{member.emoji}</div>
            <div className="font-semibold text-lg leading-tight">{member.displayName}</div>
            <div className="text-xs fe-muted">{member.isBot ? 'Bot' : 'Player'}{isHost ? ' • Host' : ''}</div>
            {amHost && onKick && (
              <button onClick={onKick} disabled={busy} className="mx-auto mt-2 h-9 w-9 rounded-full bg-red-700 text-white text-lg disabled:opacity-50">
                -
              </button>
            )}
          </>
        ) : (
          <>
            <div className="text-3xl fe-muted">Empty</div>
            <div className="text-sm fe-muted">Open seat for a friend or bot</div>
            {amHost && onAddBot && (
              <button onClick={onAddBot} disabled={busy} className="mx-auto mt-2 h-10 w-10 rounded-full fe-button-primary text-xl disabled:opacity-50">
                +
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
