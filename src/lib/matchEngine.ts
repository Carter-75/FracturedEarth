export type CardType = 'SURVIVAL' | 'DISASTER' | 'TRAIT' | 'ADAPT' | 'CHAOS';
export type DisasterKind = 'EARTHQUAKE' | 'PLAGUE' | 'FLOOD' | 'WILDFIRE' | 'GLOBAL';

export interface MatchCard {
  id: string;
  name: string;
  type: CardType;
  pointsDelta: number;
  drawCount: number;
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
  traits: MatchCard[];
}

export interface MatchPayload {
  round: number;
  activePlayerIndex: number;
  players: MatchPlayer[];
  drawPile: MatchCard[];
  discardPile: MatchCard[];
  isGlobalDisasterPhase: boolean;
  winnerId?: string;
  cardsPlayedThisTurn: number;
}

export type MatchAction =
  | { type: 'INIT_MATCH'; botCount?: number }
  | { type: 'DRAW_CARD' }
  | { type: 'PLAY_CARD'; cardId: string; targetPlayerId?: string }
  | { type: 'END_TURN' }
  | { type: 'SET_WINNER'; winnerUserId: string };

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

function generateBaseCards(): MatchCard[] {
  const disasters: DisasterKind[] = ['EARTHQUAKE', 'PLAGUE', 'FLOOD', 'WILDFIRE'];
  const cards: MatchCard[] = [];

  for (let i = 1; i <= 25; i++) {
    cards.push({
      id: `survival_${i}`,
      name: `Survival ${i}`,
      type: 'SURVIVAL',
      pointsDelta: i % 5 === 0 ? 4 : 2,
      drawCount: i % 7 === 0 ? 1 : 0,
    });
  }
  for (let i = 1; i <= 25; i++) {
    cards.push({
      id: `disaster_${i}`,
      name: `Disaster ${i}`,
      type: 'DISASTER',
      pointsDelta: i % 6 === 0 ? -2 : -1,
      drawCount: 0,
      disasterKind: disasters[(i - 1) % disasters.length],
    });
  }
  for (let i = 1; i <= 25; i++) {
    cards.push({
      id: `trait_${i}`,
      name: `Trait ${i}`,
      type: 'TRAIT',
      pointsDelta: 0,
      drawCount: 0,
      blocksDisaster: disasters[(i - 1) % disasters.length],
    });
  }
  for (let i = 1; i <= 25; i++) {
    cards.push({
      id: `adapt_${i}`,
      name: `Adapt ${i}`,
      type: 'ADAPT',
      pointsDelta: 0,
      drawCount: 0,
      blocksDisaster: disasters[(i - 1) % disasters.length],
    });
  }
  for (let i = 1; i <= 25; i++) {
    cards.push({
      id: `chaos_${i}`,
      name: `Chaos ${i}`,
      type: 'CHAOS',
      pointsDelta: i % 9 === 0 ? 4 : 3,
      drawCount: 0,
      disasterKind: 'GLOBAL',
    });
  }

  return cards;
}

function starterDeck(rng: () => number): MatchCard[] {
  const base = generateBaseCards();
  const copies = base.flatMap((card) => [
    { ...card, id: `${card.id}_0` },
    { ...card, id: `${card.id}_1` },
  ]);
  return shuffle(copies, rng);
}

function evaluateWinner(state: MatchPayload): string | undefined {
  const byScore = state.players.find((p) => p.survivalPoints >= 50)?.id;
  if (byScore) return byScore;
  const alive = state.players.filter((p) => p.health > 0);
  return alive.length === 1 ? alive[0].id : undefined;
}

function drawForActive(state: MatchPayload): MatchPayload {
  if (state.drawPile.length === 0) return state;
  const active = state.players[state.activePlayerIndex];
  const card = state.drawPile[0];
  const updatedActive: MatchPlayer = { ...active, hand: [...active.hand, card] };
  const players = [...state.players];
  players[state.activePlayerIndex] = updatedActive;
  return {
    ...state,
    players,
    drawPile: state.drawPile.slice(1),
  };
}

