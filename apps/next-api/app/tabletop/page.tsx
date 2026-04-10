'use client';

import React, { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { apiFetch } from '@/lib/api';
import { loadLocalSettings, saveRoomPin, clearRoomPin, loadRoomPin } from '@/lib/localProfile';
import { MatchAction, StateEnvelope } from '@/types/game';
import { MatchCard, MatchPlayer, cardTheme } from '@/lib/tabletopShared';
import { MAX_HAND_SIZE, MAX_ACTIONS_PER_TURN } from '@/lib/gameConfig';
import PhaserGame from '@/components/PhaserGame';

// --- UI COMPONENTS ---

function PlayerStatsHUD({ player, isActive }: { player: MatchPlayer; isActive: boolean }) {
  return (
    <div className={`fe-modal-content !w-auto min-w-[160px] flex flex-col gap-4 !p-5 transition-all duration-500 backdrop-blur-3xl ${
      isActive ? 'border-accent shadow-[0_0_30px_rgba(var(--accent-rgb),0.2)]' : 'opacity-60 grayscale-[0.5]'
    }`}>
      <div className="flex items-center gap-4">
        <span className="text-2xl filter drop-shadow-[0_0_8px_rgba(var(--fg-rgb),0.2)]">{player.emoji}</span>
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-fg truncate">
            {player.displayName}
          </span>
          <div className={`h-[1px] mt-2 transition-all duration-700 ${isActive ? 'w-full bg-accent animate-pulse' : 'w-4 bg-fg/10'}`} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col">
          <span className="text-[8px] font-black text-fg/40 uppercase tracking-[0.2em] mb-1">Crd</span>
          <span className="text-xl font-black italic text-fg leading-none">{player.hand.length}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[8px] font-black text-accent-alt/60 uppercase tracking-[0.2em] mb-1">Nrg</span>
          <span className="text-xl font-black italic text-accent-alt leading-none">{player.survivalPoints}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[8px] font-black text-danger/60 uppercase tracking-[0.2em] mb-1">Hlt</span>
          <span className="text-xl font-black italic text-danger leading-none">{player.health}</span>
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
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-2xl" 
          />
          
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-sm fe-modal-content !p-0 overflow-hidden shadow-2xl"
          >
            {/* Header / Hero Area */}
            <div className="h-48 relative flex items-center justify-center overflow-hidden bg-bg/40">
              <div className="absolute inset-0 opacity-10 fe-scanline pointer-events-none" />
              <div className="text-8xl filter drop-shadow-[0_0_20px_rgba(var(--fg-rgb),0.15)]">{theme.icon}</div>
              
              <div className="absolute top-4 left-6 fe-hologram text-[10px] text-accent/40 tracking-[0.5em]">
                {card.type}_Unit
              </div>
              
              <div className="absolute bottom-4 left-6 right-6 flex justify-between items-end">
                <div className="h-[1px] w-12 bg-accent/20" />
                {card.pointsDelta !== undefined && (
                  <span className="text-2xl font-black italic text-accent tabular-nums">+{card.pointsDelta} NR</span>
                )}
              </div>
            </div>

            {/* Info Body */}
            <div className="p-8">
              <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-4 text-fg leading-none">{card.name}</h2>
              <p className="text-fg/50 leading-relaxed font-light mb-10 text-sm italic">
                {card.description || "Experimental data unit with undocumented side effects."}
              </p>
              
              <div className="flex flex-col gap-4">
                {isMyTurn && (
                  <>
                    <button 
                      onClick={onPlay}
                      className="fe-holo-btn !py-5 !text-sm !text-accent !bg-accent/10 !border-accent"
                    >
                      Authorize_Execution
                    </button>
                    <button 
                      onClick={onDiscard}
                      className="fe-holo-btn !py-3 !text-[10px] !border-danger/20 !text-danger/60 hover:!bg-danger/10 hover:!text-danger transition-all"
                    >
                      Eject_From_Hand
                    </button>
                   </>
                )}
                <button 
                  onClick={onClose}
                  className="fe-display-italic text-fg/20 hover:text-fg text-[10px] tracking-[0.5em] py-4 transition-all uppercase text-center"
                >
                  Dismiss_Buffer
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// --- MAIN PAGE CONTENT ---

function TabletopGameContent() {
  const { data: session } = useSession();
  const search = useSearchParams();
  const router = useRouter();
  const code = search.get('code')?.toUpperCase() || '';
  const [state, setState] = useState<StateEnvelope | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [activeCard, setActiveCard] = useState<MatchCard | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [local, setLocal] = useState<{ userId: string } | null>(null);
  const [showAbortConfirm, setShowAbortConfirm] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    setLocal(loadLocalSettings());
  }, []);

  const userId = (session?.user as any)?.id || local?.userId || '';
  const payload = state?.payload;
  const myPlayer = payload?.players.find(p => p.id === userId);
  const activePlayer = payload?.players[payload?.activePlayerIndex ?? 0];
  const isMyTurn = activePlayer?.id === userId;
  const opponents = payload?.players.filter(p => p.id !== userId) || [];

  useEffect(() => {
    if (hasMounted && !loadRoomPin()) {
      router.replace('/');
    }
  }, [hasMounted, router]);

  const sync = React.useCallback(async () => {
    if (!hasMounted) return;
    try {
      const res = await apiFetch(`/api/rooms/${code}/state`, { cache: 'no-store' });
      if (res.status === 404) {
        setError('ROOM_NOT_FOUND_OR_CLOSED');
        return;
      }
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown Network Error' }));
        setError(errorData.error || `HTTP Error ${res.status}`);
        return;
      }
      const stateSnapshot = await res.json();
      setState(stateSnapshot);
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Fatal Connection Error');
    }
  }, [code, hasMounted]);

  useEffect(() => {
    if (!code) return;
    sync();
    const timer = setInterval(sync, 1000);
    return () => clearInterval(timer);
  }, [code, sync]);

  useEffect(() => {
    if (myPlayer && code && local) {
      saveRoomPin({ 
        code, 
        userId: local.userId, 
        displayName: myPlayer.displayName, 
        emoji: myPlayer.emoji, 
        ttlMs: 60000 
      });
    }
  }, [myPlayer, code, local]);

  async function performAction(action: Partial<MatchAction>) {
    if (!state || !local) return;
    setBusy(true);
    try {
      const res = await apiFetch(`/api/rooms/${code}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: local.userId, action, expectedRevision: state.revision }),
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
      <div className="fe-layout-root flex flex-col items-center justify-center bg-bg p-10">
        <h1 className="fe-display-italic text-5xl md:text-7xl font-black text-danger mb-6 animate-flicker">LINK_SEVERED</h1>
        <p className="text-danger/40 font-black uppercase tracking-[0.5em] mb-16 text-[10px]">Session_Terminated_By_System</p>
        <Link href="/lan" className="fe-holo-btn !border-danger/40 !text-danger hover:!bg-danger/10">Return_To_Base</Link>
      </div>
    );
  }

  if (!hasMounted || !state) return (
    <div className="fe-layout-root flex flex-col items-center justify-center bg-bg p-12 text-center">
      {error ? (
        <div className="max-w-xs animate-in fade-in zoom-in duration-500">
          <h1 className="text-4xl font-black text-danger mb-8 animate-flicker uppercase italic tracking-tighter">COMMS_BREACH</h1>
          <p className="text-danger/40 mb-12 text-[10px] uppercase tracking-[0.3em] font-black leading-relaxed">{error}</p>
          <div className="flex flex-col gap-6">
            <button onClick={() => sync()} className="fe-holo-btn !py-5 !text-accent !border-accent/40">Retry_Sync</button>
            <Link href="/lan" className="fe-display-italic text-fg/20 text-[10px] uppercase tracking-[0.5em] mt-6 hover:text-fg transition-all">Abort_Operation</Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="w-24 h-[1px] bg-accent/20 animate-pulse mb-12" />
          <div className="fe-hologram animate-flicker text-accent text-sm tracking-[0.5em]">ESTABLISHING_NEURAL_LINK...</div>
          <div className="mt-16 text-fg/10 text-[9px] uppercase tracking-[0.8em] animate-pulse">Synchronizing_Spatial_Data</div>
        </div>
      )}
    </div>
  );

  return (
    <main className="fe-layout-root bg-bg select-none">
      {/* Visual Depth Layers */}
      <div className="fixed inset-0 z-0">
         <Image 
           src="/assets/type-bgs/chaos.png" 
           fill 
           className="object-cover opacity-20 filter brightness-[0.5] blur-sm scale-110" 
           alt="" 
           unoptimized 
         />
         <div className="fe-vignette" />
         <div className="fe-scanline opacity-10" />
         <div className="fe-grid opacity-5" />
      </div>

      {/* TOP HUD: Sector Info & Abort Control */}
      <header className="absolute top-0 left-0 right-0 p-8 sm:p-12 flex justify-between items-start z-50 pointer-events-none">
        <div className="flex flex-col gap-3">
          <div className="fe-hologram text-accent-alt/60 text-[10px] tracking-[0.5em] mb-2 uppercase">Neural_Link_Active</div>
          <h1 className="fe-display-italic text-4xl sm:text-6xl font-black italic tracking-tighter text-fg animate-flicker uppercase leading-[0.8]">
            Sector_{code}
          </h1>
        </div>
        <button 
          onClick={() => setShowAbortConfirm(true)} 
          className="pointer-events-auto px-8 py-3 border border-danger/30 rounded-full bg-danger/5 text-danger/60 hover:text-danger hover:bg-danger/10 transition-all font-black text-[10px] uppercase tracking-widest backdrop-blur-md"
        >
          Abort_Link
        </button>
      </header>

      {/* GAME ENGINE VIEWPORT */}
      <div className="flex-1 relative">
        <PhaserGame
          roomCode={code}
          gameState={payload}
          userId={userId}
          onAction={(action) => performAction(action)}
          onCardDetail={(card) => setActiveCard(card)}
        />
      </div>

      {/* BOTTOM HUD: Player Status & Turn Control */}
      <footer className="absolute bottom-0 left-0 right-0 p-8 flex flex-col items-center gap-8 pointer-events-none z-50">
        
        {/* Active Turn Controller */}
        {isMyTurn && myPlayer && (() => {
          const maxHand = (MAX_HAND_SIZE + (myPlayer.maxHandModifier || 0) + (myPlayer.triggers.some(t => t.kind === 'HAND_LIMIT_TEMP_1') ? 1 : 0));
          const isOverHandLimit = myPlayer.hand.length > maxHand;
          
          return (
            <div className="pointer-events-auto flex flex-col items-center gap-6 animate-in slide-in-from-bottom-8 duration-700">
              {isOverHandLimit && (
                <div className="bg-danger/10 border border-danger/20 rounded-full px-6 py-2 text-[10px] text-danger font-black tracking-[0.3em] backdrop-blur-3xl animate-pulse uppercase">
                  OVER_CAPACITY: DISCARD_REQ ({maxHand})
                </div>
              )}
              <button 
                onClick={() => performAction({ type: 'END_TURN' })}
                disabled={busy || isOverHandLimit}
                className={`fe-holo-btn !py-6 !px-16 text-sm font-black tracking-[0.4em] shadow-2xl transition-all ${
                  isOverHandLimit ? 'opacity-20 cursor-not-allowed grayscale' : 'hover:scale-105 active:scale-95 !text-accent !border-accent !bg-accent/10 hover:!bg-accent/20'
                }`}
              >
                {busy ? 'SYNCHRONIZING...' : 'FINALIZE_CYCLE'}
              </button>
            </div>
          );
        })()}

        <section className="w-full max-w-6xl flex items-end justify-between gap-6 overflow-x-auto sm:overflow-visible no-scrollbar pb-4 sm:pb-0">
          <div className="pointer-events-auto scale-90 sm:scale-100 origin-bottom-left flex-shrink-0">
            {myPlayer && <PlayerStatsHUD player={myPlayer} isActive={isMyTurn} />}
          </div>

          <div className="flex gap-4 pointer-events-auto scale-75 sm:scale-90 origin-bottom-right flex-shrink-0">
            {opponents.map(opp => (
              <PlayerStatsHUD key={opp.id} player={opp} isActive={activePlayer?.id === opp.id} />
            ))}
          </div>
        </section>
      </footer>

      {/* Global Modals */}
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

      {/* ABORT CONFIRMATION */}
      <AnimatePresence>
        {showAbortConfirm && (
          <div className="fixed inset-0 z-[2500] flex items-center justify-center p-8">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => setShowAbortConfirm(false)} 
              className="absolute inset-0 bg-black/95 backdrop-blur-3xl" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} 
              className="relative z-10 fe-modal-content border-danger/20 max-w-sm w-full flex flex-col items-center text-center gap-10 !p-12 shadow-[0_0_100px_rgba(var(--accent-rgb),0.1)]"
            >
              <div>
                <h3 className="fe-display-italic text-3xl font-black text-danger uppercase tracking-widest mb-4 leading-none italic">Termination_Check</h3>
                <p className="text-[10px] text-fg/30 tracking-[0.2em] leading-relaxed uppercase font-black italic">Neural link stability will be lost. Sector data persistence not guaranteed. Confirm Abort?</p>
              </div>
              <div className="flex gap-6 w-full pt-4">
                <button onClick={() => setShowAbortConfirm(false)} className="flex-1 fe-holo-btn !bg-transparent opacity-40 hover:opacity-100 !py-4">Back</button>
                <button onClick={() => {
                  clearRoomPin();
                  router.replace('/');
                }} className="flex-1 fe-holo-btn !bg-danger/20 !border-danger/40 !text-danger font-black hover:!bg-danger/30 !py-4">Abort</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default function TabletopPage() {
  return (
    <Suspense fallback={
      <div className="fe-layout-root flex flex-col items-center justify-center bg-bg">
        <div className="w-16 h-[1px] bg-accent/20 animate-pulse mb-12" />
        <div className="fe-hologram animate-flicker text-accent text-sm uppercase tracking-[0.5em]">REESTABLISHING_COMM_LINK...</div>
      </div>
    }>
      <TabletopGameContent />
    </Suspense>
  );
}
