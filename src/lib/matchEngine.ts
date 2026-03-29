import { generateNamedBaseCards } from "./cardCatalog";
import { 
  MAX_HAND_SIZE, 
  WINNING_POINTS, 
  INITIAL_HEALTH, 
  MAX_ACTIONS_PER_TURN, 
  STARTING_HAND_SIZE 
} from "./gameConfig";

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
  pointsDelta: number;
  drawCount: number;
  tier?: 1 | 2 | 3 | 4 | 5;
  effect?: string;
  gainHealth?: number;
  healthDelta?: number;
  disasterKind?: DisasterKind;
  blocksDisaster?: DisasterKind;
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
  topCard?: MatchCard;
  turnDirection: 1 | -1;
  isGlobalDisasterPhase: boolean;
  winnerId?: string;
  cardsPlayedThisTurn: number;
  hasDrawnThisTurn: boolean;
  botTurnReplay?: BotTurnEvent[];
}

export function canPlayCard(state: MatchPayload, card: MatchCard): boolean {
  const active = state.players[state.activePlayerIndex];
  
  // Handle color blocking from Twist effects
  if (active?.twistEffect === "block_red" && card.name.toLowerCase().includes("red")) return false;
  if (active?.twistEffect === "block_blue" && card.name.toLowerCase().includes("blue")) return false;

  return true; // Core rule: Play up to 3 of any cards per turn
}

export interface BotTurnEvent {
  actorId: string;
  actorName: string;
  action: "DRAW" | "PLAY" | "END_TURN";
  cardName?: string;
  targetPlayerId?: string;
}

export type MatchAction =
  | { type: "INIT_MATCH"; botCount?: number }
  | { type: "DRAW_CARD" }
  | { type: "PLAY_CARD"; cardId: string; targetPlayerId?: string }
  | { type: "DISCARD_CARD"; cardId: string }
  | { type: "END_TURN" }
  | { type: "SET_WINNER"; winnerUserId: string };

function pseudoRandom(seed: number): () => number {
  let x = seed || 123456789;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return Math.abs(x) / 2147483647;
  };
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const next = [...arr];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const t = next[i];
    next[i] = next[j];
    next[j] = t;
  }
  return next;
}

async function starterDeck(rng: () => number): Promise<MatchCard[]> {
  const base = await generateNamedBaseCards();
  const copies = base.flatMap((card) => [
    { ...card, id: `${card.id}_0` },
    { ...card, id: `${card.id}_1` },
  ]);
  return shuffle(copies, rng);
}

function evaluateWinner(state: MatchPayload): string | undefined {
  const byScore = state.players.find((p) => p.survivalPoints >= WINNING_POINTS)?.id;
  if (byScore) return byScore;
  const alive = state.players.filter((p) => p.health > 0);
  return alive.length === 1 ? alive[0].id : undefined;
}

function getPlayerMaxHand(player: MatchPlayer): number {
  return MAX_HAND_SIZE + (player.maxHandModifier ?? 0);
}

