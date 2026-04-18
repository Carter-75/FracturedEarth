import cards from './cards.json' with { type: 'json' };
import { type CardEffect, type MatchCard } from './types.js';

const AMBIGUOUS_EFFECTS = new Set([
  'redirect_any_twist_or_catac_card',
  'undo_last_turn_of_any_player',
  'repeat_last_survival_card_effect',
  'play_two_chaos_cards_immediately',
  'upgrade_one_adapt_card_for_double_effect',
]);

const BROKEN_EFFECTS = new Set([
  'UNDO_LAST_TURN',
]);

type CardRecordMap = Record<string, Array<Record<string, any>>>;
type Primitive = Record<string, any>;

const CARD_OVERRIDES: Record<string, Partial<MatchCard>> = {
  chaos_rule_break: {
    description: 'Gain 1 Point and 1 bonus action this turn.',
    primitives: [
      { type: 'MODIFY_POINTS', params: { amount: 1, target: 'self' } },
      { type: 'MODIFY_ACTIONS', params: { amount: -1, target: 'self' } },
    ],
  },
  ascended_apex_predator: {
    description: 'Draw 1 card and make target opponent skip their next draw.',
    primitives: [
      { type: 'DRAW_CARDS', params: { amount: 1, target: 'self' } },
      { type: 'ADD_TRIGGER', params: { triggerKind: 'SKIP_NEXT_DRAW', value: 1, duration: 'permanent', target: 'target_opponent' } },
    ],
  },
  ascended_event_manipulator: {
    description: 'Gain 2 Points and redirect the next negative special event away from you.',
    primitives: [
      { type: 'MODIFY_POINTS', params: { amount: 2, target: 'self' } },
      { type: 'APPLY_BUFF', params: { buffId: 'redirect_catac', target: 'self' } },
    ],
  },
  twist_blessing_of_unity: {
    description: 'Draw 3 cards.',
    primitives: [{ type: 'DRAW_CARDS', params: { amount: 3, target: 'self' } }],
  },
  twist_risk_factor: {
    description: 'Gain 3 Points.',
    primitives: [{ type: 'MODIFY_POINTS', params: { amount: 3, target: 'self' } }],
  },
  twist_stasis_lock: {
    description: 'Gain 2 Points and protect your next turn from skip effects.',
    primitives: [
      { type: 'MODIFY_POINTS', params: { amount: 2, target: 'self' } },
      { type: 'ADD_TRIGGER', params: { triggerKind: 'PREVENT_TURN_SKIP', duration: 'permanent', target: 'self' } },
    ],
  },
  twist_reverse_trick: {
    description: 'Gain 2 Points and draw 1 card.',
    primitives: [
      { type: 'MODIFY_POINTS', params: { amount: 2, target: 'self' } },
      { type: 'DRAW_CARDS', params: { amount: 1, target: 'self' } },
    ],
  },
  twist_turn_skip: {
    description: 'Gain 1 bonus action this turn.',
    primitives: [{ type: 'MODIFY_ACTIONS', params: { amount: -1, target: 'self' } }],
  },
  cataclysm_black_hole: {
    description: 'All players shuffle their hands into the deck. The drawer then swaps their hand with the discard pile and discards 1 card.',
    primitives: [
      { type: 'SHUFFLE_HAND_INTO_DECK', params: { target: 'all' } },
      { type: 'SWAP_HANDS', params: { targetA: 'self', targetB: 'discard_pile' } },
      { type: 'DISCARD_CARDS', params: { amount: 1, target: 'self', forceAction: true } },
    ],
  },
  cataclysm_curse_of_delay: {
    description: 'All players skip their next action. The drawer skips their next turn and discards 1 card.',
    primitives: [
      { type: 'ADD_TRIGGER', params: { triggerKind: 'SKIP_NEXT_ACTION', value: 1, duration: 'permanent', target: 'all' } },
      { type: 'APPLY_BUFF', params: { buffId: 'skip_next', target: 'self' } },
      { type: 'DISCARD_CARDS', params: { amount: 1, target: 'self', forceAction: true } },
    ],
  },
  cataclysm_structural_collapse: {
    description: 'All players destroy 1 pinned card. The drawer destroys 1 extra pinned card and discards 1 card.',
    primitives: [
      { type: 'DESTROY_PINNED', params: { amount: 1, target: 'all' } },
      { type: 'DESTROY_PINNED', params: { amount: 1, target: 'self' } },
      { type: 'DISCARD_CARDS', params: { amount: 1, target: 'self', forceAction: true } },
    ],
  },
  cataclysm_viral_outbreak: {
    description: 'All players lose 1 Health. The drawer loses 1 extra Health and discards 1 card.',
    primitives: [
      { type: 'MODIFY_HEALTH', params: { amount: -1, target: 'all' } },
      { type: 'MODIFY_HEALTH', params: { amount: -1, target: 'self' } },
      { type: 'DISCARD_CARDS', params: { amount: 1, target: 'self', forceAction: true } },
    ],
  },
  cataclysm_acid_spill: {
    description: 'All players lose 1 Point. The drawer loses 1 extra Point and discards 1 card.',
    primitives: [
      { type: 'MODIFY_POINTS', params: { amount: -1, target: 'all' } },
      { type: 'MODIFY_POINTS', params: { amount: -1, target: 'self' } },
      { type: 'DISCARD_CARDS', params: { amount: 1, target: 'self', forceAction: true } },
    ],
  },
  cataclysm_temporal_collapse: {
    description: 'All players skip their next draw. The drawer skips 1 extra draw and discards 1 card.',
    primitives: [
      { type: 'ADD_TRIGGER', params: { triggerKind: 'SKIP_NEXT_DRAW', value: 1, duration: 'permanent', target: 'all' } },
      { type: 'ADD_TRIGGER', params: { triggerKind: 'SKIP_NEXT_DRAW', value: 1, duration: 'permanent', target: 'self' } },
      { type: 'DISCARD_CARDS', params: { amount: 1, target: 'self', forceAction: true } },
    ],
  },
  cataclysm_resource_failure: {
    description: 'All players discard 1 Survival card. The drawer discards 1 extra card and discards 1 card.',
    primitives: [
      { type: 'DISCARD_CARDS', params: { amount: 1, filter: 'SURVIVAL', target: 'all' } },
      { type: 'DISCARD_CARDS', params: { amount: 1, filter: 'SURVIVAL', target: 'self' } },
      { type: 'DISCARD_CARDS', params: { amount: 1, target: 'self', forceAction: true } },
    ],
  },
  cataclysm_firebreak: {
    description: 'All players lose 1 Point. The drawer loses 1 extra Point and discards 1 card.',
    primitives: [
      { type: 'MODIFY_POINTS', params: { amount: -1, target: 'all' } },
      { type: 'MODIFY_POINTS', params: { amount: -1, target: 'self' } },
      { type: 'DISCARD_CARDS', params: { amount: 1, target: 'self', forceAction: true } },
    ],
  },
  cataclysm_flood_surge: {
    description: 'All players lose 2 Points. The drawer loses 1 extra Point and discards 1 card.',
    primitives: [
      { type: 'MODIFY_POINTS', params: { amount: -2, target: 'all' } },
      { type: 'MODIFY_POINTS', params: { amount: -1, target: 'self' } },
      { type: 'DISCARD_CARDS', params: { amount: 1, target: 'self', forceAction: true } },
    ],
  },
  cataclysm_magnetic_storm: {
    description: 'All pinned powers are scrambled. The drawer loses 1 extra pinned card and discards 1 card.',
    primitives: [
      { type: 'SWAP_POWERS_RANDOM', params: {} },
      { type: 'DESTROY_PINNED', params: { amount: 1, target: 'self' } },
      { type: 'DISCARD_CARDS', params: { amount: 1, target: 'self', forceAction: true } },
    ],
  },
  cataclysm_sudden_quake: {
    description: 'All players skip their next action. The drawer skips 1 extra action and discards 1 card.',
    primitives: [
      { type: 'ADD_TRIGGER', params: { triggerKind: 'SKIP_NEXT_ACTION', value: 1, duration: 'permanent', target: 'all' } },
      { type: 'ADD_TRIGGER', params: { triggerKind: 'SKIP_NEXT_ACTION', value: 1, duration: 'permanent', target: 'self' } },
      { type: 'DISCARD_CARDS', params: { amount: 1, target: 'self', forceAction: true } },
    ],
  },
  cataclysm_void_rift: {
    description: 'All players lose 1 Health. The drawer loses 1 extra Health, then draws 1 card and discards 1 card.',
    primitives: [
      { type: 'MODIFY_HEALTH', params: { amount: -1, target: 'all' } },
      { type: 'MODIFY_HEALTH', params: { amount: -1, target: 'self' } },
      { type: 'DRAW_CARDS', params: { amount: 1, target: 'self' } },
      { type: 'DISCARD_CARDS', params: { amount: 1, target: 'self', forceAction: true } },
    ],
  },
};

