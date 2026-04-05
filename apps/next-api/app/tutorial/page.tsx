'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { loadLocalSettings, setTutorialDone } from '@/lib/localProfile';
import { MatchCard, MatchPlayer, cardTheme } from '@/lib/tabletopShared';
import PhysicalCard from '@/components/PhysicalCard';
import TacticalDataPanel from '@/components/TacticalDataPanel';
import { InterstitialAd } from '@/components/InterstitialAd';

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

/* --- Physical UI Components (Shared with Tabletop) --- */

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

       {player.powers && player.powers.length > 0 && (
          <div className="absolute top-full mt-4 flex justify-center gap-2 [transform-style:preserve-3d]">
             {player.powers.map((card) => (
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

       <div className="fe-hologram flex flex-col pointer-events-auto" style={{ transform: 'translateZ(20px) translateX(calc(var(--card-w) * 1.5))', minWidth: '200px' }}>
          <PlayerStatsHUD player={player} isActive={false} />
       </div>
    </div>
  );
}

// --- MAIN TUTORIAL PAGE ---

export default function TutorialPage() {
  const router = useRouter();
  const [session, setSession] = useState<TutorialSession | null>(null);
  const [step, setStep] = useState<TutorialStep | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [showAd, setShowAd] = useState(false);

  const local = useMemo(() => loadLocalSettings(), []);

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
        if (!res.ok) throw new Error(data.error);
        setSession(data.session);
        setStep(data.step);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setBusy(false);
      }
    }
    start();
  }, [local]);

  const payload = session?.match;
  const activePlayer = payload?.players[payload.activePlayerIndex];
  const isMyTurn = activePlayer?.id === local.userId;
  const opponents = payload?.players.filter(p => p.id !== local.userId) || [];
  const myPlayer = payload?.players.find(p => p.id === local.userId);
  const selectedCard = myPlayer?.hand.find(c => c.id === selectedCardId);

  async function performAction(action: any) {
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
      setSelectedCardId(null);
      setSelectedTargetId(null);
      
      if (data.session.completed) {
        setTutorialDone(true);
        setShowAd(true);
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (!session || !payload) {
    return (
      <div className="fe-scene flex flex-col items-center justify-center">
         <div className="fe-hologram animate-pulse text-[var(--accent)] text-xl">BOOTING_TUTORIAL_PROTOCOL...</div>
      </div>
    );
  }

  return (
    <main className="fe-scene overflow-hidden relative cursor-crosshair">
      <div className="fe-vignette z-10" />
      <div className="fe-grid opacity-20 pointer-events-none" />

      {/* TOP HEADER */}
      <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-start z-50">
          <div className="flex flex-col">
             <div className="text-[10px] font-black uppercase tracking-[0.5em] text-[var(--accent)] opacity-60">Training_Sim_01</div>
             <h1 className="text-4xl font-black italic tracking-tighter text-[var(--fg)] fe-flicker uppercase">NEURAL_INITIATION</h1>
          </div>
          <div className="flex gap-4">
             <button onClick={() => router.push('/')} className="fe-holo-btn !py-2 !px-4 text-xs opacity-50 hover:opacity-100">Abort Sim</button>
          </div>
      </div>

      {/* TUTORIAL INSTRUCTION PANEL (TOP LEFT) */}
      <div className="absolute top-24 left-8 z-50 w-80">
          <AnimatePresence mode="wait">
            {step && (
               <motion.div 
                 key={step.id}
                 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                 className="p-6 rounded-[var(--radius)] bg-[var(--panel)] border border-[var(--accent)]/30 backdrop-blur-3xl"
               >
                  <div className="flex items-center gap-3 mb-2">
                     <div className="w-2 h-2 rounded-full bg-[var(--accent)] shadow-[0_0_10px_var(--accent)]" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)]">Tutorial Step {step.id}</span>
                  </div>
                  <h2 className="text-xl font-black italic tracking-tighter uppercase mb-3 leading-none text-[var(--fg)]">{step.title}</h2>
                  <p className="text-xs text-[var(--fg)] opacity-60 leading-relaxed tracking-tight">{step.description}</p>
               </motion.div>
            )}
            {session.completed && (
               <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-8 rounded-[var(--radius)] bg-[var(--accent)]/10 border-2 border-[var(--accent)] backdrop-blur-3xl text-center">
                  <h2 className="text-2xl font-black italic uppercase text-[var(--accent)] fe-glow-text mb-4">Training Complete</h2>
                  <Link href="/" className="fe-holo-btn !bg-[var(--accent)] !text-black">Return to Command</Link>
               </motion.div>
            )}
          </AnimatePresence>
      </div>

      {/* ARENA 3D SPACE */}
      <div className="absolute inset-0 flex items-center justify-center [perspective:2000px]">
          <div className="relative w-full h-full [transform-style:preserve-3d]">
              
              {opponents.map((opp, i) => (
                 <OpponentHand key={opp.id} player={opp} count={opp.hand.length} angle={180} />
              ))}

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 [transform:rotateX(60deg) translateZ(0)]">
                  <PlayPile cards={payload.turnPile || []} />
              </div>

              <div className="absolute top-1/2 left-[15%] -translate-y-1/2 [transform:rotateX(60deg) translateZ(20px)]">
                  <FloatingDeck 
                    count={payload.drawPile.length} 
                    canDraw={isMyTurn && payload.cardsPlayedThisTurn === 0} 
                    onDraw={() => isMyTurn && performAction({ type: 'DRAW_CARD' })} 
                    highlighted={step?.expectedActionType === 'DRAW_CARD'}
                  />
              </div>
          </div>
      </div>

      {/* PLAYER HUD & HAND (BOTTOM) */}
      <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col items-center pointer-events-none z-50">
          
          <div className="mb-8 flex flex-col items-center">
             {isMyTurn && step?.expectedActionType === 'END_TURN' && (
                <motion.button 
                  animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity }}
                  onClick={() => performAction({ type: 'END_TURN' })}
                  className="fe-holo-btn pointer-events-auto !py-2 !px-8 text-xs !border-[var(--accent)] !text-[var(--accent)]"
                >
                  End Turn
                </motion.button>
             )}
          </div>

          <div className="w-full max-w-6xl flex items-end justify-between gap-12">
              <div className="pointer-events-auto">
                 {myPlayer && <PlayerStatsHUD player={myPlayer} isActive={isMyTurn} />}
              </div>

              <div className="flex-1 flex justify-center [perspective:1000px] h-[300px] pointer-events-auto">
                  <div className="relative w-full max-w-2xl flex justify-center items-end h-full">
                     {myPlayer?.hand.map((card, i) => {
                        const angle = (i - (myPlayer.hand.length-1)/2) * 10;
                        const x = (i - (myPlayer.hand.length-1)/2) * 80;
                        const y = Math.abs(i - (myPlayer.hand.length-1)/2) * 5;
                        
                        return (
                           <motion.div
                              key={card.id}
                              animate={{ 
                                y: selectedCardId === card.id ? -100 : y,
                                x,
                                rotate: angle,
                                zIndex: selectedCardId === card.id ? 100 : i
                              }}
                              whileHover={{ y: selectedCardId === card.id ? -100 : -20, scale: 1.05 }}
                              className={`absolute bottom-0 cursor-pointer origin-bottom ${step?.expectedCardId === card.id ? 'ring-4 ring-yellow-400 ring-offset-4 ring-offset-black rounded-[var(--radius)]' : ''}`}
                              onClick={() => setSelectedCardId(selectedCardId === card.id ? null : card.id)}
                           >
                              <PhysicalCard card={card} isSelected={selectedCardId === card.id} className="w-[140px] h-[210px]" />
                           </motion.div>
                        );
                     })}
                  </div>
              </div>

              <div className="w-64 h-64 flex flex-col justify-end pointer-events-auto">
                 <AnimatePresence>
                    {selectedCard && (
                       <motion.div 
                         initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                         className="p-6 rounded-[var(--radius)] bg-[var(--panel)] border border-[var(--accent)]/30 backdrop-blur-3xl space-y-4"
                       >
                          <h4 className="text-xl font-black italic tracking-tighter uppercase">{selectedCard.name}</h4>
                          <p className="text-[10px] text-white/50 leading-relaxed uppercase tracking-tighter">{selectedCard.effect || 'Standard survival directive.'}</p>
                          
                          <button 
                            onClick={() => performAction({ type: 'PLAY_CARD', cardId: selectedCard.id })}
                            className="w-full fe-holo-btn !py-3 !text-sm border-[var(--accent)] !bg-[var(--accent)]/10 hover:!bg-[var(--accent)]/20"
                          >
                             Execute Protocol
                          </button>
                       </motion.div>
                    )}
                 </AnimatePresence>
              </div>
          </div>
      </div>

      {showAd && <InterstitialAd onComplete={() => setShowAd(false)} />}
    </main>
  );
}
