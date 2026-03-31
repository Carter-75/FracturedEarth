const fs = require('fs');

let code = fs.readFileSync('./src/lib/matchEngine.ts', 'utf8');

const replacement = `function resolveEffect(state: MatchPayload, card: MatchCard, targetId?: string): MatchPayload {
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
               let discarded = [];
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
}`;

// Use regex to capture and replace the function block cleanly 
// between its start and the start of drawForActive
const regex = /function resolveEffect\(state: MatchPayload, card: MatchCard, targetId\?: string\): MatchPayload \{[\s\S]*?\}\s*function drawForActive\(/;
if(regex.test(code)) {
    code = code.replace(regex, replacement + "\n\nfunction drawForActive(");
    fs.writeFileSync('./src/lib/matchEngine.ts', code);
    console.log("Successfully injected replacement resolveEffect");
} else {
    console.log("Could not find resolveEffect block to replace!");
}