const TARGET_LABELS: Record<string, string> = {
  self: 'you',
  all: 'everyone',
  all_opponents: 'all opponents',
  target_player: 'target player',
  target_opponent: 'target opponent',
  random_opponent: 'a random opponent',
  inherited: 'the inherited target',
};

function formatTarget(target?: string): string {
  return TARGET_LABELS[target || 'self'] || target || 'you';
}

function formatSignedAmount(amount: number, positiveLabel: string, negativeLabel: string, suffix: string) {
  if (amount === 0) return `No change to ${suffix}`;
  if (amount > 0) {
    return `${positiveLabel} ${amount} ${suffix}${amount === 1 ? '' : 's'}`;
  }
  return `${negativeLabel} ${Math.abs(amount)} ${suffix}${Math.abs(amount) === 1 ? '' : 's'}`;
}

function describeBuff(buffId?: string, target = 'self') {
  const actor = formatTarget(target);
  switch (buffId) {
    case 'prevent_negative':
    case 'block_negative_effect':
      return `${actor} prevent the next negative effect.`;
    case 'block_first_disaster':
    case 'block_next_disaster':
    case 'avoid_disaster':
    case 'cancel_disaster_target':
    case 'evade_hightier_disaster':
      return `${actor} block the next Disaster effect.`;
    case 'block_catac':
    case 'cancel_catac':
    case 'cancel_next_catac':
    case 'negate_catac':
    case 'prevent_catac_effect':
      return `${actor} negate the next Catac effect.`;
    case 'block_health_loss':
      return `${actor} reduce the next Disaster health loss by 1.`;
    case 'block_point_loss':
      return `${actor} prevent the next point loss.`;
    case 'double_next_points':
      return `${actor} double the next Points gain.`;
    case 'double_next_catac':
      return `${actor} double the next Catac they trigger.`;
    case 'skip_next':
      return `${actor} skip their next turn.`;
    case 'skip_next_action':
      return `${actor} skip their next action.`;
    case 'skip_next_draw':
    case 'skip_next_draw_2':
      return `${actor} skip their next draw${buffId === 'skip_next_draw_2' ? ' twice' : ''}.`;
    case 'prevent_turn_reverse':
      return `${actor} prevent the next turn-order change.`;
    case 'prevent_turn_skip':
      return `${actor} prevent the next turn skip.`;
    case 'prevent_turn_skip_reverse':
      return `${actor} prevent the next skip or reverse effect.`;
    case 'disable_powers_1_turn':
      return `${actor} have their pinned Powers disabled for 1 turn.`;
    case 'redirect_disaster':
    case 'redirect_chaos':
    case 'redirect_chaos_disaster':
    case 'redirect_negative':
    case 'redirect_catac':
    case 'redirect_twist_catac':
      return `${actor} redirect the next matching negative effect away from themselves.`;
    case 'convert_disaster_to_points':
      return `${actor} convert the next Disaster loss into Points instead.`;
    case 'draw_when_pinned_1':
      return `${actor} draw 1 card when this card is pinned.`;
    case 'discard_after_use':
      return `Discard this card after it resolves.`;
    case 'points_per_survival_1':
    case 'survival_plus_1_pt':
      return `${actor} gain +1 Point whenever a Survival card is played.`;
    case 'points_per_pinned_survival_1':
      return `${actor} gain +1 Point whenever one of their Survival engines stays active.`;
    case 'upgrade_adapt':
      return `${actor} double the next Power or Adapt effect they use.`;
    case 'revive_2':
      return `${actor} revive at 2 Health if they would be reduced to 0.`;
    case 'steal_draw':
      return `${actor} steal the next draw from an opponent.`;
    default:
      return `${actor} gain ${buffId || 'a temporary buff'}.`;
  }
}

