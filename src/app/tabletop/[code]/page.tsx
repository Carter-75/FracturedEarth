'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import React from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from 'framer-motion';
import {
  appendMatchOutcome,
  clearRoomPin,
  loadLocalSettings,
  saveRoomPin,
  type LocalMatchOutcome,
} from '@/lib/localProfile';
import { cardTheme, describeCardEffect, positionOpponents } from '@/lib/tabletopShared';
import { InterstitialAd } from '@/components/InterstitialAd';
import TacticalDataPanel from '@/components/TacticalDataPanel';

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
};

/* --- Physical Scene Components --- */

function PhysicalCard({ card, onClick, isSelected, className, style }: { card: MatchCard; onClick?: () => void; isSelected?: boolean; className?: string; style?: any }) {
  const theme = cardTheme(card.type);
  return (
    <motion.div
      onClick={onClick}
      style={style}
      className={`fe-card-physical ${isSelected ? 'border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.5)] z-[200]' : ''} ${className || ''}`}
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
                    <span className="text-[8px] font-bold text-sky-400">+{card.gainHealth}H</span>
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
    <div className={`flex flex-col gap-2 p-6 rounded-[2rem] bg-black/40 backdrop-blur-3xl border ${isActive ? 'border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.2)]' : 'border-white/10'} w-48`}>
        <div className="flex items-center gap-3">
           <div className="text-2xl">{player.emoji}</div>
           <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{player.displayName}</span>
              <div className={`h-[2px] ${isActive ? 'bg-amber-500 shadow-[0_0_10px_#f59e0b]' : 'bg-white/10'} w-8 mt-1`} />
           </div>
        </div>
        <div className="flex justify-between items-end mt-4">
           {/* ADDED: Bug 3 Hand Count */}
           <div className="flex flex-col">
              <span className="text-[7px] font-black text-white/50 uppercase tracking-widest">Cards</span>
              <div className="text-3xl font-black italic text-white/80 fe-glow-text">{player.hand.length}</div>
           </div>
           <div className="flex flex-col items-center">
              <span className="text-[7px] font-black text-sky-400/60 uppercase tracking-widest">Energy</span>
              <div className="text-3xl font-black italic text-sky-400 fe-glow-text">{player.survivalPoints}</div>
           </div>
           <div className="flex flex-col items-end">
              <span className="text-[7px] font-black text-rose-500/60 uppercase tracking-widest">Health</span>
              <div className="text-3xl font-black italic text-rose-500 fe-glow-text">{player.health}</div>
           </div>
        </div>

       {/* Opponent Pinned Powers */}
       {player.powers && player.powers.length > 0 && (
          <div className="absolute top-full mt-4 flex justify-center gap-2 [transform-style:preserve-3d]">
             {player.powers.map((card, i) => (
                <div key={card.id} className="relative w-16 h-24 bg-slate-800 rounded-lg border border-amber-500/30 overflow-hidden shadow-[0_4px_10px_rgba(245,158,11,0.2)]" style={{ transform: `translateZ(10px)` }}>
                   <div className="absolute inset-0 bg-amber-500/10" />
                   <div className="fe-hologram text-[6px] text-amber-500/80 p-1 text-center font-bold absolute bottom-0 w-full bg-black/50">{card.name}</div>
                </div>
             ))}
          </div>
       )}
    </div>
  );
}

