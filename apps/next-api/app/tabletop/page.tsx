'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import React, { Suspense } from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from 'framer-motion';
import {
  appendMatchOutcome,
  clearRoomPin,
  loadLocalSettings,
  saveRoomPin,
  type LocalMatchOutcome,
} from '@/lib/localProfile';
import { apiFetch } from '@/lib/api';
import { cardTheme, describeCardEffect, positionOpponents } from '@/lib/tabletopShared';
import { InterstitialAd } from '@/components/InterstitialAd';
import TacticalDataPanel from '@/components/TacticalDataPanel';
import { GameEndOverlay } from '@/components/GameEndOverlay';

// Types derived from engine
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
  maxHandModifier?: number;
  twistEffect?: string;
  triggers: Array<{
    id: string;
    kind: string;
    value?: any;
    duration: string;
  }>;
};

type GameStatePayload = {
  round: number;
  activePlayerIndex: number;
  players: MatchPlayer[];
  drawPile: MatchCard[];
  discardPile: MatchCard[];
  turnPile: MatchCard[];
  topCard?: MatchCard;
  turnDirection: 1 | -1;
  isGlobalDisasterPhase: boolean;
  winnerId?: string;
  cardsPlayedThisTurn: number;
  hasDrawnThisTurn: boolean;
  botTurnReplay?: any[];
};

type StateEnvelope = {
  roomCode: string;
  revision: number;
  payload: GameStatePayload;
  isPaused?: boolean;
  disconnectedUserId?: string;
};

/* --- Physical Scene Components --- */

function ConnectionLostOverlay({ userId, players }: { userId: string, players: MatchPlayer[] }) {
  const disconnectedPlayer = players.find(p => p.id === userId);
  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-3xl flex flex-col items-center justify-center p-8 text-center"
    >
      <div className="fe-flicker flex flex-col items-center gap-8">
        <div className="w-24 h-24 rounded-full border-4 border-rose-500/30 flex items-center justify-center animate-pulse">
           <div className="w-4 h-4 bg-rose-500 rounded-full shadow-[0_0_20px_rose-500]" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-4xl font-black italic tracking-tighter text-rose-500 fe-glow-text uppercase">Comm_Link_Severed</h2>
          <p className="text-[var(--fg)] opacity-40 fe-hologram text-xs tracking-[0.3em] uppercase">Waiting for Neural Sync stabilization...</p>
        </div>

        <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-2xl max-w-sm">
           <span className="text-rose-500 font-bold text-lg">{disconnectedPlayer?.displayName || 'Unknown Subject'}</span>
           <span className="text-[var(--fg)] opacity-60 text-[10px] block mt-2 uppercase tracking-widest font-black italic">
             Dropped Out of Reality Sector {Math.random().toString(36).substring(7).toUpperCase()}
           </span>
        </div>

        <div className="mt-12 flex flex-col items-center gap-4">
           <div className="w-64 h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                animate={{ x: [-256, 256] }} 
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }} 
                className="w-1/2 h-full bg-rose-500 shadow-[0_0_10px_rose-500]" 
              />
           </div>
           <span className="text-[var(--fg)] opacity-20 text-[8px] uppercase tracking-[0.5em] font-black">Syncing_Back_To_Engine</span>
        </div>
      </div>
    </motion.div>
  );
}