function describeTrigger(triggerKind?: string, target = 'self', value?: number) {
  const actor = formatTarget(target);
  switch (triggerKind) {
    case 'NEGATE_NEXT_DISASTER':
      return `${actor} negate the next Disaster effect.`;
    case 'NEGATE_NEXT_CATAC_EFFECT':
      return `${actor} negate the next Catac effect.`;
    case 'NEGATE_NEXT_NEGATIVE_EFFECT':
      return `${actor} negate the next negative effect.`;
    case 'PREVENT_NEXT_POINT_LOSS':
      return `${actor} prevent the next point loss.`;
    case 'REDUCE_INCOMING_DISASTER_1':
      return `${actor} reduce the next Disaster by 1.`;
    case 'PREVENT_OPPONENT_DRAW_1':
    case 'SKIP_NEXT_DRAW':
      return `${actor} skip the next ${value && value > 1 ? `${value} draws` : 'draw'}.`;
    case 'HAND_LIMIT_TEMP_1':
      return `${actor} gain +1 hand limit until their next cleanup.`;
    case 'TEMP_DOUBLE_POWER_EFFECT':
      return `${actor} double the next Power or Adapt effect they use.`;
    case 'REDIRECT_NEXT_DISASTER':
      return `${actor} redirect the next Disaster away from themselves.`;
    case 'REDIRECT_NEXT_NEGATIVE':
      return `${actor} redirect the next negative effect away from themselves.`;
    case 'POINTS_PER_TURN_1':
      return `${actor} gain +1 Point at the end of each turn while this stays active.`;
    case 'HEAL_1_PER_TURN':
      return `${actor} heal 1 Health at the end of each turn while this stays active.`;
    case 'SKIP_NEXT_TURN':
      return `${actor} skip the next turn.`;
    case 'SKIP_NEXT_ACTION':
      return `${actor} skip the next action.`;
    case 'PREVENT_TURN_SKIP':
      return `${actor} prevent the next turn skip.`;
    case 'PREVENT_TURN_REVERSE':
      return `${actor} prevent the next turn-order reversal.`;
    case 'DISABLE_POWERS_NEXT_TURN':
      return `${actor} have their pinned Powers disabled for 1 turn.`;
    case 'POINTS_PER_SURVIVAL_1':
    case 'SURVIVAL_PLUS_1_PT':
      return `${actor} gain +1 Point whenever a Survival card is played.`;
    case 'POINTS_PER_PINNED_SURVIVAL_1':
      return `${actor} gain +1 Point whenever one of their Survival engines stays active.`;
    case 'REVIVE_TO_2':
      return `${actor} revive at 2 Health if reduced to 0.`;
    case 'DRAW_WHEN_PINNED_1':
      return `${actor} draw 1 card when this card is pinned.`;
    case 'DISCARD_AFTER_USE':
      return `Discard this card after it resolves.`;
    case 'DOUBLE_NEXT_CATAC_EFFECT':
      return `${actor} double the next Catac they trigger.`;
    case 'CONVERT_NEXT_DISASTER_LOSS_TO_POINTS':
      return `${actor} convert the next Disaster loss into Points instead.`;
    case 'PREVENT_HEALTH_LOSS_GLOBAL':
      return `${actor} prevent Health loss until their next turn ends.`;
    case 'BLOCK_EARTHQUAKE_DRAW_1':
      return `${actor} block the next Earthquake and draw 1 card.`;
    case 'BLOCK_WILDFIRE_DRAW_1':
      return `${actor} block the next Wildfire and draw 1 card.`;
    case 'DISABLE_SURVIVAL_NEXT_TURN':
      return `${actor} cannot play Survival cards on their next turn.`;
    case 'PREVENT_HEALTH_REGAIN':
      return `${actor} cannot regain Health until their next cleanup.`;
    case 'NEGATE_ALL_SURVIVAL_THIS_TURN':
      return `All Survival cards are negated until this turn ends.`;
    case 'LOSE_1_PT_PER_TURN_3':
      return `${actor} lose 1 Point at the end of each turn while this stays active.`;
    case 'LOSE_1_HEALTH_PER_TURN_2':
      return `${actor} lose 1 Health at the end of each turn while this stays active.`;
    case 'IGNORE_RULE':
      return `${actor} ignore the next rules restriction that would stop their play.`;
    default:
      return `${actor} gain the ${triggerKind || 'temporary'} trigger.`;
  }
}

