'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { MatchCard, cardTheme } from '@/lib/tabletopShared';

interface PhysicalCardProps {
  card: MatchCard;
  onClick?: () => void;
  isSelected?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function PhysicalCard({ card, onClick, isSelected, className, style }: PhysicalCardProps) {
  const theme = cardTheme(card.type);
  return (
    <motion.div 
      onClick={onClick} 
      style={style} 
      className={`fe-card-physical ${isSelected ? 'border-[var(--accent)] shadow-[0_0_30px_rgba(var(--accent-rgb),0.5)] z-[200]' : ''} ${className || ''}`}
    >
      {/* Background Graphic */}
      <Image src={theme.bg} alt="" fill className="object-cover opacity-60 mix-blend-screen pointer-events-none" unoptimized />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-80 pointer-events-none" />
      
      {/* Tactical Glow */}
      <div className={`absolute -inset-1 rounded-[var(--radius)] opacity-20 blur-xl ${theme.ring.replace('border-', 'bg-')}`} />

      <div className="relative z-10 flex flex-col h-full p-4 justify-between border border-white/10 rounded-[var(--radius)] overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-2xl drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">{theme.icon}</span>
          <div className="flex flex-col items-end">
             <span className={`text-[10px] font-black uppercase tracking-widest ${theme.tint}`}>{card.type}</span>
             <div className="h-[2px] w-4 bg-white/20 mt-1" />
          </div>
        </div>

        <div className="text-center py-2">
            <h3 className="text-lg font-black uppercase tracking-tighter leading-none mb-1 text-[var(--fg)] fe-flicker font-spectral italic">{card.name}</h3>
            <div className="fe-hologram text-[6px] text-[var(--fg)] opacity-30 tracking-[0.3em]">NEURAL_SIGNATURE_VERIFIED</div>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 pt-3">
           <div className="flex flex-col">
              <span className="text-[6px] text-[var(--fg)] opacity-40 uppercase tracking-widest">Efficiency</span>
              <span className="text-xs font-black text-[var(--fg)] italic">{ (card.pointsDelta ?? 0) > 0 ? '+' : ''}{card.pointsDelta ?? 0}</span>
           </div>
           <div className={`w-6 h-6 rounded-full border border-white/10 flex items-center justify-center ${theme.tint} text-[10px] font-black`}>
              {card.id.slice(-1).toUpperCase()}
           </div>
        </div>
      </div>
      
      {/* Holographic Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none fe-scanline opacity-10" />
    </motion.div>
  );
}