function PhysicalCard({ card, onClick, isSelected, className, style }: { card: MatchCard; onClick?: () => void; isSelected?: boolean; className?: string; style?: any }) {
  const theme = cardTheme(card.type);
  return (
    <motion.div
      onClick={onClick}
      style={style}
      className={`fe-card-physical ${isSelected ? 'border-[var(--accent)] shadow-[0_0_30px_rgba(var(--accent-rgb),0.5)] z-[200]' : ''} ${className || ''}`}
    >
      <img src={theme.bg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-screen pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-80 pointer-events-none" />
      
      <div className="relative z-10 flex flex-col h-full p-3 justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xl">{theme.icon}</span>
          <span className="text-[8px] uppercase font-black tracking-widest opacity-50">{card.type}</span>
        </div>
        
        <div className="text-center">
            <h3 className="text-xs font-black uppercase tracking-tighter leading-none mb-1">{card.name}</h3>
            <div className="flex gap-1 justify-center">
                {card.pointsDelta !== 0 && (
                    <span className={`text-[8px] font-bold ${card.pointsDelta > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {card.pointsDelta > 0 ? '+' : ''}{card.pointsDelta}E
                    </span>
                )}
                {card.gainHealth && card.gainHealth > 0 && (
                    <span className="text-[8px] font-bold text-[var(--accent-soft)]">+{card.gainHealth}H</span>
                )}
            </div>
        </div>

        <div className="h-4 bg-white/5 border-t border-white/5 text-[6px] flex items-center justify-center opacity-30 tracking-[0.3em] font-black uppercase">
            REV-X.04
        </div>
      </div>
    </motion.div>
  );
}

function PlayerStatsHUD({ player, isActive }: { player: MatchPlayer; isActive: boolean }) {
  return (
    <div className={`flex flex-col gap-2 p-4 md:p-6 rounded-[var(--radius)] bg-[var(--panel)] backdrop-blur-3xl border transition-all duration-700 ${isActive ? 'border-[var(--accent)] shadow-[0_0_50px_rgba(var(--accent-rgb),0.4)] ring-2 ring-[var(--accent)]/20' : 'border-[var(--border)]'} w-40 md:w-48`}>
        <div className="flex items-center gap-2 md:gap-3">
           <div className={`text-xl md:text-2xl transition-transform duration-500 ${isActive ? 'scale-110 md:scale-125' : ''}`}>{player.emoji}</div>
           <div className="flex flex-col">
              <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-colors truncate max-w-[80px] md:max-w-none ${isActive ? 'text-[var(--accent)]' : 'text-[var(--fg)] opacity-40'}`}>{player.displayName}</span>
              <div className={`h-[1px] md:h-[2px] transition-all duration-500 ${isActive ? 'bg-[var(--accent)] shadow-[0_0_10px_var(--glow-color)] w-10 md:w-12' : 'bg-[var(--border)] w-6 md:w-8'} mt-1`} />
           </div>
        </div>
        <div className="flex justify-between items-end mt-2 md:mt-4">
           {/* ADDED: Bug 3 Hand Count */}
           <div className="flex flex-col">
              <span className="text-[6px] md:text-[7px] font-black text-[var(--fg)] opacity-50 uppercase tracking-widest">Cards</span>
              <div className="text-xl md:text-3xl font-black italic text-[var(--fg)] opacity-80 fe-glow-text">{player.hand?.length ?? 0}</div>
           </div>
           <div className="flex flex-col items-center">
              <span className="text-[6px] md:text-[7px] font-black text-[var(--accent-soft)] opacity-60 uppercase tracking-widest">Energy</span>
              <div className="text-xl md:text-3xl font-black italic text-[var(--accent-soft)] fe-glow-text">{player.survivalPoints}</div>
           </div>
           <div className="flex flex-col items-end">
              <span className="text-[6px] md:text-[7px] font-black text-rose-500 opacity-60 uppercase tracking-widest">Health</span>
              <div className="text-xl md:text-3xl font-black italic text-rose-500 fe-glow-text">{player.health}</div>
           </div>
        </div>

    </div>
  );
}

function PlayPile({ cards }: { cards: MatchCard[] }) {
  return (
    <div 
      className="relative [transform-style:preserve-3d] cursor-pointer group" 
      style={{ width: 'var(--card-w)', height: 'var(--card-h)' }}
      onClick={() => window.dispatchEvent(new CustomEvent('fe:view-pile', { detail: cards }))}
    >
       {/* 3D Box Container */}
       <div className="absolute inset-0 bg-white/5 border border-white/10 rounded-2xl [transform:translateZ(-10px)] group-hover:bg-white/10 transition-colors" />
       
       <AnimatePresence>
          {cards.map((card, i) => (
             <motion.div
               key={card.id}
               initial={{ opacity: 0, y: -200, rotateX: -90 }}
               animate={{ 
                 opacity: 1, 
                 y: 0, 
                 rotateX: 0,
                 z: i * 2,
                 rotate: (i - (cards.length-1)/2) * 5,
                 x: `calc(${(i - (cards.length-1)/2)} * (var(--card-w) * 0.2))`
               }}
               style={{ transformStyle: 'preserve-3d' }}
               className="absolute inset-0"
             >
                <PhysicalCard card={card} className="w-full h-full shadow-2xl" />
             </motion.div>
          ))}
       </AnimatePresence>

       {cards.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
             <div className="fe-hologram text-[6px] tracking-[0.5em] text-center">SECTOR<br/>VOID</div>
          </div>
       )}
    </div>
  );
}

function OpponentHand({ count, angle, player, isActive }: { count: number; angle: number; player: MatchPlayer; isActive: boolean }) {
  const rad = angle * (Math.PI / 180);
  
  const [radius, setRadius] = useState(340);
  useEffect(() => {
    const updateRadius = () => {
      const h = window.innerHeight;
      const w = window.innerWidth;
      if (h < 600) setRadius(w < 600 ? 180 : 240);
      else if (w < 768) setRadius(220);
      else if (w < 1024) setRadius(280);
      else setRadius(340);
    };
    updateRadius();
    window.addEventListener('resize', updateRadius);
    return () => window.removeEventListener('resize', updateRadius);
  }, []);

  const isMobile = radius === 200;

  const orbitX = -Math.sin(rad) * radius;
  const orbitY = Math.cos(rad) * radius;

  return (
    <div 
      className="absolute flex flex-col items-center justify-center gap-2 md:gap-4 pointer-events-none"
      style={{ 
        transform: `translate(${orbitX}px, ${orbitY}px) rotate(${angle}deg)`,
        zIndex: 50
      }}
    >
       {/* Opponent HUD */}
       <div className="fe-hologram pointer-events-auto scale-[0.5] md:scale-100 origin-bottom">
          <PlayerStatsHUD player={player} isActive={isActive} />
       </div>

       {/* Opponent Cards */}
       <div className="relative flex justify-center mt-2 md:mt-4 w-full h-16 md:h-24">
          {[...Array(Math.max(0, count))].map((_, i) => (
             <motion.div
               key={i}
               style={{ 
                 width: `calc(var(--card-w) * ${isMobile ? 0.6 : 0.8})`,
                 height: `calc(var(--card-h) * ${isMobile ? 0.6 : 0.8})`,
                 transform: `translateX(calc(${(i - (count-1)/2)} * (var(--card-w) * 0.2))) rotate(${(i - (count-1)/2) * 6}deg)`,
                 transformOrigin: 'bottom center',
                 position: 'absolute',
                 bottom: 0
               }}
               className="bg-slate-900 border border-white/20 rounded-lg md:rounded-xl shadow-2xl overflow-hidden"
             >
                {/* High-Fidelity Card Back */}
                <div className="absolute inset-0 bg-[var(--bg)]" />
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(var(--accent-rgb),0.1)_0%,transparent_100%)]" />
                <div className="fe-grid opacity-30" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-8 h-8 md:w-12 md:h-12 rounded-full border-2 border-white/5 flex items-center justify-center opacity-40 shadow-[0_0_15px_rgba(var(--accent-rgb),0.2)]">
                      <div className="w-2 h-2 md:w-3 md:h-3 bg-[var(--accent-soft)] rounded-full" />
                   </div>
                </div>
                <div className="absolute top-2 left-0 right-0 text-center opacity-30">
                   <span className="text-[4px] md:text-[6px] fe-hologram tracking-[0.3em] text-[var(--accent-soft)] uppercase">Opponent</span>
                </div>
                <div className="absolute inset-0 fe-scanline opacity-10" />
             </motion.div>
           ))}
        </div>
    </div>
  );
}


