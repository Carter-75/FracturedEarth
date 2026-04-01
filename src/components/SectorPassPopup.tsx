'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export function SectorPassPopup() {
  const [visible, setVisible] = useState(false);

  const pathname = usePathname();

  useEffect(() => {
    // Show only once per day on session start
    const lastPrompt = localStorage.getItem('fe:last-sub-prompt');
    const isAdFree = localStorage.getItem('fe:user-settings:v1')?.includes('"adFree":true');
    const onGameplayPath = pathname.startsWith('/tabletop') || pathname.startsWith('/lan');
    const tutorialPending = !localStorage.getItem('fe:user:tutorial-done');
    
    if (!isAdFree && !onGameplayPath && !tutorialPending && (!lastPrompt || Date.now() - Number(lastPrompt) > 86400000)) {
       const timer = setTimeout(() => setVisible(true), 1500);
       return () => clearTimeout(timer);
    }
  }, []);

  function handleDismiss() {
    setVisible(false);
    localStorage.setItem('fe:last-sub-prompt', String(Date.now()));
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fe-modal-overlay"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }}
            className="fe-modal-content max-w-md"
          >
            <div className="fe-blur-bg bg-sky-500/10" />
            
            <div className="relative z-10 text-center">
               <div className="fe-hologram text-sky-400 mb-2 uppercase font-black text-[9px] md:text-[10px]">Priority Transmission</div>
               <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter text-white uppercase mb-4">Secure Your Sector</h2>
               <p className="text-white/40 leading-relaxed font-light mb-8 text-xs md:text-sm">
                  Upgrade to the **Sector Pass** to eliminate sponsor interruptions and unlock premium planetary themes.
               </p>

               <div className="space-y-3">
                  <Link 
                    href="/store" onClick={() => setVisible(false)}
                    className="fe-holo-btn w-full !bg-sky-500/10 !border-sky-500 !text-white !py-3 md:!py-4 text-sm md:text-base"
                  >
                    View Packages
                  </Link>
                  <button 
                    onClick={handleDismiss}
                    className="text-[9px] md:text-[10px] fe-hologram text-white/20 hover:text-white transition-all uppercase tracking-[0.3em]"
                  >
                    Continue as Candidate
                  </button>
               </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
