export type SharedCardType =
  | 'SURVIVAL'
  | 'DISASTER'
  | 'POWER'
  | 'ADAPT'
  | 'CHAOS'
  | 'ASCENDED'
  | 'TWIST'
  | 'CATACLYSM';

export type OpponentSlot = 'left' | 'top' | 'right';

export function positionOpponents<T extends { id: string }>(players: T[], selfId: string): Array<{ slot: OpponentSlot; player: T }> {
  const opponents = players.filter((p) => p.id !== selfId);
  if (opponents.length === 0) return [];
  if (opponents.length === 1) {
    return [{ slot: 'top', player: opponents[0] }];
  }
  if (opponents.length === 2) {
    return [
      { slot: 'left', player: opponents[0] },
      { slot: 'right', player: opponents[1] },
    ];
  }
  const slots: OpponentSlot[] = ['left', 'top', 'right'];
  return opponents.slice(0, 3).map((player, index) => ({ slot: slots[index], player }));
}

export function cardTheme(type: SharedCardType): {
  icon: string;
  ring: string;
  tint: string;
  header: string;
  glow: string;
  badge: string;
  bg: string;
} {
  switch (type) {
    case 'SURVIVAL':
      return {
        icon: '🌱', ring: 'border-emerald-500', tint: 'text-emerald-200',
        header: 'bg-gradient-to-r from-emerald-800 to-emerald-700',
        glow: 'shadow-emerald-900/60', badge: 'bg-emerald-700 text-emerald-100',
        bg: '/assets/type-bgs/survival.png',
      };
    case 'DISASTER':
      return {
        icon: '🌋', ring: 'border-rose-500', tint: 'text-rose-200',
        header: 'bg-gradient-to-r from-rose-900 to-rose-700',
        glow: 'shadow-rose-900/60', badge: 'bg-rose-700 text-rose-100',
        bg: '/assets/type-bgs/disaster.png',
      };
    case 'POWER':
      return {
        icon: '🛡️', ring: 'border-sky-500', tint: 'text-sky-200',
        header: 'bg-gradient-to-r from-sky-900 to-sky-700',
        glow: 'shadow-sky-900/60', badge: 'bg-sky-700 text-sky-100',
        bg: '/assets/type-bgs/power.png',
      };
    case 'ADAPT':
      return {
        icon: '🧬', ring: 'border-cyan-500', tint: 'text-cyan-200',
        header: 'bg-gradient-to-r from-cyan-900 to-teal-700',
        glow: 'shadow-cyan-900/60', badge: 'bg-cyan-700 text-cyan-100',
        bg: '/assets/type-bgs/adapt.png',
      };
    case 'CHAOS':
      return {
        icon: '⚡', ring: 'border-fuchsia-500', tint: 'text-fuchsia-200',
        header: 'bg-gradient-to-r from-fuchsia-900 to-purple-700',
        glow: 'shadow-fuchsia-900/60', badge: 'bg-fuchsia-700 text-fuchsia-100',
        bg: '/assets/type-bgs/chaos.png',
      };
    case 'ASCENDED':
      return {
        icon: '✨', ring: 'border-amber-500', tint: 'text-amber-200',
        header: 'bg-gradient-to-r from-amber-900 to-yellow-800',
        glow: 'shadow-amber-900/60', badge: 'bg-amber-700 text-amber-100',
        bg: '/assets/type-bgs/ascended.png',
      };
    case 'TWIST':
      return {
        icon: '🌀', ring: 'border-purple-500', tint: 'text-purple-200',
        header: 'bg-gradient-to-r from-purple-900 to-indigo-800',
        glow: 'shadow-purple-900/60', badge: 'bg-purple-700 text-purple-100',
        bg: '/assets/type-bgs/twist.png',
      };
    case 'CATACLYSM':
      return {
        icon: '💀', ring: 'border-red-600', tint: 'text-red-200',
        header: 'bg-gradient-to-r from-red-950 to-orange-900',
        glow: 'shadow-red-950/80', badge: 'bg-red-800 text-red-100',
        bg: '/assets/type-bgs/cataclysm.png',
      };
    default:
      return {
        icon: '🃏', ring: 'border-slate-500', tint: 'text-slate-200',
        header: 'bg-slate-700', glow: 'shadow-slate-900/60', badge: 'bg-slate-600 text-slate-100',
        bg: '/assets/type-bgs/survival.png',
      };
  }
}

export interface TacticalPip {
  label: string;
  value: string;
  icon: string;
  color: string;
}

export interface TacticalData {
  summary: string;
  pips: TacticalPip[];
  themeColor: string;
}

export function describeCardEffect(input: {
  name: string;
  type: SharedCardType;
  pointsDelta: number;
  drawCount: number;
  effect?: string;
  gainHealth?: number;
  disasterKind?: string;
  blocksDisaster?: string;
}): TacticalData {
  const pips: TacticalPip[] = [];
  const theme = cardTheme(input.type);
  const color = theme.tint.replace('text-', '');

  if (input.pointsDelta !== 0) {
    pips.push({ 
      label: 'NET_YIELD', 
      value: `${input.pointsDelta > 0 ? '+' : ''}${input.pointsDelta}`, 
      icon: '📊', 
      color 
    });
  }
  if (input.gainHealth) {
    pips.push({ label: 'REPAIR_SEQ', value: `+${input.gainHealth}`, icon: '🔧', color: 'emerald-400' });
  }
  if (input.drawCount > 0) {
    pips.push({ label: 'DATA_LINK', value: `x${input.drawCount}`, icon: '📡', color: 'sky-400' });
  }
  if (input.disasterKind) {
    pips.push({ label: 'THREAT_LVL', value: input.disasterKind.toUpperCase(), icon: '⚠️', color: 'rose-500' });
  }
  if (input.blocksDisaster) {
    pips.push({ label: 'SHIELD_PROT', value: input.blocksDisaster.toUpperCase(), icon: '🛡️', color: 'cyan-400' });
  }

  const summary = input.effect ? input.effect.replaceAll('_', ' ') : 'Standard Tactical Deployment';

  return {
    summary,
    pips,
    themeColor: color
  };
}
