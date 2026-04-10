'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { loadMatchHistory, loadRoomPin, clearRoomPin, type LocalMatchOutcome, type LocalRoomPin } from '@/lib/localProfile';

export default function HomePage() {
  const [history, setHistory] = useState<LocalMatchOutcome[]>([]);
  const [activePin, setActivePin] = useState<LocalRoomPin | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    setHistory(loadMatchHistory());
    
    let isValidating = false;

    const syncPin = async () => {
      const pin = loadRoomPin();
      if (!pin) {
        setActivePin(null);
        return;
      }

      if (activePin?.code === pin.code && !isValidating) {
        return;
      }

      if (!isValidating) {
        isValidating = true;
        try {
          const res = await fetch(`/api/rooms/${pin.code}/validate?userId=${encodeURIComponent(pin.userId)}`);
          const data = await res.json();
          if (res.ok && data.valid) {
            setActivePin(pin);
          } else {
            console.log('[Session] Server-side validation failed:', data.reason);
            clearRoomPin();
            setActivePin(null);
          }
        } catch (e) {
          console.error('[Session] Validation check failed', e);
          setActivePin(pin);
        } finally {
          isValidating = false;
        }
      }
    };

    syncPin();
    const timer = setInterval(syncPin, 5000);
    return () => clearInterval(timer);
  }, [activePin?.code]);

  return (
    <main className="fe-scene min-h-full flex flex-col items-center justify-start py-20 px-6 text-center select-none overflow-y-auto overflow-x-hidden">
      {/* Hero Content Layer */}


      {/* Cinematic Background Layer */}
      <div className="fixed inset-0 z-0">
        <Image 
          src="/assets/type-bgs/chaos.png" 
          fill 
          className="object-cover opacity-40 filter brightness-[0.75] saturate-[1.5] scale-105 blur-[2px]" 
          alt="Fractured Earth Background" 
          priority
          unoptimized
        />
        <div className="fe-vignette" />
        <div className="fe-scanline" />
        <div className="fe-grid" />
      </div>

      <section className="relative z-10 w-full max-w-4xl flex flex-col items-center mt-12 md:mt-24">
        {/* Header Section */}
        <div className="animate-flicker mb-12 w-full">
          <div className="fe-hologram text-accent opacity-60 text-[10px] md:text-xs uppercase tracking-[0.6em] mb-6">Local_Area_Network_Active</div>
          <h1 className="text-[14vw] md:text-[8rem] font-black italic tracking-tighter text-fg leading-[0.8] mb-4 uppercase drop-shadow-2xl">
            Fractured<br/>
            <span className="text-accent">Earth</span>
          </h1>
          <div className="h-[1px] w-24 bg-accent/20 mx-auto mt-12" />
        </div>

        <p className="text-fg/50 text-base md:text-2xl font-light tracking-tight mb-16 leading-relaxed max-w-2xl px-8">
          Experience the definitive strategic survival engine. Secure your sector and manage your resources in pure cinematic reality.
        </p>

        {/* Action Grid (Pill Buttons) */}
        <div className="flex flex-col sm:flex-row gap-4 md:gap-6 w-full max-w-2xl mt-8 px-4">
          {activePin ? (
            <Link 
              href={`/tabletop?code=${activePin.code}&userId=${encodeURIComponent(activePin.userId)}`} 
              className="fe-holo-btn flex-1 !py-5 text-base md:text-lg !text-accent !bg-accent/10 !border-accent animate-pulse"
            >
              Resume Session
            </Link>
          ) : (
            <Link href="/lan" className="fe-holo-btn flex-1 !py-5 text-base md:text-lg !text-fg !bg-accent/10 !border-accent/30 hover:!bg-accent/20">
              Start Protocol
            </Link>
          )}
          <Link href="/tutorial" className="fe-holo-btn flex-1 !py-5 text-base md:text-lg">
            Training
          </Link>
          <Link href="/rules" className="fe-holo-btn flex-1 !py-5 text-base md:text-lg !border-accent-alt/50 !text-accent-alt">
            NeuralAtlas
          </Link>
        </div>

        {/* Match History Section */}
        {history.length > 0 && (
          <div className="mt-24 w-full max-w-2xl px-4 text-left">
            <h3 className="fe-hologram text-fg/20 text-[10px] mb-8 flex items-center gap-4">
              <span className="w-8 h-[1px] bg-fg/10" />
              Neural_Archive_Log
              <span className="w-full h-[1px] bg-fg/10" />
            </h3>
            <div className="space-y-3">
              {history.slice(0, 5).map((outcome) => (
                <div key={outcome.id} className="bg-fg/5 border border-fg/5 rounded-2xl p-4 flex items-center justify-between group hover:bg-fg/10 transition-all backdrop-blur-sm">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl opacity-50 group-hover:opacity-100 transition-opacity">
                      {outcome.didWin ? '🏆' : '💀'}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-fg font-bold text-sm uppercase tracking-wider">{outcome.roomCode}</span>
                      <span className="text-fg/30 text-[9px] uppercase tracking-widest">
                        {hasMounted ? new Date(outcome.playedAtEpochMs).toLocaleDateString() : ''} • {outcome.winnerDisplayName}
                      </span>
                    </div>
                  </div>
                  <div className={`fe-hologram text-[10px] ${outcome.didWin ? 'text-accent' : 'text-rose-500'} font-black italic`}>
                    {outcome.didWin ? 'ASCENDED' : 'FALLEN'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Link href="/settings" className="mt-20 text-fg/20 hover:text-fg transition-all text-[8px] tracking-[1em] uppercase mb-12">
          Access_Settings
        </Link>
      </section>

      {/* Subtle Background Accents */}
      <div className="fixed top-[20%] left-[-10%] w-[50%] h-[50%] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[10%] right-[-10%] w-[40%] h-[40%] bg-accent-alt/5 blur-[120px] rounded-full pointer-events-none" />
    </main>
  );
}
