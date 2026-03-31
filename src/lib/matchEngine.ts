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
  tier?: 1 | 2 | 3 | 4 | 5;
  effect?: string;
  description?: string;
  disasterKind?: DisasterKind;
  blocksDisaster?: DisasterKind;
  primitives?: any[];
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
  const activeIndex = state.activePlayerIndex;
  
  // Safely deep clone the players array so sub-function mutations are retained cumulatively
  let next = { 
    ...state, 
    players: state.players.map(p => ({
       ...p,
       hand: [...p.hand],
       powers: [...p.powers]
    }))
  };

  const primitives = card.primitives;
  if (!primitives || primitives.length === 0) return next;

  // Helper to interpret targets
  const getTargetIndices = (targetStr: string): number[] => {
     if (targetStr === 'self') return [activeIndex];
     if (targetStr === 'target_player' || targetStr === 'target_opponent') {
         const found = next.players.findIndex(p => p.id === targetId);
         return found >= 0 ? [found] : [];
     }
     if (targetStr === 'all') return next.players.map((_, i) => i);
     if (targetStr === 'all_opponents') return next.players.map((_, i) => i).filter(i => i !== activeIndex);
     if (targetStr === 'random_opponent') {
         const opps = next.players.map((_, i) => i).filter(i => i !== activeIndex);
         if (opps.length === 0) return [];
         return [opps[Math.floor(Math.random() * opps.length)]];
     }
     return [];
  };

  const evaluatePrims = (prims: any[]) => {
      for (const prim of prims) {
          const type = prim.type;
          const params = prim.params || {};

          // Resolving Conditionals
          if (type === 'IF_UNBLOCKED') {
             const tIdxs = getTargetIndices(params.target === 'inherited' ? 'target_player' : params.target);
             const dKind = card.disasterKind;
             // Check if target is shielded
             const unblockedTargets = tIdxs.filter(i => {
                const p = next.players[i];
                if (p.twistEffect === 'prevent_next_disaster') {
                   p.twistEffect = undefined;
                   return false; 
                }
                const blockingPower = p.powers.find(pow => pow.blocksDisaster === dKind);
                return !blockingPower;
             });

             if (unblockedTargets.length > 0 && prim.then) {
                 // We execute the 'then' block for those who were unblocked. 
                 // For simplicity in this game engine, IF_UNBLOCKED wraps the exact primitives meant for the target.
                 // We temporarily remap the target in the nested params strictly to these unblocked targets if we needed array processing,
                 // but since 'then' typically uses 'target_player' or 'all_opponents', the engine handles the damage.
                 // Wait, if an 'all_opponents' disaster is blocked by one guy, only HE blocks it.
                 // So we must intercept the nested primitive execution to only apply to unblocked guys.
                 // Rather than complicate it, we simply evaluate the primitive inside but manually restrict 'target_player' and 'all_opponents'.
                 
                 // Standardize by extracting inner primitive and manually executing on unblocked
                 for (const inner of prim.then) {
                     for (const u_idx of unblockedTargets) {
                         executeAtomic(inner.type, { ...inner.params, overrideTargetIndex: u_idx });
                     }
                 }
             }
             continue;
          }

          if (type === 'IF_HEALTH') {
              const tIdxs = getTargetIndices(params.target);
              let conditionMet = false;
              for (const ti of tIdxs) {
                  const p = next.players[ti];
                  if (params.op === '==' && p.health === params.amount) conditionMet = true;
                  if (params.op === '<=' && p.health <= params.amount) conditionMet = true;
                  if (params.op === '<' && p.health < params.amount) conditionMet = true;
              }
              if (conditionMet && prim.then) evaluatePrims(prim.then);
              else if (!conditionMet && prim.else) evaluatePrims(prim.else);
              continue;
          }

          if (type === 'IF_HAND_SIZE') {
              const p = next.players[activeIndex];
              let conditionMet = false;
              if (params.op === '<=' && p.hand.length <= params.amount) conditionMet = true;
              if (params.op === '<' && p.hand.length < params.amount) conditionMet = true;
              if (params.op === '>=' && p.hand.length >= params.amount) conditionMet = true;
              if (conditionMet && prim.then) evaluatePrims(prim.then);
              continue;
          }

          if (type === 'IF_FIRST_CARD') {
              if (state.cardsPlayedThisTurn === 1 && prim.then) evaluatePrims(prim.then);
              continue;
          }
          if (type === 'IF_CHAOS_PLAYED') {
              if (state.turnPile.some(c => c.type === 'CHAOS') && prim.then) evaluatePrims(prim.then);
              continue;
          }
          if (type === 'IF_CHAOS_PLAYED_LAST_TURN') {
              // Not tracked in state currently for last turn, skip conditionally
              continue; 
          }
          if (type === 'IF_PREVIOUS_CARD_TYPE') {
              const prev = state.turnPile.length > 0 ? state.turnPile[state.turnPile.length - 1] : null;
              if (prev && prev.type === params.cardType && prim.then) evaluatePrims(prim.then);
              continue;
          }
          if (type === 'IF_NO_OTHER_SURVIVAL') {
              if (!state.turnPile.some(c => c.type === 'SURVIVAL') && prim.then) evaluatePrims(prim.then);
              continue;
          }
          if (type === 'CHANCE') {
              if (Math.random() < params.probability && prim.then) evaluatePrims(prim.then);
              else if (prim.else) evaluatePrims(prim.else);
              continue;
          }

          // Stat Mutators
          if (params.overrideTargetIndex !== undefined) {
               executeAtomic(type, params, params.overrideTargetIndex);
          } else {
               const targets = getTargetIndices(params.target);
               for (const ti of targets) executeAtomic(type, params, ti);
          }
      }
  };

  const executeAtomic = (type: string, params: any, targetIndex: number = activeIndex) => {
      const p = next.players[targetIndex];
      const active = next.players[activeIndex];
      
      switch (type) {
         case 'MODIFY_POINTS':
            p.survivalPoints += params.amount;
            break;
         case 'MODIFY_POINTS_SCALED':
            if (params.scaleBy === 'pinned_powers') {
               p.survivalPoints += (p.powers.length * params.multiplier);
            }
            if (params.scaleBy === 'all_pinned_powers') {
               const total = next.players.reduce((acc, curr) => acc + curr.powers.length, 0);
               p.survivalPoints += (total * params.multiplier);
            }
            break;
         case 'MODIFY_HEALTH':
            p.health = Math.min(INITIAL_HEALTH, Math.max(0, p.health + params.amount));
            break;
         case 'MODIFY_HEALTH_SCALED':
            if (params.scaleBy === 'pinned_adapt') {
               p.health = Math.min(INITIAL_HEALTH, p.health + (p.powers.filter(c => c.type === 'ADAPT').length * params.multiplier));
            }
            break;
         case 'MODIFY_POINTS_RANDOM':
            p.survivalPoints += Math.floor(Math.random() * (params.max - params.min + 1)) + params.min;
            break;
         case 'MODIFY_HEALTH_RANDOM':
            p.health = Math.min(INITIAL_HEALTH, Math.max(0, p.health + Math.floor(Math.random() * (params.max - params.min + 1)) + params.min));
            break;
         case 'SET_POINTS':
            p.survivalPoints = params.amount;
            break;
         
         case 'DRAW_CARDS':
            for(let i=0; i<params.amount; i++) {
                // Must ensure drawForActive takes activePlayerIndex strictly 
                const swapIdx = next.activePlayerIndex;
                next.activePlayerIndex = targetIndex;
                next = drawForActive(next);
                next.activePlayerIndex = swapIdx;
            }
            break;
         case 'DISCARD_CARDS':
            if (p.hand.length >= params.amount) {
               let discarded: MatchCard[] = [];
               if (params.filter === 'SURVIVAL') {
                   const survs = p.hand.filter(c => c.type === 'SURVIVAL');
                   discarded = survs.slice(0, params.amount);
                   p.hand = p.hand.filter(c => !discarded.includes(c));
               } else {
                   discarded = p.hand.slice(0, params.amount);
                   p.hand = p.hand.slice(params.amount);
               }
               next.discardPile = [...next.discardPile, ...discarded];
            }
            break;
         case 'DISCARD_AND_DRAW':
            if (p.hand.length >= params.discardAmount) {
               const discarded = p.hand.slice(0, params.discardAmount);
               p.hand = p.hand.slice(params.discardAmount);
               next.discardPile = [...next.discardPile, ...discarded];
               for(let i=0; i<params.drawAmount; i++) {
                  const swapIdx = next.activePlayerIndex;
                  next.activePlayerIndex = targetIndex;
                  next = drawForActive(next);
                  next.activePlayerIndex = swapIdx;
               }
            }
            break;
            
         case 'SWAP_HANDS':
            if (params.targetB === 'discard_pile') {
               const tempH = [...p.hand];
               p.hand = [...next.discardPile];
               next.discardPile = tempH;
            } else if (params.targetB === 'random_opponent' || params.targetB === 'target_player') {
               const bIdxs = getTargetIndices(params.targetB);
               if (bIdxs.length > 0) {
                   const b = next.players[bIdxs[0]];
                   const tempH = [...p.hand];
                   p.hand = [...b.hand];
                   b.hand = tempH;
               }
            }
            break;
         case 'SHUFFLE_HAND_INTO_DECK':
            next.drawPile = shuffle([...next.drawPile, ...p.hand], pseudoRandom(Date.now()));
            p.hand = [];
            break;
         case 'SHUFFLE_ALL_PILES':
            next.drawPile = shuffle([...next.drawPile, ...next.discardPile, ...next.turnPile], pseudoRandom(Date.now()));
            next.discardPile = [];
            break;
         case 'SHUFFLE_DISCARD_INTO_DECK':
            next.drawPile = shuffle([...next.drawPile, ...next.discardPile], pseudoRandom(Date.now()));
            next.discardPile = [];
            break;
         case 'RETURN_FROM_DISCARD':
            if (next.discardPile.length >= params.amount) {
               const cards = next.discardPile.slice(-params.amount);
               next.discardPile = next.discardPile.slice(0, -params.amount);
               p.hand.push(...cards);
            }
            break;
         case 'STEAL_POINTS':
            const amt = Math.min(p.survivalPoints, params.amount);
            p.survivalPoints -= amt;
            active.survivalPoints += amt;
            break;
            
         case 'MODIFY_MAX_HAND':
            p.maxHandModifier = (p.maxHandModifier ?? 0) + params.amount;
            break;
         case 'MODIFY_ACTIONS':
            next.cardsPlayedThisTurn = Math.max(0, next.cardsPlayedThisTurn - params.amount);
            break;
         case 'REVERSE_TURN_ORDER':
            next.turnDirection = next.turnDirection === 1 ? -1 : 1;
            break;
         case 'RESHUFFLE_TURN_ORDER': // Ignored for MVP sequential nature
            break;
            
         case 'APPLY_BUFF':
            p.twistEffect = params.buffId;
            break;
         case 'DESTROY_PINNED':
            if (p.powers.length > 0) {
               const dumped = p.powers.slice(0, params.amount);
               p.powers = p.powers.slice(params.amount);
               next.discardPile = [...next.discardPile, ...dumped];
            }
            break;
         case 'SWAP_PINNED_POWERS':
            const targetBIdx = getTargetIndices(params.targetB)[0];
            if (targetBIdx !== undefined) {
               const b = next.players[targetBIdx];
               const tmp = [...p.powers];
               p.powers = [...b.powers];
               b.powers = tmp;
            }
            break;
      }
  };

  evaluatePrims(primitives);
  return next;
}

