'use client';

import { motion } from 'framer-motion';
import { TacticalData } from '@/lib/tabletopShared';

export default function TacticalDataPanel({ data }: { data: TacticalData }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 max-w-md w-full relative overflow-hidden shadow-2xl"
    >
      {/* Scanning Line */}
      <motion.div 
        animate={{ top: ['0%', '100%', '0%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 right-0 h-[1px] bg-[var(--accent)] opacity-30 z-20 pointer-events-none"
      />

      <div className="relative z-10 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-2 mb-6">
           <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse shadow-[0_0_10px_var(--glow-color)]" />
           <div className="fe-hologram text-[8px] uppercase tracking-[0.3em] text-[var(--fg)] opacity-40">Tactical_Analysis_Active</div>
        </div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl font-bold italic tracking-tight text-[var(--fg)] opacity-90 mb-8 leading-tight uppercase font-spectral"
        >
          {data.summary}
        </motion.p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           {data.pips.map((pip, i) => {
             // Map legacy tailwind colors to semantic theme tokens or softened versions
             const colorClass = pip.color.includes('emerald') ? 'text-emerald-400' : 
                               pip.color.includes('rose') ? 'text-rose-500' :
                               pip.color.includes('sky') ? 'text-[var(--accent-soft)]' :
                               pip.color.includes('amber') ? 'text-[var(--accent)]' :
                               `text-${pip.color}`;
             
             return (
               <motion.div 
                 key={pip.label}
                 initial={{ x: -20, opacity: 0 }}
                 animate={{ x: 0, opacity: 1 }}
                 transition={{ delay: 0.4 + (i * 0.1) }}
                 className="flex flex-col gap-1 p-3 bg-white/5 border border-white/5 rounded-xl hover:border-white/20 transition-colors group"
               >
                  <div className="flex items-center gap-2">
                     <span className="text-xs opacity-70 group-hover:opacity-100 transition-opacity">{pip.icon}</span>
                     <span className="text-[7px] font-black uppercase tracking-widest text-[var(--fg)] opacity-30">{pip.label}</span>
                  </div>
                  <div className={`text-2xl font-black italic ${colorClass} fe-glow-text leading-none mt-1`}>
                    {pip.value}
                  </div>
               </motion.div>
             );
           })}
        </div>

        <div className="mt-8 flex justify-center opacity-20">
           <div className="h-[2px] w-24 bg-gradient-to-r from-transparent via-white to-transparent rounded-full" />
        </div>
      </div>
    </motion.div>
  );
}