function advanceTurn(state: MatchPayload): MatchPayload {
  const nextIndex = (state.activePlayerIndex + 1) % state.players.length;
  const wrapsRound = nextIndex === 0;
  const nextRound = wrapsRound ? state.round + 1 : state.round;
  return {
    ...state,
    activePlayerIndex: nextIndex,
    round: nextRound,
    isGlobalDisasterPhase: wrapsRound && nextRound % 3 === 0,
    cardsPlayedThisTurn: 0,
  };
}

function applyDisaster(state: MatchPayload, card: MatchCard, targetId?: string): MatchPayload {
  const active = state.players[state.activePlayerIndex];
  const targets =
    card.disasterKind === 'GLOBAL'
      ? state.players.filter((p) => p.id !== active.id)
      : targetId
      ? state.players.filter((p) => p.id === targetId)
      : [];

  let players = [...state.players];
  for (const target of targets) {
    const idx = players.findIndex((p) => p.id === target.id);
    if (idx < 0) continue;
    const current = players[idx];
    const blocker = current.traits.find((t) => t.blocksDisaster === card.disasterKind);
    if (blocker) {
      const keepTraits = blocker.type === 'ADAPT'
        ? current.traits.filter((t) => t.id !== blocker.id)
        : current.traits;
      players[idx] = { ...current, traits: keepTraits };
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

function playCard(state: MatchPayload, cardId: string, targetPlayerId?: string): MatchPayload {
  const active = state.players[state.activePlayerIndex];
  const card = active.hand.find((c) => c.id === cardId);
  if (!card) throw new Error('Card not in hand');

  const newHand = active.hand.filter((c) => c.id !== card.id);
  let next: MatchPayload = {
    ...state,
    players: state.players.map((p, i) => (i === state.activePlayerIndex ? { ...active, hand: newHand } : p)),
    discardPile: [...state.discardPile, card],
    cardsPlayedThisTurn: state.cardsPlayedThisTurn + 1,
  };

  switch (card.type) {
    case 'SURVIVAL': {
      const updated = {
        ...next.players[next.activePlayerIndex],
        survivalPoints: Math.max(0, next.players[next.activePlayerIndex].survivalPoints + card.pointsDelta),
      };
      const players = [...next.players];
      players[next.activePlayerIndex] = updated;
      next = { ...next, players };
      for (let i = 0; i < card.drawCount; i++) {
        next = drawForActive(next);
      }
      break;
    }
    case 'DISASTER':
      next = applyDisaster(next, card, targetPlayerId);
      break;
    case 'TRAIT':
    case 'ADAPT': {
      const updated = {
        ...next.players[next.activePlayerIndex],
        traits: [...next.players[next.activePlayerIndex].traits, card],
      };
      const players = [...next.players];
      players[next.activePlayerIndex] = updated;
      next = { ...next, players };
      break;
    }
    case 'CHAOS': {
      const players = next.players.map((p, i) => {
        if (i === next.activePlayerIndex) {
          return {
            ...p,
            survivalPoints: Math.max(0, p.survivalPoints + card.pointsDelta),
          };
        }
        return { ...p, health: Math.max(0, p.health - 1) };
      });
      next = { ...next, players };
      break;
    }
  }

  return {
    ...next,
    winnerId: evaluateWinner(next),
  };
}

function chooseBotAction(state: MatchPayload): { cardId: string; targetPlayerId?: string } | null {
  const active = state.players[state.activePlayerIndex];
  if (!active.isBot || active.hand.length === 0) return null;
  const targetLeader = state.players
    .filter((p) => p.id !== active.id)
    .sort((a, b) => b.survivalPoints - a.survivalPoints)[0];
  const preferredDisaster = active.hand.find((c) => c.type === 'DISASTER');
  const card = preferredDisaster ?? active.hand[0];
  return {
    cardId: card.id,
    targetPlayerId: targetLeader?.id,
  };
}

function runBotTurnsUntilHuman(state: MatchPayload): MatchPayload {
  let next = state;
  while (!next.winnerId) {
    const active = next.players[next.activePlayerIndex];
    if (!active.isBot) break;
    next = drawForActive(next);
    for (let i = 0; i < 3; i++) {
      const action = chooseBotAction(next);
      if (!action) break;
      next = playCard(next, action.cardId, action.targetPlayerId);
      if (next.winnerId) break;
    }
    next = advanceTurn(next);
  }
  return next;
}

export function initializeMatch(input: {
  roomPlayers: Array<{ userId: string; displayName: string; emoji: string; isBot?: boolean }>;
  roomCode: string;
  botCount?: number;
}): MatchPayload {
  const botsToAdd = Math.max(0, Math.min(3, input.botCount ?? 0));
  const roomPlayers = input.roomPlayers.slice(0, 4).map((p) => ({ ...p, isBot: Boolean(p.isBot) }));
  for (let i = 0; i < botsToAdd && roomPlayers.length < 4; i++) {
    roomPlayers.push({
      userId: `bot_${i}`,
      displayName: `Bot ${i + 1}`,
      emoji: '🤖',
      isBot: true,
    });
  }

  const seed = input.roomCode.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const rng = pseudoRandom(seed || 7);
  const deck = starterDeck(rng);

  const players: MatchPlayer[] = roomPlayers.map((p, index) => ({
    id: p.userId,
    displayName: p.displayName,
    emoji: p.emoji,
    isBot: Boolean(p.isBot),
    survivalPoints: 0,
    health: 3,
    hand: deck.slice(index * 5, index * 5 + 5),
    traits: [],
  }));

  const usedIds = new Set(players.flatMap((p) => p.hand.map((c) => c.id)));
  const drawPile = deck.filter((c) => !usedIds.has(c.id));

  return {
    round: 1,
    activePlayerIndex: 0,
    players,
    drawPile,
    discardPile: [],
    isGlobalDisasterPhase: false,
    cardsPlayedThisTurn: 0,
  };
}

export function applyMatchAction(input: {
  current: MatchPayload;
  action: MatchAction;
  actorUserId: string;
  roomPlayers: Array<{ userId: string; displayName: string; emoji: string; isBot?: boolean }>;
  roomCode: string;
}): MatchPayload {
  const current = input.current;
  const action = input.action;
  const active = current.players[current.activePlayerIndex];
  const isActorInRoom = input.roomPlayers.some((p) => p.userId === input.actorUserId);

  if (!isActorInRoom) {
    throw new Error('Actor is not in room');
  }

  if (action.type === 'INIT_MATCH') {
    return initializeMatch({
      roomPlayers: input.roomPlayers,
      roomCode: input.roomCode,
      botCount: action.botCount,
    });
  }

  if (current.winnerId && action.type !== 'SET_WINNER') {
    throw new Error('Match already finished');
  }

  switch (action.type) {
    case 'DRAW_CARD': {
      if (active.id !== input.actorUserId) throw new Error('Not your turn');
      return drawForActive(current);
    }
    case 'PLAY_CARD': {
      if (active.id !== input.actorUserId) throw new Error('Not your turn');
      if (current.cardsPlayedThisTurn >= 3) throw new Error('Max 3 cards per turn');
      return playCard(current, action.cardId, action.targetPlayerId);
    }
    case 'END_TURN': {
      if (active.id !== input.actorUserId) throw new Error('Not your turn');
      const next = advanceTurn(current);
      return runBotTurnsUntilHuman(next);
    }
    case 'SET_WINNER': {
      if (!current.players.some((p) => p.id === action.winnerUserId)) {
        throw new Error('Winner not found');
      }
      return {
        ...current,
        winnerId: action.winnerUserId,
      };
    }
    default:
      return current;
  }
}
