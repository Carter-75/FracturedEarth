'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  appendMatchOutcome,
  clearRoomPin,
  loadLocalSettings,
  saveRoomPin,
  type LocalMatchOutcome,
} from '@/lib/localProfile';
import { cardTheme, describeCardEffect, positionOpponents } from '@/lib/tabletopShared';
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
  status: 'OPEN' | 'IN_GAME' | 'CLOSED';
  members: RoomMember[];
};

type CardType = 'SURVIVAL' | 'DISASTER' | 'POWER' | 'ADAPT' | 'CHAOS' | 'ASCENDED' | 'TWIST' | 'CATACLYSM';

type MatchCard = {
  id: string;
  name: string;
  type: CardType;
  pointsDelta: number;
  drawCount: number;
  tier?: 1 | 2 | 3 | 4 | 5;
  effect?: string;
  gainHealth?: number;
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
  powers: MatchCard[];
  twistEffect?: string;
};

type GameStatePayload = {
  round: number;
  activePlayerIndex: number;
  players: MatchPlayer[];
  drawPile: MatchCard[];
  discardPile: MatchCard[];
  turnPile: MatchCard[];
  isGlobalDisasterPhase: boolean;
  winnerId?: string;
  cardsPlayedThisTurn: number;
  hasDrawnThisTurn: boolean;
  botTurnReplay?: Array<{
    actorId: string;
    actorName: string;
    action: 'DRAW' | 'PLAY' | 'END_TURN';
    cardName?: string;
    targetPlayerId?: string;
  }>;
};


type StateEnvelope = {
  roomCode: string;
  revision: number;
  updatedAtEpochMs: number;
  updatedByUserId: string;
  payload: GameStatePayload;
};