function PlayPile({ cards }: { cards: MatchCard[] }) {
  return (
    <div 
      className="relative [transform-style:preserve-3d]" 
      style={{ width: 'var(--card-w)', height: 'var(--card-h)' }}
    >
       {/* 3D Box Container */}
       <div className="absolute inset-0 bg-white/5 border border-white/10 rounded-2xl [transform:translateZ(-10px)]" />
       
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

function OpponentHand({ count, angle, player }: { count: number; angle: number; player: MatchPlayer }) {
  return (
    <div 
      className="absolute flex items-end justify-center gap-8 pointer-events-none"
      style={{ 
        transform: `rotate(${angle}deg) translateY(var(--opp-offset)) rotateX(-45deg)`,
        transformStyle: 'preserve-3d'
      }}
    >
       {/* Opponent Cards */}
       <div className="relative flex justify-center [transform-style:preserve-3d] w-0">
          {[...Array(Math.max(0, count))].map((_, i) => (
             <motion.div
               key={i}
               style={{ 
                 width: 'calc(var(--card-w) * 0.7)',
                 height: 'calc(var(--card-h) * 0.7)',
                 transform: `translateX(calc(${(i - (count-1)/2)} * (var(--card-w) * 0.3))) rotate(${(i - (count-1)/2) * 8}deg)`,
                 transformOrigin: 'bottom center',
                 transformStyle: 'preserve-3d',
                 position: 'absolute'
               }}
               className="bg-slate-900 border-2 border-white/10 rounded-xl shadow-2xl overflow-hidden -top-full -translate-y-1/2"
             >
                {/* High-Fidelity Card Back */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e293b_0%,#020617_100%)]" />
                <div className="fe-grid opacity-30" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center opacity-20">
                      <div className="w-2 h-2 bg-sky-400 rounded-full" />
                   </div>
                </div>
                <div className="absolute bottom-2 left-0 right-0 text-center opacity-10">
                   <span className="text-[4px] fe-hologram tracking-widest">FRACTURED_EARTH</span>
                </div>
                <div className="absolute inset-0 fe-scanline opacity-10" />
             </motion.div>
           ))}
        </div>

       {/* Opponent Stats Physically Next to Cards (Bug 3 fixed to mirror Player UI) */}
       <div className="fe-hologram flex flex-col pointer-events-auto" style={{ transform: 'translateZ(20px) translateX(calc(var(--card-w) * 1.5))', minWidth: '200px' }}>
          <PlayerStatsHUD player={player} isActive={false} />
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
         className={`absolute inset-0 bg-indigo-950 border-2 border-white/20 rounded-xl flex items-center justify-center overflow-hidden ${!canDraw ? 'opacity-30' : ''}`}
       >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1e1b4b_0%,#020617_100%)]" />
          <div className="fe-grid" />
          <div className="relative z-10 flex flex-col items-center gap-2">
             <div className="w-10 h-10 rounded-full border-2 border-white/10 flex items-center justify-center">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 10, ease: 'linear' }} className="absolute inset-0 rounded-full border-t-2 border-sky-400" />
                <div className="w-2 h-2 bg-sky-400 rounded-full shadow-[0_0_10px_#38bdf8]" />
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
  const params = useParams<{ code: string }>();
  const search = useSearchParams();
  const code = String(params.code || '').trim().toUpperCase();
  const userFromQuery = String(search.get('userId') ?? '').trim();
  
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
  const router = useRouter();

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
    const res = await fetch(`/api/rooms/${code}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action, expectedRevision }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Action failed');
    return data as StateEnvelope;
  }, [code, userId]);

  useEffect(() => {
    async function sync() {
      try {
        const res = await fetch(`/api/rooms/${code}/state`, { cache: 'no-store' });
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
        await fetch(`/api/rooms/${code}/heartbeat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
      } catch (e) { console.error('Heartbeat failed', e); }
    };
    ping();
    const interval = setInterval(ping, 10000);
    return () => clearInterval(interval);
  }, [code, userId]);

  // Bug 9: Error Dismissal
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

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
    }, 1500);
    return () => clearTimeout(timer);
  }, [replayQueue]);

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
       <main className="fe-scene bg-black flex-1 flex items-center justify-center">
         <div className="fe-hologram animate-pulse text-sky-400 text-xl tracking-[0.5em] fe-flicker">SYNCING_SECTOR_STATE...</div>
       </main>
     );
  }

  return (
    <main className="fe-scene bg-black flex-1">
      {/* Bot Turn Replay Toast */}
      <AnimatePresence>
        {replayEvent && (
           <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="absolute top-24 left-1/2 -translate-x-1/2 z-[2000] bg-indigo-900/60 backdrop-blur-xl border border-indigo-400 px-8 py-4 rounded-full shadow-[0_0_30px_rgba(99,102,241,0.5)] whitespace-nowrap">
              <span className="text-white font-black italic tracking-widest uppercase text-sm">
                 <span className="text-sky-400">{replayEvent.actorName}</span> 
                 {replayEvent.action === 'DRAW' && ' Draws A Card...'}
                 {replayEvent.action === 'END_TURN' && ' Ends Turn.'}
                 {replayEvent.action === 'PLAY' && ` Deploys ${replayEvent.cardName}`}
              </span>
           </motion.div>
        )}
      </AnimatePresence>

      {/* Event Effects */}
      <AnimatePresence>
        {payload?.isGlobalDisasterPhase && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[1000] pointer-events-none bg-rose-900/20 backdrop-invert-[0.1]">
             <div className="absolute inset-0 fe-scanline opacity-20 bg-rose-500/10" />
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-rose-500 fe-hologram text-4xl fe-flicker">CATACLYSM_ACTIVE</div>
          </motion.div>
        )}
        {payload && payload.round % 3 === 0 && !payload.isGlobalDisasterPhase && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, scale: [1, 1.05, 1] }} transition={{ duration: 5, repeat: Infinity }} className="absolute inset-0 z-[1000] pointer-events-none bg-sky-900/10 mix-blend-screen">
             <div className="absolute inset-0 fe-scanline opacity-10 bg-sky-500/5 rotate-90" />
             <div className="absolute bottom-12 right-12 text-sky-400 fe-hologram text-sm fe-flicker">AETHER_SHIFT_IN_PROGRESS</div>
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

      {/* Cool Holographic Header (Restored & Enhanced) */}
      <div className="absolute top-12 left-12 z-[100] pointer-events-none">
         <div className="flex flex-col gap-1">
            <div className="flex items-center gap-4">
               <h1 className="text-3xl font-black italic tracking-tighter text-white fe-glow-text">
                  FRACTURED<span className="text-amber-500">EARTH</span>
               </h1>
               <div className="w-[1px] h-6 bg-white/20" />
               <div className="fe-hologram text-[10px] text-white/40 uppercase tracking-[0.2em] fe-flicker">SECTOR_{code}</div>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-12 h-[2px] bg-gradient-to-r from-amber-500/0 via-amber-500/50 to-amber-500/0" />
               <div className="fe-hologram text-[8px] text-amber-500/60 font-bold uppercase tracking-widest">CYCLE_{payload?.round || 0}_LOGGED</div>
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
                <OpponentHand key={p.id} count={p.hand.length} angle={angle} player={p} />
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
            className="absolute bottom-[35%] md:bottom-[28%] right-[5%] md:right-[20%] z-[1500] fe-holo-btn !py-5 !px-10 !text-xl !border-amber-500 !text-amber-500 bg-black/50 shadow-[0_0_50px_rgba(245,158,11,0.2)]"
          >
            Pass Control
          </motion.button>
        )}
      </AnimatePresence>

      {/* Cinematic Player Area (HUD + Hand physically adjacent) */}
      {myPlayer && (
        <div className="absolute bottom-6 md:bottom-12 left-0 right-0 z-[200] flex flex-col md:flex-row items-center md:items-end justify-center gap-6 md:gap-16 pointer-events-none px-4">
           {/* HUD physically next to Hand */}
           <div className="pointer-events-auto shrink-0 transform scale-75 md:scale-100 origin-bottom">
              <PlayerStatsHUD player={myPlayer} isActive={isMyTurn} />
           </div>

           {/* Hand */}
           <div className="relative h-[var(--card-h)] flex justify-center pointer-events-auto w-full max-w-2xl shrink-0">
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
                       x: `calc(${(i - (myPlayer.hand.length-1)/2)} * var(--hand-spread))`
                     }}
                     whileHover={isDrawPending ? {} : { y: -40, rotate: 0, scale: 1.1, zIndex: 1000 }}
                     className={`absolute origin-bottom ${isDrawPending ? 'opacity-40 grayscale pointer-events-none cursor-not-allowed' : 'cursor-pointer'}`}
                     onClick={() => !isDrawPending && setSelectedCardId(card.id)}
                   >
                      <PhysicalCard card={card} />
                   </motion.div>
                 ))}
              </AnimatePresence>
           </div>
        </div>
      )}

      {/* Pinned Powers Layer */}
      {myPlayer && myPlayer.powers && myPlayer.powers.length > 0 && (
         <div className="absolute bottom-40 md:bottom-24 left-1/2 -translate-x-1/2 flex gap-4 pointer-events-auto items-end z-[150]">
            {myPlayer.powers.map((card, i) => (
               <motion.div 
                 key={card.id} 
                 initial={{ y: 50, opacity: 0 }} 
                 animate={{ y: 0, opacity: 1 }} 
                 whileHover={{ y: -20, zIndex: 300, scale: 1.1 }}
                 className="relative w-20 h-28 bg-slate-900 border-2 border-amber-500/50 rounded-xl overflow-hidden cursor-pointer shadow-[0_10px_20px_rgba(245,158,11,0.2)]"
                 onClick={() => { setInspectedCard(card); setShowFullInspect(true); }}
               >
                  <img src={cardTheme(card.type).bg} className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-screen" alt="" />
                  <div className="absolute bottom-0 w-full bg-black/80 p-1 text-center">
                     <span className="fe-hologram text-[6px] text-amber-400 font-bold block">{card.name}</span>
                  </div>
               </motion.div>
            ))}
         </div>
      )}

      {/* Cinematic Inspection Layer */}
      <AnimatePresence>
         {(selectedCard || (showFullInspect && inspectedCard)) && (
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 z-[500] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-12"
               onClick={(e) => e.target === e.currentTarget && (setSelectedCardId(''), setShowFullInspect(false))}
            >
               <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1.2 }} className="mb-12">
                  <PhysicalCard card={selectedCard || inspectedCard!} style={{ width: '14rem', height: '20rem' }} />
               </motion.div>

               <div className="flex flex-col items-center gap-8 w-full max-w-md">
                   <TacticalDataPanel data={describeCardEffect(selectedCard || inspectedCard!)} />
                   
                   <div className="flex flex-col gap-4 w-full">
                      {selectedCard && selectedCard.type === 'DISASTER' && selectedCard.disasterKind !== 'GLOBAL' && payload && (
                         <div className="flex gap-2 flex-wrap justify-center border-b border-white/10 pb-4 mb-2">
                           {payload.players.filter(p => p.id !== userId).map(p => (
                              <button 
                                key={p.id} 
                                onClick={() => setSelectedTargetId(p.id)} 
                                className={`fe-holo-btn !py-2 !px-4 !text-xs ${selectedTargetId === p.id ? '!border-rose-500 !text-rose-500 !bg-rose-500/10' : ''}`}
                              >
                                Target {p.displayName}
                              </button>
                           ))}
                         </div>
                      )}
                      
                      <div className="flex gap-4 justify-center">
                         {selectedCard && (
                            <>
                               <button onClick={() => { setSelectedCardId(''); setSelectedTargetId(''); }} className="fe-holo-btn">Stow_Card</button>
                               <button 
                                 onClick={handlePlay} 
                                 disabled={busy || maxPlayReached || (selectedCard.type === 'DISASTER' && selectedCard.disasterKind !== 'GLOBAL' && !selectedTargetId)} 
                                 className="fe-holo-btn !text-amber-500 !border-amber-500/50 disabled:!opacity-30 disabled:!cursor-not-allowed"
                               >
                                 Deploy_Tactical
                               </button>
                               <button 
                                 onClick={handleDiscard} 
                                 disabled={busy} 
                                 className="fe-holo-btn !text-rose-500 !border-rose-500/50"
                               >
                                 Discard_Data
                               </button>
                            </>
                         )}
                         {inspectedCard && !selectedCard && (
                            <button onClick={() => { setInspectedCard(null); setShowFullInspect(false); }} className="fe-holo-btn">Dismiss_Intel</button>
                         )}
                      </div>
                   </div>
               </div>
            </motion.div>
         )}
      </AnimatePresence>

      {/* Win/Loss Hologram */}
      <AnimatePresence>
        {winner && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[1000] bg-black/95 backdrop-blur-3xl flex items-center justify-center">
              <div className="text-center">
                <p className="fe-hologram text-amber-500/60 mb-8 uppercase tracking-[0.4em]">Simulation Ended</p>
                <h2 className="text-9xl font-black italic tracking-tighter text-white uppercase">{winner?.id === userId ? 'ASCENDED' : 'FALLEN'}</h2>
                <div className="mt-4 fe-hologram text-[10px] text-white/40 uppercase tracking-widest">
                   Commander {winner?.displayName} Claims the Sector
                </div>
                
                 <div className="mt-20 flex gap-6">
                    <button 
                      onClick={() => setShowPostGameAd(true)} 
                      className="fe-holo-btn !border-sky-400 !text-sky-400"
                    >
                       Evacuate Sector (Interstellar Protocol)
                    </button>
                 </div>

                 {showPostGameAd && (
                    <InterstitialAd force onComplete={() => router.push('/lan')} />
                 )}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-[2000] bg-red-500/20 border border-red-500 text-red-500 text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-full fe-flicker">
           System Failure: {error}
         </div>
      )}
    </main>
  );
}
