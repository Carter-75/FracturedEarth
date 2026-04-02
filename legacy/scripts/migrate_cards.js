const fs = require('fs');
const cards = JSON.parse(fs.readFileSync('./src/data/cards.json', 'utf8'));

// We handle base stats with implicit primitives.
function getBasePrims(card) {
  let p = [];
  const isD = card.type === 'DISASTER' || card.type === 'CATACLYSM';
  if (card.pointsDelta) {
    p.push({ type: 'MODIFY_POINTS', params: { amount: isD ? -Math.abs(card.pointsDelta) : card.pointsDelta, target: isD ? 'target_player' : 'self' } });
  }
  if (card.gainHealth) {
    p.push({ type: 'MODIFY_HEALTH', params: { amount: isD ? -Math.abs(card.gainHealth) : card.gainHealth, target: isD ? 'target_player' : 'self' } });
  }
  if (card.healthDelta) {
    p.push({ type: 'MODIFY_HEALTH', params: { amount: -Math.abs(card.healthDelta), target: 'target_player' } });
  }
  if (card.drawCount) {
    p.push({ type: 'DRAW_CARDS', params: { amount: card.drawCount, target: 'self' } });
  }
  return p;
}

const rgxMap = [
  { r: /draw_(\d+)_cards/, p: [] },
  { r: /^(\d+)_health$/, p: [] },
  { r: /^draw_1_card$/, p: [] },
  { r: /heal_(\d+)_health_discard_after_use/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'discard_after_use', target: 'self' } }] },
  { r: /draw_1_gain_1_point/, p: [{ type: 'MODIFY_POINTS', params: { amount: 1, target: 'self' } }] },
  { r: /draw_1_2_points/, p: [{ type: 'MODIFY_POINTS', params: { amount: 2, target: 'self' } }] },
  { r: /draw_2_1_health/, p: [{ type: 'MODIFY_HEALTH', params: { amount: 1, target: 'self' } }] },
  { r: /heal_1_discard_1/, p: [{ type: 'DISCARD_CARDS', params: { amount: 1, target: 'self' } }] },
  { r: /heal_1_health_discard_1_card/, p: [{ type: 'DISCARD_CARDS', params: { amount: 1, target: 'self' } }] },
  { r: /heal_(\d+)_health_discarded_after_use/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'discard_after_use', target: 'self' } }] },
  { r: /restore_1_health_discard_after_use/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'discard_after_use', target: 'self' } }] },
  { r: /blocks_first_(.*)_disaster_pinned_until_destroyed/, p: m => [{ type: 'APPLY_BUFF', params: { buffId: 'block_first_disaster', kind: m[1], target: 'self' } }] },
  { r: /blocks_next_(.*)_disaster_pinned/, p: m => [{ type: 'APPLY_BUFF', params: { buffId: 'block_next_disaster', kind: m[1], target: 'self' } }] },
  { r: /redirects_first_chaos_or_disaster_card_pinned/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'redirect_chaos_disaster', target: 'self' } }] },
  { r: /prevent_1_health_loss_per_turn/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'prevent_health_loss_1', target: 'self' } }] },
  { r: /prevent_turn_skip_effects/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'prevent_turn_skip', target: 'self' } }] },
  { r: /prevent_turn_skip_or_reverse/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'prevent_turn_skip_reverse', target: 'self' } }] },
  { r: /prevents_next_catac_negative_effect/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'prevent_catac_effect', target: 'self' } }] },
  { r: /prevents_next_turn_order_change/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'prevent_turn_reverse', target: 'self' } }] },
  { r: /blocks_one_catac_effect_discarded_if_used/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'block_catac', target: 'self' } }] },
  { r: /redirect_one_disaster_to_another_target/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'redirect_disaster', target: 'self' } }] },
  { r: /block_next_point_loss/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'block_point_loss', target: 'self' } }] },
  { r: /blocks_next_negative_card_effect_discarded_after_use/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'block_negative_effect', target: 'self' } }] },
  { r: /block_1_health_loss_from_disaster/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'block_health_loss', target: 'self' } }] },
  { r: /block_next_negative_effect_discarded/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'block_negative_effect', target: 'self' } }] },
  { r: /1_point_each_turn_while_pinned/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'points_per_turn_1', target: 'self' } }] },
  { r: /1_point_per_survival_card_played/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'points_per_survival_1', target: 'self' } }] },
  { r: /1_point_for_each_survival_card_pinned/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'points_per_pinned_survival_1', target: 'self' } }] },
  { r: /heal_1_health_each_turn/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'health_per_turn_1', target: 'self' } }] },
  { r: /draw_1_card_when_pinned/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'draw_when_pinned_1', target: 'self' } }] },
  { r: /blocks_earthquake_draw_1_card/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'block_earthquake_draw_1', target: 'self' } }] },
  { r: /blocks_wildfire_draw_1_card/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'block_wildfire_draw_1', target: 'self' } }] },
  { r: /2_points_if_hand_3/, p: [{ type: 'IF_HAND_SIZE', params: { op: '<=', amount: 3, target: 'self' }, then: [{ type: 'MODIFY_POINTS', params: { amount: 2, target: 'self' } }] }] },
  { r: /2_points_if_used_immediately_after_survival_card/, p: [{ type: 'IF_PREVIOUS_CARD_TYPE', params: { cardType: 'SURVIVAL' }, then: [{ type: 'MODIFY_POINTS', params: { amount: 2, target: 'self' } }] }] },
  { r: /convert_disaster_loss_into_points/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'convert_disaster_to_points', target: 'self' } }] },
  { r: /avoid_next_disaster_effect/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'avoid_disaster', target: 'self' } }] },
  { r: /evade_next_chaos_effect/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'evade_chaos', target: 'self' } }] },
  { r: /evade_next_hightier_disaster/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'evade_hightier_disaster', target: 'self' } }] },
  { r: /cancel_one_disaster_card_targeting_you/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'cancel_disaster_target', target: 'self' } }] },
  { r: /cancel_one_catac_card/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'cancel_catac', target: 'self' } }] },
  { r: /skip_your_turn_to_negate_catac_effect/, p: [{ type: 'SKIP_TURN', params: { target: 'self' } }, { type: 'APPLY_BUFF', params: { buffId: 'negate_catac', target: 'self' } }] },
  { r: /redirect_chaos_effect_to_another_player/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'redirect_chaos', target: 'self' } }] },
  { r: /redirect_next_negative_card/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'redirect_negative', target: 'self' } }] },
  { r: /3_points_all_others_lose_1_health/, p: [{ type: 'MODIFY_HEALTH', params: { amount: -1, target: 'all_opponents' } }] },
  { r: /take_1_card_from_discard_pile/, p: [{ type: 'RETURN_FROM_DISCARD', params: { amount: 1, target: 'self' } }] },
  { r: /steal_5_points_from_a_target/, p: [{ type: 'STEAL_POINTS', params: { amount: 5, target: 'target_player' } }] },
  { r: /lose_1_health_for_10_points/, p: [{ type: 'MODIFY_HEALTH', params: { amount: -1, target: 'self' } }, { type: 'MODIFY_POINTS', params: { amount: 10, target: 'self' } }] },
  { r: /confuse_opponent_skip_their_next_turn/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'skip_next', target: 'target_player' } }] },
  { r: /skip_targets_next_turn_blocked_by_kinetic_dampener/, p: [{ type: 'IF_UNBLOCKED', params: { target: 'inherited' }, then: [{ type: 'APPLY_BUFF', params: { buffId: 'skip_next', target: 'target_player' } }] }] },
  { r: /all_pinned_power_cards_disabled_for_1_turn/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'disable_powers_1_turn', target: 'all' } }] },
  { r: /destroy_one_pinned_power_card_of_target/, p: [{ type: 'DESTROY_PINNED', params: { amount: 1, target: 'target_player' } }] },
  { r: /reverse_turn_order_until_end_of_round/, p: [{ type: 'REVERSE_TURN_ORDER', params: { duration: 'round' } }] },
  { r: /reverse_turn_order_for_1_round/, p: [{ type: 'REVERSE_TURN_ORDER', params: { duration: 'round' } }] },
  { r: /reverse_turn_order_of_match/, p: [{ type: 'REVERSE_TURN_ORDER', params: { duration: 'permanent' } }] },
  { r: /randomly_addremove_15_points_from_each_player/, p: [{ type: 'MODIFY_POINTS_RANDOM', params: { min: -5, max: 5, target: 'all' } }] }, // interpreted 15 as 1-5
  { r: /shuffle_all_piles_into_deck/, p: [{ type: 'SHUFFLE_ALL_PILES' }] },
  { r: /draw_3_cards_discard_1/, p: [{ type: 'DISCARD_CARDS', params: { amount: 1, target: 'self' } }] },
  { r: /draw_2_cards_discard_1/, p: [{ type: 'DISCARD_CARDS', params: { amount: 1, target: 'self' } }] },
  { r: /draw_5_cards_discard_2/, p: [{ type: 'DISCARD_CARDS', params: { amount: 2, target: 'self' } }] },
  { r: /lose_2_points_opponents_gain_1_each/, p: [{ type: 'MODIFY_POINTS', params: { amount: -2, target: 'self' } }, { type: 'MODIFY_POINTS', params: { amount: 1, target: 'all_opponents' } }] },
  { r: /ignore_next_rule_of_your_choice/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'ignore_rule', target: 'self' } }] },
  { r: /redistribute_all_points_equally/, p: [{ type: 'REDISTRIBUTE_POINTS', params: { format: 'equal' } }] },
  { r: /roll_dice_gainlose_13_health/, p: [{ type: 'MODIFY_HEALTH_RANDOM', params: { min: -3, max: 3, target: 'self' } }] },
  { r: /swap_hands_with_a_target_player/, p: [{ type: 'SWAP_HANDS', params: { targetA: 'self', targetB: 'target_player' } }] },
  { r: /swap_entire_hand_with_opponent/, p: [{ type: 'SWAP_HANDS', params: { targetA: 'self', targetB: 'target_player' } }] },
  { r: /swap_two_opponents_hands/, p: [{ type: 'SWAP_HANDS', params: { targetA: 'random_opponent', targetB: 'random_opponent' } }] },
  { r: /randomly_swap_pinned_power_or_adapt_cards/, p: [{ type: 'SWAP_POWERS_RANDOM', params: { target: 'all' } }] },
  { r: /redirect_one_catac_card/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'redirect_catac', target: 'self' } }] },
  { r: /everyone_draws_(\d+)_card/, p: m => [{ type: 'DRAW_CARDS', params: { amount: +m[1], target: 'all' } }] },
  { r: /all_survival_cards_1_point_this_turn/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'survival_plus_1_pt', target: 'all' } }] },
  { r: /next_catac_card_effect_doubled/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'double_next_catac', target: 'global' } }] },
  { r: /reshuffle_next_turn_order_randomly/, p: [{ type: 'RESHUFFLE_TURN_ORDER', params: {} }] },
  { r: /revive_to_2_health_when_reaching_0/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'revive_2', target: 'self' } }] },
  { r: /repeat_last_survival_card_effect/, p: [{ type: 'REPEAT_LAST_SURVIVAL', params: {} }] },
  { r: /steal_next_draw_phase_from_opponent/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'steal_draw', target: 'target_player' } }] },
  { r: /15_points_in_one_turn/, p: [{ type: 'MODIFY_POINTS', params: { amount: 15, target: 'self' } }] },
  { r: /reset_all_players_to_0_points/, p: [{ type: 'SET_POINTS', params: { amount: 0, target: 'all' } }] },
  { r: /swap_two_opponents_pinned_power_cards/, p: [{ type: 'SWAP_PINNED_POWERS', params: { targetA: 'random_opponent', targetB: 'random_opponent' } }] },
  { r: /heal_3_health_instantly/, p: [] },
  { r: /play_two_chaos_cards_immediately/, p: [{ type: 'MODIFY_ACTIONS', params: { amount: -2, target: 'self' } }] },
  { r: /upgrade_one_adapt_card_for_double_effect/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'upgrade_adapt', target: 'self' } }] },
  { r: /undo_last_turn_of_any_player/, p: [{ type: 'UNDO_LAST_TURN', params: {} }] },
  { r: /prevent_all_health_loss_for_one_turn/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'prevent_health_loss_global', target: 'all' } }] },
  { r: /all_pinned_power_cards_gain_2_points/, p: [{ type: 'MODIFY_POINTS_SCALED', params: { scaleBy: 'all_pinned_powers', multiplier: 2, target: 'all' } }] },
  { r: /cancel_next_catac_effect_globally/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'cancel_next_catac', target: 'global' } }] },
  { r: /redirect_any_twist_or_catac_card/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'redirect_twist_catac', target: 'self' } }] },
  { r: /draw_5_gain_5_health_10_points/, p: [{ type: 'MODIFY_POINTS', params: { amount: 10, target: 'self' } }] },
  { r: /5050_chance_gainlose_3_points/, p: [{ type: 'CHANCE', params: { probability: 0.5 }, then: [{ type: 'MODIFY_POINTS', params: { amount: 3, target: 'self' } }], else: [{ type: 'MODIFY_POINTS', params: { amount: -3, target: 'self' } }] }] },
  { r: /skip_your_next_turn/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'skip_next', target: 'self' } }] },
  { r: /skip_next_turn_discard/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'skip_next', target: 'self' } }, { type: 'DISCARD_CARDS', params: { amount: 1, target: 'self', forceSelfDrawn: true } }] },
  { r: /draw_2_cards_2_points/, p: [{ type: 'MODIFY_POINTS', params: { amount: 2, target: 'self' } }] },
  { r: /gain_5_points/, p: [{ type: 'MODIFY_POINTS', params: { amount: 5, target: 'self' } }] },
  { r: /temporarily_increase_max_hand_to_6/, p: [{ type: 'MODIFY_MAX_HAND', params: { amount: 1, target: 'self' } }] },
  { r: /swap_two_of_your_own_cards/, p: [{ type: 'DISCARD_CARDS', params: { amount: 2, target: 'self' } }, { type: 'DRAW_CARDS', params: { amount: 2, target: 'self' } }] },
  { r: /draw_1_card_immediately/, p: [] },
  { r: /3_points_only_affects_drawer/, p: [{ type: 'MODIFY_POINTS', params: { amount: 3, target: 'self' } }] },
  { r: /5_points_only_drawer_affected/, p: [{ type: 'MODIFY_POINTS', params: { amount: 5, target: 'self' } }] },
  { r: /1_health_cannot_exceed_5/, p: [] },
  { r: /swap_1_card_with_discard/, p: [{ type: 'DISCARD_CARDS', params: { amount: 1, target: 'self' } }, { type: 'RETURN_FROM_DISCARD', params: { amount: 1, target: 'self' } }] },
  { r: /prevent_next_negative_card_effect/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'prevent_negative', target: 'self' } }] },
  { r: /shuffle_your_hand_draw_1/, p: [{ type: 'SHUFFLE_HAND_INTO_DECK', params: { target: 'self' } }, { type: 'DRAW_CARDS', params: { amount: 1, target: 'self' } }] },
  { r: /return_one_discarded_card_to_hand/, p: [{ type: 'RETURN_FROM_DISCARD', params: { amount: 1, target: 'self' } }] },
  { r: /return_a_played_card_from_discard_to_hand/, p: [{ type: 'RETURN_FROM_DISCARD', params: { amount: 1, target: 'self' } }] },
  { r: /play_an_extra_card_this_turn/, p: [{ type: 'MODIFY_ACTIONS', params: { amount: -1, target: 'self' } }] },
  { r: /skip_target_players_next_turn/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'skip_next', target: 'target_player' } }] },
  
  // Specific Disasters
  { r: /10_points_strike_all_players_discard_immediately/, p: [{ type: 'MODIFY_POINTS', params: { amount: -10, target: 'all' } }, { type: 'DISCARD_CARDS', params: { amount: 1, target: 'self', forceAction: true } }] },
  { r: /swap_hand_with_discard_pile_discard/, p: [{ type: 'SWAP_HANDS', params: { targetA: 'self', targetB: 'discard_pile' } }, { type: 'DISCARD_CARDS', params: { amount: 1, target: 'self', forceAction: true } }] },
  { r: /any_player_draws_extra_card_discard/, p: [{ type: 'DRAW_CARDS', params: { amount: 1, target: 'all' } }, { type: 'DISCARD_CARDS', params: { amount: 1, target: 'self', forceAction: true } }] },
  { r: /lose_3_points_discard/, p: [{ type: 'MODIFY_POINTS', params: { amount: -3, target: 'self' } }, { type: 'DISCARD_CARDS', params: { amount: 1, target: 'self', forceAction: true } }] },
  { r: /target_loses_pinned_power_discard/, p: [{ type: 'DESTROY_PINNED', params: { amount: 1, target: 'target_player' } }, { type: 'DISCARD_CARDS', params: { amount: 1, target: 'self', forceAction: true } }] },
  { r: /all_hands_shuffled_discard/, p: [{ type: 'SHUFFLE_HAND_INTO_DECK', params: { target: 'all' } }, { type: 'DISCARD_CARDS', params: { amount: 1, target: 'self', forceAction: true } }] },
  { r: /skip_next_2_draws_discard/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'skip_next_draw_2', target: 'self' } }, { type: 'DISCARD_CARDS', params: { amount: 1, target: 'self', forceAction: true } }] },
  { r: /discard_2_survival_cards_discard/, p: [{ type: 'DISCARD_CARDS', params: { amount: 2, filter: 'SURVIVAL', target: 'self' } }, { type: 'DISCARD_CARDS', params: { amount: 1, target: 'self', forceAction: true } }] },
  { r: /target_cannot_play_fire_survival_card_next_turn_discard/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'cannot_play_fire', target: 'target_player' } }, { type: 'DISCARD_CARDS', params: { amount: 1, target: 'self', forceAction: true } }] },
  { r: /swap_pinned_power_with_opponent_discard/, p: [{ type: 'SWAP_PINNED_POWERS', params: { targetA: 'self', targetB: 'target_player' } }, { type: 'DISCARD_CARDS', params: { amount: 1, target: 'self', forceAction: true } }] },
  { r: /all_discard_piles_shuffled_discard/, p: [{ type: 'SHUFFLE_DISCARD_INTO_DECK', params: {} }, { type: 'DISCARD_CARDS', params: { amount: 1, target: 'self', forceAction: true } }] },
  { r: /target_skips_next_action_discard/, p: [{ type: 'APPLY_BUFF', params: { buffId: 'skip_next_action', target: 'target_player' } }, { type: 'DISCARD_CARDS', params: { amount: 1, target: 'self', forceAction: true } }] },
  { r: /draw_1_lose_1_health_discard/, p: [{ type: 'MODIFY_HEALTH', params: { amount: -1, target: 'self' } }, { type: 'DISCARD_CARDS', params: { amount: 1, target: 'self', forceAction: true } }] },
  { r: /target_loses_5_health_discard_immediately/, p: [{ type: 'DISCARD_CARDS', params: { amount: 1, target: 'self', forceAction: true } }] },
  { r: /all_opponents_lose_3_points_discard/, p: [{ type: 'DISCARD_CARDS', params: { amount: 1, target: 'self', forceAction: true } }] },
  { r: /target_loses_2_health_discard/, p: [{ type: 'DISCARD_CARDS', params: { amount: 1, target: 'self', forceAction: true } }] },
  { r: /target_loses_2_points_discard/, p: [{ type: 'DISCARD_CARDS', params: { amount: 1, target: 'self', forceAction: true } }] },
  { r: /target_loses_3_points_discard/, p: [{ type: 'DISCARD_CARDS', params: { amount: 1, target: 'self', forceAction: true } }] },
  { r: /all_opponents_lose_1_health_discard/, p: [{ type: 'DISCARD_CARDS', params: { amount: 1, target: 'self', forceAction: true } }] },
  
  // Specific mappings
  { r: "4_points_maximizes_yield_when_health_is_5", p: [{ type: "IF_HEALTH", params: { op: "==", amount: 5, target: "self" }, then: [{ type: "MODIFY_POINTS", params: { amount: 2, target: "self" } }] }] },
  { r: "3_points_doubles_output_6_if_health_3", p: [{ type: "IF_HEALTH", params: { op: "<=", amount: 3, target: "self" }, then: [{ type: "MODIFY_POINTS", params: { amount: 3, target: "self" } }] }] },
  { r: "2_health_if_first_card_played_this_turn", p: [{ type: "IF_FIRST_CARD", params: {}, then: [{ type: "MODIFY_HEALTH", params: { amount: 2, target: "self" } }] }] },
  { r: "5_points_1_pt_for_each_pinned_power_card", p: [{ type: "MODIFY_POINTS_SCALED", params: { scaleBy: "pinned_powers", multiplier: 1, target: "self" } }] },

];

