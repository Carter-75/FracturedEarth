'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isTutorialDone, setTutorialDone } from '@/lib/localProfile';
import { motion, AnimatePresence } from 'framer-motion';

export function TutorialLaunchGate() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hiddenPath = pathname.startsWith('/tutorial') || pathname.startsWith('/api') || pathname.startsWith('/tabletop');
    setVisible(!hiddenPath && !isTutorialDone());
  }, [pathname]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fe-modal-overlay z-[3000]"
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
          className="fe-modal-content"
        >
          <div className="fe-blur-bg bg-amber-500/10" />
          
          <div className="relative z-10">
             <div className="fe-hologram text-amber-500 mb-2">Neural Link Warning</div>
             <h2 className="text-4xl font-black italic tracking-tighter text-white uppercase mb-6">Uncertified Candidate</h2>
             <p className="text-white/50 leading-relaxed font-light mb-10 text-lg">
                Your neural profile lacks certification. It is recommended to initialize the **Tactical Training Protocol** before attempting live planetary control.
             </p>

             <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/tutorial"
                  className="fe-holo-btn !bg-amber-500/10 !border-amber-500 !text-white !py-4 flex-1 text-center"
                >
                  Confirm Training
                </Link>
                <button
                  onClick={() => {
                    setTutorialDone(true);
                    setVisible(false);
                  }}
                  className="fe-holo-btn !py-4 flex-1 text-white/30 hover:text-white transition-all"
                >
                  Bypass Certification
                </button>
             </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
