'use client';

import React, { useEffect, useMemo, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { loadLocalSettings, setTutorialDone } from '@/lib/localProfile';
import { MatchCard, MatchPlayer } from '@/lib/tabletopShared';
import PhaserGame from '@/components/PhaserGame';
import { InterstitialAd } from '@/components/InterstitialAd';

type TutorialStep = {
  id: number;
  title: string;
  description: string;
  expectedActionType: string;
  expectedCardId?: string;
};

type TutorialSession = {
  match: any;
  stepIndex: number;
  completed: boolean;
};

// --- MAIN TUTORIAL PAGE ---

export default function TutorialPage() {
  const router = useRouter();
  const [session, setSession] = useState<TutorialSession | null>(null);
  const [step, setStep] = useState<TutorialStep | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCard, setActiveCard] = useState<MatchCard | null>(null);
  const [showAd, setShowAd] = useState(false);

  const local = useMemo(() => loadLocalSettings(), []);

  const sync = React.useCallback(async () => {
    // Initial start
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
  }, [local]);

  useEffect(() => {
    sync();
  }, [sync]);

  const payload = session?.match;
  const activePlayer = payload?.players[payload.activePlayerIndex];
  const isMyTurn = activePlayer?.id === local.userId;
  const myPlayer = payload?.players.find((p: any) => p.id === local.userId);

  async function performAction(action: any) {
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
            expectedRevision: 0 // Mock revision for tutorial
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setSession(data.session);
      setStep(data.step);
      setActiveCard(null);
      
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
      <div className="fe-scene flex flex-col items-center justify-center bg-black">
         <div className="fe-hologram animate-pulse text-[var(--accent)] text-xl">INITIATING_NEURAL_LINK...</div>
      </div>
    );
  }

  // Inject tutorial step info into payload for Phaser to pick up
  const enrichedPayload = {
      ...payload,
      tutorialStep: step
  };

  return (
    <main className="fe-scene overflow-hidden relative cursor-default bg-black">
      <div className="fe-vignette z-30 pointer-events-none" />
      <div className="fe-grid opacity-10 pointer-events-none" />

      {/* TOP HEADER */}
      <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-start z-50 pointer-events-none">
          <div className="flex flex-col">
             <div className="text-[10px] font-black uppercase tracking-[0.5em] text-[var(--accent)] opacity-60">Training_Protocol_v3.2</div>
             <h1 className="text-4xl font-black italic tracking-tighter text-[var(--fg)] fe-flicker uppercase">Sector_TUTORIAL</h1>
          </div>
          <div className="flex gap-4 pointer-events-auto">
             <button onClick={() => router.push('/')} className="fe-holo-btn !py-2 !px-4 text-xs opacity-50 hover:opacity-100">Abort Sim</button>
          </div>
      </div>

      {/* TUTORIAL INSTRUCTION PANEL (TOP LEFT) */}
      <div className="absolute top-24 left-8 z-50 w-96 pointer-events-none">
          <AnimatePresence mode="wait">
            {step && (
               <motion.div 
                 key={step.id}
                 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                 className="p-8 rounded-3xl bg-[var(--panel)] border-2 border-[var(--accent)]/40 shadow-[0_0_50px_rgba(var(--accent-rgb),0.3)] backdrop-blur-3xl"
               >
                  <div className="flex items-center gap-3 mb-4">
                     <div className="w-3 h-3 rounded-full bg-[var(--accent)] shadow-[0_0_15px_var(--accent)] animate-pulse" />
                     <span className="text-xs font-black uppercase tracking-[0.3em] text-[var(--accent)]">Protocol Phase {step.id + 1}</span>
                  </div>
                  <h2 className="text-2xl font-black italic tracking-tighter uppercase mb-4 leading-none text-[var(--fg)]">{step.title}</h2>
                  <p className="text-sm text-[var(--fg)] opacity-70 leading-relaxed font-medium">{step.description}</p>
               </motion.div>
            )}
            {session.completed && (
               <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-10 rounded-3xl bg-[var(--accent)]/10 border-4 border-[var(--accent)] backdrop-blur-3xl text-center pointer-events-auto">
                  <h2 className="text-4xl font-black italic uppercase text-[var(--accent)] fe-glow-text mb-6 fe-flicker">Simulation Complete</h2>
                  <p className="text-white/60 mb-8 uppercase tracking-widest text-xs">Aptitude Certified. Access granted to planetary sectors.</p>
                  <Link href="/lan" className="fe-holo-btn !bg-[var(--accent)] !text-black !py-4 !px-12 font-black">Return to Command</Link>
               </motion.div>
            )}
          </AnimatePresence>
      </div>

      {/* PHASER ENGINE */}
      <PhaserGame 
         roomCode="TUTORIAL" 
         gameState={enrichedPayload} 
         onAction={(action) => performAction(action)} 
         onCardDetail={(card) => setActiveCard(card)}
      />

      {/* END TURN BUTTON (BOTTOM RIGHT) */}
      {isMyTurn && !session.completed && (
         <div className="fixed bottom-8 right-8 z-[70] pointer-events-auto flex flex-col items-end gap-2">
            <button 
              onClick={() => performAction({ type: 'END_TURN' })}
              disabled={busy || step?.expectedActionType !== 'END_TURN'}
              className={`fe-holo-btn !py-2 !px-8 text-[10px] border-[var(--accent)]/20 !bg-black/50 shadow-xl transition-all font-black uppercase tracking-widest flex items-center gap-2 group ${
                step?.expectedActionType !== 'END_TURN' ? 'opacity-10 grayscale pointer-events-none' : 'hover:!bg-[var(--accent)]/10 border-[var(--accent)]'
              }`}
            >
              <span className="opacity-40 group-hover:opacity-100 transition-opacity">NEXT_CYCLE</span>
              <div className={`w-1.5 h-1.5 rounded-full bg-[var(--accent)] ${busy || step?.expectedActionType !== 'END_TURN' ? '' : 'animate-pulse'}`} />
            </button>
         </div>
      )}

      {/* Card Detail Modal */}
      <AnimatePresence>
        {activeCard && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveCard(null)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-sm rounded-[var(--radius)] overflow-hidden bg-[var(--panel)] border border-[var(--border)] p-8">
                    <h3 className="text-3xl font-black italic uppercase mb-2">{activeCard.name}</h3>
                    <p className="text-white/60 mb-8 uppercase text-xs tracking-tighter">{activeCard.description}</p>
                    {step?.expectedCardId === activeCard.id && (
                        <button onClick={() => performAction({ type: 'PLAY_CARD', cardId: activeCard.id })} className="w-full fe-holo-btn !bg-[var(--accent)] !text-black !py-4 font-black">CONFIRM_DEPLOYMENT</button>
                    )}
                    <button onClick={() => setActiveCard(null)} className="w-full text-white/20 text-[10px] mt-4 uppercase font-black hover:text-white/40">Close Preview</button>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {showAd && <InterstitialAd onComplete={() => setShowAd(false)} />}
    </main>
  );
}