function resolveEffect(state: MatchPayload, card: MatchCard, targetId?: string): MatchPayload {
  const effect = card.effect || "";
  const activeIndex = state.activePlayerIndex;
  const players = [...state.players];
  let active = { ...players[activeIndex] };
  let next = { ...state, players };

  // Helper to get target index
  const tIdx = targetId ? players.findIndex(p => p.id === targetId) : -1;

  if (card.type === "SURVIVAL") {
    let yield_val = card.pointsDelta;
    if (effect.includes("maximizes_yield_when_health_is_5") && active.health === 5) yield_val = 6;
    if (effect.includes("doubles_output_6_if_health_3") && active.health <= 3) yield_val = 6;
    if (effect.includes("1_pt_for_each_pinned_power_card")) yield_val += active.powers.length;
    if (effect.includes("1_if_chaos_card_played_previously") && state.turnPile.some(c => c.type === "CHAOS")) yield_val += 1;
    active.survivalPoints += yield_val;
    active.health = Math.min(INITIAL_HEALTH, active.health + (card.gainHealth ?? 0));
    if (effect.includes("2_health_if_first_card_played_this_turn") && state.cardsPlayedThisTurn === 1) {
      active.health = Math.min(INITIAL_HEALTH, active.health + 2);
    }
    if (effect.includes("draw_2_cards")) { for(let i=0; i<2; i++) next = drawForActive(next); }
    if (effect.includes("draw_3_cards")) { for(let i=0; i<3; i++) next = drawForActive(next); }
    if (effect.includes("draw_1_card")) { next = drawForActive(next); }
    if (effect.includes("hand_limit_temporarily_1")) active.maxHandModifier = (active.maxHandModifier ?? 0) + 1;
  }

  if (card.type === "DISASTER") {
    next = applyDisaster(next, card, targetId);
  }

  // POWER and ADAPT effects logic (not placement, placement handled in playCard)
  if (card.type === "POWER" || card.type === "ADAPT") {
    active.survivalPoints += card.pointsDelta || 0;
    if (card.gainHealth) active.health = Math.min(INITIAL_HEALTH, active.health + card.gainHealth);
    
    if (effect.includes("draw_1_card_when_pinned")) next = drawForActive(next);
    if (effect.includes("restore_1_health")) active.health = Math.min(INITIAL_HEALTH, active.health + 1);
  }

  if (card.type === "CHAOS") {
    active.survivalPoints += card.pointsDelta || 0;
    if (card.gainHealth) active.health = Math.min(INITIAL_HEALTH, active.health + card.gainHealth);
    if (effect.includes("take_1_card_from_discard_pile") && state.discardPile.length > 0) {
      active.hand.push(state.discardPile[state.discardPile.length - 1]);
      next.discardPile = state.discardPile.slice(0, -1);
    }
    if (effect.includes("steal_5_points") && tIdx >= 0) {
      const stolen = Math.min(players[tIdx].survivalPoints, 5);
      players[tIdx].survivalPoints -= stolen;
      active.survivalPoints += stolen;
    }
    if (effect.includes("lose_1_health_for_10_points")) {
      active.health = Math.max(0, active.health - 1);
      active.survivalPoints += 10;
    }
  }

  if (card.type === "TWIST") {
    active.survivalPoints += card.pointsDelta || 0;
    active.health = Math.min(INITIAL_HEALTH, active.health + (card.gainHealth ?? 0));
    if (effect.includes("everyone_draws_3_cards")) {
        players.forEach((p, idx) => {
            // Simplified everyone draw - avoid recursion for now
        });
    }
    if (effect.includes("5050_chance")) active.survivalPoints += Math.random() > 0.5 ? 3 : -3;
    if (effect.includes("skip_your_next_turn")) active.twistEffect = "skip_next";
    if (effect.includes("temporarily_increase_max_hand_to_6")) active.maxHandModifier = 1;
    if (effect.includes("swap_two_of_your_own_cards")) { /* shuffle hand */ }
  }

  if (card.type === "CATACLYSM") {
    active.survivalPoints += card.pointsDelta || 0;
    if (effect.includes("strike_all_players")) {
        players.forEach((p, idx) => { if(idx !== activeIndex) p.health = Math.max(0, p.health - 1); });
    }
    if (effect.includes("target_loses_5_health") && tIdx >= 0) players[tIdx].health = Math.max(0, players[tIdx].health - 5);
    if (effect.includes("skip_next_turn")) active.twistEffect = "skip_next";
  }

  if (card.type === "ASCENDED") {
    active.survivalPoints += card.pointsDelta || 0;
    active.health = Math.min(INITIAL_HEALTH, active.health + (card.gainHealth ?? 0));
    if (effect.includes("revive_to_2_health_when_reaching_0")) { /* handled eventually */ }
    if (effect.includes("extra_action")) next.cardsPlayedThisTurn--;
  }

  next.players[activeIndex] = active;

  // Generic Draw Effect pipeline for all cards (Fixes Bug 1 Twist Draw)
  if (card.drawCount && card.drawCount > 0) {
    for (let i = 0; i < card.drawCount; i++) {
       next = drawForActive(next);
    }
  }

  return next;
}

