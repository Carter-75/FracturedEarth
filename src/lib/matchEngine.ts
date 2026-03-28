import { generateNamedBaseCards } from "@/lib/cardCatalog";

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

function starterDeck(rng: () => number): MatchCard[] {
  const base = generateNamedBaseCards();
  const copies = base.flatMap((card) => [
    { ...card, id: `${card.id}_0` },
    { ...card, id: `${card.id}_1` },
  ]);
  return shuffle(copies, rng);
}

function evaluateWinner(state: MatchPayload): string | undefined {
  const byScore = state.players.find((p) => p.survivalPoints >= 100)?.id;
  if (byScore) return byScore;
  const alive = state.players.filter((p) => p.health > 0);
  return alive.length === 1 ? alive[0].id : undefined;
}

function playCardImmediate(state: MatchPayload, card: MatchCard): MatchPayload {
  let next: MatchPayload = {
    ...state,
    discardPile: [...state.discardPile, card],
  };
  const active = next.players[next.activePlayerIndex];

  if (card.type === "TWIST") {
    const effect = card.effect;
    let updatedPlayer = { ...active };

    if (effect === "draw_3") {
      let tempState = { ...next };
      for (let i = 0; i < 3; i++) {
        tempState = drawForActive(tempState);
      }
      next = tempState;
    } else if (effect === "gain_2_health") {
      updatedPlayer.health += 2;
    } else if (effect === "gain_5_points") {
      updatedPlayer.survivalPoints += 5;
    } else if (effect === "skip_turn") {
      updatedPlayer = { ...updatedPlayer, twistEffect: "skip_next" };
    } else if (effect === "lose_1_health") {
      updatedPlayer.health = Math.max(0, updatedPlayer.health - 1);
    } else if (effect === "block_red" || effect === "block_blue") {
      updatedPlayer.twistEffect = effect;
    } else if (effect === "draw_ascended") {
      const ascended = next.drawPile.find((c) => c.type === "ASCENDED");
      if (ascended) {
        updatedPlayer.hand.push(ascended);
        next.drawPile = next.drawPile.filter((c) => c.id !== ascended.id);
      }
    } else if (effect === "draw_2_cards") {
      let tempState = { ...next };
      for (let i = 0; i < 2; i++) {
        tempState = drawForActive(tempState);
      }
      next = tempState;
    } else if (effect === "restore_2_health") {
      updatedPlayer.health += 2;
    } else if (effect === "lose_2_health") {
      updatedPlayer.health = Math.max(0, updatedPlayer.health - 2);
    } else if (effect === "gain_or_lose_3") {
      updatedPlayer.survivalPoints += Math.random() > 0.5 ? 3 : -3;
    }

    const players = [...next.players];
    players[next.activePlayerIndex] = updatedPlayer;
    next = { ...next, players };
  } else if (card.type === "CATACLYSM") {
    const players = [...next.players].map((p, idx) => {
      if (idx === next.activePlayerIndex) {
        return {
          ...p,
          survivalPoints: Math.max(0, p.survivalPoints - card.pointsDelta),
          health: Math.max(0, p.health - 3),
        };
      }
      return { ...p, health: Math.max(0, p.health - 1) };
    });
    next = { ...next, players };
  }

  return { ...next, winnerId: evaluateWinner(next) };
}

