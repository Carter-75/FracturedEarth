'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loadLocalSettings, setTutorialDone } from '@/lib/localProfile';
import { CARD_GROUPS } from '@/lib/cardCatalog';
import { describeCardEffect, positionOpponents } from '@/lib/tabletopShared';
import { ImagePromptPlaceholder } from '@/components/ImagePromptPlaceholder';

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

type MatchPayload = {
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

type TutorialStep = {
  id: number;
  title: string;
  description: string;
  expectedActionType: 'INIT_MATCH' | 'DRAW_CARD' | 'PLAY_CARD' | 'END_TURN' | 'SET_WINNER' | 'ACK';
  expectedCardId?: string;
  expectedTargetPlayerId?: string;
};

type TutorialAction =
  | { type: 'DRAW_CARD' }
  | { type: 'PLAY_CARD'; cardId: string; targetPlayerId?: string }
  | { type: 'END_TURN' }
  | { type: 'SET_WINNER'; winnerUserId: string }
  | { type: 'ACK' };

type TutorialSession = {
  match: MatchPayload;
  stepIndex: number;
  completed: boolean;
};

type OpponentSlot = 'left' | 'top' | 'right';

const CARD_TOUR = [
  ...CARD_GROUPS.SURVIVAL,
  ...CARD_GROUPS.DISASTER,
  ...CARD_GROUPS.POWER,
  ...CARD_GROUPS.ADAPT,
  ...CARD_GROUPS.CHAOS,
  ...CARD_GROUPS.ASCENDED,
  ...CARD_GROUPS.TWIST,
  ...CARD_GROUPS.CATACLYSM,
];

export default function TutorialPage() {
  const router = useRouter();
  const [session, setSession] = useState<TutorialSession | null>(null);
  const [step, setStep] = useState<TutorialStep | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [selectedCardId, setSelectedCardId] = useState('');
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [tourIndex, setTourIndex] = useState(0);
  const [tourPlaying, setTourPlaying] = useState(false);
  const [playedAnimCard, setPlayedAnimCard] = useState<MatchCard | null>(null);
  const [deckPulse, setDeckPulse] = useState(false);
  const [botReplayMessage, setBotReplayMessage] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const prevMatchRef = useRef<MatchPayload | null>(null);

  const local = useMemo(() => loadLocalSettings(), []);

  useEffect(() => {
    async function start() {
      setBusy(true);
      try {
        const res = await fetch('/api/tutorial/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: local.userId,
            displayName: local.displayName,
            emoji: local.emoji,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(String(data?.error ?? 'Unable to start tutorial'));
        setSession(data.session as TutorialSession);
        setStep((data.step ?? null) as TutorialStep | null);
        setError('');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unable to start tutorial');
      } finally {
        setBusy(false);
      }
    }

    start();
  }, [local.displayName, local.emoji, local.userId]);

  const payload = session?.match;
  const active = payload?.players[payload.activePlayerIndex] ?? null;
  const me = payload?.players.find((p) => p.id === local.userId) ?? null;
  const opponents = (payload?.players ?? []).filter((p) => p.id !== local.userId);
  const positionedOpponents = positionOpponents(payload?.players ?? [], local.userId);
  const selectedCard = me?.hand.find((c) => c.id === selectedCardId) ?? null;
  const isMyTurn = active?.id === local.userId;
  const canDraw = Boolean(isMyTurn && !busy && !session?.completed && !payload?.hasDrawnThisTurn);
  const canEndTurn = Boolean(isMyTurn && !busy && !session?.completed && payload?.hasDrawnThisTurn);
  const highlightDraw = step?.expectedActionType === 'DRAW_CARD';
  const highlightEnd = step?.expectedActionType === 'END_TURN';
  const expectedCardId = step?.expectedActionType === 'PLAY_CARD' ? step.expectedCardId : undefined;
  const expectingPlay = step?.expectedActionType === 'PLAY_CARD';
  const expectingAck = step?.expectedActionType === 'ACK';
  const expectingSetWinner = step?.expectedActionType === 'SET_WINNER';
  const scriptedCanDraw = canDraw && step?.expectedActionType === 'DRAW_CARD';
  const scriptedCanEnd = canEndTurn && step?.expectedActionType === 'END_TURN';

  useEffect(() => {
    if (!tourPlaying) return;
    const timer = setInterval(() => {
      setTourIndex((prev) => (prev + 1) % CARD_TOUR.length);
    }, 1000);
    return () => clearInterval(timer);
  }, [tourPlaying]);

  useEffect(() => {
    const replay = payload?.botTurnReplay;
    if (!replay?.length) return;

    let cancelled = false;
    (async () => {
      for (const event of replay) {
        if (cancelled) return;
        if (event.action === 'DRAW') {
          setBotReplayMessage(`${event.actorName} drew a card.`);
        } else if (event.action === 'PLAY') {
          setBotReplayMessage(`${event.actorName} played ${event.cardName ?? 'a card'}.`);
        } else {
          setBotReplayMessage(`${event.actorName} ended turn.`);
        }
        await new Promise((resolve) => setTimeout(resolve, 540));
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
  }, [payload?.botTurnReplay]);

  useEffect(() => {
    if (!payload) return;
    const prev = prevMatchRef.current;
    prevMatchRef.current = payload;
    if (!prev) return;

    let drawTimer: ReturnType<typeof setTimeout> | undefined;
    let playTimer: ReturnType<typeof setTimeout> | undefined;
    let actionTimer: ReturnType<typeof setTimeout> | undefined;

    if (!prev.hasDrawnThisTurn && payload.hasDrawnThisTurn) {
      setDeckPulse(true);
      drawTimer = setTimeout(() => setDeckPulse(false), 420);
    }

    if (payload.discardPile.length > prev.discardPile.length) {
      const top = payload.discardPile[payload.discardPile.length - 1];
      if (top) {
        setPlayedAnimCard(top);
        playTimer = setTimeout(() => setPlayedAnimCard(null), 620);

        const prevById = new Map(prev.players.map((p) => [p.id, p]));
        const deltas: string[] = [];
        for (const player of payload.players) {
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
        setActionMessage(`${top.name}${effectLine}`);
        actionTimer = setTimeout(() => setActionMessage(''), 2200);
      }
    }

    return () => {
      if (drawTimer) clearTimeout(drawTimer);
      if (playTimer) clearTimeout(playTimer);
      if (actionTimer) clearTimeout(actionTimer);
    };
  }, [payload]);

  async function runAction(action: TutorialAction) {
    if (!session) return;
    setBusy(true);
    try {
      const res = await fetch('/api/tutorial/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session,
          action,
          actorUserId: local.userId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(String(data?.error ?? 'Tutorial action failed'));

      const nextSession = data.session as TutorialSession;
      setSession(nextSession);
      setStep((data.step ?? null) as TutorialStep | null);
      setSelectedCardId('');
      setSelectedTargetId('');
      setError('');

      if (nextSession.completed) {
        setTutorialDone(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Tutorial action failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Guided Tutorial</h1>
          <p className="text-sm text-gray-400">Full-length scripted training with deterministic card teaching moments.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setTutorialDone(true);
              router.push('/');
            }}
            className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 text-sm"
          >
            Skip Tutorial
          </button>
          <Link href="/settings" className="px-3 py-2 rounded bg-slate-700 hover:bg-slate-600 text-sm">Settings</Link>
        </div>
      </div>

      {step && !session?.completed && (
        <section className="bg-blue-950/60 border border-blue-800 rounded-xl p-4 space-y-1">
          <p className="text-xs uppercase tracking-wide text-blue-300">Step {step.id}</p>
          <h2 className="font-semibold text-lg">{step.title}</h2>
          <p className="text-sm text-blue-100">{step.description}</p>
          {(expectingAck || expectingSetWinner) && (
            <div className="pt-2">
              <button
                onClick={() => runAction(expectingSetWinner ? { type: 'SET_WINNER', winnerUserId: local.userId } : { type: 'ACK' })}
                disabled={busy}
                className="fe-button-primary rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                {expectingSetWinner ? 'Finish Tutorial (Win)' : 'Continue Lesson'}
              </button>
            </div>
          )}
        </section>
      )}

      <section className="fe-panel rounded-3xl p-4 space-y-2">
        {/* AI prompt: illustrated training manual spread, survival symbols, card anatomy callouts, clean but gritty educational art style */}
        <ImagePromptPlaceholder label="Tutorial Manual Illustration" ratioClassName="aspect-[20/7]" />
        <div className="grid sm:grid-cols-2 gap-3">
          {/* AI prompt: card anatomy blueprint with labeled zones, icon legend, soft parchment background, educational game art */}
          <ImagePromptPlaceholder label="Card Anatomy Blueprint" ratioClassName="aspect-[16/9]" />
          {/* AI prompt: turn-order wheel carved in wood with arrow indicators, top-down tabletop render, warm cinematic light */}
          <ImagePromptPlaceholder label="Turn Order Wheel Art" ratioClassName="aspect-[16/9]" />
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-semibold">Full Card Tour ({tourIndex + 1}/{CARD_TOUR.length})</h2>
          <div className="flex gap-2">
            <button className="fe-panel-alt rounded px-3 py-1 text-sm" onClick={() => setTourPlaying((v) => !v)}>
              {tourPlaying ? 'Pause Tour' : 'Auto Tour (5 min approx)'}
            </button>
            <button className="fe-panel-alt rounded px-3 py-1 text-sm" onClick={() => setTourIndex((v) => (v - 1 + CARD_TOUR.length) % CARD_TOUR.length)}>Prev</button>
            <button className="fe-panel-alt rounded px-3 py-1 text-sm" onClick={() => setTourIndex((v) => (v + 1) % CARD_TOUR.length)}>Next</button>
          </div>
        </div>
        <div className="fe-panel-alt rounded-xl p-3">
          <p className="font-semibold">{CARD_TOUR[tourIndex].name}</p>
          <p className="text-xs fe-muted mt-1">{describeCardEffect(CARD_TOUR[tourIndex])}</p>
        </div>
      </section>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {botReplayMessage && <p className="text-amber-300 text-sm font-medium animate-pulse">{botReplayMessage}</p>}
      {actionMessage && <p className="text-cyan-200 text-sm font-medium">{actionMessage}</p>}

      {session?.completed && (
        <section className="bg-emerald-900/40 border border-emerald-700 rounded-xl p-4">
          <h2 className="text-xl font-semibold text-emerald-200">Tutorial Complete</h2>
          <p className="text-sm text-emerald-100 mt-1">You can replay anytime from settings.</p>
          <div className="mt-3">
            <Link href="/" className="px-4 py-2 rounded bg-emerald-700 hover:bg-emerald-600 inline-block">Back Home</Link>
          </div>
        </section>
      )}

      <section className="fe-panel rounded-[2rem] p-4 sm:p-6 space-y-4 relative overflow-hidden">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="font-semibold text-xl">Round {payload?.round ?? '-'}</h2>
          <div className="text-sm fe-muted">
            Draw pile: {payload?.drawPile.length ?? 0} • Discard pile: {payload?.discardPile.length ?? 0}
          </div>
        </div>

        <p className="text-sm fe-muted">
          {active ? `${active.emoji} ${active.displayName} is acting now.` : 'Waiting for players...'}
        </p>

        <div className="relative mx-auto max-w-6xl h-[52rem] sm:h-[56rem] fe-table-stage">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-[14%] top-[20%] h-44 w-44 rounded-full bg-cyan-300/10 blur-3xl" />
            <div className="absolute right-[10%] bottom-[16%] h-48 w-48 rounded-full bg-orange-300/10 blur-3xl" />
          </div>

          <div className="absolute inset-[16%] rounded-[2.75rem] border border-white/10 shadow-[0_40px_110px_rgba(0,0,0,0.5)] [transform:perspective(1500px)_rotateX(58deg)] fe-table-surface">
            <div className="absolute inset-[9%] rounded-[2.2rem] border border-white/10 bg-black/10" />
          </div>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 text-center fe-center-stack">
            <div className="fe-panel-alt rounded-[2rem] px-6 py-5 min-w-[15rem] fe-center-pulse">
              <p className="text-xs uppercase tracking-[0.3em] fe-muted">Tutorial Table</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <button
                  onClick={() => runAction({ type: 'DRAW_CARD' })}
                  disabled={!scriptedCanDraw}
                  className={`fe-stack-card fe-stack-draw disabled:opacity-45 disabled:cursor-not-allowed ${highlightDraw ? 'ring-2 ring-cyan-300' : ''} ${deckPulse ? 'fe-deck-pulse' : ''}`}
                  title="Draw from deck"
                >
                  <div className="text-[10px] uppercase tracking-[0.2em] fe-muted">Deck</div>
                  <div className="text-2xl font-black mt-1">{payload?.drawPile.length ?? 0}</div>
                  <div className="text-[10px] mt-1 text-cyan-100/90">Tap to draw</div>
                </button>
                <div className="fe-stack-card fe-stack-discard" title="Discard pile">
                  <div className="text-[10px] uppercase tracking-[0.2em] fe-muted">Discard</div>
                  <div className="text-2xl font-black mt-1">{payload?.discardPile.length ?? 0}</div>
                  <div className="text-[10px] mt-1 text-amber-100/80">Spent cards</div>
                </div>
              </div>
              <p className="fe-muted mt-3 text-xs">Clockwise order from bottom seat.</p>
              <button
                onClick={() => runAction({ type: 'END_TURN' })}
                disabled={!scriptedCanEnd}
                className={`fe-turn-puck mt-3 disabled:opacity-45 disabled:cursor-not-allowed ${highlightEnd ? 'ring-2 ring-amber-300' : ''}`}
              >
                End Turn
              </button>
            </div>
          </div>

          {positionedOpponents.map(({ slot, player }) => (
            <div
              key={player.id}
              className={`absolute z-10 fe-seat-enter ${slot === 'top' ? 'left-1/2 top-0 -translate-x-1/2 w-[17rem]' : slot === 'left' ? 'left-0 top-1/2 -translate-y-1/2 w-[15rem]' : 'right-0 top-1/2 -translate-y-1/2 w-[15rem]'}`}
            >
              <PlayerSeatCard player={player} active={active?.id === player.id} faceDown seatLabel={slot.toUpperCase()} />
            </div>
          ))}

          {playedAnimCard && (
            <div className="absolute left-1/2 bottom-10 -translate-x-1/2 z-30 fe-card-fly-to-center pointer-events-none">
              <div className="h-24 w-16 rounded-xl border border-white/40 bg-[linear-gradient(180deg,#2b3e57,#1a2434)] flex items-center justify-center text-xl shadow-xl">
                {playedAnimCard.type[0]}
              </div>
            </div>
          )}

          {me && (
            <div className="absolute left-1/2 bottom-44 -translate-x-1/2 w-[22rem] sm:w-[25rem] z-10 fe-seat-enter">
              <PlayerSeatCard player={me} active={active?.id === me.id} faceDown={false} isSelf seatLabel="BOTTOM" />
            </div>
          )}

          {me && (
            <div className="absolute left-1/2 bottom-3 -translate-x-1/2 w-[95%] sm:w-[84%] z-20">
              <div className="fe-fan-zone">
                {(me.hand ?? []).map((card, index, arr) => {
                  const center = (arr.length - 1) / 2;
                  const distance = index - center;
                  const rotate = distance * 4.5;
                  const offset = distance * 42;
                  return (
                    <button
                      key={card.id}
                      onClick={() => setSelectedCardId(card.id)}
                      disabled={!expectingPlay || Boolean(expectedCardId && expectedCardId !== card.id)}
                      style={{
                        transform: `translateX(${offset}px) rotate(${rotate}deg)`,
                        zIndex: 100 + index,
                      }}
                      className={`fe-fan-card fe-card-3d text-left w-44 sm:w-48 rounded-2xl border px-3 py-3 ${step?.expectedCardId === card.id ? 'border-yellow-300 bg-yellow-900/30 ring-2 ring-yellow-300' : 'border-gray-600 bg-[linear-gradient(180deg,#283a52,#1b2536)] hover:border-emerald-400'} ${expectedCardId && expectedCardId !== card.id ? 'opacity-35 cursor-not-allowed' : ''}`}
                    >
                      <div className="text-xs text-emerald-300">{card.type}</div>
                      <div className="font-semibold text-base leading-tight mt-1">{card.name}</div>
                      <div className="text-xs text-gray-300 mt-2">Pts {card.pointsDelta} • Draw {card.drawCount}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {selectedCard && (
            <div className="absolute left-1/2 bottom-40 -translate-x-1/2 z-30 w-[20rem] sm:w-[24rem] fe-panel rounded-2xl p-4 space-y-2 border border-white/20 fe-lifted-card">
              <p className="text-xs uppercase tracking-[0.2em] fe-muted">Tutorial Card</p>
              <h3 className="text-xl font-bold">{selectedCard.name}</h3>
              <p className="text-sm fe-muted">Type: {selectedCard.type}</p>
              <p className="text-sm fe-muted">Points: {selectedCard.pointsDelta} • Draw: {selectedCard.drawCount}</p>

              {selectedCard.type === 'DISASTER' && selectedCard.disasterKind !== 'GLOBAL' && (
                <div className="space-y-1">
                  <label className="text-sm fe-muted">Target</label>
                  <select
                    value={selectedTargetId}
                    onChange={(e) => setSelectedTargetId(e.target.value)}
                    className="w-full rounded fe-panel-alt px-3 py-2"
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
                  onClick={() => runAction({
                    type: 'PLAY_CARD',
                    cardId: selectedCard.id,
                    targetPlayerId: selectedCard.type === 'DISASTER' ? selectedTargetId || undefined : undefined,
                  })}
                  disabled={busy || !isMyTurn || Boolean(session?.completed) || !expectingPlay}
                  className="px-4 py-2 rounded fe-button-primary disabled:opacity-50"
                >
                  Play Card
                </button>
                <button
                  onClick={() => setSelectedCardId('')}
                  className="px-4 py-2 rounded fe-panel-alt"
                >
                  Put Back
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {busy && <p className="text-sm text-gray-400">Syncing tutorial...</p>}
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
    <div className={`fe-panel-alt rounded-[1.75rem] p-4 text-center shadow-2xl shadow-black/30 ${active ? 'ring-2 ring-amber-300/80 fe-turn-glow' : ''}`}>
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
