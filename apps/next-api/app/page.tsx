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
    <main className="relative min-h-screen flex flex-col items-center justify-center p-6 text-center">
      {/* Cinematic Background Layer */}
      <div className="fe-main-bg">
        <Image 
          src="/assets/type-bgs/chaos.png" 
          fill 
          className="object-cover opacity-20 filter brightness-50 scale-105" 
          alt="Fractured Earth Background" 
          priority
          unoptimized
        />
        <div className="fe-scanline" />
      </div>

      <section className="relative z-10 w-full max-w-2xl flex flex-col items-center">
        {/* Header Section */}
        <div className="animate-flicker mb-12 w-full">
          <div className="fe-hologram text-accent/60 text-[10px] tracking-[0.5em] mb-4">Neural_Link_Status: Active</div>
          <h1 className="text-[clamp(3.5rem,15vw,6rem)] sm:text-8xl font-black italic tracking-tighter text-fg leading-[0.85] mb-2 uppercase">
            Fractured<br/>
            <span className="text-accent drop-shadow-[0_0_20px_rgba(245,158,11,0.3)]">Earth</span>
          </h1>
          <div className="h-px w-24 bg-accent/20 mx-auto mt-6" />
        </div>

        <p className="text-fg-muted font-light tracking-tight mb-16 leading-relaxed max-w-lg text-sm sm:text-base px-4">
          Definitive strategic survival engine. Secure your sector and manage resources in pure cinematic reality.
        </p>

        {/* Action Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full px-4 mb-20">
          {activePin ? (
            <Link 
              href={`/tabletop?code=${activePin.code}&userId=${encodeURIComponent(activePin.userId)}`} 
              className="fe-btn fe-btn-primary animate-pulse py-5 text-sm"
            >
              Resume Session
            </Link>
          ) : (
            <Link href="/lan" className="fe-btn py-5 text-sm hover:!bg-accent/5">
              Start Protocol
            </Link>
          )}
          <Link href="/tutorial" className="fe-btn py-5 text-sm group">
            <span className="group-hover:text-accent-alt transition-colors">Training_Sim</span>
          </Link>
          <Link href="/rules" className="fe-btn sm:col-span-2 py-4 text-[10px] opacity-60 hover:opacity-100">
            Neural_Atlas_Databank
          </Link>
        </div>

        {/* Match Archive */}
        {history.length > 0 && (
          <div className="w-full text-left px-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <h3 className="fe-hologram text-fg-muted/30 text-[9px] mb-8 flex items-center gap-6">
              <span className="h-px flex-1 bg-white/5" />
              Neural_Archive_Log
              <span className="h-px w-8 bg-white/5" />
            </h3>
            
            <div className="space-y-3">
              {history.slice(0, 3).map((outcome) => (
                <div key={outcome.id} className="fe-card group flex items-center justify-between !py-4 !px-6 bg-surface/40 hover:!bg-surface-raised/60">
                  <div className="flex items-center gap-5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${outcome.didWin ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                      {outcome.didWin ? '●' : '×'}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-fg font-bold text-xs uppercase tracking-widest leading-none mb-1">{outcome.roomCode}</span>
                      <span className="text-fg-subtle text-[8px] uppercase tracking-widest">
                        {hasMounted ? new Date(outcome.playedAtEpochMs).toLocaleDateString() : ''} • {outcome.winnerDisplayName}
                      </span>
                    </div>
                  </div>
                  <div className={`text-[10px] font-black tracking-widest ${outcome.didWin ? 'text-accent' : 'text-danger/60'}`}>
                    {outcome.didWin ? 'ASCENDED' : 'FALLEN'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <Link href="/settings" className="mt-20 text-fg-subtle/40 hover:text-accent/60 text-[9px] tracking-[0.6em] transition-all uppercase mb-12">
          System_Settings
        </Link>
      </section>

      {/* Subtle Background Accents */}
      <div className="absolute top-[20%] left-[-10%] w-[50%] h-[50%] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] bg-accent-alt/5 blur-[120px] rounded-full pointer-events-none" />
    </main>
  );
}