function drawForActive(state: MatchPayload): MatchPayload {
  let drawPile = [...state.drawPile];
  let discardPile = [...state.discardPile];

  if (drawPile.length === 0) {
    if (discardPile.length === 0) return state;
    // Reshuffle discard into draw pile
    drawPile = shuffle(discardPile, pseudoRandom(Math.random() * 1000));
    discardPile = [];
  }

  const card = drawPile[0];
  const remainingDrawPile = drawPile.slice(1);
  const active = state.players[state.activePlayerIndex];

  if (card.type === "TWIST" || card.type === "CATACLYSM") {
    return playCardImmediate(
      {
        ...state,
        drawPile: remainingDrawPile,
        discardPile,
        hasDrawnThisTurn: true,
      },
      card
    );
  }

  const updatedActive: MatchPlayer = {
    ...active,
    hand: [...active.hand, card],
  };
  const players = [...state.players];
  players[state.activePlayerIndex] = updatedActive;
  return {
    ...state,
    players,
    drawPile: remainingDrawPile,
    discardPile,
    hasDrawnThisTurn: true,
  };
}

function playCardImmediate(state: MatchPayload, card: MatchCard): MatchPayload {
  // A card is pinned to the user's power slot if it's explicitly a permanent protection or power,
  // EXCEPT if its effect text explicitly specifies "discard" or "consumed" after use.
  const isPinned = 
    Boolean(card.blocksDisaster) || 
    ((card.type === "POWER" || card.type === "ADAPT") && !card.effect?.includes("discard") && !card.effect?.includes("consumed"));

  const activeIndex = state.activePlayerIndex;
  const active = { ...state.players[activeIndex] };
  let next = {
    ...state,
    topCard: card,
    turnPile: [...state.turnPile, card],
    cardsPlayedThisTurn: state.cardsPlayedThisTurn + 1,
  };

  if (isPinned) {
    active.powers = [...active.powers, card];
    const newPlayers = [...state.players];
    newPlayers[activeIndex] = active;
    next.players = newPlayers;
  } else {
    next.discardPile = [...state.discardPile, card];
  }

  return resolveEffect(next, card);
}

function advanceTurn(state: MatchPayload): MatchPayload {
  const dir = state.turnDirection || 1;
  const nextIndex = (state.activePlayerIndex + dir + state.players.length) % state.players.length;
  const wrapsRound = (dir === 1 && nextIndex === 0) || (dir === -1 && nextIndex === state.players.length - 1);
  const nextRound = wrapsRound ? state.round + 1 : state.round;
  
  return {
    ...state,
    activePlayerIndex: nextIndex,
    round: nextRound,
    isGlobalDisasterPhase: wrapsRound && nextRound % 3 === 0,
    cardsPlayedThisTurn: 0,
    hasDrawnThisTurn: false,
    turnPile: [],
    botTurnReplay: undefined,
  };
}


function playCard(
  state: MatchPayload,
  cardId: string,
  targetPlayerId?: string
): MatchPayload {
  const activeIndex = state.activePlayerIndex;
  const active = state.players[activeIndex];
  const card = active.hand.find((c) => c.id === cardId);
  if (!card) throw new Error("Card not in hand");
  if (!canPlayCard(state, card)) throw new Error("Card does not match top card");

  const newHand = active.hand.filter((c) => c.id !== card.id);
  const isPinned = 
    Boolean(card.blocksDisaster) || 
    ((card.type === "POWER" || card.type === "ADAPT") && !card.effect?.includes("discard") && !card.effect?.includes("consumed"));
  
  let next: MatchPayload = {
    ...state,
    players: state.players.map((p, i) =>
      i === activeIndex 
        ? { ...active, hand: newHand, powers: isPinned ? [...active.powers, card] : active.powers } 
        : p
    ),
    discardPile: isPinned ? state.discardPile : [...state.discardPile, card],
    topCard: card,
    turnPile: [...state.turnPile, card],
    cardsPlayedThisTurn: state.cardsPlayedThisTurn + 1,
  };

  return resolveEffect(next, card, targetPlayerId);
}

function chooseBotAction(
  state: MatchPayload
): { cardId: string; cardName: string; targetPlayerId?: string } | null {
  const active = state.players[state.activePlayerIndex];
  if (!active.isBot || active.hand.length === 0) return null;

  const playable = active.hand.filter((c) => canPlayCard(state, c));
  if (playable.length === 0) return null;

  const targetLeader = state.players
    .filter((p) => p.id !== active.id)
    .sort((a, b) => b.survivalPoints - a.survivalPoints)[0];

  // Simple priority: ASCENDED > DISASTER > CHAOS > SURVIVAL > rest
  let card = playable.find((c) => c.type === "ASCENDED");
  if (!card) card = playable.find((c) => c.type === "DISASTER");
  if (!card) card = playable.find((c) => c.type === "CHAOS");
  if (!card) card = playable.find((c) => c.type === "SURVIVAL");
  if (!card) card = playable[0];

  return {
    cardId: card.id,
    cardName: card.name,
    targetPlayerId: targetLeader?.id,
  };
}