function FloatingDeck({ count, canDraw, onDraw }: { count: number; canDraw: boolean; onDraw: () => void }) {
  return (
    <div 
      className="relative group cursor-pointer" 
      onClick={onDraw} 
      style={{ width: 'var(--card-w)', height: 'var(--card-h)' }}
    >
       {/* Visual Stack Layers */}
       {[...Array(Math.min(5, Math.ceil(count/10)))].map((_, i) => (
         <div 
           key={i}
           className="absolute inset-0 bg-slate-900 border border-white/10 rounded-xl shadow-2xl"
           style={{ transform: `translateZ(${i * 2}px) translateY(-${i}px)` }}
         />
       ))}
       <motion.div 
         whileHover={canDraw ? { y: -5, rotateX: -5 } : {}}
         className={`absolute inset-0 bg-[var(--panel-alt)] border-2 border-[var(--border)] rounded-[calc(var(--radius)/2)] flex items-center justify-center overflow-hidden ${!canDraw ? 'opacity-30' : ''}`}
       >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,var(--bg)_0%,var(--panel)_100%)]" />
          <div className="fe-grid" />
          <div className="relative z-10 flex flex-col items-center gap-2">
             <div className="w-10 h-10 rounded-full border-2 border-white/10 flex items-center justify-center">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 10, ease: 'linear' }} className="absolute inset-0 rounded-full border-t-2 border-[var(--accent-soft)]" />
                <div className="w-2 h-2 bg-[var(--accent-soft)] rounded-full shadow-[0_0_10px_var(--accent-soft)]" />
             </div>
             <span className="text-[10px] font-black tracking-[0.4em] opacity-40">DECK</span>
             <span className="text-[8px] font-black opacity-20">{count} UNITS</span>
          </div>
       </motion.div>
    </div>
  );
}

/* --- Main Page --- */

