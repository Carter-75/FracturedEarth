'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { loadMatchHistory, loadRoomPin, type LocalMatchOutcome, type LocalRoomPin } from '@/lib/localProfile';

export default function HomePage() {
  const [history, setHistory] = useState<LocalMatchOutcome[]>([]);
  const [activePin, setActivePin] = useState<LocalRoomPin | null>(null);

  useEffect(() => {
    setHistory(loadMatchHistory());
    const syncPin = () => setActivePin(loadRoomPin());
    syncPin();
    const timer = setInterval(syncPin, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <main className="fe-scene bg-black overflow-y-auto !justify-start md:!justify-center !items-start pb-20">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0">
         <img src="/assets/type-bgs/chaos.png" className="w-full h-full object-cover opacity-40 scale-105 blur-sm" alt="" />
         <div className="fe-vignette" />
         <div className="fe-scanline" />
         <div className="fe-grid" />
      </div>

      <section className="relative z-10 w-full max-w-4xl mx-auto px-6 pt-24 pb-12 flex flex-col items-center justify-center min-h-screen text-center">
        <div className="fe-flicker mb-8 md:mb-12">
           <div className="fe-hologram text-[var(--accent)] opacity-60 mb-4 font-black text-[10px] md:text-xs">Local Area Network Active</div>
           <h1 className="text-[15vw] md:text-[8rem] font-black italic tracking-tighter text-[var(--fg)] leading-[0.9] md:leading-none">
             FRACTURED<br/>
             <span className="text-[var(--accent)]">EARTH</span>
           </h1>
        </div>

        <p className="max-w-2xl text-base md:text-2xl text-[var(--fg)] opacity-50 font-light tracking-tight mb-12 md:mb-16 px-4 leading-relaxed">
          Experience the definitive strategic survival engine. Secure your sector and manage your resources in pure cinematic reality.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 md:gap-6 w-full max-w-2xl mt-8 px-4">
           {activePin ? (
             <Link 
               href={`/tabletop?code=${activePin.code}&userId=${encodeURIComponent(activePin.userId)}`} 
               className="fe-holo-btn flex-1 flex justify-center items-center !py-4 md:!py-5 text-base md:!text-lg !text-[var(--accent)] !bg-[var(--accent)]/10 !border-[var(--accent)] animate-pulse"
             >
               Resume Session
             </Link>
           ) : (
             <Link href="/lan" className="fe-holo-btn flex-1 flex justify-center items-center !py-4 md:!py-5 text-base md:!text-lg !text-[var(--fg)] !bg-[var(--accent)]/10 !border-[var(--accent)]/30 hover:!bg-[var(--accent)]/20">
               Start Protocol
             </Link>
           )}
           <Link href="/tutorial" className="fe-holo-btn flex-1 flex justify-center items-center !py-4 md:!py-5 text-base md:!text-lg">
             Training
           </Link>
           <Link href="/rules" className="fe-holo-btn flex-1 flex justify-center items-center !py-4 md:!py-5 text-base md:!text-lg !border-[var(--accent-soft)]/50 !text-[var(--accent-soft)]">
             NeuralAtlas
           </Link>
        </div>

        {/* Match History Section */}
        {history.length > 0 && (
          <div className="mt-24 w-full max-w-2xl px-4 text-left">
            <h3 className="fe-hologram text-[var(--fg)] opacity-20 text-[10px] mb-6 flex items-center gap-4">
              <span className="w-8 h-[1px] bg-white/10" />
              Neural_Archive_Log
              <span className="w-full h-[1px] bg-white/10" />
            </h3>
            <div className="space-y-3">
              {history.slice(0, 5).map((outcome) => (
                <div key={outcome.id} className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center justify-between group hover:bg-white/10 transition-all">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl opacity-50 group-hover:opacity-100 transition-opacity">
                      {outcome.didWin ? '🏆' : '💀'}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-[var(--fg)] font-bold text-sm uppercase tracking-wider">{outcome.roomCode}</span>
                      <span className="text-[var(--fg)] opacity-30 text-[9px] uppercase tracking-widest">
                        {new Date(outcome.playedAtEpochMs).toLocaleDateString()} • {outcome.winnerDisplayName}
                      </span>
                    </div>
                  </div>
                  <div className={`fe-hologram text-[10px] ${outcome.didWin ? 'text-[var(--accent)]' : 'text-rose-500'} font-black italic`}>
                    {outcome.didWin ? 'ASCENDED' : 'FALLEN'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <Link href="/settings" className="mt-16 text-[var(--fg)] opacity-20 hover:opacity-60 text-xs tracking-[0.5em] transition-all uppercase mb-12">
          Access_Settings
        </Link>
      </section>

      {/* Floating Decorative Mesh */}
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] border border-white/5 rounded-full blur-3xl bg-[var(--accent)]/5 pointer-events-none" />
      <div className="absolute top-[10%] right-[-5%] w-[30%] h-[30%] border border-white/5 rounded-full blur-3xl bg-[var(--accent-soft)]/5 pointer-events-none" />
    </main>
  );
}
