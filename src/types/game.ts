export type CardType = 'SURVIVAL' | 'DISASTER' | 'TRAIT' | 'ADAPT' | 'CHAOS';
export type DisasterKind = 'EARTHQUAKE' | 'PLAGUE' | 'FLOOD' | 'WILDFIRE' | 'GLOBAL';
export type BotDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

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
  disasterKind?: DisasterKind;
  blocksDisaster?: DisasterKind;
  primitives?: Primitive[];
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
}

export interface GameState {
  round: number;
  activePlayerIndex: number;
  players: PlayerState[];
  drawPile: Card[];
  discardPile: Card[];
  isGlobalDisasterPhase: boolean;
  winnerId?: string;
}
