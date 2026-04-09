'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export function SectorPassPopup() {
  const [visible, setVisible] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  const pathname = usePathname();

  useEffect(() => {
    setHasMounted(true);
    // Show only once per day on session start
    const lastPrompt = localStorage.getItem('fe:last-sub-prompt');
    const isAdFree = localStorage.getItem('fe:user-settings:v1')?.includes('"adFree":true');
    const onGameplayPath = pathname.startsWith('/tabletop') || pathname.startsWith('/lan');
    const tutorialPending = !localStorage.getItem('fe:user:tutorial-done');

    if (!isAdFree && !onGameplayPath && !tutorialPending && (!lastPrompt || Date.now() - Number(lastPrompt) > 86400000)) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  if (!hasMounted) return null;

  function handleDismiss() {
    setVisible(false);
    localStorage.setItem('fe:last-sub-prompt', String(Date.now()));
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[5000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.95, y: 30, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
            className="fe-card max-w-sm !p-0 overflow-hidden !bg-surface-raised !border-white/10 shadow-2xl relative"
          >
             <div className="h-40 bg-accent-alt/10 relative flex items-center justify-center">
                <div className="absolute inset-0 fe-scanline opacity-20" />
                <div className="text-6xl animate-pulse">🛰️</div>
             </div>

            <div className="p-8 text-center relative z-10">
              <div className="fe-hologram text-accent-alt/60 mb-2 uppercase font-black text-[9px] tracking-[0.4em]">Interstellar_Comm</div>
              <h2 className="text-2xl font-black italic tracking-tighter text-fg uppercase mb-4 leading-none">Secure Your Sector</h2>
              <p className="text-fg-muted leading-relaxed font-medium mb-8 text-xs">
                Upgrade to the **Sector Pass** to eliminate sponsor interruptions and unlock premium planetary themes.
              </p>

              <div className="flex flex-col gap-3">
                <Link
                  href="/store" onClick={() => setVisible(false)}
                  className="fe-btn fe-btn-primary !border-accent-alt/30 !text-accent-alt !py-4"
                >
                  View_Packages
                </Link>
                <button
                  onClick={handleDismiss}
                  className="text-[9px] font-black text-fg-subtle/40 hover:text-fg-muted transition-all uppercase tracking-[0.4em] py-3 underline underline-offset-8 decoration-white/5"
                >
                  Continue_As_Candidate
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
