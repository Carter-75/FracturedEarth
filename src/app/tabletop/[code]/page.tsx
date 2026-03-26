'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  appendMatchOutcome,
  clearRoomPin,
  loadLocalSettings,
  saveRoomPin,
  type LocalMatchOutcome,
} from '@/lib/localProfile';

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
  status: 'OPEN' | 'IN_GAME' | 'CLOSED';
  members: RoomMember[];
};

type CardType = 'SURVIVAL' | 'DISASTER' | 'TRAIT' | 'ADAPT' | 'CHAOS';

type MatchCard = {
  id: string;
  name: string;
  type: CardType;
  pointsDelta: number;
  drawCount: number;
  disasterKind?: string;
  blocksDisaster?: string;
};

type MatchPlayer = {
  id: string;
  displayName: string;
  emoji: string;
  isBot: boolean;
  survivalPoints: number;
  health: number;
  hand: MatchCard[];
  traits: MatchCard[];
};

type GameStatePayload = {
  round: number;
  activePlayerIndex: number;
  players: MatchPlayer[];
  drawPile: MatchCard[];
  discardPile: MatchCard[];
  isGlobalDisasterPhase: boolean;
  winnerId?: string;
  cardsPlayedThisTurn: number;
};

function cardTheme(type: CardType): { icon: string; ring: string; tint: string } {
  switch (type) {
    case 'SURVIVAL':
      return { icon: '🌱', ring: 'border-emerald-500', tint: 'text-emerald-300' };
    case 'DISASTER':
      return { icon: '🌋', ring: 'border-rose-500', tint: 'text-rose-300' };
    case 'TRAIT':
      return { icon: '🛡️', ring: 'border-sky-500', tint: 'text-sky-300' };
    case 'ADAPT':
      return { icon: '🧬', ring: 'border-cyan-500', tint: 'text-cyan-300' };
    case 'CHAOS':
      return { icon: '⚡', ring: 'border-fuchsia-500', tint: 'text-fuchsia-300' };
    default:
      return { icon: '🃏', ring: 'border-slate-500', tint: 'text-slate-200' };
  }
}

type StateEnvelope = {
  roomCode: string;
  revision: number;
  updatedAtEpochMs: number;
  updatedByUserId: string;
  payload: GameStatePayload;
};

