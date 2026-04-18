export type CardType =
  | 'SURVIVAL'
  | 'DISASTER'
  | 'POWER'
  | 'ADAPT'
  | 'CHAOS'
  | 'ASCENDED'
  | 'TWIST'
  | 'CATACLYSM';

export type MatchMode = 'practice' | 'live' | 'private';

export type DisasterKind =
  | 'EARTHQUAKE'
  | 'PLAGUE'
  | 'FLOOD'
  | 'WILDFIRE'
  | 'GLOBAL';

export type ResolutionStatus = 'pending' | 'resolved' | 'truncated' | 'failed';
export type EffectClassification = 'clear' | 'ambiguous' | 'broken';

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
  effectSteps?: string[];
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
  | 'NEGATE_ALL_SURVIVAL_THIS_TURN'
  | 'POINTS_PER_TURN_1'
  | 'HEAL_1_PER_TURN'
  | 'SKIP_NEXT_TURN'
  | 'SKIP_NEXT_ACTION'
  | 'PREVENT_TURN_SKIP'
  | 'PREVENT_TURN_REVERSE'
  | 'DISABLE_POWERS_NEXT_TURN'
  | 'POINTS_PER_SURVIVAL_1'
  | 'POINTS_PER_PINNED_SURVIVAL_1'
  | 'SURVIVAL_PLUS_1_PT'
  | 'REVIVE_TO_2'
  | 'DRAW_WHEN_PINNED_1'
  | 'DISCARD_AFTER_USE'
  | 'DOUBLE_NEXT_CATAC_EFFECT'
  | 'PREVENT_HEALTH_LOSS_GLOBAL'
  | 'BLOCK_EARTHQUAKE_DRAW_1'
  | 'BLOCK_WILDFIRE_DRAW_1'
  | 'DISABLE_SURVIVAL_NEXT_TURN'
  | 'CONVERT_NEXT_DISASTER_LOSS_TO_POINTS'
  | 'IGNORE_RULE';

export interface Trigger {
  id: string;
  kind: TriggerKind;
  value?: unknown;
  duration: 'next_event' | 'turn' | 'round' | 'permanent';
  sourceCardId?: string;
}

export interface ResolutionFrame {
  sourceCardId: string;
  sourceCardType: CardType;
  slotIndex?: number;
  targetPlayerId?: string;
  interruptedBy?: string;
  status: ResolutionStatus;
}

export interface ResolutionResult {
  frames: ResolutionFrame[];
  winnerId?: string;
  stateChanged: boolean;
}

export interface PlayerStateSlot {
  slotIndex: number;
  cardId?: string;
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

export interface GameState {
  mode: MatchMode;
  roomCode: string;
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
  previousState?: unknown;
  revision?: number;
  lastBotActionEpochMs?: number;
  pendingResolution?: ResolutionFrame[];
  occupiedSlots: PlayerStateSlot[];
}

export type MatchPayload = GameState;

export interface BotTurnEvent {
  actorId: string;
  actorName: string;
  action: 'THINKING' | 'DRAW' | 'PLAY' | 'DISCARD' | 'END_TURN';
  cardName?: string;
  card?: MatchCard;
  targetPlayerId?: string;
  slotIndex?: number;
}

export type MatchAction =
  | { type: 'INIT_MATCH'; botCount?: number }
  | { type: 'DRAW_CARD' }
  | { type: 'PLAY_CARD'; cardId: string; targetPlayerId?: string; slotIndex: number }
  | { type: 'DISCARD_CARD'; cardId: string }
  | { type: 'END_TURN' }
  | { type: 'SET_WINNER'; winnerUserId: string };

export interface StateEnvelope {
  revision: number;
  updatedAtEpochMs: number;
  updatedByUserId: string;
  payload: MatchPayload;
}

export interface ServerMatchSnapshot {
  matchId: string;
  mode: MatchMode;
  revision: number;
  seed: number;
  payload: MatchPayload;
  updatedAtEpochMs: number;
}

export interface CardEffect {
  cardId: string;
  effectId: string;
  classification: EffectClassification;
  description?: string;
  notes?: string;
}
