'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function InterstitialAd({ 
  onComplete, 
  force = false 
}: { 
  onComplete: () => void;
  force?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const isAdFree = localStorage.getItem('fe:user-settings:v1')?.includes('"adFree":true');
    const lastAd = Number(localStorage.getItem('fe:last-interstitial') || 0);
    const now = Date.now();

    // Show if not ad-free AND (forced OR 5 minutes since last ad)
    if (!isAdFree && (force || now - lastAd > 300000)) {
       setVisible(true);
       localStorage.setItem('fe:last-interstitial', String(now));
    } else {
       onComplete();
    }
  }, [force, onComplete]);

  useEffect(() => {
    if (!visible) return;
    if (countdown <= 0) {
       // Auto-close or allow manual close
       return;
    }
    const timer = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [visible, countdown]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[3000] bg-black flex flex-col items-center justify-center p-12"
      >
        <div className="fe-grid absolute inset-0 opacity-20" />
        <div className="fe-scanline absolute inset-0 opacity-10" />
        
        <div className="relative z-10 text-center max-w-lg">
           <div className="fe-hologram text-sky-400 mb-8 uppercase font-black text-xs tracking-widest animate-pulse">
              Sponsor Interruption: Universal Signal 0xCC
           </div>

           {/* Ad Content Placeholder */}
           <div className="w-full aspect-video bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mb-10 overflow-hidden relative">
              <div className="absolute inset-0 fe-grid opacity-5" />
              <div className="text-white/20 fe-hologram text-xs uppercase font-black tracking-[0.5em]">Transmitting Message...</div>
           </div>

           <div className="flex flex-col items-center space-y-6">
              {countdown > 0 ? (
                <div className="text-white/40 fe-hologram text-[10px] uppercase font-bold tracking-widest">
                   Transmission Secure in {countdown}s
                </div>
              ) : (
                <button 
                  onClick={onComplete}
                  className="fe-holo-btn !py-4 !px-12 !text-emerald-400 !border-emerald-500 !bg-emerald-500/10 transition-all font-black uppercase text-sm tracking-widest active:scale-95"
                >
                   Close Transmission
                </button>
              )}
              
              <Link href="/store" onClick={onComplete} className="text-[9px] fe-hologram text-white/10 hover:text-white transition-all uppercase tracking-[0.3em]">
                 Upgrade to Sector Pass to Mute Interstellar Ads
              </Link>
           </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

import Link from 'next/link';