const getMatchPrims = (e, card) => {
   for (const rx of rgxMap) {
      if (typeof rx.r === 'string' && e === rx.r) return typeof rx.p === 'function' ? rx.p(e.match(rx.r)) : rx.p;
      if (rx.r instanceof RegExp) {
          const mt = e.match(rx.r);
          if (mt) return typeof rx.p === 'function' ? rx.p(mt) : rx.p;
      }
   }
   return [{ type: 'UNMAPPED', params: { effect: e } }];
}

let cardsOut = [];

for (const cat of Object.keys(cards)) {
  for (const card of cards[cat]) {
     let p = getBasePrims(card);
     if (card.effect) {
         let sub = getMatchPrims(card.effect, card);
         p.push(...sub);
     }
     
     let cleaned = {...card, primitives: p};
     delete cleaned.effect;
     delete cleaned.pointsDelta;
     delete cleaned.gainHealth;
     delete cleaned.drawCount;
     delete cleaned.healthDelta;
     cardsOut.push(cleaned);
  }
}

// Convert back to mapping
let newJson = {};
Object.keys(cards).forEach(k => newJson[k] = []);
cardsOut.forEach(c => newJson[c.type].push(c));

fs.writeFileSync('./src/data/cards.json', JSON.stringify(newJson, null, 2));
console.log('Finished migrating cards.json');
