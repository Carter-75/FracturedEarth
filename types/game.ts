export type CardType = 'SURVIVAL' | 'DISASTER' | 'TRAIT' | 'ADAPT' | 'CHAOS' | 'POWER' | 'ASCENDED' | 'TWIST' | 'CATACLYSM';
export type DisasterKind = 'EARTHQUAKE' | 'PLAGUE' | 'FLOOD' | 'WILDFIRE' | 'GLOBAL';
export type BotDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export type TriggerKind = 
  | 'NEGATE_NEXT_DISASTER' 
  | 'NEGATE_NEXT_CATAC_EFFECT'
  | 'NEGATE_NEXT_NEGATIVE_EFFECT'
  | 'DOUBLE_NEXT_POINTS'
  | 'PREVENT_NEXT_POINT_LOSS'
  | 'SKIP_NEXT_DRAW'
  | 'REDUCE_INCOMING_DISASTER_1'
  | 'PREVENT_OPPONENT_DRAW_1'
  | 'HAND_LIMIT_TEMP_1'
  | 'TEMP_DOUBLE_POWER_EFFECT'
  | 'REDIRECT_NEXT_DISASTER'
  | 'RESET_HAND_5'
  | 'PREVENT_HEALTH_REGAIN'
  | 'LOSE_1_PT_PER_TURN_3'
  | 'LOSE_1_HEALTH_PER_TURN_2'
  | 'DISABLE_SURVIVAL_NEXT_TURN'
  | 'SKIP_NEXT_DRAW'
  | 'NEGATE_ALL_SURVIVAL_THIS_TURN'
  | 'SWAP_HAND_WITH_DISCARD';

export interface Trigger {
  id: string;
  kind: TriggerKind;
  value?: any;
  duration: 'next_event' | 'turn' | 'round' | 'permanent';
  sourceCardId?: string;
  targetId?: string; // If it affects another player
}

export type Theme =
  | 'Obsidian'
  | 'DeepTeal'
  | 'ElectricIndigo'
  | 'CrimsonNight'
  | 'ForestSignal'
  | 'CarbonGold'
  | 'ArcticTerminal'
  | 'SolarFlare'
  | 'VoidPurple'
  | 'TitaniumSlate';

export interface Primitive {
  type: string;
  params?: any;
  then?: Primitive[];
  else?: Primitive[];
}

export interface Card {
  id: string;
  name: string;
  type: CardType;
  description: string;
  disasterKind?: DisasterKind;
  blocksDisaster?: DisasterKind;
  primitives?: Primitive[];
  tier?: number;
}

export interface PlayerState {
  id: string;
  displayName: string;
  survivalPoints: number;
  health: number;
  hand: Card[];
  traits: Card[];
  isBot: boolean;
  maxHandModifier?: number;
  twistEffect?: string;
  powers?: Card[];
  triggers: Trigger[];
}

export interface GameState {
  round: number;
  activePlayerIndex: number;
  players: PlayerState[];
  drawPile: Card[];
  discardPile: Card[];
  isGlobalDisasterPhase: boolean;
  winnerId?: string;
  turnOrderReversed: boolean;
}
