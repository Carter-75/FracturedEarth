export type CardType =
  | "SURVIVAL"
  | "DISASTER"
  | "POWER"
  | "ADAPT"
  | "CHAOS"
  | "ASCENDED"
  | "TWIST"
  | "CATACLYSM";

export type DisasterKind =
  | "EARTHQUAKE"
  | "PLAGUE"
  | "FLOOD"
  | "WILDFIRE"
  | "GLOBAL";

export interface MatchCard {
  id: string;
  name: string;
  type: CardType;
  tier?: number;
  pointsDelta?: number;
  drawCount?: number;
  effect?: string;
  description?: string;
  disasterKind?: DisasterKind;
  blocksDisaster?: DisasterKind;
  primitives?: any[];
  discardCost?: number;
  gainHealth?: number;
}

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
  | 'REDIRECT_NEXT_NEGATIVE'
  | 'RESET_HAND_5'
  | 'PREVENT_HEALTH_REGAIN'
  | 'LOSE_1_PT_PER_TURN_3'
  | 'LOSE_1_HEALTH_PER_TURN_2'
  | 'DISABLE_SURVIVAL_NEXT_TURN'
  | 'SKIP_NEXT_DRAW'
  | 'NEGATE_ALL_SURVIVAL_THIS_TURN'
  | 'POINTS_PER_TURN_1'
  | 'HEAL_1_PER_TURN'
  | 'SKIP_NEXT_TURN';

export interface Trigger {
  id: string;
  kind: TriggerKind;
  value?: any;
  duration: 'next_event' | 'turn' | 'round' | 'permanent';
  sourceCardId?: string;
}

export interface MatchPlayer {
  id: string;
  displayName: string;
  emoji: string;
  isBot: boolean;
  survivalPoints: number;
  health: number;
  hand: MatchCard[];
  powers: MatchCard[];
  traits: MatchCard[];
  triggers: Trigger[];
  twistEffect?: string;
  maxHandModifier?: number;
}

export interface MatchPayload {
  round: number;
  activePlayerIndex: number;
  players: MatchPlayer[];
  drawPile: MatchCard[];
  discardPile: MatchCard[];
  turnPile: MatchCard[];
  turnHistory: MatchCard[];
  topCard?: MatchCard;
  turnDirection: 1 | -1;
  isGlobalDisasterPhase: boolean;
  winnerId?: string;
  cardsPlayedThisTurn: number;
  hasDrawnThisTurn: boolean;
  botTurnReplay?: BotTurnEvent[];
  isPaused?: boolean;
  disconnectedUserId?: string;
  previousState?: any;
}

export interface BotTurnEvent {
  actorId: string;
  actorName: string;
  action: "THINKING" | "DRAW" | "PLAY" | "END_TURN";
  cardName?: string;
  card?: MatchCard;
  targetPlayerId?: string;
}

export type MatchAction =
  | { type: "INIT_MATCH"; botCount?: number }
  | { type: "DRAW_CARD" }
  | { type: "PLAY_CARD"; cardId: string; targetPlayerId?: string }
  | { type: "DISCARD_CARD"; cardId: string }
  | { type: "END_TURN" }
  | { type: "SET_WINNER"; winnerUserId: string }
  | { type: "UNDO_LAST_TURN" };

export interface StateEnvelope {
  revision: number;
  updatedAtEpochMs: number;
  updatedByUserId: string;
  payload: MatchPayload;
}
