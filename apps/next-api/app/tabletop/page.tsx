'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import React, { Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  appendMatchOutcome,
  clearRoomPin,
  loadLocalSettings,
  saveRoomPin,
} from '@/lib/localProfile';
import { apiFetch } from '@/lib/api';
import dynamic from 'next/dynamic';
const PhaserGame = dynamic(() => import('@/components/PhaserGame').then(mod => mod.PhaserGame), { ssr: false });

// --- Types ---
type CardType = 'SURVIVAL' | 'DISASTER' | 'POWER' | 'ADAPT' | 'CHAOS' | 'ASCENDED' | 'TWIST' | 'CATACLYSM';
type MatchCard = {
  id: string;
  name: string;
  type: CardType;
  pointsDelta: number;
  drawCount: number;
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
  triggers: any[];
};

type GameStatePayload = {
  round: number;
  activePlayerIndex: number;
  players: MatchPlayer[];
  drawPile: MatchCard[];
  discardPile: MatchCard[];
  turnPile: MatchCard[];
  topCard?: MatchCard;
  winnerId?: string;
};

type StateEnvelope = {
  roomCode: string;
  revision: number;
  payload: GameStatePayload;
};

/* --- Main Page --- */

export default function TabletopPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-black flex items-center justify-center"><div className="text-amber-500 animate-pulse tracking-[0.5em] font-black italic">INITIALIZING_NEURAL_LINK...</div></div>}>
      <TabletopContent />
    </Suspense>
  );
}

function TabletopContent() {
  const search = useSearchParams();
  const code = (search.get('code') || '').trim().toUpperCase();
  const userFromQuery = (search.get('userId') || '').trim();
  
  const [state, setState] = useState<StateEnvelope | null>(null);
  const [error, setError] = useState('');
  const hasRecordedHistory = useRef(false);
  const router = useRouter();

  const userId = useMemo(() => {
    if (userFromQuery) return userFromQuery;
    return loadLocalSettings().userId;
  }, [userFromQuery]);

  const payload = state?.payload;
  const myPlayer = payload?.players.find((p) => p.id === userId) ?? null;
  const winner = payload?.players.find((p) => p.id === payload?.winnerId);

  const postAction = useCallback(async (action: any, expectedRevision?: number) => {
    const res = await apiFetch(`/api/rooms/${code}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action, expectedRevision }),
    });
    const data = await res.json();
    if (!res.ok) {
       if (res.status === 409 && data.current) return data.current as StateEnvelope;
       throw new Error(data.error || 'Action failed');
    }
    return data as StateEnvelope;
  }, [code, userId]);

  // State Synchronization
  useEffect(() => {
    async function sync() {
      try {
        const res = await apiFetch(`/api/rooms/${code}/state`, { cache: 'no-store' });
        if (!res.ok) return;
        const stateSnapshot = await res.json();
        setState(stateSnapshot);
      } catch (e) { 
        console.error('Sync failed', e); 
      }
    }
    const timer = setInterval(sync, 1500);
    return () => clearInterval(timer);
  }, [code]);

  // Heartbeat & Session Persistence
  useEffect(() => {
    const ping = async () => {
      try {
        await apiFetch(`/api/rooms/${code}/heartbeat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
        if (myPlayer) {
          saveRoomPin({
            code,
            userId,
            displayName: myPlayer.displayName,
            emoji: myPlayer.emoji,
            ttlMs: 60000
          });
        }
      } catch (e) { console.error('Heartbeat failed', e); }
    };
    ping();
    const interval = setInterval(ping, 1000);
    return () => clearInterval(interval);
  }, [code, userId, myPlayer]);

  // Match Outcome Persistence
  useEffect(() => {
    if (winner && !hasRecordedHistory.current) {
        hasRecordedHistory.current = true;
        appendMatchOutcome({
            id: `FE-${code}-${Date.now()}`,
            roomCode: code,
            playedAtEpochMs: Date.now(),
            winnerUserId: winner.id,
            winnerDisplayName: winner.displayName,
            participants: payload?.players.map(p => ({ userId: p.id, displayName: p.displayName, emoji: p.emoji })) || [],
            didWin: winner.id === userId
        });
        clearRoomPin();
    }
  }, [winner, code, userId, payload?.players]);

  if (!state) {
     return (
       <main className="fixed inset-0 bg-black flex items-center justify-center">
         <div className="text-amber-500 animate-pulse tracking-[0.5em] font-black italic">SYNCING_SECTOR_STATE...</div>
       </main>
     );
  }

  return (
    <main className="fixed inset-0 bg-black overflow-hidden select-none touch-none">
      <PhaserGame 
        gameState={payload} 
        onAction={(action) => {
          postAction(action, state.revision)
            .then(setState)
            .catch(e => {
              setError(e.message);
              setTimeout(() => setError(''), 4000);
            });
        }} 
      />
      
      {/* HUD Overlay for Errors */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0 }} 
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[5000] bg-rose-600 text-white px-8 py-3 rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(225,29,72,0.4)] border border-rose-400/30"
          >
            System_Fault: {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Sector Vignette */}
      <div className="fixed inset-0 pointer-events-none z-[4000] shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]" />
    </main>
  );
}