function joinClauses(clauses: string[]) {
  return clauses.filter(Boolean).join(' ');
}

function describePrimitive(primitive: Primitive): string[] {
  const type = primitive?.type;
  const params = primitive?.params || {};
  const target = params.target || 'self';
  const actor = formatTarget(target);

  switch (type) {
    case 'MODIFY_POINTS':
      return [`${actor[0].toUpperCase()}${actor.slice(1)} ${formatSignedAmount(params.amount || 0, 'gain', 'lose', 'Point')}.`];
    case 'MODIFY_HEALTH':
      return [`${actor[0].toUpperCase()}${actor.slice(1)} ${formatSignedAmount(params.amount || 0, 'heal', 'lose', 'Health')}.`];
    case 'MODIFY_POINTS_SCALED':
      return [`${actor[0].toUpperCase()}${actor.slice(1)} gain scaled Points based on ${params.scaleBy || 'the current board'}.`];
    case 'MODIFY_HEALTH_SCALED':
      return [`${actor[0].toUpperCase()}${actor.slice(1)} gain scaled Health based on ${params.scaleBy || 'the current board'}.`];
    case 'MODIFY_POINTS_RANDOM':
      return [`${actor[0].toUpperCase()}${actor.slice(1)} gain a random ${params.min ?? 0} to ${params.max ?? 0} Points.`];
    case 'MODIFY_HEALTH_RANDOM':
      return [`${actor[0].toUpperCase()}${actor.slice(1)} gain a random ${params.min ?? 0} to ${params.max ?? 0} Health change.`];
    case 'SET_POINTS':
      return [`${actor[0].toUpperCase()}${actor.slice(1)} set their Points to ${params.amount}.`];
    case 'DRAW_CARDS':
      return [`${actor[0].toUpperCase()}${actor.slice(1)} draw ${params.amount || 0} card${params.amount === 1 ? '' : 's'}.`];
    case 'DISCARD_CARDS': {
      const filter = params.filter ? ` ${params.filter.toLowerCase()}` : '';
      return [`${actor[0].toUpperCase()}${actor.slice(1)} discard ${params.amount || 0}${filter} card${params.amount === 1 ? '' : 's'}.`];
    }
    case 'DISCARD_AND_DRAW':
      return [`${actor[0].toUpperCase()}${actor.slice(1)} discard ${params.discardAmount || 0}, then draw ${params.drawAmount || 0}.`];
    case 'SWAP_HANDS':
      return [`${actor[0].toUpperCase()}${actor.slice(1)} swap hands with ${formatTarget(params.targetB)}.`];
    case 'RESET_HAND_5':
      return [`${actor[0].toUpperCase()}${actor.slice(1)} reset their hand to 5 cards.`];
    case 'SHUFFLE_HAND_INTO_DECK':
      return [`${actor[0].toUpperCase()}${actor.slice(1)} shuffle their hand back into the deck.`];
    case 'SHUFFLE_ALL_PILES':
      return ['Shuffle the draw, discard, and turn piles together.'];
    case 'SHUFFLE_DISCARD_INTO_DECK':
      return ['Shuffle the discard pile back into the deck.'];
    case 'RETURN_FROM_DISCARD':
      return [`${actor[0].toUpperCase()}${actor.slice(1)} return ${params.amount || 0} card${params.amount === 1 ? '' : 's'} from discard to hand.`];
    case 'STEAL_POINTS':
      return [`${actor[0].toUpperCase()}${actor.slice(1)} steal ${params.amount || 0} Point${params.amount === 1 ? '' : 's'}.`];
    case 'MODIFY_MAX_HAND':
      return [`${actor[0].toUpperCase()}${actor.slice(1)} change their max hand size by ${params.amount || 0}.`];
    case 'MODIFY_ACTIONS':
      return [
        params.amount < 0
          ? `${actor[0].toUpperCase()}${actor.slice(1)} gain ${Math.abs(params.amount)} bonus action${Math.abs(params.amount) === 1 ? '' : 's'} this turn.`
          : `${actor[0].toUpperCase()}${actor.slice(1)} lose ${params.amount || 0} action${params.amount === 1 ? '' : 's'} this turn.`,
      ];
    case 'REVERSE_TURN_ORDER':
      return ['Reverse the turn order.'];
    case 'APPLY_BUFF':
      return [describeBuff(params.buffId, target)];
    case 'ADD_TRIGGER':
      return [describeTrigger(params.triggerKind, target, params.value)];
    case 'SWAP_HAND_WITH_DISCARD':
      return [`${actor[0].toUpperCase()}${actor.slice(1)} swap their hand with the discard pile.`];
    case 'DESTROY_PINNED':
      return [`${actor[0].toUpperCase()}${actor.slice(1)} destroy ${params.amount || 0} pinned card${params.amount === 1 ? '' : 's'}.`];
    case 'SWAP_PINNED_POWERS':
      return [`${actor[0].toUpperCase()}${actor.slice(1)} swap pinned Powers with ${formatTarget(params.targetB)}.`];
    case 'ENSURE_HAND_SIZE':
      return [`${actor[0].toUpperCase()}${actor.slice(1)} draw until they have ${params.amount || 0} cards in hand.`];
    case 'SKIP_TURN':
      return [`${actor[0].toUpperCase()}${actor.slice(1)} skip their next turn.`];
    case 'REDISTRIBUTE_POINTS':
      return ['Redistribute all players’ Points evenly.'];
    case 'SWAP_POWERS_RANDOM':
      return ['Randomly redistribute all pinned Powers.'];
    case 'RESHUFFLE_TURN_ORDER':
      return ['Randomly reshuffle the turn order.'];
    case 'REPEAT_LAST_SURVIVAL':
      return ['Repeat the last Survival effect that resolved.'];
    case 'REDUCE_POINTS':
      return [`${actor[0].toUpperCase()}${actor.slice(1)} lose ${params.amount || 0} Point${params.amount === 1 ? '' : 's'}.`];
    case 'IF_UNBLOCKED':
      return [`If the Disaster is not blocked: ${joinClauses(describeSequence(primitive.then || []))}`];
    case 'IF_HEALTH':
      return [`If ${formatTarget(params.target)} health is ${params.op || ''} ${params.amount}: ${joinClauses(describeSequence(primitive.then || []))}${primitive.else?.length ? ` Otherwise: ${joinClauses(describeSequence(primitive.else))}` : ''}`];
    case 'IF_HAND_SIZE':
      return [`If your hand size is ${params.op || ''} ${params.amount}: ${joinClauses(describeSequence(primitive.then || []))}`];
    case 'IF_FIRST_CARD':
      return [`If this is your first played card this turn: ${joinClauses(describeSequence(primitive.then || []))}`];
    case 'IF_CHAOS_PLAYED':
      return [`If a Chaos card was already played this turn: ${joinClauses(describeSequence(primitive.then || []))}`];
    case 'IF_PREVIOUS_CARD_TYPE':
      return [`If the previous card type was ${params.cardType}: ${joinClauses(describeSequence(primitive.then || []))}`];
    case 'IF_NO_OTHER_SURVIVAL':
      return [`If no other Survival card was played this turn: ${joinClauses(describeSequence(primitive.then || []))}`];
    case 'CHANCE':
      return [`${Math.round((params.probability || 0) * 100)}% chance: ${joinClauses(describeSequence(primitive.then || []))}${primitive.else?.length ? ` Otherwise: ${joinClauses(describeSequence(primitive.else))}` : ''}`];
    default:
      return [type ? `${type}: resolve the card script in order.` : 'Resolve this card in order.'];
  }
}

