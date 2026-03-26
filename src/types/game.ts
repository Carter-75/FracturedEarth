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

export interface Card {
  id: string;
  name: string;
  type: CardType;
  pointsDelta: number;
  drawCount: number;
  disasterKind?: DisasterKind;
  blocksDisaster?: DisasterKind;
}

export interface PlayerState {
  id: string;
  displayName: string;
  survivalPoints: number;
  health: number;
  hand: Card[];
  traits: Card[];
  isBot: boolean;
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
