'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { clearRoomPin } from '@/lib/localProfile';

interface GameEndOverlayProps {
  isWin: boolean;
  winnerName: string;
  stats: {
    energy: number;
    health: number;
    round: number;
  };
}

export function GameEndOverlay({ isWin, winnerName, stats }: GameEndOverlayProps) {
  const router = useRouter();

  const handleReturnHome = () => {
    clearRoomPin();
    router.push('/');
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="fixed inset-0 z-[5000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6"
    >
      <div className="absolute inset-0 fe-grid opacity-20" />
      <div className="absolute inset-0 fe-scanline opacity-10" />
      
      <div className="relative z-10 max-w-2xl w-full text-center">
        <motion.div
           initial={{ scale: 0.9, y: 20 }}
           animate={{ scale: 1, y: 0 }}
           transition={{ delay: 0.2 }}
        >
          <p className={`fe-hologram ${isWin ? 'text-[var(--accent)]' : 'text-rose-500'} opacity-60 mb-6 uppercase tracking-[0.4em] text-sm`}>
            Simulation Result: {isWin ? 'Success' : 'Critical Failure'}
          </p>
          
          <h2 className={`text-7xl md:text-9xl font-black italic tracking-tighter uppercase mb-4 ${isWin ? 'text-[var(--fg)]' : 'text-rose-600'} fe-glow-text`}>
            {isWin ? 'ASCENDED' : 'FALLEN'}
          </h2>
          
          <div className="fe-hologram text-xs md:text-sm text-[var(--fg)] opacity-40 uppercase tracking-widest mb-12">
            Commander {winnerName} {isWin ? 'Secured' : 'Lost'} the Sector
          </div>
          
          <div className="grid grid-cols-3 gap-4 md:gap-8 mb-16 px-4 md:px-0">
             <div className="flex flex-col items-center bg-white/5 border border-white/10 p-4 md:p-6 rounded-[var(--radius)]">
                <span className="text-[8px] md:text-[10px] fe-hologram text-[var(--accent-soft)] mb-2">Final_Energy</span>
                <span className="text-2xl md:text-4xl font-black italic text-[var(--fg)]">{stats.energy}</span>
             </div>
             <div className="flex flex-col items-center bg-white/5 border border-white/10 p-4 md:p-6 rounded-[var(--radius)]">
                <span className="text-[8px] md:text-[10px] fe-hologram text-rose-500 mb-2">Vital_Signs</span>
                <span className="text-2xl md:text-4xl font-black italic text-[var(--fg)]">{stats.health}</span>
             </div>
             <div className="flex flex-col items-center bg-white/5 border border-white/10 p-4 md:p-6 rounded-[var(--radius)]">
                <span className="text-[8px] md:text-[10px] fe-hologram text-[var(--accent)] mb-2">Cycles_Passed</span>
                <span className="text-2xl md:text-4xl font-black italic text-[var(--fg)]">{stats.round}</span>
             </div>
          </div>

          <button 
            onClick={handleReturnHome}
            className="fe-holo-btn !py-4 md:!py-6 !px-12 md:!px-20 text-base md:text-xl !border-[var(--accent)] !text-[var(--accent)] hover:!bg-[var(--accent)]/10 transition-all active:scale-95 shadow-[0_0_50px_rgba(var(--accent-rgb),0.2)]"
          >
            DISCONNECT_TERMINAL
          </button>
        </motion.div>
      </div>

      <div className="absolute bottom-8 left-0 right-0 text-center">
         <span className="fe-hologram text-[8px] opacity-10 tracking-[1em] uppercase">Persistent Log Updated // Neural Archive v4.0</span>
      </div>
    </motion.div>
  );
}
