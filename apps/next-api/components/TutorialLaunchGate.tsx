'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isTutorialDone, setTutorialDone } from '@/lib/localProfile';
import { motion, AnimatePresence } from 'framer-motion';

export function TutorialLaunchGate() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    const hiddenPath = pathname.startsWith('/tutorial') || pathname.startsWith('/api') || pathname.startsWith('/tabletop');
    setVisible(!hiddenPath && !isTutorialDone());
  }, [pathname]);

  if (!hasMounted || !visible) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[6000] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-8"
      >
        <motion.div 
          initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
          className="fe-card max-w-sm !p-0 overflow-hidden !bg-surface-raised !border-white/10 shadow-2xl relative"
        >
           <div className="h-40 bg-amber-500/10 relative flex items-center justify-center">
              <div className="absolute inset-0 fe-scanline opacity-20" />
              <div className="text-6xl animate-pulse">⚠️</div>
           </div>
          
          <div className="p-8 text-center relative z-10">
             <div className="fe-hologram text-amber-500/60 mb-2 text-[10px] uppercase font-black tracking-[0.4em]">Neural_Link_Warning</div>
             <h2 className="text-2xl font-black italic tracking-tighter text-fg uppercase mb-4 leading-none">Uncertified Candidate</h2>
             <p className="text-fg-muted leading-relaxed font-medium mb-10 text-xs">
                Your neural profile lacks certification. It is recommended to initialize the **Tactical Training Protocol** before attempting live planetary control.
             </p>

             <div className="flex flex-col gap-3">
                <Link
                  href="/tutorial"
                  className="fe-btn fe-btn-primary !border-amber-500/30 !text-amber-500 !py-4"
                >
                  Confirm_Training
                </Link>
                <button
                  onClick={() => {
                    setTutorialDone(true);
                    setVisible(false);
                  }}
                  className="text-[9px] font-black text-fg-subtle/40 hover:text-fg-muted transition-all uppercase tracking-[0.4em] py-3 underline underline-offset-8 decoration-white/5"
                >
                  Bypass_Certification
                </button>
             </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
