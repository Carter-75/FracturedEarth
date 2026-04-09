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
    <main className="relative min-h-screen flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden">
      {/* Absolute Overlays (Top-Right / Bottom-Left) */}
      <div className="absolute top-8 right-8 z-[100] flex gap-4 pointer-events-auto">
        <Link href="/login" className="px-5 py-2 border border-accent/30 rounded-full text-[10px] font-black tracking-[0.3em] uppercase transition-all hover:bg-accent/10 hover:border-accent text-accent">Sign_In</Link>
        <Link href="/store" className="px-5 py-2 border border-sky-400/30 rounded-full text-[10px] font-black tracking-[0.3em] uppercase transition-all hover:bg-sky-400/10 hover:border-sky-400 text-sky-400">Sector_Pass</Link>
      </div>

      <div className="absolute bottom-8 left-8 z-[100] pointer-events-auto">
        <button className="fe-btn !bg-transparent !border-white/5 opacity-40 hover:opacity-100 transition-all !px-4 !py-2">
           <span className="text-[10px] font-black tracking-[0.5em] uppercase">Neural_Diag_(1)</span>
        </button>
      </div>

      {/* Cinematic Background Layer */}
      <div className="fe-main-bg">
        <Image 
          src="/assets/type-bgs/chaos.png" 
          fill 
          className="object-cover opacity-30 filter brightness-[0.75] saturate-[1.5] scale-105" 
          alt="Fractured Earth Background" 
          priority
          unoptimized
        />
        <div className="fe-scanline" />
      </div>

      <section className="relative z-10 w-full max-w-2xl flex flex-col items-center">
        {/* Header Section */}
        <div className="animate-flicker mb-12 w-full">
          <div className="fe-hologram text-accent-alt/60 text-[9px] uppercase tracking-[0.6em] mb-6">Local_Area_Network_Active</div>
          <h1 className="fe-display-italic text-[clamp(3.5rem,15vw,6.5rem)] font-black italic tracking-tighter text-white leading-[0.8] mb-4 uppercase drop-shadow-2xl">
            Fractured<br/>
            <span className="text-accent italic">Earth</span>
          </h1>
          <div className="h-px w-24 bg-accent/20 mx-auto mt-8" />
        </div>

        <p className="text-fg-muted/60 font-medium tracking-tight mb-16 leading-relaxed max-w-lg text-sm sm:text-base px-8">
          Experience the definitive strategic survival engine. Secure your sector and manage your resources in pure cinematic reality.
        </p>

        {/* Action Grid (Pill Buttons) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full px-6 mb-20 max-w-lg">
          {activePin ? (
            <Link 
              href={`/tabletop?code=${activePin.code}&userId=${encodeURIComponent(activePin.userId)}`} 
              className="fe-btn-pill !border-white !text-white animate-pulse"
            >
              Resume Session
            </Link>
          ) : (
            <Link href="/lan" className="fe-btn-pill !border-white/40 !text-white hover:!bg-white/10">
              Start Protocol
            </Link>
          )}
          <Link href="/tutorial" className="fe-btn-pill">
            Training
          </Link>
          <Link href="/rules" className="fe-btn-pill sm:col-span-2 !text-sky-400 !border-sky-400/30 hover:!bg-sky-400/5">
            NeuralAtlas
          </Link>
        </div>

        <Link href="/settings" className="mt-8 text-fg-subtle/30 hover:text-white transition-all text-[8px] tracking-[1em] uppercase">
          Access_Settings
        </Link>
      </section>

      {/* Subtle Background Accents */}
      <div className="absolute top-[20%] left-[-10%] w-[50%] h-[50%] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] bg-accent-alt/5 blur-[120px] rounded-full pointer-events-none" />
    </main>
  );
}