function describeSequence(primitives: Primitive[]) {
  return primitives.flatMap((primitive) => describePrimitive(primitive));
}

function normalizeCard(card: Record<string, any>): MatchCard {
  const override = CARD_OVERRIDES[card.id] || {};
  const primitives = (override.primitives || card.primitives || []) as Primitive[];
  const effectSteps = override.effectSteps || describeSequence(primitives);
  const description = override.description || card.description || effectSteps.join(' ');

  return {
    id: card.id,
    name: card.name,
    type: card.type,
    tier: card.tier,
    description,
    effect: description,
    primitives,
    disasterKind: card.disasterKind,
    blocksDisaster: card.blocksDisaster,
    discardCost: card.discardCost,
    gainHealth: card.gainHealth,
    effectSteps,
  };
}

let cachedCards: MatchCard[] | undefined;

export function getAllCards(): MatchCard[] {
  if (!cachedCards) {
    const record = cards as CardRecordMap;
    cachedCards = Object.values(record).flat().map(normalizeCard);
  }
  return cachedCards;
}

export function getCardById(cardId: string): MatchCard | undefined {
  return getAllCards().find((card) => card.id === cardId);
}

export function getCanonicalCardMatrix(): CardEffect[] {
  return getAllCards().map((card) => {
    const primitive = Array.isArray(card.primitives) ? card.primitives[0] : undefined;
    const effectId = primitive?.type || card.id;
    const classification = BROKEN_EFFECTS.has(effectId)
      ? 'broken'
      : AMBIGUOUS_EFFECTS.has(card.effect || '') || AMBIGUOUS_EFFECTS.has(effectId)
        ? 'ambiguous'
        : 'clear';

    return {
      cardId: card.id,
      effectId,
      classification,
      description: card.description,
      notes: card.effectSteps?.join(' | '),
    };
  });
}