function drawForActive(state: MatchPayload): MatchPayload {
  if (state.drawPile.length === 0) return state;
  const card = state.drawPile[0];

  if (card.type === "TWIST" || card.type === "CATACLYSM") {
    return playCardImmediate(
      {
        ...state,
        drawPile: state.drawPile.slice(1),
        hasDrawnThisTurn: true,
      },
      card
    );
  }

  const active = state.players[state.activePlayerIndex];
  const updatedActive: MatchPlayer = {
    ...active,
    hand: [...active.hand, card],
  };
  const players = [...state.players];
  players[state.activePlayerIndex] = updatedActive;
  return {
    ...state,
    players,
    drawPile: state.drawPile.slice(1),
    hasDrawnThisTurn: true,
  };
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

function applyDisaster(
  state: MatchPayload,
  card: MatchCard,
  targetId?: string
): MatchPayload {
  const active = state.players[state.activePlayerIndex];
  const targets =
    card.disasterKind === "GLOBAL"
      ? state.players.filter((p) => p.id !== active.id)
      : targetId
        ? state.players.filter((p) => p.id === targetId)
        : [];

  let players = [...state.players];
  for (const target of targets) {
    const idx = players.findIndex((p) => p.id === target.id);
    if (idx < 0) continue;
    const current = players[idx];
    const blocker = current.powers.find(
      (t) => t.blocksDisaster === card.disasterKind
    );
    if (blocker) {
      const keepPowers =
        blocker.type === "ADAPT"
          ? current.powers.filter((t) => t.id !== blocker.id)
          : current.powers;
      players[idx] = { ...current, powers: keepPowers };
      continue;
    }
    players[idx] = {
      ...current,
      health: Math.max(0, current.health + card.pointsDelta),
    };
  }

  return {
    ...state,
    players,
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
  let next: MatchPayload = {
    ...state,
    players: state.players.map((p, i) =>
      i === activeIndex ? { ...active, hand: newHand } : p
    ),
    discardPile: [...state.discardPile, card],
    topCard: card,
    turnPile: [...state.turnPile, card],
    cardsPlayedThisTurn: state.cardsPlayedThisTurn + 1,
  };

  const effect = card.effect;
  let players = [...next.players];
  let updatedActive = { ...players[activeIndex] };

  switch (card.type) {
    case "SURVIVAL": {
      let points = card.pointsDelta;
      if (effect === "points_per_health") points = points * updatedActive.health;
      if (effect === "combo_survival") points += next.turnPile.filter(c => c.type === "SURVIVAL").length;
      if (effect === "low_health_bonus" && updatedActive.health < 3) points *= 2;
      if (effect === "points_per_power") points += updatedActive.powers.length;
      
      updatedActive.survivalPoints += points;
      updatedActive.health += (card.gainHealth ?? 0);
      players[activeIndex] = updatedActive;
      next = { ...next, players };
      
      for (let i = 0; i < card.drawCount; i++) {
        next = drawForActive(next);
      }
      break;
    }
    case "DISASTER":
      next = applyDisaster(next, card, targetPlayerId);
      break;
    case "POWER":
    case "ADAPT": {
      updatedActive.powers.push(card);
      players[activeIndex] = updatedActive;
      next = { ...next, players };
      break;
    }
    case "CHAOS": {
      if (effect === "steal_points" && targetPlayerId) {
        const tIdx = players.findIndex(p => p.id === targetPlayerId);
        if (tIdx >= 0) {
          const stolen = Math.min(players[tIdx].survivalPoints, 5);
          players[tIdx].survivalPoints -= stolen;
          updatedActive.survivalPoints += stolen;
        }
      } else if (effect === "damage_all") {
        players = players.map((p, i) => i === activeIndex ? p : { ...p, health: Math.max(0, p.health - 1) });
      } else if (effect === "health_for_points") {
        updatedActive.health = Math.max(0, updatedActive.health - 1);
        updatedActive.survivalPoints += 10;
      } else {
        updatedActive.survivalPoints += card.pointsDelta;
      }
      players[activeIndex] = updatedActive;
      next = { ...next, players };
      break;
    }
    case "ASCENDED": {
      if (effect === "extra_action") {
        next.cardsPlayedThisTurn--;
      } else if (effect === "reverse_turn_order") {
        next.turnDirection = (next.turnDirection === 1 ? -1 : 1);
      } else if (effect === "swap_hands" && targetPlayerId) {
        const tIdx = players.findIndex(p => p.id === targetPlayerId);
        if (tIdx >= 0) {
          const tempHand = [...updatedActive.hand];
          updatedActive.hand = [...players[tIdx].hand];
          players[tIdx].hand = tempHand;
        }
      }
      updatedActive.survivalPoints += card.pointsDelta;
      updatedActive.health += (card.gainHealth ?? 0);
      players[activeIndex] = updatedActive;
      next = { ...next, players };
      for (let i = 0; i < card.drawCount; i++) {
        next = drawForActive(next);
      }
      break;
    }
  }

  return {
    ...next,
    winnerId: evaluateWinner(next),
  };
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

export function initializeMatch(input: {
  roomPlayers: Array<{
    userId: string;
    displayName: string;
    emoji: string;
    isBot?: boolean;
  }>;
  roomCode: string;
  botCount?: number;
}): MatchPayload {
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
  const fullDeck = starterDeck(rng);
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
    health: 5,
    hand: safeForInitial.slice(index * 5, index * 5 + 5),
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

export function applyMatchAction(input: {
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
}): MatchPayload {
  const current = input.current;
  const action = input.action;
  const active = current.players[current.activePlayerIndex];
  const isActorInRoom = input.roomPlayers.some(
    (p) => p.userId === input.actorUserId
  );

  if (!isActorInRoom) {
    throw new Error("Actor is not in room");
  }

  if (action.type === "INIT_MATCH") {
    return initializeMatch({
      roomPlayers: input.roomPlayers,
      roomCode: input.roomCode,
      botCount: action.botCount,
    });
  }

  if (current.winnerId && action.type !== "SET_WINNER") {
    throw new Error("Match already finished");
  }

  switch (action.type) {
    case "DRAW_CARD": {
      if (active.id !== input.actorUserId) throw new Error("Not your turn");
      if (current.hasDrawnThisTurn) {
        throw new Error("You can only draw once per turn");
      }
      const next = drawForActive(current);
      return { ...next, botTurnReplay: undefined };
    }
    case "PLAY_CARD": {
      if (active.id !== input.actorUserId) throw new Error("Not your turn");
      if (!current.hasDrawnThisTurn) {
        throw new Error("Draw a card before playing");
      }
      if (current.cardsPlayedThisTurn >= 3) {
        throw new Error("Max 3 cards per turn");
      }
      const next = playCard(current, action.cardId, action.targetPlayerId);
      return { ...next, botTurnReplay: undefined };
    }
    case "END_TURN": {
      if (active.id !== input.actorUserId) throw new Error("Not your turn");
      if (!current.hasDrawnThisTurn) {
        throw new Error("You must draw before ending turn");
      }
      const next = advanceTurn(current);
      const resolved = runBotTurnsUntilHuman(next);
      return { ...resolved.state, botTurnReplay: resolved.replay };
    }
    case "SET_WINNER": {
      if (!current.players.some((p) => p.id === action.winnerUserId)) {
        throw new Error("Winner not found");
      }
      return {
        ...current,
        winnerId: action.winnerUserId,
        botTurnReplay: undefined,
      };
    }
    default:
      return current;
  }
}