function runBotTurnsUntilHuman(state: MatchPayload): {
  state: MatchPayload;
  replay: BotTurnEvent[];
} {
  let next = state;
  const replay: BotTurnEvent[] = [];

  while (!next.winnerId) {
    const active = next.players[next.activePlayerIndex];
    if (!active.isBot) break;

    replay.push({
      actorId: active?.id ?? "unknown",
      actorName: active?.displayName ?? "Unknown Player",
      action: "DRAW",
    });
    next = drawForActive(next);

    for (let i = 0; i < 3; i++) {
      const action = chooseBotAction(next);
      if (!action) break;

      replay.push({
        actorId: active?.id ?? "unknown",
        actorName: active?.displayName ?? "Unknown Player",
        action: "PLAY",
        cardName: action.cardName,
        targetPlayerId: action.targetPlayerId,
      });

      next = playCard(next, action.cardId, action.targetPlayerId);
      if (next.winnerId) break;
    }

    replay.push({
      actorId: active?.id ?? "unknown",
      actorName: active?.displayName ?? "Unknown Player",
      action: "END_TURN",
    });
    next = advanceTurn(next);
  }

  return { state: next, replay };
}

export async function initializeMatch(input: {
  roomPlayers: Array<{
    userId: string;
    displayName: string;
    emoji: string;
    isBot?: boolean;
  }>;
  roomCode: string;
  botCount?: number;
}): Promise<MatchPayload> {
  const botsToAdd = Math.max(0, Math.min(3, input.botCount ?? 0));
  const roomPlayers = input.roomPlayers
    .slice(0, 4)
    .map((p) => ({ ...p, isBot: Boolean(p.isBot) }));

  for (let i = 0; i < botsToAdd && roomPlayers.length < 4; i++) {
    roomPlayers.push({
      userId: `bot_${i}`,
      displayName: `Bot ${i + 1}`,
      emoji: "🤖",
      isBot: true,
    });
  }

  const seed = input.roomCode
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const rng = pseudoRandom(seed || 7);
  const fullDeck = await starterDeck(rng);
  const safeForInitial = fullDeck.filter(
    (c) => c.type !== "TWIST" && c.type !== "CATACLYSM"
  );
  const delayedCards = fullDeck.filter(
    (c) => c.type === "TWIST" || c.type === "CATACLYSM"
  );

  const players: MatchPlayer[] = roomPlayers.map((p, index) => ({
    id: p.userId,
    displayName: p.displayName,
    emoji: p.emoji,
    isBot: Boolean(p.isBot),
    survivalPoints: 0,
    health: INITIAL_HEALTH,
    hand: safeForInitial.slice(index * STARTING_HAND_SIZE, index * STARTING_HAND_SIZE + STARTING_HAND_SIZE),
    powers: [],
  }));

  const usedIds = new Set(players.flatMap((p) => p.hand.map((c) => c.id)));
  const safeRemaining = safeForInitial.filter((c) => !usedIds.has(c.id));
  const drawPile = shuffle([...safeRemaining, ...delayedCards], rng);

  return {
    round: 1,
    activePlayerIndex: 0,
    players,
    drawPile: drawPile.slice(1),
    discardPile: [drawPile[0]],
    topCard: drawPile[0],
    turnDirection: 1,
    turnPile: [],
    isGlobalDisasterPhase: false,
    cardsPlayedThisTurn: 0,
    hasDrawnThisTurn: false,
    botTurnReplay: undefined,
  };
}

