'use client';

import React, { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { loadLocalSettings, saveRoomPin, clearRoomPin } from '@/lib/localProfile';
import { MatchAction, StateEnvelope } from '@/types/game';
import { MatchCard, MatchPlayer, cardTheme } from '@/lib/tabletopShared';
import { MAX_HAND_SIZE, MAX_ACTIONS_PER_TURN } from '@/lib/gameConfig';
import PhaserGame from '@/components/PhaserGame';

// --- UI COMPONENTS (STATIC) ---

function PlayerStatsHUD({ player, isActive }: { player: MatchPlayer; isActive: boolean }) {
  return (
    <div className={`flex flex-col gap-2 p-6 rounded-[var(--radius)] bg-[var(--panel)] backdrop-blur-3xl border ${isActive ? 'border-[var(--accent)] shadow-[0_0_30px_rgba(var(--accent-rgb),0.2)]' : 'border-[var(--border)]'} min-w-[12rem] transition-all duration-500`}>
        <div className="flex items-center gap-3">
           <div className="text-2xl">{player.emoji}</div>
           <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--fg)] opacity-40">{player.displayName}</span>
              <div className={`h-[2px] ${isActive ? 'bg-[var(--accent)] shadow-[0_0_10px_var(--glow-color)]' : 'bg-[var(--border)]'} w-8 mt-1 transition-all duration-500`} />
           </div>
        </div>
        <div className="flex justify-between items-end mt-4">
           <div className="flex flex-col">
              <span className="text-[7px] font-black text-[var(--fg)] opacity-50 uppercase tracking-widest">Cards</span>
              <div className="text-3xl font-black italic text-[var(--fg)] opacity-80 fe-glow-text">{player.hand.length}</div>
           </div>
           <div className="flex flex-col items-center">
              <span className="text-[7px] font-black text-[var(--accent-soft)] opacity-60 uppercase tracking-widest">NRG</span>
              <div className="text-3xl font-black italic text-[var(--accent-soft)] fe-glow-text">{player.survivalPoints}</div>
           </div>
           <div className="flex flex-col items-end">
              <span className="text-[7px] font-black text-rose-500 opacity-60 uppercase tracking-widest">Health</span>
              <div className="text-3xl font-black italic text-rose-500 fe-glow-text">{player.health}</div>
           </div>
        </div>
    </div>
  );
}