const SLOT_DELAY_MS: Record<'left' | 'top' | 'right' | 'bottom', number> = {
  left: 120,
  top: 220,
  right: 320,
  bottom: 420,
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
  const [botReplayMessage, setBotReplayMessage] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [lastAnimatedRevision, setLastAnimatedRevision] = useState<number | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [showDiscardDetails, setShowDiscardDetails] = useState(false);
  const [playedAnimCard, setPlayedAnimCard] = useState<MatchCard | null>(null);
  const [deckPulse, setDeckPulse] = useState(false);
  const prevStateRef = useRef<StateEnvelope | null>(null);

  const userId = useMemo(() => {
    if (userFromQuery) return userFromQuery;
    return loadLocalSettings().userId;
  }, [userFromQuery]);

  const me = room?.members.find((m) => m.userId === userId);
  const payload = state?.payload;
  const activePlayer = payload?.players[payload.activePlayerIndex];
  const myPlayer = payload?.players.find((p) => p.id === userId) ?? null;
  const selectedCard = myPlayer?.hand.find((c) => c.id === selectedCardId) ?? null;

  const fetchRoom = useCallback(async () => {
    const res = await fetch(`/api/rooms/${code}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Room not found');
    return (await res.json()) as Room;
  }, [code]);

  const fetchState = useCallback(async () => {
    const res = await fetch(`/api/rooms/${code}/state`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as StateEnvelope;
  }, [code]);

  const sendHeartbeat = useCallback(async () => {
    if (!userId || !code) return;
    await fetch(`/api/rooms/${code}/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
  }, [code, userId]);

  const postAction = useCallback(async (action: Record<string, unknown>, expectedRevision?: number) => {
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
  }, [code, userId]);

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
  }, [code, userId, fetchRoom, fetchState, postAction, sendHeartbeat]);

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

  useEffect(() => {
    const replay = payload?.botTurnReplay;
    if (!state || !replay?.length) return;
    if (lastAnimatedRevision === state.revision) return;

    let cancelled = false;
    setLastAnimatedRevision(state.revision);

    (async () => {
      for (const event of replay) {
        if (cancelled) return;

        if (event.action === 'DRAW') {
          setBotReplayMessage(`${event.actorName} draws a card...`);
        } else if (event.action === 'PLAY') {
          const target = event.targetPlayerId ? ` on ${event.targetPlayerId}` : '';
          setBotReplayMessage(`${event.actorName} plays ${event.cardName ?? 'a card'}${target}...`);
        } else {
          setBotReplayMessage(`${event.actorName} ends turn...`);
        }

        await new Promise((resolve) => setTimeout(resolve, 650));
      }

      if (!cancelled) {
        setTimeout(() => {
          if (!cancelled) setBotReplayMessage('');
        }, 350);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [payload?.botTurnReplay, state, lastAnimatedRevision]);

  useEffect(() => {
    if (!payload) return;
    const timer = setTimeout(() => setShowIntro(false), 1400);
    return () => clearTimeout(timer);
  }, [payload]);

  useEffect(() => {
    if (!state) return;

    const prev = prevStateRef.current;
    prevStateRef.current = state;
    if (!prev) return;
    if (prev.revision === state.revision) return;

    const prevPayload = prev.payload;
    const nextPayload = state.payload;
    const topPlayed = nextPayload.discardPile[nextPayload.discardPile.length - 1];
    let animTimer: ReturnType<typeof setTimeout> | undefined;
    let clearTimer: ReturnType<typeof setTimeout> | undefined;
    let drawTimer: ReturnType<typeof setTimeout> | undefined;

    if (!prevPayload.hasDrawnThisTurn && nextPayload.hasDrawnThisTurn) {
      setDeckPulse(true);
      drawTimer = setTimeout(() => setDeckPulse(false), 420);
    }

    if (!topPlayed) return;

    if (nextPayload.discardPile.length > prevPayload.discardPile.length) {
      setPlayedAnimCard(topPlayed);
      animTimer = setTimeout(() => setPlayedAnimCard(null), 620);
    }

    const prevById = new Map(prevPayload.players.map((p) => [p.id, p]));
    const deltas: string[] = [];
    for (const player of nextPayload.players) {
      const old = prevById.get(player.id);
      if (!old) continue;
      const hpDelta = player.health - old.health;
      const ptsDelta = player.survivalPoints - old.survivalPoints;
      if (hpDelta !== 0) {
        deltas.push(`${player.displayName} ${hpDelta > 0 ? '+' : ''}${hpDelta} hp`);
      }
      if (ptsDelta !== 0) {
        deltas.push(`${player.displayName} ${ptsDelta > 0 ? '+' : ''}${ptsDelta} pts`);
      }
    }

    const effectLine = deltas.length ? ` (${deltas.join(' | ')})` : '';
    setActionMessage(`${topPlayed.name}${effectLine}`);
    clearTimer = setTimeout(() => setActionMessage(''), 2200);
    return () => {
      if (animTimer) clearTimeout(animTimer);
      if (clearTimer) clearTimeout(clearTimer);
      if (drawTimer) clearTimeout(drawTimer);
    };
  }, [state]);

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
  const canDraw = Boolean(me && isMyTurn && !busy && !winner && payload && !payload.hasDrawnThisTurn);
  const canEndTurn = Boolean(me && isMyTurn && !busy && !winner && payload?.hasDrawnThisTurn);
  const maxPlayReached = Boolean((payload?.cardsPlayedThisTurn ?? 0) >= 3);
  const positionedOpponents = positionOpponents(payload?.players ?? [], userId);

  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Tabletop Room {code}</h1>
          <p className="fe-muted text-sm">Clockwise turn order. Room state stays authoritative on the backend.</p>
        </div>
        <Link href="/lan" className="fe-panel-alt rounded-xl px-4 py-2 text-sm hover:opacity-90">Back to lobby</Link>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <section className="fe-panel rounded-[2rem] p-4 sm:p-6 space-y-4 relative overflow-hidden fe-table-rail">
        {/* AI prompt: dramatic post-apocalypse card table center, worn wood rail, green felt, survival tokens, cinematic rim light, photoreal style */}
        <ImagePromptPlaceholder label="Tabletop Atmosphere Matte" ratioClassName="aspect-[24/5]" />
        <div className="grid sm:grid-cols-2 gap-3">
          {/* AI prompt: draw deck close-up with embossed card backs, candlelit shadows, cinematic board game photography */}
          <ImagePromptPlaceholder label="Deck Texture Art" ratioClassName="aspect-[16/9]" />
          {/* AI prompt: discard pile storytelling shot with torn-edge cards, ash particles, warm practical lighting, realistic macro */}
          <ImagePromptPlaceholder label="Discard Story Art" ratioClassName="aspect-[16/9]" />
        </div>

        {showIntro && payload && (
          <div className="absolute inset-0 z-20 bg-black/75 backdrop-blur-sm flex items-center justify-center fe-game-intro">
            <div className="text-center space-y-3">
              <p className="text-xs uppercase tracking-[0.35em] fe-muted">Match Starting</p>
              <h2 className="text-4xl sm:text-6xl font-black tracking-[0.12em]">FRACTURED EARTH</h2>
              <p className="fe-accent text-sm">Round 1 begins. Opening turn starts from the bottom seat and moves clockwise.</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="font-semibold text-xl">Round {payload?.round ?? '-'}</h2>
          <div className="text-sm fe-muted">
            Draw pile: {payload?.drawPile.length ?? 0} • Discard pile: {payload?.discardPile.length ?? 0} • Played this turn: {payload?.cardsPlayedThisTurn ?? 0}
          </div>
        </div>

        {botReplayMessage && (
          <p className="text-amber-300 text-sm font-medium animate-pulse">{botReplayMessage}</p>
        )}
        {winner ? (
          <p className="text-emerald-300 font-semibold">Winner: {winner.displayName}</p>
        ) : (
          <p className="text-sm fe-muted">
            {activePlayer ? `${activePlayer.emoji} ${activePlayer.displayName} is acting now.` : 'Waiting for players...'}
          </p>
        )}
        {actionMessage && <p className="text-cyan-200 text-sm font-medium">{actionMessage}</p>}

        <div className="relative mx-auto max-w-6xl h-[56rem] sm:h-[60rem] fe-table-stage">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-[14%] top-[20%] h-44 w-44 rounded-full bg-cyan-300/10 blur-3xl" />
            <div className="absolute right-[10%] bottom-[16%] h-48 w-48 rounded-full bg-orange-300/10 blur-3xl" />
          </div>

          <div className="absolute inset-[16%] rounded-[2.75rem] fe-table-arena [transform:perspective(1500px)_rotateX(58deg)]">
            <div className="absolute inset-[7%] rounded-[2.2rem] border border-white/10 bg-black/10" />
            <div className="absolute inset-x-[11%] -bottom-3 h-5 rounded-full bg-black/35 blur-md" />
          </div>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 text-center fe-center-stack">
            <div className="fe-center-pedestal rounded-[2rem] px-6 py-5 min-w-[15rem] fe-center-pulse">
              <p className="text-xs uppercase tracking-[0.3em] fe-muted">Center Stack</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <button
                  onClick={drawCard}
                  disabled={!canDraw}
                  className={`fe-stack-card fe-stack-draw disabled:opacity-45 disabled:cursor-not-allowed ${deckPulse ? 'fe-deck-pulse' : ''}`}
                  title="Draw from deck"
                >
                  <div className="text-[10px] uppercase tracking-[0.2em] fe-muted">Deck</div>
                  <div className="text-2xl font-black mt-1">{payload?.drawPile.length ?? 0}</div>
                  <div className="text-[10px] mt-1 text-cyan-100/90">Tap to draw</div>
                </button>
                <button className="fe-stack-card fe-stack-discard" title="Discard pile" onClick={() => setShowDiscardDetails(true)}>
                  <div className="text-[10px] uppercase tracking-[0.2em] fe-muted">Discard</div>
                  <div className="text-2xl font-black mt-1">{payload?.discardPile.length ?? 0}</div>
                  <div className="text-[10px] mt-1 text-amber-100/80">Tap to inspect</div>
                </button>
              </div>
              {!!payload?.discardPile?.length && (
                <div className="mt-2 flex items-center justify-center gap-1.5">
                  {payload.discardPile.slice(-3).reverse().map((card) => {
                    const theme = cardTheme(card.type);
                    return (
                      <div key={card.id} className={`h-10 w-7 rounded border ${theme.ring} bg-[linear-gradient(180deg,#2a3242,#181f2d)] flex items-center justify-center text-xs`} title={card.name}>
                        {theme.icon}
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="fe-muted mt-3 text-xs">Clockwise order from bottom seat.</p>
              <p className="mt-2 text-[11px] tracking-[0.25em] text-amber-200/80">BOTTOM -&gt; LEFT -&gt; TOP -&gt; RIGHT</p>
              <button
                onClick={endTurn}
                disabled={!canEndTurn}
                className="fe-turn-puck mt-3 disabled:opacity-45 disabled:cursor-not-allowed"
              >
                End Turn
              </button>
            </div>
          </div>

          {!!payload?.turnPile?.length && (
            <div className="absolute left-1/2 bottom-[29%] -translate-x-1/2 z-10">
              <div className="fe-center-pedestal rounded-xl px-3 py-2 text-center min-w-[13rem]">
                <p className="text-[10px] uppercase tracking-[0.22em] fe-muted">Played This Turn</p>
                <div className="flex items-center justify-center gap-1.5 mt-2">
                  {payload.turnPile.slice(-5).map((card) => {
                    const theme = cardTheme(card.type);
                    return (
                      <div key={card.id} className={`h-14 w-9 rounded-lg border ${theme.ring} bg-[linear-gradient(180deg,#2a3242,#181f2d)] flex items-center justify-center text-sm`} title={describeCardEffect(card)}>
                        {theme.icon}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {playedAnimCard && (
            <div className="absolute left-1/2 bottom-10 -translate-x-1/2 z-30 fe-card-fly-to-center pointer-events-none">
              <div className="h-24 w-16 rounded-xl border border-white/40 bg-[linear-gradient(180deg,#2b3e57,#1a2434)] flex items-center justify-center text-xl shadow-xl">
                {cardTheme(playedAnimCard.type).icon}
              </div>
            </div>
          )}

          {positionedOpponents.map(({ slot, player }) => (
            <div
              key={player.id}
              className={`absolute z-10 fe-seat-enter ${slot === 'top' ? 'left-1/2 top-0 -translate-x-1/2 w-[17rem]' : slot === 'left' ? 'left-0 top-1/2 -translate-y-1/2 w-[15rem]' : 'right-0 top-1/2 -translate-y-1/2 w-[15rem]'}`}
              style={{ animationDelay: `${SLOT_DELAY_MS[slot]}ms` }}
            >
              <PlayerSeatCard player={player} active={activePlayer?.id === player.id} faceDown seatLabel={slot.toUpperCase()} />
            </div>
          ))}

          {myPlayer && (
            <div className="absolute left-1/2 bottom-44 -translate-x-1/2 w-[22rem] sm:w-[25rem] z-10 fe-seat-enter" style={{ animationDelay: `${SLOT_DELAY_MS.bottom}ms` }}>
              <PlayerSeatCard player={myPlayer} active={activePlayer?.id === myPlayer.id} faceDown={false} isSelf seatLabel="BOTTOM" />
            </div>
          )}

          {myPlayer && (
            <div className="absolute left-1/2 bottom-3 -translate-x-1/2 w-[95%] sm:w-[84%] z-20">
              {myPlayer.twistEffect && (
                <div className="mb-2 mx-auto w-fit text-sm bg-purple-900/55 border border-purple-600 rounded-full px-4 py-1 text-purple-200">
                  Active Effect: {myPlayer.twistEffect}
                </div>
              )}
              <div className="fe-hand-rail px-2">
                <div className="fe-fan-zone">
                {(myPlayer.hand ?? []).map((card, index, arr) => {
                  const theme = cardTheme(card.type);
                  const isSelected = card.id === selectedCardId;
                  const isTwistBlocked = myPlayer.twistEffect?.includes('block') ? true : false;
                  const drawGateBlocked = !payload?.hasDrawnThisTurn;
                  const turnGateBlocked = !isMyTurn || Boolean(winner);
                  const limitBlocked = maxPlayReached;
                  const isBlocked = isTwistBlocked || drawGateBlocked || turnGateBlocked || limitBlocked;
                  const center = (arr.length - 1) / 2;
                  const distance = index - center;
                  const rotate = distance * 4.5;
                  const offset = distance * 42;
                  return (
                    <button
                      key={card.id}
                      onClick={() => setSelectedCardId(card.id)}
                      disabled={isBlocked}
                      style={{
                        transform: `translateX(${offset}px) rotate(${rotate}deg)`,
                        zIndex: 100 + index,
                      }}
                      className={`fe-fan-card fe-card-3d text-left w-44 sm:w-48 rounded-2xl border-2 transition-all duration-150 shadow-lg ${theme.glow} ${
                        isBlocked ? 'opacity-40 cursor-not-allowed' : ''
                      } ${
                        isSelected ? `border-white scale-[1.03] ${theme.glow}` : theme.ring
                      } overflow-hidden ${isBlocked ? '' : 'hover:scale-[1.06] hover:border-white'}`}
                      title={
                        isTwistBlocked
                          ? 'Blocked by active Twist effect'
                          : drawGateBlocked
                            ? 'Draw first before playing cards'
                            : limitBlocked
                              ? 'Max 3 cards played this turn'
                              : 'Inspect card'
                      }
                    >
                      <div className={`${theme.header} px-3 py-2 flex items-center gap-1.5`}>
                        <span className="text-base leading-none">{theme.icon}</span>
                        <span className={`text-[11px] font-semibold tracking-wide uppercase ${theme.tint}`}>
                          {card.type}{card.tier ? ` T${card.tier}` : ''}
                        </span>
                      </div>
                      <div className="px-3 py-3 bg-[linear-gradient(180deg,#1f2838,#151c29)]">
                        <div className="font-semibold text-base leading-tight text-white mb-2">{card.name}</div>
                        <div className="flex gap-1 flex-wrap">
                          {card.pointsDelta !== 0 && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${theme.badge}`}>
                              {card.pointsDelta > 0 ? '+' : ''}{card.pointsDelta} pts
                            </span>
                          )}
                          {card.gainHealth && card.gainHealth > 0 && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-lime-900 text-lime-200">
                              +{card.gainHealth} heal
                            </span>
                          )}
                          {card.drawCount > 0 && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-slate-700 text-slate-200">
                              +{card.drawCount} draw
                            </span>
                          )}
                          {card.disasterKind && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-rose-900 text-rose-200">
                              {card.disasterKind.toLowerCase()}
                            </span>
                          )}
                          {card.blocksDisaster && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-sky-900 text-sky-200">
                              blocks {card.blocksDisaster.toLowerCase()}
                            </span>
                          )}
                          {card.effect && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-purple-900 text-purple-200">
                              {card.effect}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
                </div>
              </div>
            </div>
          )}
        </div>

        {selectedCard && (
          <div className="absolute left-1/2 bottom-40 -translate-x-1/2 z-30 w-[20rem] sm:w-[24rem] fe-center-pedestal rounded-2xl p-4 space-y-2 border border-white/20 fe-lifted-card">
            <p className="text-xs uppercase tracking-[0.2em] fe-muted">Card In Hand</p>
            <h3 className="text-xl font-bold">{selectedCard.name}</h3>
            <p className="text-sm fe-muted">Type: {selectedCard.type}{selectedCard.tier ? ` (Tier ${selectedCard.tier})` : ''}</p>
            <p className="text-sm fe-muted">Points: {selectedCard.pointsDelta} • Draw: {selectedCard.drawCount}</p>
            {selectedCard.gainHealth && selectedCard.gainHealth > 0 && <p className="text-sm text-lime-300">Heal: +{selectedCard.gainHealth}</p>}
            {selectedCard.disasterKind && <p className="text-sm text-red-300">Disaster: {selectedCard.disasterKind}</p>}
            {selectedCard.blocksDisaster && <p className="text-sm text-teal-300">Blocks: {selectedCard.blocksDisaster}</p>}
            {selectedCard.effect && <p className="text-sm text-purple-300">Effect: {selectedCard.effect}</p>}

            {selectedCard.type === 'DISASTER' && selectedCard.disasterKind !== 'GLOBAL' && (
              <div className="space-y-1">
                <label className="text-sm fe-muted">Target player</label>
                <select className="w-full rounded fe-panel-alt px-3 py-2" value={selectedTargetId} onChange={(e) => setSelectedTargetId(e.target.value)}>
                  <option value="">Choose target...</option>
                  {opponents.map((p) => (
                    <option key={p.id} value={p.id}>{p.displayName}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button onClick={playSelectedCard} disabled={busy || !isMyTurn || Boolean(winner) || !payload?.hasDrawnThisTurn || maxPlayReached} className="px-4 py-2 rounded fe-button-primary disabled:opacity-50">
                Play Card
              </button>
              <button onClick={() => setSelectedCardId('')} className="px-4 py-2 rounded fe-panel-alt">
                Put Back
              </button>
            </div>
          </div>
        )}

        {showDiscardDetails && (
          <div className="absolute left-4 top-24 z-30 w-[24rem] fe-center-pedestal rounded-2xl p-4 space-y-2 border border-white/20">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Discard Pile</h3>
              <button onClick={() => setShowDiscardDetails(false)} className="px-3 py-1 rounded fe-panel-alt text-sm">Close</button>
            </div>
            <p className="text-xs fe-muted">Newest first</p>
            <div className="max-h-[17rem] overflow-auto pr-1 space-y-2">
              {(payload?.discardPile ?? []).slice(-20).reverse().map((card) => {
                const theme = cardTheme(card.type);
                return (
                  <div key={card.id} className="fe-panel-alt rounded-lg p-2">
                    <div className="flex items-center gap-2">
                      <span>{theme.icon}</span>
                      <span className="font-semibold text-sm">{card.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ml-auto ${theme.badge}`}>{card.type}</span>
                    </div>
                    <p className="text-xs fe-muted mt-1">{describeCardEffect(card)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function PlayerSeatCard({
  player,
  active,
  faceDown,
  isSelf,
  seatLabel,
}: {
  player: MatchPlayer;
  active: boolean;
  faceDown: boolean;
  isSelf?: boolean;
  seatLabel: string;
}) {
  return (
    <div className={`fe-seat-plinth rounded-[1.75rem] p-4 text-center shadow-2xl shadow-black/30 ${active ? 'ring-2 ring-amber-300/80 fe-turn-glow' : ''}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-left">
          <div className="text-[10px] uppercase tracking-[0.28em] fe-muted">{seatLabel} seat</div>
          <div className="font-semibold text-lg leading-tight">{player.emoji} {player.displayName}{isSelf ? ' (you)' : ''}</div>
          <div className="text-xs fe-muted mt-1">{active ? 'Taking turn now' : 'Waiting'} • {player.survivalPoints} pts • {player.health} hp</div>
        </div>
        <div className="text-xs fe-muted text-right">
          <div>{player.powers.length} powers</div>
          <div>{player.hand.length} cards</div>
        </div>
      </div>

      <div className="mt-3 flex justify-center gap-1.5 flex-wrap min-h-[3.5rem]">
        {Array.from({ length: Math.min(faceDown ? 6 : 8, player.hand.length) }).map((_, index) => (
          <div
            key={`${player.id}-${index}`}
            className={`h-14 w-9 rounded-lg border flex items-center justify-center text-lg ${faceDown ? 'bg-gradient-to-b from-slate-600 to-slate-800 border-slate-500 text-slate-400' : 'bg-gradient-to-b from-zinc-700 to-zinc-900 border-zinc-500 text-zinc-200'}`}
          >
            {faceDown ? '🂠' : '🃏'}
          </div>
        ))}
      </div>
    </div>
  );
}
