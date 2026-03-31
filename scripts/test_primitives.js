const fs = require('fs');
const cards = JSON.parse(fs.readFileSync('./src/data/cards.json', 'utf8'));

function parseEffect(card) {
  let prims = [];
  
  if (card.pointsDelta) {
     const isDisaster = card.type === 'DISASTER' || card.type === 'CATACLYSM';
     if (isDisaster) {
        prims.push({ type: 'MODIFY_POINTS', params: { amount: -Math.abs(card.pointsDelta), target: 'target_player' } });
     } else {
        prims.push({ type: 'MODIFY_POINTS', params: { amount: card.pointsDelta, target: 'self' } });
     }
  }

  if (card.gainHealth) {
     const isDisaster = card.type === 'DISASTER' || card.type === 'CATACLYSM';
     if (isDisaster) {
        prims.push({ type: 'MODIFY_HEALTH', params: { amount: -Math.abs(card.gainHealth), target: 'target_player' } });
     } else {
        prims.push({ type: 'MODIFY_HEALTH', params: { amount: card.gainHealth, target: 'self' } });
     }
  }
  
  if (card.healthDelta) {
     prims.push({ type: 'MODIFY_HEALTH', params: { amount: -Math.abs(card.healthDelta), target: 'target_player' } });
  }

  if (card.drawCount) {
     prims.push({ type: 'DRAW_CARDS', params: { amount: card.drawCount, target: 'self' } });
  }

  const e = card.effect || "";
  if (!e) return prims;

  const out = (type, params) => [{ type, params }];

  // Dynamic mapping
  const m = {
    "upgrade_one_pinned_power_card_temporarily_doubles_effect": out("APPLY_BUFF", { buffId: "upgrade_power", target: "self" }),
    "3_points_if_next_card_is_chaos_negate_effect": out("APPLY_BUFF", { buffId: "negate_next_chaos", target: "self" }),
    "heal_1_health_and_prevent_next_point_loss": [...out("MODIFY_HEALTH", { amount: 1, target: "self" }), ...out("APPLY_BUFF", { buffId: "prevent_point_loss", target: "self" })],
    "block_first_disaster_damage_this_turn": out("APPLY_BUFF", { buffId: "block_first_disaster", target: "self" }),
    "4_points_discard_one_card_to_double_points": [...out("DISCARD_CARDS", { amount: 1, target: "self" }), ...out("MODIFY_POINTS", { amount: 4, target: "self" })],
    "2_health_draw_1_card": [], // handled by base stats
    "3_points_if_hand_3_cards_draw_1": [{ type: "IF_HAND_SIZE", params: { op: "<=", amount: 3, target: "self" }, then: out("DRAW_CARDS", { amount: 1, target: "self" }) }],
    "5_points_reduce_incoming_disaster_effect_by_1": out("APPLY_BUFF", { buffId: "reduce_disaster_damage_1", target: "self" }),
    "2_points_discard_1_to_draw_2": out("DISCARD_AND_DRAW", { discardAmount: 1, drawAmount: 2, target: "self" }),
    "3_health_if_no_other_survival_card_played": [{ type: "IF_NO_OTHER_SURVIVAL", then: out("MODIFY_HEALTH", { amount: 3, target: "self" }) }],
    "3_points_1_if_chaos_card_played_previously": [{ type: "IF_CHAOS_PLAYED", then: out("MODIFY_POINTS", { amount: 1, target: "self" }) }],
    "1_health_per_pinned_adapt_card": out("MODIFY_HEALTH_SCALED", { scaleBy: "pinned_adapt", multiplier: 1, target: "self" }),
    "2_points_prevent_next_negative_card_effect": out("APPLY_BUFF", { buffId: "prevent_next_negative", target: "self" }),
    "draw_2_opponent_discards_1": out("DISCARD_CARDS", { amount: 1, target: "target_opponent" }), // assumes target_opponent logic
    "3_points_can_redirect_next_disaster": out("APPLY_BUFF", { buffId: "redirect_next_disaster", target: "self" }),
    "prevent_opponent_from_drawing_next_card": out("APPLY_BUFF", { buffId: "prevent_draw", target: "target_opponent" }),
    "3_points_can_steal_1_point_from_target": out("STEAL_POINTS", { amount: 1, target: "target_player" }),
    "2_points_hand_limit_temporarily_1": out("MODIFY_MAX_HAND", { amount: 1 }),
    "2_health_protects_next_turn": out("APPLY_BUFF", { buffId: "protect_next_turn", target: "self" }),
    "draw_1_revive_1_health_if_needed": [{ type: "IF_HEALTH", params: { op: "<", amount: 5, target: "self" }, then: out("MODIFY_HEALTH", { amount: 1, target: "self" }) }],
    "1_health_next_disaster_negated": out("APPLY_BUFF", { buffId: "negate_next_disaster", target: "self" }),
    "3_points_discard_1_to_draw_2": out("DISCARD_AND_DRAW", { discardAmount: 1, drawAmount: 2, target: "self" }),
    "2_points_block_chaos_effect_once": out("APPLY_BUFF", { buffId: "block_chaos", target: "self" }),
    "3_points_draw_1_card_if_hand_5": [{ type: "IF_HAND_SIZE", params: { op: "<=", amount: 5, target: "self" }, then: out("DRAW_CARDS", { amount: 1, target: "self" }) }],
    "2_points_temporary_hand_1": out("MODIFY_MAX_HAND", { amount: 1 }),
    "heal_1_health_prevent_next_catac_effect": out("APPLY_BUFF", { buffId: "prevent_next_catac", target: "self" }),
    "2_health_can_block_next_disaster": out("APPLY_BUFF", { buffId: "block_next_disaster", target: "self" }),
    "3_points_discard_1_to_draw_1": out("DISCARD_AND_DRAW", { discardAmount: 1, drawAmount: 1, target: "self" }),
    "5_points_reset_hand_to_5_if_lower": [{ type: "IF_HAND_SIZE", params: { op: "<", amount: 5, target: "self" }, then: out("DRAW_CARDS", { amount: "fill_to_5", target: "self" }) }],
    "2_health_prevent_first_disaster_next_turn": out("APPLY_BUFF", { buffId: "prevent_disaster_next_turn", target: "self" }),
    "3_points_1_if_hand_3": [{ type: "IF_HAND_SIZE", params: { op: "<=", amount: 3, target: "self" }, then: out("MODIFY_POINTS", { amount: 1, target: "self" }) }],
    "2_points_block_next_disaster": out("APPLY_BUFF", { buffId: "block_next_disaster", target: "self" }),
    "2_health_discard_1_to_draw_1": out("DISCARD_AND_DRAW", { discardAmount: 1, drawAmount: 1, target: "self" }),
    "1_health_prevent_next_catac_effect": out("APPLY_BUFF", { buffId: "prevent_next_catac", target: "self" }),
    "4_points_discard_1_card_to_gain_2_points": [...out("DISCARD_CARDS", { amount: 1, target: "self" }), ...out("MODIFY_POINTS", { amount: 2, target: "self" })],
    "3_points_can_negate_one_chaos_card": out("APPLY_BUFF", { buffId: "negate_chaos", target: "self" }),
    "2_points_next_catac_effect_negated": out("APPLY_BUFF", { buffId: "negate_next_catac", target: "self" }),
    "1_health_draw_1_card": [],
    "2_health_prevent_one_negative_effect": out("APPLY_BUFF", { buffId: "prevent_one_negative", target: "self" }),
    "draw_2_discard_1_if_hand_5": [{ type: "IF_HAND_SIZE", params: { op: ">=", amount: 5, target: "self" }, then: out("DISCARD_CARDS", { amount: 1, target: "self" }) }],
    "3_points_block_one_disaster": out("APPLY_BUFF", { buffId: "block_one_disaster", target: "self" }),
    "2_points_redirect_next_negative_card": out("APPLY_BUFF", { buffId: "redirect_next_negative", target: "self" }),
    "1_health_1_if_chaos_played_last_turn": [{ type: "IF_CHAOS_PLAYED_LAST_TURN", then: out("MODIFY_HEALTH", { amount: 1, target: "self" }) }],
    "3_points_draw_1_if_hand_4": [{ type: "IF_HAND_SIZE", params: { op: "<=", amount: 4, target: "self" }, then: out("DRAW_CARDS", { amount: 1, target: "self" }) }],
    "2_points_block_first_catac": out("APPLY_BUFF", { buffId: "block_first_catac", target: "self" }),
    "4_points_discard_1_to_draw_2": out("DISCARD_AND_DRAW", { discardAmount: 1, drawAmount: 2, target: "self" }),
    "heal_2_health_prevent_one_negative_effect": out("APPLY_BUFF", { buffId: "prevent_one_negative", target: "self" }),
    "2_health_draw_1_if_hand_3": [{ type: "IF_HAND_SIZE", params: { op: "<=", amount: 3, target: "self" }, then: out("DRAW_CARDS", { amount: 1, target: "self" }) }],
    "4_points_temporary_hand_1": out("MODIFY_MAX_HAND", { amount: 1 }),
    "1_health_redirect_next_negative_card": out("APPLY_BUFF", { buffId: "redirect_next_negative", target: "self" }),
    "heal_1_prevent_next_disaster": out("APPLY_BUFF", { buffId: "prevent_next_disaster", target: "self" }),
    "4_points_discard_1_to_gain_1_health": [...out("DISCARD_CARDS", { amount: 1, target: "self" }), ...out("MODIFY_HEALTH", { amount: 1, target: "self" })],
    "2_health_block_one_catac": out("APPLY_BUFF", { buffId: "block_one_catac", target: "self" }),
    "draw_2_1_point": [],
    "5_points_hand_temporary_1": out("MODIFY_MAX_HAND", { amount: 1 }),
    "heal_1_health_prevent_next_disaster": out("APPLY_BUFF", { buffId: "prevent_next_disaster", target: "self" }),

    // Targeted/Global Disasters
    "all_opponents_lose_3_health_can_be_blocked_by_kinetic_dampener": [{ type: "IF_UNBLOCKED", params: { disasterKind: "EARTHQUAKE", target: "all_opponents" }, then: out("MODIFY_HEALTH", { amount: -3, target: "all_opponents" }) }], // Note: we can map the strings strictly with regex to save hardcoding later
  };

  const rgxMap = [
    { r: /^(.*)_blocked_by_(.*)$/, p: (m) => [{ type: "IF_UNBLOCKED", params: { target: "inherited" }, then: parseVanilla(m[1]) }] },
    { r: /^all_opponents_lose_(\d+)_health/, p: (m) => out("MODIFY_HEALTH", { amount: -m[1], target: "all_opponents" }) },
    { r: /^target_loses_(\d+)_points/, p: (m) => out("MODIFY_POINTS", { amount: -m[1], target: "target_player" }) },
    { r: /^target_loses_(\d+)_health/, p: (m) => out("MODIFY_HEALTH", { amount: -m[1], target: "target_player" }) },
    { r: /^target_cannot_regain_health/, p: (m) => out("APPLY_BUFF", { buffId: "cannot_regain_health", target: "target_player" }) },
    { r: /^all_opponents_lose_(\d+)_points/, p: (m) => out("MODIFY_POINTS", { amount: -m[1], target: "all_opponents" }) },
    { r: /^target_discards_(\d+)_cards/, p: (m) => out("DISCARD_CARDS", { amount: +m[1], target: "target_player" }) },
    { r: /^target_discards_(\d+)_card/, p: (m) => out("DISCARD_CARDS", { amount: +m[1], target: "target_player" }) },
    { r: /^skip_targets_next_turn/, p: (m) => out("APPLY_BUFF", { buffId: "skip_next", target: "target_player" }) },
    { r: /^swap_targets_hand_with_discard_pile/, p: (m) => out("SWAP_HANDS", { targetA: "target_player", targetB: "discard_pile" }) },
    { r: /^target_cannot_play_survival_cards/, p: (m) => out("APPLY_BUFF", { buffId: "cannot_play_survival", target: "target_player" }) },
    { r: /^target_skips_next_draw/, p: (m) => out("APPLY_BUFF", { buffId: "skip_next_draw", target: "target_player" }) },
    { r: /^all_opponents_discard_(\d+)_card/, p: (m) => out("DISCARD_CARDS", { amount: +m[1], target: "all_opponents" }) },
    { r: /^target_loses_(\d+)_health_each_turn_for_(\d+)_turns/, p: (m) => out("APPLY_BUFF", { buffId: "health_bleed_1", duration: +m[2], target: "target_player" }) },
    { r: /^target_loses_(\d+)_point_per_turn_for_(\d+)_turns/, p: (m) => out("APPLY_BUFF", { buffId: "point_bleed_1", duration: +m[2], target: "target_player" }) },
    { r: /^all_players_lose_(\d+)_points/, p: (m) => out("MODIFY_POINTS", { amount: -m[1], target: "all" }) },
    { r: /^blocks_first_(.*)_disaster_pinned_until_destroyed/, p: (m) => out("APPLY_POWER", { logic: "block_first_disaster", kind: m[1] }) },
    { r: /^blocks_next_(.*)_disaster_pinned/, p: (m) => out("APPLY_POWER", { logic: "block_next_disaster", kind: m[1] }) },
    { r: /^1_point_per_(.*)_card_played/, p: (m) => out("APPLY_POWER", { logic: "gain_1_pt_per_card_played", condition: m[1] }) },

    // More basic patterns so I don't have to duplicate
    { r: /cancel_one_(.*)_card($|_targeting_you)/, p: (m) => out("APPLY_BUFF", { buffId: "cancel_card", kind: m[1] }) },
    { r: /evade_next_(.*)/, p: (m) => out("APPLY_BUFF", { buffId: "evade_next", kind: m[1] }) },
    { r: /draw_(\d+)_card_when_pinned/, p: (m) => out("APPLY_POWER", { logic: "draw_when_pinned", amount: +m[1] }) },
    { r: /heal_(\d+)_health_each_turn/, p: (m) => out("APPLY_POWER", { logic: "heal_per_turn", amount: +m[1] }) },
    { r: /1_point_each_turn_while_pinned/, p: (m) => out("APPLY_POWER", { logic: "point_per_turn", amount: 1 }) },
  ];

  function parseVanilla(str) {
      for (const rx of rgxMap) {
          const mt = str.match(rx.r);
          if (mt) return rx.p(mt);
      }
      return out("UNMAPPED", { effect: str });
  }

  if (m[e]) prims.push(...m[e]);
  else {
      let matched = false;
      for (const rx of rgxMap) {
          const match = e.match(rx.r);
          if (match) {
             prims.push(...rx.p(match));
             matched = true;
             break;
          }
      }
      if (!matched && !card.pointsDelta && !card.gainHealth && !card.drawCount && !card.healthDelta) prims.push({ type: "UNMAPPED", params: { effect: e } });
      else if (!matched && e !== "") prims.push({ type: "UNMAPPED", params: { effect: e } });
  }

  return prims;
}

let unmappedEffects = new Set();
let cardsOut = [];

for (const cat of Object.keys(cards)) {
   for (const card of cards[cat]) {
      const res = parseEffect(card);
      let cleanedCard = { ...card };
      delete cleanedCard.effect;
      delete cleanedCard.pointsDelta;
      delete cleanedCard.gainHealth;
      delete cleanedCard.drawCount;
      delete cleanedCard.healthDelta;
      cleanedCard.primitives = res;
      cardsOut.push(cleanedCard);

      if (res.some(r => r.type === "UNMAPPED" || (r.then && r.then.some(t => t.type === "UNMAPPED")))) {
          unmappedEffects.add(card.effect);
      }
   }
}

fs.writeFileSync('./effects_todo.txt', Array.from(unmappedEffects).join('\n'));
console.log(`Wrote ${unmappedEffects.size} unmatched effects to effects_todo.txt`);

