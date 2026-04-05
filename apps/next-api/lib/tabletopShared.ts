'use client';

import { MatchCard, MatchPlayer, CardType, MatchPayload } from '@/types/game';

export { type MatchCard, type MatchPlayer, type CardType, type MatchPayload };

export interface TacticalData {
  summary: string;
  pips: Array<{
    label: string;
    icon: string;
    color: string;
    value: string | number;
  }>;
}

export function cardTheme(type: CardType) {
  switch (type) {
    case 'SURVIVAL':
      return { 
        icon: '🌱', 
        ring: 'border-emerald-500', 
        tint: 'text-emerald-300',
        bg: '/assets/type-bgs/survival.png',
        glow: 'var(--accent-glow)'
      };
    case 'POWER':
      return { 
        icon: '💎', 
        ring: 'border-blue-500', 
        tint: 'text-blue-300',
        bg: '/assets/type-bgs/power.png',
        glow: 'rgba(59, 130, 246, 0.5)'
      };
    case 'ADAPT':
      return { 
        icon: '🧬', 
        ring: 'border-purple-500', 
        tint: 'text-purple-300',
        bg: '/assets/type-bgs/adapt.png',
        glow: 'rgba(168, 85, 247, 0.5)'
      };
    case 'CHAOS':
      return { 
        icon: '⚡', 
        ring: 'border-amber-500', 
        tint: 'text-amber-300',
        bg: '/assets/type-bgs/chaos.png',
        glow: 'rgba(245, 158, 11, 0.5)'
      };
    case 'DISASTER':
      return { 
        icon: '🌋', 
        ring: 'border-rose-500', 
        tint: 'text-rose-300',
        bg: '/assets/type-bgs/disaster.png',
        glow: 'rgba(244, 63, 94, 0.5)'
      };
    case 'CATACLYSM':
      return { 
        icon: '🌑', 
        ring: 'border-red-600', 
        tint: 'text-red-400',
        bg: '/assets/type-bgs/cataclysm.png',
        glow: 'rgba(220, 38, 38, 0.5)'
      };
    case 'ASCENDED':
      return { 
        icon: '👑', 
        ring: 'border-yellow-400', 
        tint: 'text-yellow-200',
        bg: '/assets/type-bgs/ascended.png',
        glow: 'rgba(250, 204, 21, 0.5)'
      };
    case 'TWIST':
      return { 
        icon: '🌀', 
        ring: 'border-cyan-400', 
        tint: 'text-cyan-200',
        bg: '/assets/type-bgs/twist.png',
        glow: 'rgba(34, 211, 238, 0.5)'
      };
    default:
      return { 
        icon: '🃏', 
        ring: 'border-slate-500', 
        tint: 'text-slate-200',
        bg: '/assets/type-bgs/survival.png',
        glow: 'rgba(255, 255, 255, 0.5)'
      };
  }
}