export async function applyMatchAction(input: {
  current: MatchPayload;
  action: MatchAction;
  actorUserId: string;
  roomPlayers: Array<{
    userId: string;
    displayName: string;
    emoji: string;
    isBot?: boolean;
  }>;
  roomCode: string;
}): Promise<MatchPayload> {
  let state = { ...input.current };
  const action = input.action;
  const active = state.players[state.activePlayerIndex];
  const isActorInRoom = input.roomPlayers.some(
    (p) => p.userId === input.actorUserId
  );

  if (!isActorInRoom) {
    throw new Error("Actor is not in room");
  }

  if (action.type === "INIT_MATCH") {
    return await initializeMatch({
      roomPlayers: input.roomPlayers,
      roomCode: input.roomCode,
      botCount: action.botCount,
    });
  }

  if (state.winnerId && action.type !== "SET_WINNER") {
    throw new Error("Match already finished");
  }

  switch (action.type) {
    case "DRAW_CARD": {
      if (active.id !== input.actorUserId) throw new Error("Not your turn");
      if (state.hasDrawnThisTurn) {
        throw new Error("You can only draw once per turn");
      }
      const next = drawForActive(state);
      return { ...next, botTurnReplay: undefined };
    }
    case "PLAY_CARD": {
      if (active.id !== input.actorUserId) throw new Error("Not your turn");
      if (!state.hasDrawnThisTurn) {
        throw new Error("Draw a card before playing");
      }
      if (state.cardsPlayedThisTurn >= MAX_ACTIONS_PER_TURN) {
        throw new Error(`Max ${MAX_ACTIONS_PER_TURN} cards per turn`);
      }
      const next = playCard(state, action.cardId, action.targetPlayerId);
      return { ...next, botTurnReplay: undefined };
    }
    case "DISCARD_CARD": {
      if (active.id !== input.actorUserId) throw new Error("Not your turn");
      const idx = active.hand.findIndex(c => c.id === action.cardId);
      if (idx === -1) throw new Error("Card not in hand");

      const card = active.hand[idx];
      const nextActive = { ...active, hand: active.hand.filter((_, i) => i !== idx) };
      const nextPlayers = [...state.players];
      nextPlayers[state.activePlayerIndex] = nextActive;
      
      return {
        ...state,
        players: nextPlayers,
        discardPile: [card, ...state.discardPile],
        botTurnReplay: undefined,
      };
    }
    case "END_TURN": {
      if (active.id !== input.actorUserId) throw new Error("Not your turn");
      if (!state.hasDrawnThisTurn) {
        throw new Error("You must draw before ending turn");
      }
      // END TURN RULE: Must be at or below max hand size
      if (active.hand.length > getPlayerMaxHand(active)) {
        throw new Error(`Must discard cards. Hand size limit: ${getPlayerMaxHand(active)}`);
      }
      const next = advanceTurn(state);
      const resolved = runBotTurnsUntilHuman(next);
      return { ...resolved.state, botTurnReplay: resolved.replay };
    }
    case "SET_WINNER": {
      if (!state.players.some((p) => p.id === action.winnerUserId)) {
        throw new Error("Winner not found");
      }
      return {
        ...state,
        winnerId: action.winnerUserId,
        botTurnReplay: undefined,
      };
    }
    default:
      return state;
  }
}

function applyDisaster(state: MatchPayload, card: MatchCard, targetId?: string): MatchPayload {
  const players = [...state.players];
  const activeIndex = state.activePlayerIndex;
  
  // Identify targets
  let targets: MatchPlayer[] = [];
  const effect = card.effect || "";

  if (effect.includes("all_opponents") || card.disasterKind === "GLOBAL") {
    targets = players.filter((_, idx) => idx !== activeIndex);
  } else if (effect.includes("all_players")) {
    targets = players;
  } else if (targetId) {
    const t = players.find(p => p.id === targetId);
    if (t) targets = [t];
  }

  for (const target of targets) {
    const tIdx = players.findIndex(p => p.id === target.id);
    if (tIdx < 0) continue;

    // Check protection
    const hasProtection = players[tIdx].powers.find(p => p.blocksDisaster === card.disasterKind);
    if (hasProtection && card.disasterKind !== "GLOBAL") {
      // Consume protection
      players[tIdx].powers = players[tIdx].powers.filter(p => p.id !== hasProtection.id);
      continue;
    }

    // Apply negative effects
    // Note: I'll handle both pointsDelta (loss) and health changes
    const pLoss = Math.abs(card.pointsDelta); // Assuming disasters have positive pointsDelta representing loss
    players[tIdx].survivalPoints = Math.max(0, players[tIdx].survivalPoints - pLoss);
    
    // Health changes
    const hLoss = card.healthDelta ? Math.abs(card.healthDelta) : (card.gainHealth || 0);
    players[tIdx].health = Math.max(0, players[tIdx].health - hLoss);
  }

  return { ...state, players };
}