export default function TabletopPage() {
  return (
    <Suspense fallback={<div className="fe-scene flex-1 flex items-center justify-center"><div className="fe-hologram animate-pulse text-[var(--accent-soft)] text-xl tracking-[0.5em] fe-flicker">INITIALIZING_NEURAL_LINK...</div></div>}>
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
  const [busy, setBusy] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState('');
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [showFullInspect, setShowFullInspect] = useState(false);
  const [inspectedCard, setInspectedCard] = useState<MatchCard | null>(null);
  const [showPostGameAd, setShowPostGameAd] = useState(false);
  const [replayQueue, setReplayQueue] = useState<any[]>([]);
  const [replayEvent, setReplayEvent] = useState<any | null>(null);
  const [viewingPile, setViewingPile] = useState<MatchCard[] | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const hasRecordedHistory = useRef(false);
  const router = useRouter();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const userId = useMemo(() => {
    if (userFromQuery) return userFromQuery;
    return loadLocalSettings().userId;
  }, [userFromQuery]);

  const payload = state?.payload;
  const activePlayer = payload?.players[payload.activePlayerIndex];
  const myPlayer = payload?.players.find((p) => p.id === userId) ?? null;
  const isMyTurn = activePlayer?.id === userId;
  const winner = payload?.players.find((p) => p.id === payload?.winnerId);
  const isDrawPending = isMyTurn && !winner && payload && !payload.hasDrawnThisTurn;
  const canDraw = Boolean(isDrawPending && !busy && replayQueue.length === 0);
  const canEndTurn = Boolean(isMyTurn && !busy && !winner && payload?.hasDrawnThisTurn && replayQueue.length === 0);
  const maxPlayReached = Boolean((payload?.cardsPlayedThisTurn ?? 0) >= 3);

  const selectedCard = useMemo(() => 
    myPlayer?.hand.find(c => c.id === selectedCardId) ?? null, 
  [myPlayer, selectedCardId]);

  /* --- API Integration --- */
  const postAction = useCallback(async (action: any, expectedRevision?: number) => {
    const res = await apiFetch(`/api/rooms/${code}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action, expectedRevision }),
    });
    const data = await res.json();
    if (!res.ok) {
       // BUG 6 FIX: Catch Race Condition (409) safely and resync to latest true state
       if (res.status === 409 && data.current) return data.current as StateEnvelope;
       throw new Error(data.error || 'Action failed');
    }
    return data as StateEnvelope;
  }, [code, userId]);

  useEffect(() => {
    async function sync() {
      try {
        const res = await apiFetch(`/api/rooms/${code}/state`, { cache: 'no-store' });
        if (!res.ok) return;
        const stateSnapshot = await res.json();
        if (stateSnapshot.payload?.botTurnReplay?.length > 0 && stateSnapshot.revision !== state?.revision) {
           setReplayQueue(stateSnapshot.payload.botTurnReplay);
        }
        setState(stateSnapshot);
      } catch (e) { console.error('Sync failed', e); }
    }
    const timer = setInterval(sync, 1500);
    return () => clearInterval(timer);
  }, [code, state?.revision]);

  // Bug 7: Room Heartbeat
  useEffect(() => {
    const ping = async () => {
      try {
        await apiFetch(`/api/rooms/${code}/heartbeat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
        // Refresh local session pin to keep the 1-minute resume window active
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

  // Bug 9: Error Dismissal
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Bug 6: Bot Turn Replay Processing
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

  // Bug 6: Bot Turn Replay Processing
  useEffect(() => {
    if (replayQueue.length === 0) {
      setReplayEvent(null);
      return;
    }
    const evt = replayQueue[0];
    setReplayEvent(evt);
    const timer = setTimeout(() => {
       setReplayQueue(q => q.slice(1));
    }, 2500); // BUG 5 FIX: Expanded timer to 2.5s for readability
    return () => clearTimeout(timer);
  }, [replayQueue]);

  // Bug 2: Custom Pile Viewer Event Listener
  useEffect(() => {
    const handleViewPile = (e: any) => setViewingPile(e.detail);
    window.addEventListener('fe:view-pile', handleViewPile as EventListener);
    return () => window.removeEventListener('fe:view-pile', handleViewPile as EventListener);
  }, []);

  async function handleDraw() {
    if (!canDraw) return;
    setBusy(true);
    try {
      const synced = await postAction({ type: 'DRAW_CARD' }, state?.revision);
      setState(synced);
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }

  async function handlePass() {
    if (!canEndTurn) return;
    setBusy(true);
    try {
      const synced = await postAction({ type: 'END_TURN' }, state?.revision);
      setState(synced);
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }

  async function handlePlay() {
    if (!selectedCard) return;
    setBusy(true);
    try {
      const needsTarget = selectedCard.type === 'DISASTER' && selectedCard.disasterKind !== 'GLOBAL';
      const synced = await postAction({
        type: 'PLAY_CARD',
        cardId: selectedCard.id,
        targetPlayerId: needsTarget ? selectedTargetId : undefined,
      }, state?.revision);
      setState(synced);
      setSelectedCardId('');
      setSelectedTargetId('');
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }

  async function handleDiscard() {
    if (!selectedCard) return;
    setBusy(true);
    try {
      const synced = await postAction({
        type: 'DISCARD_CARD',
        cardId: selectedCard.id,
      }, state?.revision);
      setState(synced);
      setSelectedCardId('');
      setSelectedTargetId('');
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }

  if (!state) {
     return (
       <main className="fe-scene flex-1 flex items-center justify-center">
         <div className="fe-hologram animate-pulse text-[var(--accent-soft)] text-xl tracking-[0.5em] fe-flicker">SYNCING_SECTOR_STATE...</div>
       </main>
     );
  }

  return (
    <main className="fe-scene bg-black flex-1">
      {/* Pause Overlay (BUG FIXED: Mismatch threshold) */}
      <AnimatePresence>
        {state.isPaused && state.disconnectedUserId && payload && (
          <ConnectionLostOverlay userId={state.disconnectedUserId} players={payload.players} />
        )}
      </AnimatePresence>

      {/* Bot Turn Replay Cinematic Modal (BUG 5 FIX) */}
      <AnimatePresence>
        {replayEvent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[4000] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-auto">
             <div className="flex flex-col items-center gap-6">
                 <div className="text-xl md:text-3xl text-[var(--accent-soft)] fe-hologram animate-pulse tracking-[0.3em] fe-glow-text">
                   NEXUS_AI_PROCESSING
                 </div>
                 <div className="bg-[var(--panel)] border border-[var(--border)] p-8 md:p-12 rounded-[var(--radius)] shadow-[0_0_50px_rgba(0,0,0,0.5)] text-center max-w-lg w-full flex flex-col items-center transition-all">
                    <span className="text-[var(--fg)] font-black italic tracking-widest uppercase text-lg md:text-xl mb-6 leading-relaxed">
                       <span className="text-[var(--accent-soft)]">{replayEvent.actorName}</span><br/>
                       {replayEvent.action === 'THINKING' && 'Calculating Vector...'}
                       {replayEvent.action === 'DRAW' && 'Downloads Data...'}
                       {replayEvent.action === 'END_TURN' && 'Terminates Control.'}
                       {replayEvent.action === 'PLAY' && `Deploys Array`}
                    </span>
                    {replayEvent.card && (
                       <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-4 pointer-events-none">
                          <PhysicalCard card={replayEvent.card} style={{ width: '12rem', height: '16rem' }} />
                       </motion.div>
                    )}
                 </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event Effects (BUGS 3/4 FIX: Subdued non-intrusive badges) */}
      <AnimatePresence>
        {payload?.isGlobalDisasterPhase && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="absolute top-4 left-1/2 -translate-x-1/2 z-[2500] pointer-events-none bg-rose-950/80 border border-rose-500/50 px-6 py-2 rounded-full shadow-[0_0_20px_rgba(225,29,72,0.5)] flex items-center gap-3">
             <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
             <div className="text-rose-500 fe-hologram text-sm fe-flicker whitespace-nowrap">CATACLYSM_ACTIVE</div>
          </motion.div>
        )}
        {payload && payload.round % 3 === 0 && !payload.isGlobalDisasterPhase && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute bottom-4 left-4 z-[2500] pointer-events-none bg-[var(--panel)] border border-[var(--accent-soft)]/50 px-4 py-2 rounded-full shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)] flex items-center gap-3">
             <div className="w-2 h-2 bg-[var(--accent-soft)] rounded-full animate-pulse" />
             <div className="text-[var(--accent-soft)] fe-hologram text-xs fe-flicker whitespace-nowrap">AETHER_SHIFT_ACTIVE</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Atmospheric Particles (Aether Dust) */}
      <div className="absolute inset-0 z-[5] pointer-events-none opacity-30">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full blur-[1px]"
            initial={{ 
              x: Math.random() * 100 + '%', 
              y: Math.random() * 100 + '%', 
              opacity: Math.random() 
            }}
            animate={{ 
              y: [null, '-=100px'],
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0]
            }}
            transition={{ 
              duration: 5 + Math.random() * 10, 
              repeat: Infinity, 
              delay: Math.random() * 10 
            }}
          />
        ))}
      </div>

      {/* Iconic Cinematic Logo (Phase 9 Revert) */}
      {/* Sector Frequency Header */}
      <div className="absolute top-4 left-4 md:top-8 md:left-8 z-[1200] flex flex-col gap-1 pointer-events-none fe-mobile-hiding-h">
         <div className="fe-hologram text-[var(--accent-soft)] opacity-60 text-[8px] md:text-[10px]">Sector_Frequency</div>
         <div className="text-xl md:text-3xl font-black italic tracking-widest text-[var(--fg)] leading-none uppercase">{code}</div>
      </div>
      <div className="absolute top-10 left-10 z-[1000] pointer-events-none fe-mobile-hiding-h">
         <div className="flex flex-col -gap-4">
            <h1 className="text-xl font-black italic tracking-[0.4em] text-[var(--fg)] opacity-30 fe-hologram uppercase fe-flicker">
               FRACTURED
            </h1>
            <h1 className="text-6xl font-black italic tracking-tighter text-[var(--accent)] fe-glow-text leading-[0.8] drop-shadow-[0_0_30px_rgba(var(--accent-rgb),0.5)]">
               EARTH
            </h1>
            <div className="flex items-center gap-2 mt-4">
               <div className="w-12 h-[1px] bg-[var(--accent)]/30" />
               <div className="fe-hologram text-[7px] text-[var(--accent)] opacity-50 font-bold uppercase tracking-[0.3em]">CYCLE_{payload?.round || 0}_LOGGED</div>
            </div>
         </div>
      </div>

      {/* Immersive Background */}
      <div className="absolute inset-0 z-0">
          <img src="/assets/type-bgs/survival.png" className="w-full h-full object-cover opacity-20 scale-110 blur-xl" alt="" />
          <div className="fe-vignette" />
          <div className="fe-scanline" />
          <div className="fe-grid" />
      </div>

      {/* The Physical Table */}
      <div className="fe-table flex items-center justify-center">
           {/* Interaction Zone - Absolute Center */}
           <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[65%] flex flex-col items-center gap-16 md:gap-24 [transform:translateZ(10px)] max-w-lg w-full">
              
              {/* Decks Layer (Back) */}
              <div className="flex items-center justify-center gap-12 w-full">
                 <FloatingDeck count={payload?.drawPile.length ?? 0} canDraw={canDraw} onDraw={handleDraw} />
                 
                 <div 
                   className="relative cursor-pointer group"
                   onClick={() => {
                     if (payload?.topCard) {
                       setInspectedCard(payload.topCard);
                       setShowFullInspect(true);
                     }
                   }}
                 >
                    {payload?.topCard ? (
                      <motion.div layoutId={payload.topCard.id} className="relative">
                        <PhysicalCard card={payload.topCard} className="shadow-2xl ring-2 ring-white/5 group-hover:ring-white/20 transition-all opacity-50 grayscale" />
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 fe-hologram text-[6px] text-white/20 opacity-0 group-hover:opacity-100 transition-opacity">RECALL_LOG</div>
                      </motion.div>
                    ) : (
                      <div style={{ width: 'var(--card-w)', height: 'var(--card-h)' }} className="fe-card-physical opacity-5 bg-white/5 border-dashed flex items-center justify-center">
                         <span className="fe-hologram text-[6px] opacity-20">DISCARD</span>
                      </div>
                    )}
                 </div>
              </div>

              {/* Play Pile Layer (Front Box) */}
              <PlayPile cards={payload?.turnPile ?? []} />
           </div>

           {/* Player Seats: Projections & Hands */}
            {payload?.players.map((p, idx) => {
              const playerCount = payload.players.length;
              const myIdx = payload.players.findIndex(pl => pl.id === userId);
              const relativeIdx = (idx - myIdx + playerCount) % playerCount;
              const angle = relativeIdx * (360 / playerCount);
              
              if (p.id === userId) return null; 
              return (
                <OpponentHand 
                  key={p.id} 
                  count={p.hand.length} 
                  angle={angle} 
                  player={p} 
                  isActive={payload.activePlayerIndex === idx}
                />
              );
            })}

      </div>

      {/* Floating Action Button (Table Edge) */}
      <AnimatePresence>
        {isMyTurn && payload?.hasDrawnThisTurn && !winner && (
          <motion.button
            role="button"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            onClick={handlePass}
            disabled={(myPlayer?.hand.length || 0) > (5 + (myPlayer?.maxHandModifier || 0))}
            className={`fixed top-[45%] md:top-auto md:bottom-[28%] right-4 md:right-[20%] z-[1300] fe-holo-btn !py-3 md:!py-5 !px-6 md:!px-10 text-sm md:!text-xl !border-[var(--accent)] !text-[var(--accent)] bg-black/50 shadow-[0_0_50px_rgba(var(--accent-rgb),0.2)] ${(myPlayer?.hand.length || 0) > (5 + (myPlayer?.maxHandModifier || 0)) ? 'opacity-50 !cursor-not-allowed !border-[var(--accent)]/30' : ''}`}
          >
            Pass Control
          </motion.button>
        )}
      </AnimatePresence>

      {/* Cinematic Player Area (HUD + Hand) */}
      {myPlayer && (
        <>
            {/* HUD: Top-Right on mobile, next to Hand on desktop */}
            <div className="fixed right-4 md:top-auto md:absolute md:left-4 md:right-auto z-[1200] pointer-events-auto transform scale-[0.6] md:scale-100 origin-top-right md:origin-bottom translate-y-[var(--hud-y-off,0px)]"
                 style={{ top: isMobile ? 'calc(var(--header-height, 60px) + 1rem)' : 'auto', bottom: isMobile ? 'auto' : 'clamp(2rem, 10vh, 5rem)' }}>
               <PlayerStatsHUD player={myPlayer} isActive={isMyTurn} />
            </div>

            <div className="fixed bottom-0 left-0 right-0 z-[1100] flex flex-row items-end justify-center pointer-events-none px-4"
                 style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom), 5vmin)' }}>
               {/* Hand */}
               <div className="relative h-[var(--card-h)] flex justify-center pointer-events-auto w-full max-w-[100vw] overflow-visible shrink-0">
                  <AnimatePresence>
                 {myPlayer.hand.map((card, i) => (
                    <motion.div
                      key={card.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`Select ${card.name}`}
                      initial={{ y: 200, opacity: 0 }}
                      animate={{ 
                        y: 0, opacity: 1, 
                        rotate: (i - (myPlayer.hand.length-1)/2) * 4,
                        x: `calc(${(i - (myPlayer.hand.length-1)/2)} * (var(--hand-spread) * ${isMobile ? 0.7 : 1}))`
                      }}
                      whileHover={isDrawPending ? {} : { y: -40, rotate: 0, scale: 1.1, zIndex: 1000 }}
                      className={`absolute origin-bottom 
                        ${isDrawPending ? 'opacity-40 grayscale pointer-events-none cursor-not-allowed' : ''} 
                        ${card.type === 'SURVIVAL' && myPlayer.triggers?.some(t => t.kind === 'DISABLE_SURVIVAL_NEXT_TURN') ? 'opacity-30 grayscale cursor-not-allowed' : 'cursor-pointer'}`}
                      onClick={() => {
                        if (isDrawPending) return;
                        if (card.type === 'SURVIVAL' && myPlayer.triggers?.some(t => t.kind === 'DISABLE_SURVIVAL_NEXT_TURN')) {
                            setError('Survival cards are currently disabled');
                            return;
                        }
                        setSelectedCardId(card.id);
                      }}
                    >
                      <PhysicalCard card={card} />
                   </motion.div>
                 ))}
               </AnimatePresence>
            </div>
         </div>
       </>
      )}

      {/* Pinned Powers Layer */}
       {myPlayer && myPlayer.powers && myPlayer.powers.length > 0 && (
          <div 
             className="absolute bottom-40 md:bottom-24 left-1/2 -translate-x-1/2 cursor-pointer z-[1200] group"
             onClick={() => window.dispatchEvent(new CustomEvent('fe:view-pile', { detail: myPlayer.powers }))}
             role="button"
             aria-label="View Player Pile"
          >
             <div className="relative w-20 h-28">
               {myPlayer.powers.map((card, i) => (
                  <div key={card.id} className="absolute inset-0 bg-[var(--bg)] border-2 border-[var(--accent)]/50 rounded-xl group-hover:-translate-y-2 transition-transform shadow-[0_10px_20px_rgba(var(--accent-rgb),0.2)]" style={{ transform: `translateX(${Math.min(i * 3, 15)}px) translateY(-${Math.min(i * 3, 15)}px)` }}>
                    <img src={cardTheme(card.type).bg} className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-screen" alt="" />
                    <div className="absolute bottom-0 w-full bg-black/80 p-1 text-center">
                       <span className="fe-hologram text-[6px] text-[var(--accent)] font-bold block truncate px-1">{card.name}</span>
                    </div>
                  </div>
               ))}
             </div>
             <div className="fe-hologram text-[8px] text-[var(--accent)] bg-black/60 px-2 py-1 rounded text-center mt-2 border border-[var(--accent)]/30 whitespace-nowrap shadow-xl">PLAYER PILE ({myPlayer.powers.length})</div>
          </div>
       )}

       {/* Cinematic Inspection Layer */}
       <AnimatePresence>
          {(selectedCard || (showFullInspect && inspectedCard)) && (
             <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-4 md:p-12 overflow-y-auto"
                onClick={(e) => e.target === e.currentTarget && (setSelectedCardId(''), setShowFullInspect(false))}
             >
                <div className="flex flex-col items-center gap-6 md:gap-12 w-full max-w-2xl py-12 md:py-0">
                   <motion.div initial={{ scale: 0.8 }} animate={{ scale: isMobile ? 1 : 1.2 }}>
                      <PhysicalCard card={selectedCard || inspectedCard!} style={{ width: isMobile ? '10rem' : '14rem', height: isMobile ? '14rem' : '20rem' }} />
                   </motion.div>

                   <div className="flex flex-col items-center gap-6 md:gap-8 w-full max-w-md">
                       <TacticalDataPanel data={describeCardEffect(selectedCard || inspectedCard!)} />
                       
                       <div className="flex flex-col gap-4 w-full">
                          {selectedCard && selectedCard.type === 'DISASTER' && selectedCard.disasterKind !== 'GLOBAL' && payload && (
                             <div className="flex gap-2 flex-wrap justify-center border-b border-white/10 pb-4 mb-2">
                               {payload.players.filter(p => p.id !== userId).map(p => (
                                  <button 
                                    key={p.id} 
                                    onClick={() => setSelectedTargetId(p.id)} 
                                    className={`fe-holo-btn !py-2 !px-4 !text-[10px] md:!text-xs ${selectedTargetId === p.id ? '!border-[var(--accent)] !text-[var(--accent)] !bg-[var(--accent)]/10' : ''}`}
                                  >
                                    Target {p.displayName}
                                  </button>
                               ))}
                             </div>
                          )}
                          
                           <div className="flex gap-3 md:gap-4 justify-center flex-wrap">
                             {selectedCard && (
                                 <>
                                    <button onClick={() => { setSelectedCardId(''); setSelectedTargetId(''); }} className="fe-holo-btn !px-4 md:!px-8 text-xs md:text-base">Stow_Card</button>
                                    <button 
                                      onClick={handlePlay} 
                                      disabled={busy || maxPlayReached || (selectedCard.type === 'DISASTER' && selectedCard.disasterKind !== 'GLOBAL' && !selectedTargetId)} 
                                      className="fe-holo-btn !text-[var(--accent)] !border-[var(--accent)]/50 disabled:!opacity-30 disabled:!cursor-not-allowed !px-4 md:!px-8 text-xs md:text-base"
                                    >
                                      Deploy_Tactical
                                    </button>
                                    <button 
                                      onClick={handleDiscard} 
                                      disabled={busy} 
                                      className="fe-holo-btn !text-[var(--accent-soft)] !border-[var(--accent-soft)]/50 !px-4 md:!px-8 text-xs md:text-base"
                                    >
                                      Discard_Data
                                    </button>
                                 </>
                             )}
                             {inspectedCard && !selectedCard && (
                                <button onClick={() => { setInspectedCard(null); setShowFullInspect(false); }} className="fe-holo-btn !px-4 md:!px-8 text-xs md:text-base">Dismiss_Intel</button>
                             )}
                          </div>
                       </div>
                   </div>
                </div>
             </motion.div>
          )}
       </AnimatePresence>

      {/* Win/Loss Hologram */}
      <AnimatePresence>
        {winner && myPlayer && (
          <GameEndOverlay 
            isWin={winner.id === userId} 
            winnerName={winner.displayName} 
            stats={{ 
                energy: myPlayer.survivalPoints,
                health: myPlayer.health,
                round: payload?.round || 0
            }} 
          />
        )}
      </AnimatePresence>

      {/* Pile Viewer Modal (BUG 2 FIX) */}
      <AnimatePresence>
         {viewingPile && (
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 z-[4000] bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center p-8 overflow-y-auto pointer-events-auto"
               onClick={(e) => e.target === e.currentTarget && setViewingPile(null)}
            >
               <h2 className="text-3xl font-black italic tracking-tighter text-amber-500 uppercase mb-8 fe-glow-text">Pile Scanner</h2>
               <div className="flex flex-wrap gap-6 justify-center max-w-5xl">
                  {viewingPile.map(card => (
                     <div key={card.id} className="cursor-pointer hover:scale-105 transition-transform" onClick={() => { setViewingPile(null); setInspectedCard(card); setShowFullInspect(true); }}>
                        <PhysicalCard card={card} style={{ width: '12rem', height: '16rem' }} />
                     </div>
                  ))}
                  {viewingPile.length === 0 && (
                     <div className="text-white/40 fe-hologram text-sm uppercase tracking-widest border border-white/10 px-12 py-6 rounded-2xl bg-white/5">No Data In Pile</div>
                  )}
               </div>
               <button onClick={() => setViewingPile(null)} className="fe-holo-btn mt-12 !border-amber-500 !text-amber-500">Close Scanner</button>
            </motion.div>
         )}
      </AnimatePresence>

      {error && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-[5000] bg-red-500/20 border border-red-500 text-red-500 text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-full fe-flicker">
           System Failure: {error}
         </div>
      )}
    </main>
  );
}
