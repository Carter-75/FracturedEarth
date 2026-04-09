export * from "../types/game";
import { 
  MatchCard, 
  MatchPayload, 
  MatchAction, 
  Trigger, 
  TriggerKind, 
  MatchPlayer, 
  BotTurnEvent,
  CardType,
  DisasterKind
} from "../types/game";
import { AIBrain } from "./aiBrain";
import { 
  MAX_HAND_SIZE, 
  WINNING_POINTS, 
  INITIAL_HEALTH, 
  MAX_ACTIONS_PER_TURN, 
  STARTING_HAND_SIZE 
} from "./gameConfig";

export function canPlayCard(state: MatchPayload, card: MatchCard): boolean {
  const active = state.players[state.activePlayerIndex];
  
  if (card.discardCost && card.discardCost > 0) {
    if (active.hand.length - 1 < card.discardCost) return false;
  }

  return true;
}

export const pseudoRandom = (seed: number): () => number => {
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

async function starterDeck(rng: () => number, fullDeck: MatchCard[]): Promise<MatchCard[]> {
  return shuffle(fullDeck, rng);
}

function evaluateWinner(state: MatchPayload): string | undefined {
  const alive = state.players.filter((p) => p.health > 0);
  if (alive.length === 1) return alive[0].id;
  
  const byScore = state.players.find((p) => p.survivalPoints >= WINNING_POINTS)?.id;
  if (byScore) return byScore;
  
  return undefined;
}

export function getPlayerMaxHand(player: MatchPlayer): number {
  let bonus = player.maxHandModifier || 0;
  if (player.triggers.some(t => t.kind === 'HAND_LIMIT_TEMP_1')) {
      bonus += 1;
  }
  return MAX_HAND_SIZE + bonus;
}

/**
 * Consumes a trigger of a given kind from the player.
 * If the trigger was attached to a POWER/ADAPT card with 'next_event' duration,
 * the card is also consumed (moved to discard).
 */
export function consumeTrigger(
  next: MatchPayload,
  playerIdx: number,
  kind: TriggerKind
): boolean {
  const pl = next.players[playerIdx];
  const triggerIdx = pl.triggers.findIndex(t => t.kind === kind);
  if (triggerIdx === -1) return false;

  const trigger = pl.triggers[triggerIdx];
  pl.triggers = pl.triggers.filter((_, i) => i !== triggerIdx);

  // If source card is a POWER/ADAPT and duration is 'next_event', consume it
  if (trigger.sourceCardId && trigger.duration === 'next_event') {
    const cardIdx = pl.powers.findIndex(c => c.id === trigger.sourceCardId);
    if (cardIdx !== -1) {
      const consumedCard = pl.powers[cardIdx];
      pl.powers = pl.powers.filter((_, i) => i !== cardIdx);
      next.discardPile.push(consumedCard);
      next.topCard = consumedCard; 
    }
  }
  return true;
}

function resolveEffect(state: MatchPayload, card: MatchCard, targetId?: string, rng?: () => number): MatchPayload {
  const activeIndex = state.activePlayerIndex;
  
  // Safely deep clone the players array so sub-function mutations are retained cumulatively
  let next = { 
    ...state, 
    players: state.players.map(p => ({
       ...p,
       hand: [...p.hand],
       powers: [...p.powers],
       triggers: [...p.triggers]
    }))
  };

  const primitives = card.primitives;
  if (!primitives || primitives.length === 0) return next;

  // Use provided rng or fallback for safety
  // Use provided rng or fallback to state-based seed for determinism
  const innerRng = rng || pseudoRandom(state.round * 1000 + state.activePlayerIndex * 100 + (state.turnHistory?.length || 0));

  // Helper to interpret targets
  const getTargetIndices = (targetStr: string, activeIdx: number): number[] => {
     if (targetStr === 'self') return [activeIdx];
     if (targetStr === 'target_player' || targetStr === 'target_opponent') {
         const found = next.players.findIndex(p => p.id === targetId);
         return found >= 0 ? [found] : [];
     }
     if (targetStr === 'all') return next.players.map((_, i) => i);
     if (targetStr === 'all_opponents') return next.players.map((_, i) => i).filter(i => i !== activeIdx);
     if (targetStr === 'random_opponent') {
         const opps = next.players.map((_, i) => i).filter(i => i !== activeIdx && next.players[i].health > 0);
         if (opps.length === 0) return [];
         return [opps[Math.floor(innerRng() * opps.length)]];
     }
     if (targetStr === 'inherited') {
         return targetId ? [next.players.findIndex(p => p.id === targetId)] : [activeIdx];
     }
     return [];
  };

  // --- NANO-FORGE UPGRADE LOGIC ---
  let multiplier = 1;
  const activeP = next.players[activeIndex];
  if (card.type === 'POWER' && activeP.triggers.some(t => t.kind === 'TEMP_DOUBLE_POWER_EFFECT')) {
      multiplier = 2;
      consumeTrigger(next, activeIndex, 'TEMP_DOUBLE_POWER_EFFECT');
  }

  // --- NEGATE CATACLYSM LOGIC ---
  if (card.type === 'CATACLYSM' && activeP.triggers.some(t => t.kind === 'NEGATE_NEXT_CATAC_EFFECT')) {
      consumeTrigger(next, activeIndex, 'NEGATE_NEXT_CATAC_EFFECT');
      return next;
  }

  // --- TURN BLOCK CHECKS ---
  if (card.type === 'SURVIVAL' && activeP.triggers.some(t => t.kind === 'DISABLE_SURVIVAL_NEXT_TURN')) {
     throw new Error('Survival cards are disabled this turn');
  }

  let isTruncated = false;

  const executeAtomic = (type: string, params: any, targetIndex: number = activeIndex) => {
    if (isTruncated) return;
    const p = next.players[targetIndex];
    const active = next.players[activeIndex];
      
      switch (type) {
          case 'MODIFY_POINTS': {
            let finalAmount = params.amount * (params.multiplier || 1);
            
            // --- REDIRECTION CHECK (Target Side) ---
            const isNegative = finalAmount < 0;
            const isDisaster = card?.type === 'DISASTER';
            const hasTargetRedirection = (isDisaster && p.triggers.some(t => t.kind === 'REDIRECT_NEXT_DISASTER')) || 
                                         (isNegative && p.triggers.some(t => t.kind === 'REDIRECT_NEXT_NEGATIVE'));

            if (isNegative && hasTargetRedirection) {
                consumeTrigger(next, targetIndex, 'REDIRECT_NEXT_DISASTER');
                consumeTrigger(next, targetIndex, 'REDIRECT_NEXT_NEGATIVE');
                const others = next.players.filter(op => op.id !== p.id && op.health > 0);
                if (others.length > 0) {
                    const newTarget = others[Math.floor(innerRng() * others.length)];
                    const newTargetIdx = next.players.findIndex(op => op.id === newTarget.id);
                    executeAtomic(type, params, newTargetIdx);
                    return;
                }
            }

            if (finalAmount < 0 && (p.twistEffect === 'prevent_negative' || p.triggers.some(t => t.kind === 'NEGATE_NEXT_NEGATIVE_EFFECT'))) {
                p.twistEffect = undefined;
                consumeTrigger(next, targetIndex, 'NEGATE_NEXT_NEGATIVE_EFFECT');
                return;
            }
            if (finalAmount < 0 && card?.type === 'DISASTER' && p.triggers.some(t => t.kind === 'REDUCE_INCOMING_DISASTER_1')) {
                finalAmount = Math.min(0, finalAmount + 1);
            }
            if (finalAmount > 0 && p.triggers.some(t => t.kind === 'DOUBLE_NEXT_POINTS')) {
                finalAmount *= 2;
                consumeTrigger(next, targetIndex, 'DOUBLE_NEXT_POINTS');
            }
            if (finalAmount < 0 && p.triggers.some(t => t.kind === 'PREVENT_NEXT_POINT_LOSS')) {
                consumeTrigger(next, targetIndex, 'PREVENT_NEXT_POINT_LOSS');
                return;
            }

            // Epicenter Scaling: Global disasters/cataclysms penalize drawer +1
            if (finalAmount < 0 && (card.disasterKind === 'GLOBAL' || card.type === 'CATACLYSM') && p.id === active.id) {
                finalAmount -= 1;
            }

            p.survivalPoints += finalAmount;
            break;
         }
         case 'MODIFY_POINTS_SCALED': {
            const mult = (params.multiplier || 1);
            if (params.scaleBy === 'pinned_powers') {
               p.survivalPoints += (p.powers.length * params.multiplier * mult);
            }
            if (params.scaleBy === 'all_pinned_powers') {
               const total = next.players.reduce((acc, curr) => acc + curr.powers.length, 0);
               p.survivalPoints += (total * params.multiplier * mult);
            }
            break;
         }
         case 'MODIFY_HEALTH': {
            let finalAmountH = params.amount * (params.multiplier || 1);
            
            // --- REDIRECTION CHECK (Target Side) ---
            const isNegativeH = finalAmountH < 0;
            const isDisasterH = card?.type === 'DISASTER';
            const hasTargetRedirectionH = (isDisasterH && p.triggers.some(t => t.kind === 'REDIRECT_NEXT_DISASTER')) || 
                                           (isNegativeH && p.triggers.some(t => t.kind === 'REDIRECT_NEXT_NEGATIVE'));

            if (isNegativeH && hasTargetRedirectionH) {
                consumeTrigger(next, targetIndex, 'REDIRECT_NEXT_DISASTER');
                consumeTrigger(next, targetIndex, 'REDIRECT_NEXT_NEGATIVE');
                const others = next.players.filter(op => op.id !== p.id && op.health > 0);
                if (others.length > 0) {
                    const newTarget = others[Math.floor(innerRng() * others.length)];
                    const newTargetIdx = next.players.findIndex(op => op.id === newTarget.id);
                    executeAtomic(type, params, newTargetIdx);
                    return;
                }
            }

            if (finalAmountH < 0 && (p.twistEffect === 'prevent_negative' || p.triggers.some(t => t.kind === 'NEGATE_NEXT_NEGATIVE_EFFECT'))) {
                p.twistEffect = undefined;
                consumeTrigger(next, targetIndex, 'NEGATE_NEXT_NEGATIVE_EFFECT');
                break;
            }
            if (finalAmountH < 0 && card?.type === 'DISASTER' && p.triggers.some(t => t.kind === 'REDUCE_INCOMING_DISASTER_1')) {
                finalAmountH = Math.min(0, finalAmountH + 1);
            }
            if (finalAmountH > 0 && p.triggers.some(t => t.kind === 'PREVENT_HEALTH_REGAIN')) {
                break;
            }
            if (finalAmountH < 0 && p.triggers.some(t => t.kind === 'NEGATE_NEXT_NEGATIVE_EFFECT')) {
                consumeTrigger(next, targetIndex, 'NEGATE_NEXT_NEGATIVE_EFFECT');
                break;
            }
            if (finalAmountH < 0 && card?.type === 'DISASTER' && p.triggers.some(t => t.kind === 'NEGATE_NEXT_DISASTER')) {
                consumeTrigger(next, targetIndex, 'NEGATE_NEXT_DISASTER');
                break;
            }

            // Epicenter Scaling: Global disasters/cataclysms penalize drawer +1
            if (finalAmountH < 0 && (card.disasterKind === 'GLOBAL' || card.type === 'CATACLYSM') && p.id === active.id) {
                finalAmountH -= 1;
            }

            p.health = Math.min(INITIAL_HEALTH, Math.max(0, p.health + finalAmountH));
            break;
         }
         case 'MODIFY_HEALTH_SCALED':
            if (params.scaleBy === 'pinned_adapt') {
               p.health = Math.min(INITIAL_HEALTH, p.health + (p.powers.filter(c => c.type === 'ADAPT').length * params.multiplier));
            }
            break;
         case 'MODIFY_POINTS_RANDOM':
            p.survivalPoints += Math.floor(innerRng() * (params.max - params.min + 1)) + params.min;
            break;
         case 'MODIFY_HEALTH_RANDOM':
            p.health = Math.min(INITIAL_HEALTH, Math.max(0, p.health + (Math.floor(innerRng() * (params.max - params.min + 1)) + params.min) * (params.multiplier || 1)));
            break;
         case 'SET_POINTS':
            p.survivalPoints = params.amount;
            break;
         
         case 'DRAW_CARDS': {
            const targetIndexLocal = targetIndex; 
            if (activeIndex === targetIndexLocal) {
               for(let i=0; i<params.amount; i++) {
                  if (isTruncated) break;
                  next = drawForActive(next, undefined, innerRng);
                  // If a special card was triggered, it would have changed topCard or turnPile
                  if (next.topCard?.type === 'TWIST' || next.topCard?.type === 'CATACLYSM') {
                      isTruncated = true;
                  }
               }
            } else {
               // Drawing for someone else
               for(let i=0; i<(params.drawAmount || params.amount); i++) {
                  const swapIdx = next.activePlayerIndex;
                  next.activePlayerIndex = targetIndex;
                  next = drawForActive(next, undefined, innerRng);
                  next.activePlayerIndex = swapIdx;
               }
            }
            break;
          }
         case 'DISCARD_CARDS':
            for (let i = 0; i < params.amount; i++) {
               if (p.hand.length === 0) break;
               const dropped = p.hand.pop()!;
               next.discardPile.push(dropped);
            }
            break;
          case 'DISCARD_AND_DRAW':
            if (p.hand.length >= params.discardAmount) {
               const discarded = p.hand.slice(0, params.discardAmount);
               p.hand = p.hand.slice(params.discardAmount);
               next.discardPile = [...next.discardPile, ...discarded];
               for(let i=0; i<params.drawAmount; i++) {
                  next = drawForActive(next, undefined, innerRng, targetIndex);
               }
            }
            break;
            
          case 'SWAP_HANDS':
            if (params.targetB === 'discard_pile') {
               const tempH = [...p.hand];
               p.hand = [...next.discardPile];
               next.discardPile = tempH;
            } else if (params.targetB === 'random_opponent' || params.targetB === 'target_player') {
               const bIdxs = getTargetIndices(params.targetB, activeIndex);
               if (bIdxs.length > 0) {
                   const b = next.players[bIdxs[0]];
                   const tempH = [...p.hand];
                   p.hand = [...b.hand];
                   b.hand = tempH;
               }
            }
            break;
         case 'RESET_HAND_5':
            next.discardPile = [...next.discardPile, ...p.hand];
            p.hand = [];
            for (let i = 0; i < 5; i++) {
                next = drawForActive(next, undefined, innerRng, targetIndex);
            }
            break;
         case 'SHUFFLE_HAND_INTO_DECK':
            next.drawPile = shuffle([...next.drawPile, ...p.hand], innerRng);
            p.hand = [];
            break;
         case 'SHUFFLE_ALL_PILES':
            next.drawPile = shuffle([...next.drawPile, ...next.discardPile, ...next.turnPile], innerRng);
            next.discardPile = [];
            break;
         case 'SHUFFLE_DISCARD_INTO_DECK':
            next.drawPile = shuffle([...next.drawPile, ...next.discardPile], innerRng);
            next.discardPile = [];
            break;
         case 'RETURN_FROM_DISCARD':
            if (next.discardPile.length >= params.amount) {
               const cards = next.discardPile.slice(-params.amount);
               next.discardPile = next.discardPile.slice(0, -params.amount);
               p.hand.push(...cards);
            }
            break;
          case 'STEAL_POINTS': {
            let amt = Math.min(p.survivalPoints, params.amount);
            
            // Redirection Check
            if (amt > 0 && p.triggers.some(t => t.kind === 'REDIRECT_NEXT_NEGATIVE')) {
                consumeTrigger(next, targetIndex, 'REDIRECT_NEXT_NEGATIVE');
                const others = next.players.filter(op => op.id !== p.id && op.health > 0);
                if (others.length > 0) {
                    const newTarget = others[Math.floor(innerRng() * others.length)];
                    const stolen = Math.min(newTarget.survivalPoints, amt);
                    newTarget.survivalPoints -= stolen;
                    active.survivalPoints += stolen;
                    return;
                }
            }

            // Negation Check
            if (amt > 0 && (p.twistEffect === 'prevent_negative' || p.triggers.some(t => t.kind === 'NEGATE_NEXT_NEGATIVE_EFFECT' || t.kind === 'PREVENT_NEXT_POINT_LOSS'))) {
                consumeTrigger(next, targetIndex, 'NEGATE_NEXT_NEGATIVE_EFFECT');
                consumeTrigger(next, targetIndex, 'PREVENT_NEXT_POINT_LOSS');
                p.twistEffect = undefined;
                return;
            }

            p.survivalPoints -= amt;
            active.survivalPoints += amt;
            break;
          }
            
         case 'MODIFY_MAX_HAND':
            p.maxHandModifier = (p.maxHandModifier ?? 0) + params.amount;
            break;
         case 'MODIFY_ACTIONS':
            next.cardsPlayedThisTurn = Math.max(0, next.cardsPlayedThisTurn - params.amount);
            break;
         case 'REVERSE_TURN_ORDER':
            next.turnDirection = next.turnDirection === 1 ? -1 : 1;
            break;
            
         case 'APPLY_BUFF': {
            const buffId = params.buffId;
            const duration = params.duration || 'next_event';
            
            let kind: TriggerKind | null = null;
            if (buffId === 'block_first_disaster') kind = 'NEGATE_NEXT_DISASTER';
            if (buffId === 'block_catac') kind = 'NEGATE_NEXT_CATAC_EFFECT';
            if (buffId === 'redirect_chaos_disaster') kind = 'REDIRECT_NEXT_DISASTER';
            if (buffId === 'prevent_negative') kind = 'NEGATE_NEXT_NEGATIVE_EFFECT';
            if (buffId === 'block_negative_effect') kind = 'NEGATE_NEXT_NEGATIVE_EFFECT';
            if (buffId === 'evade_chaos') kind = 'NEGATE_NEXT_NEGATIVE_EFFECT';
            if (buffId === 'avoid_disaster') kind = 'NEGATE_NEXT_DISASTER';
            if (buffId === 'double_next_points') kind = 'DOUBLE_NEXT_POINTS';
            if (buffId === 'prevent_point_loss') kind = 'PREVENT_NEXT_POINT_LOSS';
            if (buffId === 'skip_next_draw') kind = 'SKIP_NEXT_DRAW';
            if (buffId === 'prevent_turn_skip_reverse') kind = 'NEGATE_NEXT_NEGATIVE_EFFECT';
            if (buffId === 'redirect_negative') kind = 'REDIRECT_NEXT_NEGATIVE';
            if (buffId === 'redirect_catac') kind = 'REDIRECT_NEXT_NEGATIVE';
            if (buffId === 'cancel_catac') kind = 'NEGATE_NEXT_CATAC_EFFECT';
            if (buffId === 'skip_next') kind = 'SKIP_NEXT_TURN';
            
            if (kind) {
                p.triggers.push({
                    id: `${kind}_${Date.now()}`,
                    kind,
                    duration,
                    sourceCardId: card.id
                });
            } else {
                p.twistEffect = buffId;
            }
            break;
          }
         case 'ADD_TRIGGER': {
            const trigger: Trigger = {
                id: `trigger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                kind: params.triggerKind,
                value: params.value,
                duration: params.duration || 'next_event',
                sourceCardId: card.id
            };
             p.triggers.push(trigger);
             break;
          }
          case 'SWAP_HAND_WITH_DISCARD': {
             const tempHand = [...p.hand];
             p.hand = [...next.discardPile];
             next.discardPile = tempHand;
             break;
          }
         case 'DESTROY_PINNED':
            if (p.powers.length > 0) {
               const dumped = p.powers.slice(0, params.amount);
               p.powers = p.powers.slice(params.amount);
               next.discardPile = [...next.discardPile, ...dumped];
               // Remove associated triggers
               for (const d of dumped) {
                   p.triggers = p.triggers.filter(t => t.sourceCardId !== d.id);
               }
            }
            break;
          case 'SWAP_PINNED_POWERS': {
            const bIdxs = getTargetIndices(params.targetB, activeIndex);
            if (bIdxs.length > 0) {
               const b = next.players[bIdxs[0]];
               const tmp = [...p.powers];
               p.powers = [...b.powers];
               b.powers = tmp;
            }
            break;
         }

         // --- NEW PRIMITIVES FOR 100% PARITY ---
          case 'ENSURE_HAND_SIZE': {
            while (p.hand.length < params.amount) {
               if (isTruncated) break;
               next = drawForActive(next, undefined, innerRng, targetIndex);
               if (next.topCard?.type === 'TWIST' || next.topCard?.type === 'CATACLYSM') {
                   isTruncated = true;
               }
               if (next.drawPile.length === 0 && next.discardPile.length === 0) break;
            }
            break;
          }
         case 'SKIP_TURN': {
            p.triggers.push({
               id: `skip_${Date.now()}`,
               kind: 'SKIP_NEXT_TURN',
               duration: 'permanent'
            });
            break;
         }
         case 'REDISTRIBUTE_POINTS': {
            const total = next.players.reduce((acc, curr) => acc + curr.survivalPoints, 0);
            const avg = Math.floor(total / next.players.length);
            next.players.forEach(pl => pl.survivalPoints = avg);
            break;
         }
         case 'SWAP_POWERS_RANDOM': {
            const allPowers = next.players.flatMap(pl => {
               const pList = [...pl.powers];
               pl.powers = [];
               return pList;
            });
            const shuffled = shuffle(allPowers, innerRng);
            shuffled.forEach((c, i) => {
               const receiver = next.players[i % next.players.length];
               receiver.powers.push(c);
            });
            break;
         }
         case 'RESHUFFLE_TURN_ORDER': {
            next.turnDirection = innerRng() > 0.5 ? 1 : -1;
            break;
         }
         case 'REPEAT_LAST_SURVIVAL': {
            const lastSurv = next.turnHistory.filter(c => c.type === 'SURVIVAL' && c.id !== card.id).pop();
            if (lastSurv) {
                // IMPORTANT: We must assign the return value of resolveEffect to next
                next = resolveEffect(next, lastSurv, targetId, innerRng);
            }
            break;
         }
         case 'REDUCE_POINTS': {
             const tIdxs = getTargetIndices(params.target, activeIndex);
             tIdxs.forEach(ti => next.players[ti].survivalPoints = Math.max(0, next.players[ti].survivalPoints - params.amount));
             break;
         }
      }
  };

  const evaluatePrims = (prims: any[]) => {
      for (const prim of prims) {
          if (isTruncated) break;
          const type = prim.type;
          const params = { ...(prim.params || {}), multiplier: (prim.params?.multiplier || 1) * multiplier };

          // Resolving Conditionals
          if (type === 'IF_UNBLOCKED') {
             const tIdxs = getTargetIndices(params.target === 'inherited' ? 'target_player' : params.target, activeIndex);
             const dKind = card.disasterKind;
             // Check if target is shielded
             const unblockedTargets = tIdxs.filter(i => {
                const p = next.players[i];
                if (p.triggers.some(t => t.kind === 'NEGATE_NEXT_DISASTER')) {
                    p.triggers = p.triggers.filter(t => t.kind !== 'NEGATE_NEXT_DISASTER');
                    return false;
                }
                const blockingPower = p.powers.find(pow => pow.blocksDisaster === dKind);
                return !blockingPower;
             });

             if (unblockedTargets.length > 0 && prim.then) {
                 for (const inner of prim.then) {
                     for (const u_idx of unblockedTargets) {
                         executeAtomic(inner.type, inner.params, u_idx);
                     }
                 }
             }
             continue;
          }

          if (type === 'IF_HEALTH') {
              const tIdxs = getTargetIndices(params.target, activeIndex);
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
              if (state.turnHistory.some(c => c.type === 'CHAOS') && prim.then) evaluatePrims(prim.then);
              continue;
          }
          if (type === 'IF_PREVIOUS_CARD_TYPE') {
              const prev = state.turnHistory.length > 0 ? state.turnHistory[state.turnHistory.length - 1] : null;
              if (prev && prev.type === params.cardType && prim.then) evaluatePrims(prim.then);
              continue;
          }
          if (type === 'IF_NO_OTHER_SURVIVAL') {
              if (!state.turnHistory.some(c => c.type === 'SURVIVAL' && c.id !== card.id) && prim.then) evaluatePrims(prim.then);
              continue;
          }
          if (type === 'REPEAT_LAST_SURVIVAL') {
             const lastSurv = next.turnHistory.filter(c => c.type === 'SURVIVAL' && c.id !== card.id).pop();
             if (lastSurv) {
                 next = resolveEffect(next, lastSurv, targetId, innerRng);
             }
             continue;
          }
          if (type === 'CHANCE') {
              if (innerRng() < params.probability && prim.then) evaluatePrims(prim.then);
              else if (prim.else) evaluatePrims(prim.else);
              continue;
          }

          // Stat Mutators
          if (params.overrideTargetIndex !== undefined) {
               executeAtomic(type, params, params.overrideTargetIndex);
          } else {
               const targets = getTargetIndices(params.target, activeIndex);
               for (const ti of targets) {
                   if (isTruncated) break;
                   executeAtomic(type, params, ti);
               }
          }
      }
  };

  evaluatePrims(primitives);
  return next;
}

export function drawForActive(
  state: MatchPayload,
  replayOutput?: BotTurnEvent[],
  rng?: () => number,
  overridePlayerIndex?: number
): MatchPayload {
  const innerRng = rng || pseudoRandom(Date.now());
  const activeIdx = overridePlayerIndex !== undefined ? overridePlayerIndex : state.activePlayerIndex;
  
  // Clone state and the specific player to avoid mutation side-effects
  let next = { ...state, players: [...state.players] };
  const active = { ...next.players[activeIdx], hand: [...next.players[activeIdx].hand], triggers: [...next.players[activeIdx].triggers] };

  // --- SKIP DRAW CHECKS ---
  if (active.triggers.some(t => t.kind === 'SKIP_NEXT_DRAW')) {
      const pIdx = overridePlayerIndex !== undefined ? overridePlayerIndex : state.activePlayerIndex;
      consumeTrigger(next, pIdx, 'SKIP_NEXT_DRAW');
      return next;
  }
  if (active.triggers.some(t => t.kind === 'PREVENT_OPPONENT_DRAW_1')) {
      const pIdx = overridePlayerIndex !== undefined ? overridePlayerIndex : state.activePlayerIndex;
      consumeTrigger(next, pIdx, 'PREVENT_OPPONENT_DRAW_1');
      return next;
  }

  let drawPile = [...next.drawPile];
  let discardPile = [...next.discardPile];

  if (drawPile.length === 0) {
    if (discardPile.length === 0) return next;
    drawPile = shuffle(discardPile, innerRng);
    discardPile = [];
  }

  const card = drawPile[0];
  const remainingDrawPile = drawPile.slice(1);

  if (card.type === "TWIST" || card.type === "CATACLYSM") {
    if (replayOutput) {
       replayOutput.push({
         actorId: active.id,
         actorName: active.displayName,
         action: "DRAW",
       });
       replayOutput.push({
         actorId: active.id,
         actorName: active.displayName,
         action: "PLAY",
         cardName: card.name,
         card: card,
       });
    }

    next.hasDrawnThisTurn = true;
    return playCardImmediate(
      {
        ...next,
        drawPile: remainingDrawPile,
        discardPile,
        hasDrawnThisTurn: true,
        cardsPlayedThisTurn: next.hasDrawnThisTurn ? next.cardsPlayedThisTurn : 1
      },
      card,
      undefined,
      rng
    );
  }

  active.hand.push(card);
  next.players[activeIdx] = active;
  next.drawPile = remainingDrawPile;
  next.discardPile = discardPile;
  next.hasDrawnThisTurn = true;
  next.topCard = card;

  return next;
}

function playCardImmediate(state: MatchPayload, card: MatchCard, targetId?: string, rng?: () => number): MatchPayload {
  const isPersistent = card.type === 'POWER' || card.type === 'ADAPT';

  const activeIndex = state.activePlayerIndex;
  const active = { ...state.players[activeIndex] };
  let next = {
    ...state,
    topCard: card,
    turnPile: isPersistent ? [...state.turnPile, card] : state.turnPile,
    turnHistory: [...(state.turnHistory || []), card],
    // Reset cardsPlayedThisTurn if this is a free play from a Twist/Catac? 
    // Actually, playCardImmediate is usually called from drawForActive when a 
    // Twist/Catac is drawn. It shouldn't increment the human's "actions used" counter.
  };

  if (isPersistent) {
    active.powers = [...active.powers, card];
    const newPlayers = [...state.players];
    newPlayers[activeIndex] = active;
    next.players = newPlayers;
  } else {
    next.discardPile = [...state.discardPile, card];
  }

  return resolveEffect(next, card, targetId, rng);
}

export function advanceTurn(state: MatchPayload): MatchPayload {
  const dir = state.turnDirection || 1;
  let nextIndex = (state.activePlayerIndex + dir + state.players.length) % state.players.length;
  
  // SKIP_NEXT_TURN logic
  const nextP = state.players[nextIndex];
  if (nextP.triggers.some(t => t.kind === 'SKIP_NEXT_TURN')) {
      nextP.triggers = nextP.triggers.filter(t => t.kind !== 'SKIP_NEXT_TURN');
      nextIndex = (nextIndex + dir + state.players.length) % state.players.length;
  }

  const wrapsRound = (dir === 1 && nextIndex === 0) || (dir === -1 && nextIndex === state.players.length - 1);
  const nextRound = wrapsRound ? state.round + 1 : state.round;
  
  const next: MatchPayload = {
    ...state,
    activePlayerIndex: nextIndex,
    round: nextRound,
    isGlobalDisasterPhase: wrapsRound && nextRound % 3 === 0,
    cardsPlayedThisTurn: 0,
    hasDrawnThisTurn: false,
    turnPile: [],
    turnHistory: [],
    botTurnReplay: undefined,
  };

  // Process end-of-turn triggers for the player WHO JUST FINISHED their turn (state.players[state.activePlayerIndex])
  const prevP = next.players[state.activePlayerIndex];
  prevP.triggers.forEach((t: Trigger) => {
      if (t.kind === 'LOSE_1_PT_PER_TURN_3') {
          prevP.survivalPoints = Math.max(0, prevP.survivalPoints - 1);
      }
      if (t.kind === 'LOSE_1_HEALTH_PER_TURN_2') {
          prevP.health = Math.max(0, prevP.health - 1);
      }
      if (t.kind === 'POINTS_PER_TURN_1') {
          prevP.survivalPoints += 1;
      }
      if (t.kind === 'HEAL_1_PER_TURN') {
          prevP.health = Math.min(INITIAL_HEALTH, prevP.health + 1);
      }
  });

  // Tick down durations
  prevP.triggers = prevP.triggers.map((t: Trigger) => {
      if (t.duration === 'turn') return { ...t, duration: 'permanent' as const, toExpire: true };
      return t;
  }).filter(t => !(t as any).toExpire);

  return next;
}


export function playCard(
  state: MatchPayload,
  cardId: string,
  targetPlayerId?: string,
  rng?: () => number
): MatchPayload {
  const activeIndex = state.activePlayerIndex;
  const active = state.players[activeIndex];
  const card = active.hand.find((c) => c.id === cardId);
  if (!card) throw new Error("Card not in hand");
  if (!canPlayCard(state, card)) throw new Error("Card cannot be played");

  const isPersistent = card.type === 'POWER' || card.type === 'ADAPT';
  const discardCost = card.discardCost || 0;
  const newHand = active.hand.filter((c) => c.id !== card.id);
  
  let next: MatchPayload = {
    ...state,
    topCard: card,
    turnPile: isPersistent ? [...state.turnPile, card] : state.turnPile,
    turnHistory: [...(state.turnHistory || []), card],
  };

  if (discardCost > 0) {
    const cardsToDiscard = newHand.slice(0, discardCost);
    const handAfterCost = newHand.filter(c => !cardsToDiscard.includes(c));
    next.discardPile = [...state.discardPile, ...cardsToDiscard];
    next.players = state.players.map((p, i) =>
      i === activeIndex 
        ? { ...active, hand: handAfterCost, powers: isPersistent ? [...active.powers, card] : active.powers } 
        : p
    );
  } else {
    next.players = state.players.map((p, i) =>
      i === activeIndex 
        ? { ...active, hand: newHand, powers: isPersistent ? [...active.powers, card] : active.powers } 
        : p
    );
  }

  if (!isPersistent) {
    next.discardPile = [...next.discardPile, card];
  }

  const resolved = resolveEffect(next, card, targetPlayerId, rng);
  return {
    ...resolved,
    cardsPlayedThisTurn: resolved.cardsPlayedThisTurn + 1
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

function runBotTurnsUntilHuman(state: MatchPayload, rng: () => number): {
  state: MatchPayload;
  replay: BotTurnEvent[];
} {
  let next = state;
  const replay: BotTurnEvent[] = [];

  let turnSafetyCounter = 0;
  while (!next.winnerId && turnSafetyCounter < 20) {
    turnSafetyCounter++;
    const activeIndex = next.activePlayerIndex;
    let active = next.players[activeIndex];
    if (!active.isBot) break;

    // 1. Initial Draw (No artificial thinking)
    next = drawForActive(next, replay, rng);
    
    // Refresh active reference after draw
    active = next.players[activeIndex];

    // 2. MOVE PHASE (Iterative)
    let movePhaseCount = 0;
    while (movePhaseCount < 3 && !next.winnerId) {
        const brain = new AIBrain(next, active.id);
        const best = brain.chooseBestAction();
        
        if (!best || best.score <= 0) break; 
        
        const card = active.hand.find(c => c.id === best.cardId)!;
        
        replay.push({ 
           actorId: active.id, 
           actorName: active.displayName, 
           action: "PLAY", 
           cardName: card.name, 
           card: card, 
           targetPlayerId: best.targetPlayerId 
        });

        next = playCard(next, card.id, best.targetPlayerId, rng);
        active = next.players[activeIndex]; // Refresh
        movePhaseCount++;
    }

    // 3. DISCARD PHASE
    const maxHand = getPlayerMaxHand(active);
    let discardSafety = 0;
    while (active.hand.length > maxHand && discardSafety < 10) {
        discardSafety++;
        const brain = new AIBrain(next, active.id);
        const worst = brain.chooseBestDiscard();
        const card = active.hand.find(c => c.id === worst.cardId)!;

        replay.push({
           actorId: active.id,
           actorName: active.displayName,
           action: "DISCARD",
           cardName: card.name,
           card: card
        });

        // Apply Discard logic
        const idx = active.hand.findIndex(c => c.id === card.id);
        const nextActive = { ...active, hand: active.hand.filter((_, i) => i !== idx) };
        const nextPlayers = [...next.players];
        nextPlayers[activeIndex] = nextActive;
        next = {
            ...next,
            players: nextPlayers,
            discardPile: [...next.discardPile, card],
            topCard: card
        };
        active = next.players[activeIndex];
    }

    // 4. End Turn
    if (!next.winnerId) {
        replay.push({
          actorId: active.id,
          actorName: active.displayName,
          action: "END_TURN",
        });
        next = advanceTurn(next);
    }
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
  fullDeck: MatchCard[];
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

  const seed = input.roomCode.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const rng = pseudoRandom(seed || 7);
  const fullDeck = input.fullDeck;
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
    traits: [],
    triggers: [],
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
    turnHistory: [],
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
  const action = input.action;
  
  // Deterministic RNG Seed
  const seed = input.roomCode.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const rng = pseudoRandom(seed + (input.current.round * 100) + (input.current.activePlayerIndex * 10));

  let state: MatchPayload = { 
    ...input.current,
    previousState: input.current 
  };

  const active = state.players[state.activePlayerIndex];
  const isActorInRoom = input.roomPlayers.some(
    (p) => p.userId === input.actorUserId
  );

  if (!isActorInRoom) {
    throw new Error("Actor is not in room");
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
      const next = drawForActive(state, undefined, rng);
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
      const next = playCard(state, action.cardId, action.targetPlayerId, rng);
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
      const maxHand = getPlayerMaxHand(active);
      if (active.hand.length > maxHand) {
        throw new Error(`Must discard cards. You have more than ${maxHand} cards in hand.`);
      }
      // Just advance turn and let the matchService's heartbeat take over
      const next = advanceTurn(state);
      return { ...next, botTurnReplay: undefined };
    }
    case "SET_WINNER": {
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
