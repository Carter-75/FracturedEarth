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
  expectedActionType: 'DRAW_CARD' | 'PLAY_CARD' | 'DISCARD_CARD' | 'END_TURN' | 'SET_WINNER' | 'ACK';
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
    <motion.div onClick={onClick} style={style} className={`fe-card-physical ${isSelected ? 'border-[var(--accent)] shadow-[0_0_30px_rgba(var(--accent-rgb),0.5)] z-[200]' : ''} ${className || ''}`}>
      {/* Background Graphic */}
      <img src={theme.bg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-screen pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-80 pointer-events-none" />
      
      {/* Tactical Glow */}
      <div className={`absolute -inset-1 rounded-[var(--radius)] opacity-20 blur-xl ${theme.ring.replace('border-', 'bg-')}`} />

      <div className="relative z-10 flex flex-col h-full p-4 justify-between border border-white/10 rounded-[var(--radius)] overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-2xl drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">{theme.icon}</span>
          <div className="flex flex-col items-end">
             <span className={`text-[10px] font-black uppercase tracking-widest ${theme.tint}`}>{card.type}</span>
             <div className="h-[2px] w-4 bg-white/20 mt-1" />
          </div>
        </div>

        <div className="text-center py-2">
            <h3 className="text-lg font-black uppercase tracking-tighter leading-none mb-1 text-[var(--fg)] fe-flicker font-spectral italic">{card.name}</h3>
            <div className="fe-hologram text-[6px] text-[var(--fg)] opacity-30 tracking-[0.3em]">NEURAL_SIGNATURE_VERIFIED</div>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 pt-3">
           <div className="flex flex-col">
              <span className="text-[6px] text-[var(--fg)] opacity-40 uppercase tracking-widest">Efficiency</span>
              <span className="text-xs font-black text-[var(--fg)] italic">{card.pointsDelta > 0 ? '+' : ''}{card.pointsDelta}</span>
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
    <div className={`flex flex-col gap-2 p-6 rounded-[var(--radius)] bg-[var(--panel)] backdrop-blur-3xl border ${isActive ? 'border-[var(--accent)] shadow-[0_0_30px_rgba(var(--accent-rgb),0.2)]' : 'border-[var(--border)]'} w-48`}>
        <div className="flex items-center gap-3">
           <div className="text-2xl">{player.emoji}</div>
           <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--fg)] opacity-40">{player.displayName}</span>
              <div className={`h-[2px] ${isActive ? 'bg-[var(--accent)] shadow-[0_0_10px_var(--glow-color)]' : 'bg-[var(--border)]'} w-8 mt-1`} />
           </div>
        </div>
        <div className="flex justify-between items-end mt-4">
           {/* ADDED: Bug 3 Hand Count */}
           <div className="flex flex-col">
              <span className="text-[7px] font-black text-[var(--fg)] opacity-50 uppercase tracking-widest">Cards</span>
              <div className="text-3xl font-black italic text-[var(--fg)] opacity-80 fe-glow-text">{player.hand.length}</div>
           </div>
           <div className="flex flex-col items-center">
              <span className="text-[7px] font-black text-[var(--accent-soft)] opacity-60 uppercase tracking-widest">Energy</span>
              <div className="text-3xl font-black italic text-[var(--accent-soft)] fe-glow-text">{player.survivalPoints}</div>
           </div>
           <div className="flex flex-col items-end">
              <span className="text-[7px] font-black text-rose-500 opacity-60 uppercase tracking-widest">Health</span>
              <div className="text-3xl font-black italic text-rose-500 fe-glow-text">{player.health}</div>
           </div>
        </div>

       {/* Opponent Pinned Powers */}
       {player.powers && player.powers.length > 0 && (
          <div className="absolute top-full mt-4 flex justify-center gap-2 [transform-style:preserve-3d]">
             {player.powers.map((card, i) => (
                <div key={card.id} className="relative w-16 h-24 bg-[var(--bg)] rounded-lg border border-[var(--accent)]/30 overflow-hidden shadow-[0_4px_10px_rgba(var(--accent-rgb),0.2)]" style={{ transform: `translateZ(10px)` }}>
                   <div className="absolute inset-0 bg-[var(--accent)]/10" />
                   <div className="fe-hologram text-[6px] text-[var(--accent)] opacity-80 p-1 text-center font-bold absolute bottom-0 w-full bg-black/50">{card.name}</div>
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
    </div>
  );
}

function FloatingDeck({ count, canDraw, onDraw, highlighted }: { count: number; canDraw: boolean; onDraw: () => void; highlighted?: boolean }) {
  return (
    <div 
      className={`relative group cursor-pointer transition-all ${highlighted ? 'ring-4 ring-[var(--accent-soft)] ring-offset-8 ring-offset-black rounded-[var(--radius)]' : ''}`} 
      onClick={onDraw}
      style={{ width: 'var(--card-w)', height: 'var(--card-h)' }}
    >
       {[...Array(3)].map((_, i) => (
         <div key={i} className="absolute inset-0 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius)]" style={{ transform: `translateZ(${i * 2}px) translateY(-${i}px)` }} />
       ))}
       <motion.div whileHover={canDraw ? { y: -5 } : {}} className={`absolute inset-0 bg-[var(--panel-alt)] border-2 border-[var(--border)] rounded-[var(--radius)] flex items-center justify-center overflow-hidden ${!canDraw ? 'opacity-30' : ''}`}>
          <div className="fe-grid" />
          <div className="relative z-10 flex flex-col items-center gap-1">
             <div className="w-8 h-8 rounded-full border-2 border-white/10 flex items-center justify-center">
                <div className="w-2 h-2 bg-[var(--accent-soft)] rounded-full shadow-[0_0_10px_var(--accent-soft)]" />
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
      className="absolute flex items-end justify-center gap-8 pointer-events-none"
      style={{ 
        transform: `rotate(${angle}deg) translateY(var(--opp-offset)) rotateX(-45deg)`,
        transformStyle: 'preserve-3d'
      }}
    >
       {/* Opponent Cards */}
       <div className="absolute left-1/2 top-0 -translate-x-1/2 flex justify-center [transform-style:preserve-3d] w-0">
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
               className="bg-[var(--bg)] border-2 border-[var(--border)] rounded-[var(--radius)] shadow-2xl overflow-hidden -top-full -translate-y-1/2"
             >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,var(--panel-alt)_0%,var(--bg)_100%)]" />
                <div className="fe-grid opacity-30" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-6 h-6 rounded-full border border-white/5 flex items-center justify-center opacity-20">
                      <div className="w-1.5 h-1.5 bg-[var(--accent-soft)] rounded-full" />
                   </div>
                </div>
                <div className="absolute bottom-1 left-0 right-0 text-center opacity-10">
                   <span className="text-[4px] fe-hologram tracking-widest text-[var(--accent-soft)]">FRACTURED_EARTH</span>
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
  const isDrawPending = isMyTurn && payload && !payload.hasDrawnThisTurn;
  const selectedCard = me?.hand.find(c => c.id === selectedCardId) ?? null;

  // Bug 9: Error Dismissal
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

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
            className="absolute top-12 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-xl bg-[var(--panel)] backdrop-blur-3xl border border-[var(--accent-soft)]/30 rounded-[var(--radius)] p-8 fe-flicker text-center"
          >
             <div className="fe-hologram text-[8px] text-[var(--accent-soft)] mb-2">Protocol Step 0{step.id}</div>
             <h2 className="text-2xl font-black italic tracking-tighter text-[var(--fg)] mb-4 uppercase">{step.title}</h2>
             <p className="text-[var(--fg)] opacity-70 leading-relaxed font-light mb-6">{step.description}</p>
             {step.expectedActionType === 'ACK' && (
                <button onClick={() => runAction({ type: 'ACK' })} className="fe-holo-btn !border-[var(--accent-soft)]/50 !text-[var(--accent-soft)]">Synchronize</button>
             )}
             {step.expectedActionType === 'SET_WINNER' && (
                <button onClick={() => runAction({ type: 'SET_WINNER', winnerUserId: local.userId })} className="fe-holo-btn !border-emerald-400/50 !text-emerald-400">Complete Simulation</button>
             )}
          </motion.div>
        )}
      </AnimatePresence>

       {/* The Physical Table */}
       <div className="fe-table">
           <div className="flex flex-col items-center gap-4 [transform:translateZ(100px)] absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
             <PlayPile cards={payload?.turnPile ?? []} />
             <FloatingDeck count={payload?.drawPile.length ?? 0} canDraw={step?.expectedActionType === 'DRAW_CARD'} onDraw={() => runAction({ type: 'DRAW_CARD' })} highlighted={step?.expectedActionType === 'DRAW_CARD'} />
          </div>
 
           {/* Opponents (Tutorial) */}
           {payload?.players.map((p, idx) => {
              if (p.id === local.userId) return null;
              return <OpponentHand key={p.id} count={p.hand.length} angle={180} player={p} />;
           })}
       </div>

       {/* My HUD */}
       {/* Cinematic Player Area (HUD + Hand physically adjacent) */}
      {me && (
        <div className="absolute bottom-6 md:bottom-12 left-0 right-0 z-[200] flex flex-col md:flex-row items-center md:items-end justify-center gap-6 md:gap-16 pointer-events-none px-4">
           {/* HUD physically next to Hand */}
           <div className="pointer-events-auto shrink-0 transform scale-75 md:scale-100 origin-bottom">
              <PlayerStatsHUD player={me} isActive={isMyTurn} />
           </div>

           {/* Hand */}
           <div className="relative h-[var(--card-h)] flex justify-center pointer-events-auto w-full max-w-2xl shrink-0">
              <AnimatePresence>
                 {me.hand.map((card, i) => {
                   const isExpected = step?.expectedCardId === card.id || (step?.expectedActionType === 'DISCARD_CARD');
                   const restricted = step?.expectedActionType === 'PLAY_CARD' && !isExpected;
                   const visualDisabled = isDrawPending || restricted;
                   return (
                     <motion.div
                       key={card.id}
                       initial={{ y: 200, opacity: 0 }}
                       animate={{ 
                         y: 0, opacity: 1, 
                         rotate: (i - (me.hand.length-1)/2) * 4,
                         x: `calc(${(i - (me.hand.length-1)/2)} * var(--hand-spread))`
                       }}
                       whileHover={visualDisabled ? {} : { y: -40, rotate: 0, scale: 1.1, zIndex: 1000 }}
                       className={`absolute origin-bottom ${visualDisabled ? 'opacity-40 grayscale pointer-events-none cursor-not-allowed' : 'cursor-pointer'}`}
                       onClick={() => !visualDisabled && setSelectedCardId(card.id)}
                     >
                        <PhysicalCard card={card} isSelected={selectedCardId === card.id} />
                     </motion.div>
                   );
                 })}
              </AnimatePresence>
           </div>
        </div>
      )}

      {/* Pinned Powers Layer */}
      {me && me.powers && me.powers.length > 0 && (
         <div className="absolute bottom-40 md:bottom-24 left-1/2 -translate-x-1/2 flex gap-4 pointer-events-auto items-end z-[150]">
            {me.powers.map((card, i) => (
               <motion.div 
                 key={card.id} 
                 initial={{ y: 50, opacity: 0 }} 
                 animate={{ y: 0, opacity: 1 }} 
                 whileHover={{ y: -20, zIndex: 300, scale: 1.1 }}
                 className="relative w-20 h-28 bg-[var(--bg)] border-2 border-[var(--accent)]/50 rounded-xl overflow-hidden cursor-pointer shadow-[0_10px_20px_rgba(var(--accent-rgb),0.2)]"
               >
                  <img src={cardTheme(card.type).bg} className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-screen" alt="" />
                  <div className="absolute bottom-0 w-full bg-black/80 p-1 text-center">
                     <span className="fe-hologram text-[6px] text-[var(--accent)] font-bold block">{card.name}</span>
                  </div>
               </motion.div>
            ))}
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
                            className="fe-holo-btn !text-[var(--accent-soft)] !border-[var(--accent-soft)]/50"
                          >
                            Discard_Excess
                          </button>
                       ) : (
                          <button 
                            onClick={() => runAction({ type: 'PLAY_CARD', cardId: selectedCard.id })} 
                            className="fe-holo-btn !text-[var(--accent)] !border-[var(--accent)]/50"
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
          <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} onClick={() => runAction({ type: 'END_TURN' })} className="absolute bottom-[30%] right-[15%] fe-holo-btn !border-[var(--accent)] !text-[var(--accent)] ring-4 ring-[var(--accent)]/20">
            Terminate Control
          </motion.button>
        )}
      </AnimatePresence>

      {session?.completed && (
          <div className="absolute inset-0 z-[2000] bg-[var(--bg)]/95 flex flex-col items-center justify-center p-12 text-center">
             <h2 className="text-6xl font-black italic tracking-tighter text-[var(--fg)] mb-8 uppercase">Evaluation_Complete</h2>
             <p className="text-[var(--fg)] opacity-40 mb-12">Protocol synchronized. You are authorized for planetary deployment.</p>
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