function drawForActive(state: MatchPayload, replayOutput?: BotTurnEvent[]): MatchPayload {
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
    // BUG 5 FIX: Catac/Twist cards drawn via drawForActive silently execute immediately. 
    // We inject the trigger back into the replay buffer so the UI highlights the event.
    if (replayOutput) {
       replayOutput.push({
         actorId: active?.id ?? "unknown",
         actorName: active?.displayName ?? "Unknown Player",
         action: "PLAY",
         cardName: card.name,
         card: card,
       });
    }
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
  // BUG 1 FIX: Only explicitly defined protection/block cards are pinned to the player's pile.
  // All other cards must route to the discard pile.
  const isPinned = Boolean(card.blocksDisaster);

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
  // BUG 1 FIX: Only explicitly defined protection/block cards are pinned to the player's pile.
  const isPinned = Boolean(card.blocksDisaster);
  
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

    // BUG 5 FIX: Inject a THINKING phase to simulate processing delay before acting
    replay.push({
      actorId: active?.id ?? "unknown",
      actorName: active?.displayName ?? "Unknown Player",
      action: "THINKING",
    });

    replay.push({
      actorId: active?.id ?? "unknown",
      actorName: active?.displayName ?? "Unknown Player",
      action: "DRAW",
    });
    next = drawForActive(next, replay);

    for (let i = 0; i < 3; i++) {
      const action = chooseBotAction(next);
      if (!action) break;

      const fullCard = active.hand.find(c => c.id === action.cardId);

      replay.push({
        actorId: active?.id ?? "unknown",
        actorName: active?.displayName ?? "Unknown Player",
        action: "PLAY",
        cardName: action.cardName,
        card: fullCard,
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
      
      // BUG 4 FIX: Append to END of discardPile so it tops the stack, and accurately update topCard!
      return {
        ...state,
        players: nextPlayers,
        discardPile: [...state.discardPile, card],
        topCard: card,
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
