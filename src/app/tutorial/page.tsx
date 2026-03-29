'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { loadLocalSettings, setTutorialDone } from '@/lib/localProfile';
import { cardTheme, describeCardEffect, positionOpponents } from '@/lib/tabletopShared';
import TacticalDataPanel from '@/components/TacticalDataPanel';
import { InterstitialAd } from '@/components/InterstitialAd';

// Reuse the physical components from tabletop logic
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

type MatchPayload = {
  round: number;
  activePlayerIndex: number;
  players: MatchPlayer[];
  drawPile: MatchCard[];
  discardPile: MatchCard[];
  turnPile: MatchCard[];
  topCard?: MatchCard;
  isGlobalDisasterPhase: boolean;
  winnerId?: string;
  cardsPlayedThisTurn: number;
  hasDrawnThisTurn: boolean;
};

type TutorialStep = {
  id: number;
  title: string;
  description: string;
  expectedActionType: 'DRAW_CARD' | 'PLAY_CARD' | 'END_TURN' | 'SET_WINNER' | 'ACK';
  expectedCardId?: string;
};

type TutorialSession = {
  match: MatchPayload;
  stepIndex: number;
  completed: boolean;
};

/* --- Physical Components (Synced with Tabletop) --- */

function PhysicalCard({ card, onClick, isSelected, className, style }: { card: MatchCard; onClick?: () => void; isSelected?: boolean; className?: string; style?: any }) {
  const theme = cardTheme(card.type);
  return (
    <motion.div layoutId={card.id} onClick={onClick} style={style} className={`fe-card-physical ${isSelected ? 'border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.5)] z-[200]' : ''} ${className || ''}`}>
      {/* Background Graphic */}
      <img src={theme.bg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-screen pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-80 pointer-events-none" />
      
      {/* Tactical Glow */}
      <div className={`absolute -inset-1 rounded-2xl opacity-20 blur-xl ${theme.ring.replace('border-', 'bg-')}`} />

      <div className="relative z-10 flex flex-col h-full p-4 justify-between border border-white/10 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-2xl drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">{theme.icon}</span>
          <div className="flex flex-col items-end">
             <span className={`text-[10px] font-black uppercase tracking-widest ${theme.tint}`}>{card.type}</span>
             <div className="h-[2px] w-4 bg-white/20 mt-1" />
          </div>
        </div>

        <div className="text-center py-2">
            <h3 className="text-lg font-black uppercase tracking-tighter leading-none mb-1 text-white fe-flicker font-spectral italic">{card.name}</h3>
            <div className="fe-hologram text-[6px] text-white/30 tracking-[0.3em]">NEURAL_SIGNATURE_VERIFIED</div>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 pt-3">
           <div className="flex flex-col">
              <span className="text-[6px] text-white/40 uppercase tracking-widest">Efficiency</span>
              <span className="text-xs font-black text-white italic">{card.pointsDelta > 0 ? '+' : ''}{card.pointsDelta}</span>
           </div>
           <div className={`w-6 h-6 rounded-full border border-white/10 flex items-center justify-center ${theme.tint} text-[10px] font-black`}>
              {card.id.slice(-1).toUpperCase()}
           </div>
        </div>
      </div>
      
      {/* Holographic Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none fe-scanline opacity-10" />
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
           <div className="flex flex-col">
              <span className="text-[7px] font-black text-sky-400/60 uppercase tracking-widest">Energy</span>
              <div className="text-3xl font-black italic text-sky-400 fe-glow-text">{player.survivalPoints}</div>
           </div>
           <div className="flex flex-col items-end">
              <span className="text-[7px] font-black text-rose-500/60 uppercase tracking-widest">Health</span>
              <div className="text-3xl font-black italic text-rose-500 fe-glow-text">{player.health}</div>
           </div>
        </div>
    </div>
  );
}

function PlayPile({ cards }: { cards: MatchCard[] }) {
  return (
    <div className="relative w-48 h-64 [transform-style:preserve-3d]">
       <div className="absolute inset-0 bg-white/5 border border-white/10 rounded-2xl [transform:translateZ(-10px)]" />
       <AnimatePresence>
          {cards.map((card, i) => (
             <motion.div
               key={card.id}
               initial={{ opacity: 0, y: -200, rotateX: -90 }}
               animate={{ opacity: 1, y: 0, rotateX: 0, z: i * 2, rotate: (i - (cards.length-1)/2) * 5 }}
               style={{ transformStyle: 'preserve-3d' }}
               className="absolute inset-0"
             >
                <PhysicalCard card={card} className="w-full h-full shadow-2xl" />
             </motion.div>
          ))}
       </AnimatePresence>
    </div>
  );
}

function FloatingDeck({ count, canDraw, onDraw, highlighted }: { count: number; canDraw: boolean; onDraw: () => void; highlighted?: boolean }) {
  return (
    <div className={`relative group cursor-pointer transition-all ${highlighted ? 'ring-4 ring-sky-400 ring-offset-8 ring-offset-black rounded-xl' : ''}`} onClick={onDraw}>
       {[...Array(3)].map((_, i) => (
         <div key={i} className="absolute w-[7rem] h-[10rem] bg-slate-900 border border-white/10 rounded-xl" style={{ transform: `translateZ(${i * 2}px) translateY(-${i}px)` }} />
       ))}
       <motion.div whileHover={canDraw ? { y: -5 } : {}} className={`relative w-[7rem] h-[10rem] bg-indigo-950 border-2 border-white/20 rounded-xl flex items-center justify-center overflow-hidden ${!canDraw ? 'opacity-30' : ''}`}>
          <div className="fe-grid" />
          <div className="relative z-10 flex flex-col items-center gap-1">
             <div className="w-8 h-8 rounded-full border-2 border-white/10 flex items-center justify-center">
                <div className="w-2 h-2 bg-sky-400 rounded-full shadow-[0_0_10px_#38bdf8]" />
             </div>
             <span className="text-[8px] font-black tracking-[0.4em] opacity-40">DECK</span>
          </div>
       </motion.div>
    </div>
  );
}

function OpponentHand({ count, angle, player }: { count: number; angle: number; player: MatchPlayer }) {
  return (
    <div 
      className="absolute flex flex-col items-center justify-center pointer-events-none"
      style={{ transform: `rotate(${angle}deg) translateY(var(--opp-offset)) rotateX(-45deg)`, transformStyle: 'preserve-3d' }}
    >
       <div className="fe-hologram text-[10px] text-white/60 mb-8 flex items-center gap-2">
          <span>{player.emoji}</span>
          <span>{player.displayName}</span>
          <span className="text-sky-400 ml-2">[{player.survivalPoints}E]</span>
       </div>
       <div className="flex justify-center">
          {[...Array(Math.max(0, count))].map((_, i) => (
            <div key={i} className="w-16 h-24 bg-slate-900 border-2 border-white/10 rounded-xl shadow-2xl relative overflow-hidden" style={{ transform: `translateX(${(i - (count-1)/2) * 25}px) rotate(${(i - (count-1)/2) * 8}deg)` }}>
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e293b_0%,#020617_100%)]" />
               <div className="fe-grid opacity-30" />
               <div className="absolute inset-0 fe-scanline opacity-10" />
            </div>
          ))}
       </div>
    </div>
  );
}

export default function TutorialPage() {
  const router = useRouter();
  const [session, setSession] = useState<TutorialSession | null>(null);
  const [step, setStep] = useState<TutorialStep | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [selectedCardId, setSelectedCardId] = useState('');
  const [showPostGameAd, setShowPostGameAd] = useState(false);

  const local = useMemo(() => loadLocalSettings(), []);
  const payload = session?.match;
  const me = payload?.players.find(p => p.id === local.userId) ?? null;
  const isMyTurn = payload?.players[payload.activePlayerIndex]?.id === local.userId;
  const selectedCard = me?.hand.find(c => c.id === selectedCardId) ?? null;

  useEffect(() => {
    async function start() {
      setBusy(true);
      try {
        const res = await fetch('/api/tutorial/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: local.userId, displayName: local.displayName, emoji: local.emoji }),
        });
        const data = await res.json();
        setSession(data.session);
        setStep(data.step);
      } catch (e) { setError('Failed to initialize protocol.'); } finally { setBusy(false); }
    }
    start();
  }, [local]);

  async function runAction(action: any) {
    if (!session) return;
    setBusy(true);
    try {
      const res = await fetch('/api/tutorial/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session, action, actorUserId: local.userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSession(data.session);
      setStep(data.step);
      setSelectedCardId('');
      if (data.session.completed) setTutorialDone(true);
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }

  return (
    <main className="fe-scene bg-black">
      {/* Cinematic Environment */}
      <div className="absolute inset-0 z-0">
         <img src="/assets/type-bgs/survival.png" className="w-full h-full object-cover opacity-20 blur-2xl scale-110" alt="" />
         <div className="fe-vignette" />
         <div className="fe-scanline" />
      </div>

      {/* Holographic Tutorial Overlay */}
      <AnimatePresence>
        {step && !session?.completed && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -100, opacity: 0 }}
            className="absolute top-12 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-xl bg-sky-950/20 backdrop-blur-3xl border border-sky-400/30 rounded-3xl p-8 fe-flicker text-center"
          >
             <div className="fe-hologram text-[8px] text-sky-400 mb-2">Protocol Step 0{step.id}</div>
             <h2 className="text-2xl font-black italic tracking-tighter text-white mb-4 uppercase">{step.title}</h2>
             <p className="text-sky-100/60 leading-relaxed font-light mb-6">{step.description}</p>
             {step.expectedActionType === 'ACK' && (
                <button onClick={() => runAction({ type: 'ACK' })} className="fe-holo-btn !border-sky-400/50 !text-sky-400">Synchronize</button>
             )}
             {step.expectedActionType === 'SET_WINNER' && (
                <button onClick={() => runAction({ type: 'SET_WINNER', winnerUserId: local.userId })} className="fe-holo-btn !border-emerald-400/50 !text-emerald-400">Complete Simulation</button>
             )}
          </motion.div>
        )}
      </AnimatePresence>

       {/* The Physical Table */}
       <div className="fe-table">
           <div className="flex items-center gap-16 [transform:translateZ(100px)] absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
             <FloatingDeck count={payload?.drawPile.length ?? 0} canDraw={step?.expectedActionType === 'DRAW_CARD'} onDraw={() => runAction({ type: 'DRAW_CARD' })} highlighted={step?.expectedActionType === 'DRAW_CARD'} />
             <PlayPile cards={payload?.turnPile ?? []} />
          </div>
 
           {/* Opponents (Tutorial) */}
           {payload?.players.map((p, idx) => {
              if (p.id === local.userId) return null;
              return <OpponentHand key={p.id} count={p.hand.length} angle={180} player={p} />;
           })}
 
           {/* Turn Pips projection */}
           <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 flex gap-4">
              {[1, 2, 3].map(s => <div key={s} className={`w-3 h-3 rounded-full ${payload?.cardsPlayedThisTurn && payload.cardsPlayedThisTurn >= s ? 'bg-amber-500 shadow-[0_0_10px_#f59e0b]' : 'bg-white/5'}`} />)}
           </div>
       </div>

       {/* My HUD */}
       {me && (
         <div className="absolute bottom-24 left-12 z-[150] pointer-events-none">
            <PlayerStatsHUD player={me} isActive={isMyTurn} />
         </div>
       )}

       {/* Physical Hand */}
       {me && (
         <div className="absolute bottom-12 left-0 right-0 z-[100] flex justify-center px-12 h-[12rem] pointer-events-none">
            <div className="relative w-full max-w-4xl flex justify-center pointer-events-auto">
              <AnimatePresence>
                 {me.hand.map((card, i) => {
                   const isExpected = step?.expectedCardId === card.id;
                   const restricted = step?.expectedActionType === 'PLAY_CARD' && !isExpected;
                   return (
                     <motion.div
                       key={card.id}
                       initial={{ y: 200 }} animate={{ y: 0, x: (i - (me.hand.length-1)/2)*60, rotate: (i - (me.hand.length-1)/2)*4 }}
                       whileHover={!restricted ? { y: -40, scale: 1.1, zIndex: 1000 } : {}}
                       className={`absolute cursor-pointer ${restricted ? 'opacity-20 grayscale pointer-events-none shadow-none' : ''} ${step?.expectedActionType === 'PLAY_CARD' && isExpected ? 'ring-2 ring-amber-400 shadow-[0_0_20px_#f59e0b]' : ''} `}
                       onClick={() => setSelectedCardId(card.id)}
                     >
                        <PhysicalCard card={card} />
                     </motion.div>
                   );
                 })}
              </AnimatePresence>
            </div>
         </div>
       )}

      {/* Inspection / Play */}
      <AnimatePresence>
         {selectedCard && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[500] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-12">
               <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1.2 }} className="mb-12">
                  <PhysicalCard card={selectedCard} style={{ width: '14rem', height: '20rem' }} />
               </motion.div>

               <div className="flex flex-col items-center gap-10 w-full max-w-md">
                   <TacticalDataPanel data={describeCardEffect(selectedCard)} />
                   
                   <div className="flex gap-6">
                       <button onClick={() => setSelectedCardId('')} className="fe-holo-btn">Stow_Card</button>
                       {me && me.hand.length > 5 ? (
                          <button 
                            onClick={() => runAction({ type: 'DISCARD_CARD', cardId: selectedCard.id })} 
                            className="fe-holo-btn !text-rose-500 !border-rose-500/50"
                          >
                            Discard_Excess
                          </button>
                       ) : (
                          <button 
                            onClick={() => runAction({ type: 'PLAY_CARD', cardId: selectedCard.id })} 
                            className="fe-holo-btn !text-amber-500 !border-amber-500/50"
                          >
                            Deploy_Tactical
                          </button>
                       )}
                    </div>
               </div>
            </motion.div>
         )}
      </AnimatePresence>

      {/* HUD Pass (Only if expected) */}
      <AnimatePresence>
        {step?.expectedActionType === 'END_TURN' && (
          <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} onClick={() => runAction({ type: 'END_TURN' })} className="absolute bottom-[30%] right-[15%] fe-holo-btn !border-amber-500 !text-amber-500 ring-4 ring-amber-500/20">
            Terminate Control
          </motion.button>
        )}
      </AnimatePresence>

      {session?.completed && (
          <div className="absolute inset-0 z-[2000] bg-black/95 flex flex-col items-center justify-center p-12 text-center">
             <h2 className="text-6xl font-black italic tracking-tighter text-white mb-8 uppercase">Evaluation_Complete</h2>
             <p className="text-white/40 mb-12">Protocol synchronized. You are authorized for planetary deployment.</p>
             <button onClick={() => setShowPostGameAd(true)} className="fe-holo-btn !py-4 !px-12">Synchronize Neural Link</button>
             
             {showPostGameAd && (
                <InterstitialAd force onComplete={() => router.push('/lan')} />
             )}
          </div>
       )}

      {error && <div className="absolute top-8 right-8 z-[3000] text-rose-500 fe-hologram animate-pulse">{error}</div>}
    </main>
  );
}