function CardDetailModal({ card, isOpen, onClose, onPlay, onDiscard, isMyTurn }: { card: MatchCard | null; isOpen: boolean; onClose: () => void; onPlay: () => void; onDiscard: () => void; isMyTurn: boolean }) {
  if (!card) return null;
  const theme = cardTheme(card.type);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           {/* Backdrop */}
           <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
             onClick={onClose}
             className="absolute inset-0 bg-black/80 backdrop-blur-md" 
           />
           
           {/* Modal */}
           <motion.div 
             initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
             className="relative w-full max-w-sm rounded-3xl overflow-hidden bg-[var(--panel)] border border-[var(--border)] shadow-[0_0_100px_rgba(0,0,0,0.5)]"
           >
              {/* Card Header / Artwork Area */}
              <div className={`h-64 relative flex items-center justify-center overflow-hidden bg-black`}>
                 <div className="absolute inset-0 opacity-20 pointer-events-none fe-grid" />
                 <div className="text-8xl filter drop-shadow-[0_0_20px_white]">{theme.icon}</div>
                 <div className="absolute bottom-4 left-6 right-6 flex justify-between items-end">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{card.type}</span>
                    {card.pointsDelta !== undefined && (
                        <span className="text-2xl font-black italic text-[var(--accent)]">+{card.pointsDelta}</span>
                    )}
                 </div>
              </div>

              {/* Text Info */}
              <div className="p-8 pb-10">
                 <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-4 leading-none">{card.name}</h2>
                 <p className="text-white/60 leading-relaxed font-medium mb-8 text-sm">
                    {card.description || "Experimental data unit with undocumented side effects."}
                 </p>
                 
                 <div className="flex flex-col gap-3">
                     {isMyTurn && (
                        <>
                           <button 
                             onClick={onPlay}
                             className="fe-holo-btn !py-4 text-sm w-full !bg-[var(--accent)] !text-black border-none font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-transform"
                           >
                              Confirm Activation
                           </button>
                           <button 
                             onClick={onDiscard}
                             className="fe-holo-btn !py-2 text-[10px] w-full border-white/10 !bg-white/5 text-white/40 hover:text-rose-400 hover:border-rose-500/50 transition-all uppercase font-black tracking-widest"
                           >
                              Discard Unit
                           </button>
                        </>
                     )}
                    <button 
                      onClick={onClose}
                      className="text-white/30 text-xs font-black uppercase tracking-widest py-2 hover:text-white/60 transition-colors"
                    >
                       Dismiss Unit
                    </button>
                 </div>
              </div>
           </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// --- MAIN PAGE ---

function TabletopGameContent() {
  const search = useSearchParams();
  const router = useRouter();
  const code = search.get('code')?.toUpperCase() || '';
  const [state, setState] = useState<StateEnvelope | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [activeCard, setActiveCard] = useState<MatchCard | null>(null);

  const userId = useMemo(() => loadLocalSettings().userId, []);
  const payload = state?.payload;
  const myPlayer = payload?.players.find(p => p.id === userId);
  const activePlayer = payload?.players[payload?.activePlayerIndex ?? 0];
  const isMyTurn = activePlayer?.id === userId;
  const opponents = payload?.players.filter(p => p.id !== userId) || [];

  const sync = React.useCallback(async () => {
    try {
      const res = await apiFetch(`/api/rooms/${code}/state`, { cache: 'no-store' });
      if (res.status === 404) {
        setError('ROOM_NOT_FOUND_OR_CLOSED');
        return;
      }
      if (!res.ok) return;
      const stateSnapshot = await res.json();
      setState(stateSnapshot);
      setError(null);
    } catch (e) {}
  }, [code]);

  useEffect(() => {
    if (!code) return;
    sync();
    const timer = setInterval(sync, 2000);
    return () => clearInterval(timer);
  }, [code, sync]);

  useEffect(() => {
     if (myPlayer && code) {
        saveRoomPin({ 
           code, 
           userId, 
           displayName: myPlayer.displayName, 
           emoji: myPlayer.emoji, 
           ttlMs: 60000 
        });
     }
  }, [myPlayer, code, userId]);

  async function performAction(action: Partial<MatchAction>) {
    if (!state) return;
    setBusy(true);
    try {
      const res = await apiFetch(`/api/rooms/${code}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, expectedRevision: state.revision }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setState(data);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (error === 'ROOM_NOT_FOUND_OR_CLOSED') {
     return (
        <div className="fe-scene flex flex-col items-center justify-center">
           <h1 className="text-4xl font-black text-rose-500 mb-4 fe-flicker">LINK_SEVERED</h1>
           <p className="text-white/40 mb-8 lowercase tracking-widest">Room does not exist or has been terminated.</p>
           <Link href="/lan" className="fe-holo-btn">Return to Base</Link>
        </div>
     );
  }

  if (!state) return null;

  return (
    <main className="fe-scene overflow-hidden relative cursor-default bg-black">
      <div className="fe-vignette z-30 pointer-events-none" />
      <div className="fe-grid opacity-10 pointer-events-none" />

      {/* TOP HEADER (UI OVERLAY) */}
      <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-start z-50 pointer-events-none">
          <div className="flex flex-col">
             <div className="text-[10px] font-black uppercase tracking-[0.5em] text-[var(--accent)] opacity-60">Neural_Simulation_Link</div>
             <h1 className="text-4xl font-black italic tracking-tighter text-[var(--fg)] fe-flicker uppercase">Sector_{code}</h1>
          </div>
          <div className="flex gap-4 pointer-events-auto">
             <Link href="/lan" className="fe-holo-btn !py-2 !px-4 text-xs opacity-50 hover:opacity-100">Abort Link</Link>
          </div>
      </div>

      {/* PHASER ENGINE (Z-20) */}
      <PhaserGame 
         roomCode={code} 
         gameState={payload} 
         onAction={(action) => performAction(action)} 
         onCardDetail={(card) => setActiveCard(card)}
      />

      {/* PLAYER HUD (STATIC UI) */}
      <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col items-center pointer-events-none z-50">
          
          {/* End Turn (Bottom Right) */}
           {isMyTurn && (
             <div className="fixed bottom-8 right-8 z-[70] pointer-events-auto flex flex-col items-end gap-2">
                <button 
                  onClick={() => performAction({ type: 'END_TURN' })}
                  disabled={busy || (myPlayer && myPlayer.hand.length > MAX_HAND_SIZE)}
                  className={`fe-holo-btn !py-2 !px-6 text-[10px] border-[var(--accent)]/20 !bg-black/50 shadow-xl transition-all font-black uppercase tracking-widest flex items-center gap-2 group ${
                    (myPlayer && myPlayer.hand.length > MAX_HAND_SIZE) ? 'opacity-20 grayscale pointer-events-none' : 'hover:!bg-[var(--accent)]/10'
                  }`}
                >
                  <span className="opacity-40 group-hover:opacity-100 transition-opacity">NEXT_CYCLE</span>
                  <div className={`w-1.5 h-1.5 rounded-full bg-[var(--accent)] ${busy ? 'animate-spin' : 'animate-pulse'}`} />
                </button>
             </div>
           )}

          <div className="w-full max-w-7xl flex items-end justify-between">
              <div className="pointer-events-auto">
                 {myPlayer && <PlayerStatsHUD player={myPlayer} isActive={isMyTurn} />}
              </div>

              {/* Opponents Stats (Pinned to Screen corners or sides) */}
              <div className="flex gap-4">
                 {opponents.map(opp => (
                    <div key={opp.id} className="pointer-events-auto opacity-70 hover:opacity-100 transition-opacity">
                       <PlayerStatsHUD player={opp} isActive={activePlayer?.id === opp.id} />
                    </div>
                 ))}
              </div>
          </div>
      </div>

      {/* Card Detail Modal (Z-100) */}
      <CardDetailModal 
        card={activeCard} 
        isOpen={!!activeCard} 
        onClose={() => setActiveCard(null)}
        isMyTurn={isMyTurn && myPlayer?.hand.some(c => c.id === activeCard?.id) || false}
        onPlay={() => {
          if (activeCard) {
            performAction({ type: 'PLAY_CARD', cardId: activeCard.id });
            setActiveCard(null);
          }
        }}
        onDiscard={() => {
          if (activeCard) {
            performAction({ type: 'DISCARD_CARD', cardId: activeCard.id });
            setActiveCard(null);
          }
        }}
      />
    </main>
  );
}

export default function TabletopPage() {
  return (
    <Suspense fallback={
       <div className="fe-scene flex flex-col items-center justify-center bg-black">
          <div className="w-12 h-12 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mb-4" />
          <div className="fe-hologram animate-pulse text-[var(--accent)]">ESTABLISHING_NEURAL_LINK...</div>
       </div>
    }>
       <TabletopGameContent />
    </Suspense>
  );
}

