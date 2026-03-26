'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loadLocalSettings, setTutorialDone } from '@/lib/localProfile';

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

type MatchPayload = {
  round: number;
  activePlayerIndex: number;
  players: MatchPlayer[];
  drawPile: MatchCard[];
  discardPile: MatchCard[];
  isGlobalDisasterPhase: boolean;
  winnerId?: string;
  cardsPlayedThisTurn: number;
};

type TutorialStep = {
  id: number;
  title: string;
  description: string;
  expectedActionType: 'INIT_MATCH' | 'DRAW_CARD' | 'PLAY_CARD' | 'END_TURN' | 'SET_WINNER';
  expectedCardId?: string;
  expectedTargetPlayerId?: string;
};

type TutorialSession = {
  match: MatchPayload;
  stepIndex: number;
  completed: boolean;
};

export default function TutorialPage() {
  const router = useRouter();
  const [session, setSession] = useState<TutorialSession | null>(null);
  const [step, setStep] = useState<TutorialStep | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [selectedCardId, setSelectedCardId] = useState('');
  const [selectedTargetId, setSelectedTargetId] = useState('');

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
  const selectedCard = me?.hand.find((c) => c.id === selectedCardId) ?? null;
  const isMyTurn = active?.id === local.userId;

  async function runAction(action: Record<string, unknown>) {
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
          <p className="text-sm text-gray-400">Practice round with fixed cards and one bot.</p>
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
        </section>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {session?.completed && (
        <section className="bg-emerald-900/40 border border-emerald-700 rounded-xl p-4">
          <h2 className="text-xl font-semibold text-emerald-200">Tutorial Complete</h2>
          <p className="text-sm text-emerald-100 mt-1">You can replay anytime from settings.</p>
          <div className="mt-3">
            <Link href="/" className="px-4 py-2 rounded bg-emerald-700 hover:bg-emerald-600 inline-block">Back Home</Link>
          </div>
        </section>
      )}

      <section className="bg-gray-800 rounded-xl p-4">
        <h2 className="font-semibold mb-2">Table State</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {payload?.players.map((p) => (
            <div key={p.id} className="bg-gray-900 rounded p-3 flex items-center justify-between">
              <span>{p.emoji} {p.displayName}{active?.id === p.id ? ' (turn)' : ''}</span>
              <span className="text-xs text-gray-300">{p.survivalPoints} pts • {p.health} hp • {p.hand.length} cards</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-800 rounded-xl p-4 space-y-3">
        <h2 className="font-semibold">Actions</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => runAction({ type: 'DRAW_CARD' })}
            disabled={busy || !isMyTurn || Boolean(session?.completed)}
            className="px-4 py-2 rounded bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50"
          >
            Draw Card
          </button>
          <button
            onClick={() => runAction({ type: 'END_TURN' })}
            disabled={busy || !isMyTurn || Boolean(session?.completed)}
            className="px-4 py-2 rounded bg-indigo-700 hover:bg-indigo-600 disabled:opacity-50"
          >
            End Turn
          </button>
        </div>
      </section>

      <section className="bg-gray-800 rounded-xl p-4 space-y-3">
        <h2 className="font-semibold">Opponent Cards</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {opponents.map((p) => (
            <div key={p.id} className="bg-gray-900 rounded p-3">
              <div className="font-medium">{p.emoji} {p.displayName}</div>
              <div className="text-xs text-gray-400 mb-2">{p.hand.length} cards</div>
              <div className="flex gap-1 flex-wrap">
                {Array.from({ length: Math.min(8, p.hand.length) }).map((_, idx) => (
                  <div key={`${p.id}-${idx}`} className="h-14 w-9 rounded border border-slate-500 bg-gradient-to-b from-slate-600 to-slate-800" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-800 rounded-xl p-4 space-y-3">
        <h2 className="font-semibold">Your Cards</h2>
        <div className="flex gap-2 flex-wrap">
          {(me?.hand ?? []).map((card) => (
            <button
              key={card.id}
              onClick={() => setSelectedCardId(card.id)}
              className={`text-left w-40 rounded-lg border px-3 py-2 ${step?.expectedCardId === card.id ? 'border-yellow-300 bg-yellow-900/30' : 'border-gray-600 bg-gradient-to-b from-slate-700 to-slate-900 hover:border-emerald-400'}`}
            >
              <div className="text-xs text-emerald-300">{card.type}</div>
              <div className="font-semibold leading-tight">{card.name}</div>
              <div className="text-xs text-gray-300 mt-1">Pts {card.pointsDelta} • Draw {card.drawCount}</div>
            </button>
          ))}
        </div>
      </section>

      {selectedCard && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center" onClick={() => setSelectedCardId('')}>
          <div className="w-full max-w-md bg-gray-900 rounded-xl p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold">{selectedCard.name}</h3>
            <p className="text-sm text-gray-300">Type: {selectedCard.type}</p>
            <p className="text-sm text-gray-300">Points: {selectedCard.pointsDelta}</p>
            <p className="text-sm text-gray-300">Draw: {selectedCard.drawCount}</p>

            {selectedCard.type === 'DISASTER' && selectedCard.disasterKind !== 'GLOBAL' && (
              <div className="space-y-1">
                <label className="text-sm text-gray-300">Target</label>
                <select
                  value={selectedTargetId}
                  onChange={(e) => setSelectedTargetId(e.target.value)}
                  className="w-full rounded bg-gray-800 px-3 py-2"
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
                disabled={busy || !isMyTurn || Boolean(session?.completed)}
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

      {busy && <p className="text-sm text-gray-400">Syncing tutorial...</p>}
    </main>
  );
}