export default function TabletopPage() {
  const params = useParams<{ code: string }>();
  const search = useSearchParams();
  const code = String(params.code || '').trim().toUpperCase();
  const userFromQuery = String(search.get('userId') ?? '').trim();
  const [room, setRoom] = useState<Room | null>(null);
  const [state, setState] = useState<StateEnvelope | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState('');
  const [selectedTargetId, setSelectedTargetId] = useState('');

  const userId = useMemo(() => {
    if (userFromQuery) return userFromQuery;
    return loadLocalSettings().userId;
  }, [userFromQuery]);

  const me = room?.members.find((m) => m.userId === userId);
  const payload = state?.payload;
  const activePlayer = payload?.players[payload.activePlayerIndex];
  const myPlayer = payload?.players.find((p) => p.id === userId) ?? null;
  const selectedCard = myPlayer?.hand.find((c) => c.id === selectedCardId) ?? null;

  async function fetchRoom() {
    const res = await fetch(`/api/rooms/${code}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Room not found');
    return (await res.json()) as Room;
  }

  async function fetchState() {
    const res = await fetch(`/api/rooms/${code}/state`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as StateEnvelope;
  }

  async function sendHeartbeat() {
    if (!userId || !code) return;
    await fetch(`/api/rooms/${code}/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
  }

  async function postAction(action: Record<string, unknown>, expectedRevision?: number) {
    const res = await fetch(`/api/rooms/${code}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action, expectedRevision }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(String(data?.error ?? 'Action failed'));
    }
    return data as StateEnvelope;
  }

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let beatTimer: ReturnType<typeof setTimeout>;
    async function tick() {
      try {
        const roomSnapshot = await fetchRoom();
        setRoom(roomSnapshot);

        const memberSnapshot = roomSnapshot.members.find((m) => m.userId === userId);
        const isMember = Boolean(memberSnapshot);
        if (isMember && roomSnapshot.status !== 'CLOSED') {
          saveRoomPin({
            code: roomSnapshot.code,
            userId,
            displayName: memberSnapshot?.displayName ?? loadLocalSettings().displayName,
            emoji: memberSnapshot?.emoji ?? loadLocalSettings().emoji,
            ttlMs: 60_000,
          });
        }

        let stateSnapshot = await fetchState();
        if (!stateSnapshot && roomSnapshot.status === 'IN_GAME' && roomSnapshot.hostUserId === userId) {
          stateSnapshot = await postAction({ type: 'INIT_MATCH', botCount: 0 });
        }
        setState(stateSnapshot);
        await sendHeartbeat();
        beatTimer = setTimeout(sendHeartbeat, 10_000);
        setError('');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Sync error');
      } finally {
        timer = setTimeout(tick, 1500);
      }
    }

    if (code) tick();
    return () => {
      clearTimeout(timer);
      clearTimeout(beatTimer);
    };
  }, [code, userId]);

  useEffect(() => {
    if (!room || !state || !state.payload.winnerId) return;

    const winner = room.members.find((m) => m.userId === state.payload.winnerId);
    const dedupeId = `${code}:${state.revision}:${userId}`;
    const outcome: LocalMatchOutcome = {
      id: dedupeId,
      roomCode: code,
      playedAtEpochMs: state.updatedAtEpochMs,
      winnerUserId: state.payload.winnerId,
      winnerDisplayName: winner?.displayName ?? 'Unknown',
      participants: room.members.map((m) => ({ userId: m.userId, displayName: m.displayName, emoji: m.emoji })),
      didWin: state.payload.winnerId === userId,
    };
    appendMatchOutcome(outcome);
    clearRoomPin();
  }, [room, state, code, userId]);

  async function drawCard() {
    if (!state) return;
    setBusy(true);
    try {
      const synced = await postAction({ type: 'DRAW_CARD' }, state.revision);
      setState(synced);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to update state');
    } finally {
      setBusy(false);
    }
  }

  async function endTurn() {
    if (!state) return;
    setBusy(true);
    try {
      const synced = await postAction({ type: 'END_TURN' }, state.revision);
      setState(synced);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to end turn');
    } finally {
      setBusy(false);
    }
  }

  async function playSelectedCard() {
    if (!state || !selectedCard) return;
    setBusy(true);
    try {
      const needsTarget = selectedCard.type === 'DISASTER' && selectedCard.disasterKind !== 'GLOBAL';
      if (needsTarget && !selectedTargetId) {
        throw new Error('Select a target for disaster card');
      }
      const synced = await postAction(
        {
          type: 'PLAY_CARD',
          cardId: selectedCard.id,
          targetPlayerId: needsTarget ? selectedTargetId : undefined,
        },
        state.revision,
      );
      setState(synced);
      setSelectedCardId('');
      setSelectedTargetId('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to play card');
    } finally {
      setBusy(false);
    }
  }

  const isMyTurn = activePlayer?.id === userId;
  const opponents = (payload?.players ?? []).filter((p) => p.id !== userId);
  const winner = payload?.players.find((p) => p.id === payload?.winnerId);

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tabletop Room {code}</h1>
          <p className="text-gray-400 text-sm">Backend-authoritative room state with reconnect heartbeat.</p>
        </div>
        <Link href="/lan" className="text-sm text-gray-300 hover:text-white">Back to rooms</Link>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <section className="bg-gray-800 rounded-xl p-4">
        <h2 className="font-semibold mb-2">Players</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {payload?.players.map((m) => (
            <div key={m.id} className="bg-gray-900 rounded p-3 flex items-center justify-between">
              <span>{m.emoji} {m.displayName}{activePlayer?.id === m.id ? ' (turn)' : ''}</span>
              <span className="text-sm text-gray-400">{m.survivalPoints} pts • {m.health} hp • {m.hand.length} cards</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-800 rounded-xl p-4 space-y-3">
        <h2 className="font-semibold">Round {payload?.round ?? '-'}</h2>
        {winner ? (
          <p className="text-emerald-300 font-semibold">
            Winner: {winner.displayName}
          </p>
        ) : (
          <p className="text-sm text-gray-300">
            Draw pile: {payload?.drawPile.length ?? 0} • Discard pile: {payload?.discardPile.length ?? 0} • Cards played this turn: {payload?.cardsPlayedThisTurn ?? 0}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={drawCard}
            disabled={!me || busy || Boolean(winner) || !isMyTurn}
            className="px-4 py-2 rounded bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50"
          >
            Draw Card
          </button>
          <button
            onClick={endTurn}
            disabled={!me || busy || Boolean(winner) || !isMyTurn}
            className="px-4 py-2 rounded bg-indigo-700 hover:bg-indigo-600 disabled:opacity-50"
          >
            End Turn
          </button>
        </div>
      </section>

      <section className="bg-gray-800 rounded-xl p-4 space-y-3">
        <h2 className="font-semibold">Opponents (face-down)</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {opponents.map((p) => (
            <div key={p.id} className="bg-gray-900 rounded p-3">
              <div className="font-medium">{p.emoji} {p.displayName}</div>
              <div className="text-xs text-gray-400 mb-2">{p.hand.length} cards</div>
              <div className="flex gap-1 flex-wrap">
                {Array.from({ length: Math.min(8, p.hand.length) }).map((_, idx) => (
                  <div key={`${p.id}-${idx}`} className="h-12 w-8 rounded bg-slate-700 border border-slate-500" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-800 rounded-xl p-4 space-y-3">
        <h2 className="font-semibold">Your Hand (face-up)</h2>
        <div className="flex gap-2 flex-wrap">
          {(myPlayer?.hand ?? []).map((card) => {
            const theme = cardTheme(card.type);
            return (
              <button
                key={card.id}
                onClick={() => setSelectedCardId(card.id)}
                className={`text-left w-36 rounded-lg border ${theme.ring} bg-gradient-to-b from-slate-700 to-slate-900 px-3 py-2 hover:border-emerald-400`}
              >
                <div className={`text-xs ${theme.tint}`}>{theme.icon} {card.type}</div>
                <div className="font-semibold leading-tight">{card.name}</div>
                <div className="text-xs text-gray-300 mt-1">Pts {card.pointsDelta} • Draw {card.drawCount}</div>
              </button>
            );
          })}
        </div>
      </section>

      {selectedCard && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setSelectedCardId('')}>
          <div className="bg-gray-900 rounded-xl p-5 w-full max-w-md space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold">{selectedCard.name}</h3>
            <p className="text-sm text-gray-300">Type: {selectedCard.type}</p>
            <p className="text-sm text-gray-300">Points: {selectedCard.pointsDelta}</p>
            <p className="text-sm text-gray-300">Draw: {selectedCard.drawCount}</p>
            {selectedCard.disasterKind && (
              <p className="text-sm text-red-300">Disaster: {selectedCard.disasterKind}</p>
            )}
            {selectedCard.blocksDisaster && (
              <p className="text-sm text-teal-300">Blocks: {selectedCard.blocksDisaster}</p>
            )}

            {selectedCard.type === 'DISASTER' && selectedCard.disasterKind !== 'GLOBAL' && (
              <div className="space-y-1">
                <label className="text-sm text-gray-300">Target player</label>
                <select
                  className="w-full rounded bg-gray-800 px-3 py-2"
                  value={selectedTargetId}
                  onChange={(e) => setSelectedTargetId(e.target.value)}
                >
                  <option value="">Choose target...</option>
                  {opponents.map((p) => (
                    <option key={p.id} value={p.id}>{p.displayName}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={playSelectedCard}
                disabled={busy || !isMyTurn || Boolean(winner)}
                className="px-4 py-2 rounded bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50"
              >
                Play Card
              </button>
              <button
                onClick={() => setSelectedCardId('')}
                className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
