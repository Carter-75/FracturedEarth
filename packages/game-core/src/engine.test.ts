import { describe, expect, it } from 'vitest';
import { advanceTurn, applyMatchAction, drawForActive, getAllCards, getCanonicalCardMatrix, getCardById, initializeMatch, playCard, type MatchAction } from './index.js';

const fullDeck = getAllCards();

describe('game-core engine', () => {
  const roomPlayers = [
    { userId: 'p1', displayName: 'Pilot One', emoji: '🌍', isBot: false },
    { userId: 'p2', displayName: 'Pilot Bot', emoji: '🤖', isBot: true },
  ];

  it('initializes match state with slots and baseline rules', async () => {
    const state = await initializeMatch({
      roomPlayers,
      roomCode: 'ROOM01',
      fullDeck,
    });

    expect(state.mode).toBe('practice');
    expect(state.occupiedSlots).toHaveLength(4);
    expect(state.players[0].hand.length).toBeGreaterThan(0);
  });

  it('requires a valid slot index when playing a card', async () => {
    let state = await initializeMatch({
      roomPlayers,
      roomCode: 'ROOM02',
      fullDeck,
    });

    state = await applyMatchAction({
      current: state,
      action: { type: 'DRAW_CARD' },
      actorUserId: 'p1',
      roomPlayers,
      roomCode: 'ROOM02',
    });

    const action: MatchAction = {
      type: 'PLAY_CARD',
      cardId: state.players[0].hand[0].id,
      slotIndex: 0,
    };

    state = await applyMatchAction({
      current: state,
      action,
      actorUserId: 'p1',
      roomPlayers,
      roomCode: 'ROOM02',
    });

    expect(state.occupiedSlots.find((slot) => slot.slotIndex === 0)?.cardId).toBeTruthy();
  });

  it('counts a drawn Twist as one of the turn plays and resolves it immediately', () => {
    const twist = getCardById('twist_energy_boost');
    expect(twist).toBeTruthy();

    const state = {
      mode: 'practice' as const,
      roomCode: 'TWIST1',
      round: 1,
      activePlayerIndex: 0,
      players: [
        {
          id: 'p1',
          displayName: 'Pilot One',
          emoji: '🌍',
          isBot: false,
          survivalPoints: 0,
          health: 5,
          hand: [],
          powers: [],
          traits: [],
          triggers: [],
        },
        {
          id: 'p2',
          displayName: 'Pilot Two',
          emoji: '🔥',
          isBot: false,
          survivalPoints: 0,
          health: 5,
          hand: [],
          powers: [],
          traits: [],
          triggers: [],
        },
      ],
      drawPile: [twist!],
      discardPile: [],
      turnPile: [],
      turnHistory: [],
      topCard: undefined,
      turnDirection: 1 as const,
      isGlobalDisasterPhase: false,
      cardsPlayedThisTurn: 0,
      hasDrawnThisTurn: false,
      occupiedSlots: Array.from({ length: 4 }, (_, slotIndex) => ({ slotIndex })),
      pendingResolution: [],
    };

    const next = drawForActive(state);
    expect(next.hasDrawnThisTurn).toBe(true);
    expect(next.cardsPlayedThisTurn).toBe(1);
    expect(next.players[0].survivalPoints).toBe(3);
    expect(next.topCard?.id).toBe('twist_energy_boost');
  });

  it('resolves a special draw on the player who drew it even during another player effect', () => {
    const twist = getCardById('twist_minor_luck');
    expect(twist).toBeTruthy();

    const triggerCard = {
      id: 'test_force_draw',
      name: 'Forced Draw',
      type: 'SURVIVAL' as const,
      description: 'Target opponent draws 1 card.',
      effect: 'Target opponent draws 1 card.',
      primitives: [{ type: 'DRAW_CARDS', params: { amount: 1, target: 'target_opponent' } }],
    };

    const state = {
      mode: 'practice' as const,
      roomCode: 'DRAW2',
      round: 1,
      activePlayerIndex: 0,
      players: [
        {
          id: 'p1',
          displayName: 'Pilot One',
          emoji: '🌍',
          isBot: false,
          survivalPoints: 0,
          health: 5,
          hand: [triggerCard],
          powers: [],
          traits: [],
          triggers: [],
        },
        {
          id: 'p2',
          displayName: 'Pilot Two',
          emoji: '🔥',
          isBot: false,
          survivalPoints: 0,
          health: 5,
          hand: [],
          powers: [],
          traits: [],
          triggers: [],
        },
      ],
      drawPile: [twist!],
      discardPile: [],
      turnPile: [],
      turnHistory: [],
      topCard: undefined,
      turnDirection: 1 as const,
      isGlobalDisasterPhase: false,
      cardsPlayedThisTurn: 0,
      hasDrawnThisTurn: true,
      occupiedSlots: Array.from({ length: 4 }, (_, slotIndex) => ({ slotIndex })),
      pendingResolution: [],
    };

    const next = playCard(state, triggerCard.id, 'p2', () => 0.2, 0);
    expect(next.players[0].survivalPoints).toBe(0);
    expect(next.players[1].survivalPoints).toBe(5);
    expect(next.cardsPlayedThisTurn).toBe(2);
  });

  it('honors IF_FIRST_CARD conditionals on the first play of the turn', () => {
    const conditionalCard = {
      id: 'test_first_card',
      name: 'Opening Move',
      type: 'SURVIVAL' as const,
      description: 'If first card, gain 2 Points.',
      effect: 'If first card, gain 2 Points.',
      primitives: [
        {
          type: 'IF_FIRST_CARD',
          then: [{ type: 'MODIFY_POINTS', params: { amount: 2, target: 'self' } }],
        },
      ],
    };

    const state = {
      mode: 'practice' as const,
      roomCode: 'FIRST1',
      round: 1,
      activePlayerIndex: 0,
      players: [
        {
          id: 'p1',
          displayName: 'Pilot One',
          emoji: '🌍',
          isBot: false,
          survivalPoints: 0,
          health: 5,
          hand: [conditionalCard],
          powers: [],
          traits: [],
          triggers: [],
        },
        {
          id: 'p2',
          displayName: 'Pilot Two',
          emoji: '🔥',
          isBot: false,
          survivalPoints: 0,
          health: 5,
          hand: [],
          powers: [],
          traits: [],
          triggers: [],
        },
      ],
      drawPile: [],
      discardPile: [],
      turnPile: [],
      turnHistory: [],
      topCard: undefined,
      turnDirection: 1 as const,
      isGlobalDisasterPhase: false,
      cardsPlayedThisTurn: 0,
      hasDrawnThisTurn: true,
      occupiedSlots: Array.from({ length: 4 }, (_, slotIndex) => ({ slotIndex })),
      pendingResolution: [],
    };

    const next = playCard(state, conditionalCard.id, undefined, () => 0.1, 0);
    expect(next.players[0].survivalPoints).toBe(2);
  });

  it('treats skipped draws as a consumed draw step instead of deadlocking the turn', () => {
    const state = {
      mode: 'practice' as const,
      roomCode: 'SKIP1',
      round: 1,
      activePlayerIndex: 0,
      players: [
        {
          id: 'p1',
          displayName: 'Pilot One',
          emoji: '🌍',
          isBot: false,
          survivalPoints: 0,
          health: 5,
          hand: [],
          powers: [],
          traits: [],
          triggers: [{ id: 'skip', kind: 'SKIP_NEXT_DRAW', duration: 'permanent' as const, value: 1 }],
        },
        {
          id: 'p2',
          displayName: 'Pilot Two',
          emoji: '🔥',
          isBot: false,
          survivalPoints: 0,
          health: 5,
          hand: [],
          powers: [],
          traits: [],
          triggers: [],
        },
      ],
      drawPile: [],
      discardPile: [],
      turnPile: [],
      turnHistory: [],
      topCard: undefined,
      turnDirection: 1 as const,
      isGlobalDisasterPhase: false,
      cardsPlayedThisTurn: 0,
      hasDrawnThisTurn: false,
      occupiedSlots: Array.from({ length: 4 }, (_, slotIndex) => ({ slotIndex })),
      pendingResolution: [],
    };

    const next = drawForActive(state);
    expect(next.hasDrawnThisTurn).toBe(true);
    expect(next.players[0].triggers).toHaveLength(0);
  });

  it('exposes ordered effect steps for the UI card text', () => {
    const card = getCardById('twist_blessing_of_unity');
    expect(card?.effectSteps?.length).toBeGreaterThan(0);
    expect(card?.effectSteps?.[0]).toContain('draw 3');
  });

  it('prevents a protected player from being skipped on turn advance', () => {
    const state = {
      mode: 'practice' as const,
      roomCode: 'TURNP1',
      round: 1,
      activePlayerIndex: 0,
      players: [
        {
          id: 'p1',
          displayName: 'Pilot One',
          emoji: '🌍',
          isBot: false,
          survivalPoints: 0,
          health: 5,
          hand: [],
          powers: [],
          traits: [],
          triggers: [],
        },
        {
          id: 'p2',
          displayName: 'Pilot Two',
          emoji: '🔥',
          isBot: false,
          survivalPoints: 0,
          health: 5,
          hand: [],
          powers: [],
          traits: [],
          triggers: [
            { id: 'skip', kind: 'SKIP_NEXT_TURN' as const, duration: 'permanent' as const, value: 1 },
            { id: 'protect', kind: 'PREVENT_TURN_SKIP' as const, duration: 'permanent' as const, value: 1 },
          ],
        },
      ],
      drawPile: [],
      discardPile: [],
      turnPile: [],
      turnHistory: [],
      topCard: undefined,
      turnDirection: 1 as const,
      isGlobalDisasterPhase: false,
      cardsPlayedThisTurn: 0,
      hasDrawnThisTurn: true,
      occupiedSlots: Array.from({ length: 4 }, (_, slotIndex) => ({ slotIndex })),
      pendingResolution: [],
    };

    const next = advanceTurn(state);
    expect(next.activePlayerIndex).toBe(1);
    expect(next.players[1].triggers).toHaveLength(0);
  });

  it('consumes skip-next-action instead of playing the selected card', async () => {
    const basicCard = {
      id: 'test_basic_play',
      name: 'Basic Play',
      type: 'SURVIVAL' as const,
      description: 'Gain 1 Point.',
      effect: 'Gain 1 Point.',
      primitives: [{ type: 'MODIFY_POINTS', params: { amount: 1, target: 'self' } }],
    };

    const state = {
      mode: 'practice' as const,
      roomCode: 'SKACT1',
      round: 1,
      activePlayerIndex: 0,
      players: [
        {
          id: 'p1',
          displayName: 'Pilot One',
          emoji: '🌍',
          isBot: false,
          survivalPoints: 0,
          health: 5,
          hand: [basicCard],
          powers: [],
          traits: [],
          triggers: [{ id: 'skipAction', kind: 'SKIP_NEXT_ACTION' as const, duration: 'permanent' as const, value: 1 }],
        },
        {
          id: 'p2',
          displayName: 'Pilot Two',
          emoji: '🔥',
          isBot: false,
          survivalPoints: 0,
          health: 5,
          hand: [],
          powers: [],
          traits: [],
          triggers: [],
        },
      ],
      drawPile: [],
      discardPile: [],
      turnPile: [],
      turnHistory: [],
      topCard: undefined,
      turnDirection: 1 as const,
      isGlobalDisasterPhase: false,
      cardsPlayedThisTurn: 0,
      hasDrawnThisTurn: true,
      occupiedSlots: Array.from({ length: 4 }, (_, slotIndex) => ({ slotIndex })),
      pendingResolution: [],
    };

    const next = await applyMatchAction({
      current: state,
      action: { type: 'PLAY_CARD', cardId: basicCard.id, slotIndex: 0 },
      actorUserId: 'p1',
      roomPlayers,
      roomCode: 'SKACT1',
    });

    expect(next.players[0].hand).toHaveLength(1);
    expect(next.players[0].survivalPoints).toBe(0);
    expect(next.cardsPlayedThisTurn).toBe(1);
    expect(next.players[0].triggers).toHaveLength(0);
  });

  it('applies survival passive bonus points when survival-plus trigger is active', () => {
    const survivalCard = {
      id: 'test_survival_bonus',
      name: 'Survival Bonus',
      type: 'SURVIVAL' as const,
      description: 'Gain 1 Point.',
      effect: 'Gain 1 Point.',
      primitives: [{ type: 'MODIFY_POINTS', params: { amount: 1, target: 'self' } }],
    };

    const state = {
      mode: 'practice' as const,
      roomCode: 'SURV1',
      round: 1,
      activePlayerIndex: 0,
      players: [
        {
          id: 'p1',
          displayName: 'Pilot One',
          emoji: '🌍',
          isBot: false,
          survivalPoints: 0,
          health: 5,
          hand: [survivalCard],
          powers: [],
          traits: [],
          triggers: [{ id: 'survPlus', kind: 'SURVIVAL_PLUS_1_PT' as const, duration: 'turn' as const, value: 1 }],
        },
        {
          id: 'p2',
          displayName: 'Pilot Two',
          emoji: '🔥',
          isBot: false,
          survivalPoints: 0,
          health: 5,
          hand: [],
          powers: [],
          traits: [],
          triggers: [],
        },
      ],
      drawPile: [],
      discardPile: [],
      turnPile: [],
      turnHistory: [],
      topCard: undefined,
      turnDirection: 1 as const,
      isGlobalDisasterPhase: false,
      cardsPlayedThisTurn: 0,
      hasDrawnThisTurn: true,
      occupiedSlots: Array.from({ length: 4 }, (_, slotIndex) => ({ slotIndex })),
      pendingResolution: [],
    };

    const next = playCard(state, survivalCard.id, undefined, () => 0.1, 0);
    expect(next.players[0].survivalPoints).toBe(2);
  });

  it('negates Survival card effects for the rest of the turn when the trigger is active', () => {
    const survivalCard = {
      id: 'test_negated_survival',
      name: 'Negated Survival',
      type: 'SURVIVAL' as const,
      description: 'Gain 4 Points.',
      effect: 'Gain 4 Points.',
      primitives: [{ type: 'MODIFY_POINTS', params: { amount: 4, target: 'self' } }],
    };

    const state = {
      mode: 'practice' as const,
      roomCode: 'NOSURV1',
      round: 1,
      activePlayerIndex: 0,
      players: [
        {
          id: 'p1',
          displayName: 'Pilot One',
          emoji: '🌍',
          isBot: false,
          survivalPoints: 0,
          health: 5,
          hand: [survivalCard],
          powers: [],
          traits: [],
          triggers: [{ id: 'noSurvival', kind: 'NEGATE_ALL_SURVIVAL_THIS_TURN' as const, duration: 'turn' as const }],
        },
        {
          id: 'p2',
          displayName: 'Pilot Two',
          emoji: '🔥',
          isBot: false,
          survivalPoints: 0,
          health: 5,
          hand: [],
          powers: [],
          traits: [],
          triggers: [],
        },
      ],
      drawPile: [],
      discardPile: [],
      turnPile: [],
      turnHistory: [],
      topCard: undefined,
      turnDirection: 1 as const,
      isGlobalDisasterPhase: false,
      cardsPlayedThisTurn: 0,
      hasDrawnThisTurn: true,
      occupiedSlots: Array.from({ length: 4 }, (_, slotIndex) => ({ slotIndex })),
      pendingResolution: [],
    };

    const next = playCard(state, survivalCard.id, undefined, () => 0.1, 2);
    expect(next.players[0].survivalPoints).toBe(0);
    expect(next.players[0].hand).toHaveLength(0);
    expect(next.discardPile.map((card) => card.id)).toContain(survivalCard.id);
    expect(next.cardsPlayedThisTurn).toBe(1);
    expect(next.pendingResolution?.at(-1)?.status).toBe('failed');
    expect(next.occupiedSlots.find((slot) => slot.slotIndex === 2)?.cardId).toBe(survivalCard.id);
  });

  it('discards only cards matching the requested filter', () => {
    const filterCard = {
      id: 'test_filter_discard',
      name: 'Filtered Purge',
      type: 'CHAOS' as const,
      description: 'Discard 1 Survival card.',
      effect: 'Discard 1 Survival card.',
      primitives: [{ type: 'DISCARD_CARDS', params: { amount: 1, filter: 'SURVIVAL', target: 'self' } }],
    };
    const keepCard = {
      id: 'test_keep_chaos',
      name: 'Keep Chaos',
      type: 'CHAOS' as const,
      description: 'No effect.',
      effect: 'No effect.',
      primitives: [],
    };
    const discardCard = {
      id: 'test_discard_survival',
      name: 'Discard Survival',
      type: 'SURVIVAL' as const,
      description: 'Gain 1 Point.',
      effect: 'Gain 1 Point.',
      primitives: [{ type: 'MODIFY_POINTS', params: { amount: 1, target: 'self' } }],
    };

    const state = {
      mode: 'practice' as const,
      roomCode: 'FILTER1',
      round: 1,
      activePlayerIndex: 0,
      players: [
        {
          id: 'p1',
          displayName: 'Pilot One',
          emoji: '🌍',
          isBot: false,
          survivalPoints: 0,
          health: 5,
          hand: [filterCard, keepCard, discardCard],
          powers: [],
          traits: [],
          triggers: [],
        },
        {
          id: 'p2',
          displayName: 'Pilot Two',
          emoji: '🔥',
          isBot: false,
          survivalPoints: 0,
          health: 5,
          hand: [],
          powers: [],
          traits: [],
          triggers: [],
        },
      ],
      drawPile: [],
      discardPile: [],
      turnPile: [],
      turnHistory: [],
      topCard: undefined,
      turnDirection: 1 as const,
      isGlobalDisasterPhase: false,
      cardsPlayedThisTurn: 0,
      hasDrawnThisTurn: true,
      occupiedSlots: Array.from({ length: 4 }, (_, slotIndex) => ({ slotIndex })),
      pendingResolution: [],
    };

    const next = playCard(state, filterCard.id, undefined, () => 0.1, 0);
    expect(next.players[0].hand.map((card) => card.id)).toEqual(['test_keep_chaos']);
    expect(next.discardPile.map((card) => card.id)).toEqual(['test_filter_discard', 'test_discard_survival']);
  });

  it('converts the next Disaster loss into Points instead of taking the hit', () => {
    const disasterCard = {
      id: 'test_disaster_loss',
      name: 'Disaster Loss',
      type: 'DISASTER' as const,
      disasterKind: 'PLAGUE' as const,
      description: 'Target loses 2 Health.',
      effect: 'Target loses 2 Health.',
      primitives: [{ type: 'MODIFY_HEALTH', params: { amount: -2, target: 'target_player' } }],
    };

    const state = {
      mode: 'practice' as const,
      roomCode: 'FLUX1',
      round: 1,
      activePlayerIndex: 0,
      players: [
        {
          id: 'p1',
          displayName: 'Pilot One',
          emoji: '🌍',
          isBot: false,
          survivalPoints: 0,
          health: 5,
          hand: [disasterCard],
          powers: [],
          traits: [],
          triggers: [],
        },
        {
          id: 'p2',
          displayName: 'Pilot Two',
          emoji: '🔥',
          isBot: false,
          survivalPoints: 0,
          health: 5,
          hand: [],
          powers: [],
          traits: [],
          triggers: [{ id: 'flux', kind: 'CONVERT_NEXT_DISASTER_LOSS_TO_POINTS' as const, duration: 'next_event' as const }],
        },
      ],
      drawPile: [],
      discardPile: [],
      turnPile: [],
      turnHistory: [],
      topCard: undefined,
      turnDirection: 1 as const,
      isGlobalDisasterPhase: false,
      cardsPlayedThisTurn: 0,
      hasDrawnThisTurn: true,
      occupiedSlots: Array.from({ length: 4 }, (_, slotIndex) => ({ slotIndex })),
      pendingResolution: [],
    };

    const next = playCard(state, disasterCard.id, 'p2', () => 0.1, 0);
    expect(next.players[1].health).toBe(5);
    expect(next.players[1].survivalPoints).toBe(2);
    expect(next.players[1].triggers).toHaveLength(0);
  });

  it('can swap two opponents hands and pinned powers without involving the actor', () => {
    const handSwapCard = {
      id: 'test_opponent_hand_swap',
      name: 'Opponent Hand Swap',
      type: 'ASCENDED' as const,
      description: 'Swap two opponents hands.',
      effect: 'Swap two opponents hands.',
      primitives: [{ type: 'SWAP_HANDS', params: { targetA: 'random_opponent', targetB: 'random_opponent' } }],
    };
    const powerSwapCard = {
      id: 'test_opponent_power_swap',
      name: 'Opponent Power Swap',
      type: 'ASCENDED' as const,
      description: 'Swap two opponents pinned powers.',
      effect: 'Swap two opponents pinned powers.',
      primitives: [{ type: 'SWAP_PINNED_POWERS', params: { targetA: 'random_opponent', targetB: 'random_opponent' } }],
    };
    const alphaHand = { id: 'alpha_hand', name: 'Alpha Hand', type: 'SURVIVAL' as const, description: '', effect: '', primitives: [] };
    const betaHand = { id: 'beta_hand', name: 'Beta Hand', type: 'CHAOS' as const, description: '', effect: '', primitives: [] };
    const alphaPower = { id: 'alpha_power', name: 'Alpha Power', type: 'POWER' as const, description: '', effect: '', primitives: [] };
    const betaPower = { id: 'beta_power', name: 'Beta Power', type: 'POWER' as const, description: '', effect: '', primitives: [] };

    const state = {
      mode: 'practice' as const,
      roomCode: 'SWAPX1',
      round: 1,
      activePlayerIndex: 0,
      players: [
        {
          id: 'p1',
          displayName: 'Pilot One',
          emoji: '🌍',
          isBot: false,
          survivalPoints: 0,
          health: 5,
          hand: [handSwapCard, powerSwapCard],
          powers: [],
          traits: [],
          triggers: [],
        },
        {
          id: 'p2',
          displayName: 'Pilot Two',
          emoji: '🔥',
          isBot: false,
          survivalPoints: 0,
          health: 5,
          hand: [alphaHand],
          powers: [alphaPower],
          traits: [],
          triggers: [],
        },
        {
          id: 'p3',
          displayName: 'Pilot Three',
          emoji: '💨',
          isBot: false,
          survivalPoints: 0,
          health: 5,
          hand: [betaHand],
          powers: [betaPower],
          traits: [],
          triggers: [],
        },
      ],
      drawPile: [],
      discardPile: [],
      turnPile: [],
      turnHistory: [],
      topCard: undefined,
      turnDirection: 1 as const,
      isGlobalDisasterPhase: false,
      cardsPlayedThisTurn: 0,
      hasDrawnThisTurn: true,
      occupiedSlots: Array.from({ length: 4 }, (_, slotIndex) => ({ slotIndex })),
      pendingResolution: [],
    };

    const afterHandSwap = playCard(state, handSwapCard.id, undefined, () => 0.0, 0);
    expect(afterHandSwap.players[1].hand.map((card) => card.id)).toEqual(['beta_hand']);
    expect(afterHandSwap.players[2].hand.map((card) => card.id)).toEqual(['alpha_hand']);

    const afterPowerSwap = playCard(afterHandSwap, powerSwapCard.id, undefined, () => 0.0, 1);
    expect(afterPowerSwap.players[1].powers.map((card) => card.id)).toEqual(['beta_power']);
    expect(afterPowerSwap.players[2].powers.map((card) => card.id)).toEqual(['alpha_power']);
  });

  it('gives every catalog card ordered effect steps and a canonical matrix entry', () => {
    const cards = getAllCards();
    const matrix = getCanonicalCardMatrix();

    expect(cards.length).toBeGreaterThan(0);
    expect(matrix).toHaveLength(cards.length);
    for (const card of cards) {
      expect(card.effectSteps?.length, card.id).toBeGreaterThan(0);
      expect(card.description?.trim().length, card.id).toBeGreaterThan(0);
    }
  });

  it('keeps the normalized catalog within the supported script surface', () => {
    const supportedBuffs = new Set([
      'avoid_disaster',
      'block_catac',
      'block_first_disaster',
      'block_health_loss',
      'block_negative_effect',
      'block_next_disaster',
      'block_point_loss',
      'cancel_catac',
      'cancel_disaster_target',
      'cancel_next_catac',
      'convert_disaster_to_points',
      'disable_powers_1_turn',
      'discard_after_use',
      'double_next_catac',
      'double_next_points',
      'draw_when_pinned_1',
      'evade_chaos',
      'evade_hightier_disaster',
      'negate_catac',
      'points_per_pinned_survival_1',
      'points_per_survival_1',
      'prevent_catac_effect',
      'prevent_health_loss_global',
      'prevent_negative',
      'prevent_turn_reverse',
      'prevent_turn_skip',
      'prevent_turn_skip_reverse',
      'redirect_catac',
      'redirect_chaos',
      'redirect_chaos_disaster',
      'redirect_disaster',
      'redirect_negative',
      'revive_2',
      'skip_next',
      'skip_next_action',
      'skip_next_draw_2',
      'steal_draw',
      'survival_plus_1_pt',
      'upgrade_adapt',
    ]);
    const supportedTriggers = new Set([
      'BLOCK_EARTHQUAKE_DRAW_1',
      'BLOCK_WILDFIRE_DRAW_1',
      'CONVERT_NEXT_DISASTER_LOSS_TO_POINTS',
      'DISABLE_POWERS_NEXT_TURN',
      'DISABLE_SURVIVAL_NEXT_TURN',
      'DOUBLE_NEXT_CATAC_EFFECT',
      'DOUBLE_NEXT_POINTS',
      'DRAW_WHEN_PINNED_1',
      'HAND_LIMIT_TEMP_1',
      'HEAL_1_PER_TURN',
      'LOSE_1_HEALTH_PER_TURN_2',
      'LOSE_1_PT_PER_TURN_3',
      'NEGATE_ALL_SURVIVAL_THIS_TURN',
      'NEGATE_NEXT_CATAC_EFFECT',
      'NEGATE_NEXT_DISASTER',
      'NEGATE_NEXT_NEGATIVE_EFFECT',
      'POINTS_PER_TURN_1',
      'PREVENT_HEALTH_REGAIN',
      'PREVENT_HEALTH_LOSS_GLOBAL',
      'PREVENT_NEXT_POINT_LOSS',
      'PREVENT_OPPONENT_DRAW_1',
      'PREVENT_TURN_REVERSE',
      'PREVENT_TURN_SKIP',
      'POINTS_PER_PINNED_SURVIVAL_1',
      'POINTS_PER_SURVIVAL_1',
      'REDIRECT_NEXT_DISASTER',
      'REDIRECT_NEXT_NEGATIVE',
      'REDUCE_INCOMING_DISASTER_1',
      'REVIVE_TO_2',
      'SKIP_NEXT_ACTION',
      'SKIP_NEXT_DRAW',
      'SKIP_NEXT_TURN',
      'SURVIVAL_PLUS_1_PT',
      'TEMP_DOUBLE_POWER_EFFECT',
    ]);

    for (const card of getAllCards()) {
      for (const primitive of card.primitives || []) {
        const steps = [primitive, ...(primitive.then || []), ...(primitive.else || [])];
        for (const step of steps) {
          if (step?.type === 'APPLY_BUFF') {
            expect(supportedBuffs.has(step.params?.buffId), `${card.id}:${step.params?.buffId}`).toBe(true);
          }
          if (step?.type === 'ADD_TRIGGER') {
            expect(supportedTriggers.has(step.params?.triggerKind), `${card.id}:${step.params?.triggerKind}`).toBe(true);
          }
        }
      }
    }
    expect(getCanonicalCardMatrix().every((row) => row.classification === 'clear')).toBe(true);
  });

  it('keeps Twist cards as self-contained positive boosts after normalization', () => {
    const twistCards = getAllCards().filter((card) => card.type === 'TWIST');
    expect(twistCards.length).toBeGreaterThan(0);

    const hasNegativeScalar = (primitive: any): boolean => {
      if (!primitive) return false;
      if ((primitive.type === 'MODIFY_POINTS' || primitive.type === 'MODIFY_HEALTH') && Number(primitive.params?.amount || 0) < 0) {
        return true;
      }
      return [...(primitive.then || []), ...(primitive.else || [])].some(hasNegativeScalar);
    };

    for (const card of twistCards) {
      const primitives = Array.isArray(card.primitives) ? card.primitives : [card.primitives];
      const targets = primitives
        .flatMap((primitive: any) => [primitive?.params?.target, ...(primitive?.then || []).map((inner: any) => inner?.params?.target), ...(primitive?.else || []).map((inner: any) => inner?.params?.target)])
        .filter(Boolean);

      expect(targets.every((target) => target === 'self' || target === 'inherited'), card.id).toBe(true);
      expect(primitives.some((primitive: any) => primitive?.type === 'REVERSE_TURN_ORDER')).toBe(false);
      expect(primitives.some(hasNegativeScalar), card.id).toBe(false);
    }
  });

  it('keeps Cataclysm cards globally disruptive with an extra self penalty', () => {
    const catacCards = getAllCards().filter((card) => card.type === 'CATACLYSM');
    expect(catacCards.length).toBeGreaterThan(0);

    for (const card of catacCards) {
      const primitives = Array.isArray(card.primitives) ? card.primitives : [card.primitives];
      const hasGlobalReach = primitives.some((primitive: any) => {
        const target = primitive?.params?.target;
        return target === 'all'
          || primitive?.type === 'SHUFFLE_ALL_PILES'
          || primitive?.type === 'SHUFFLE_DISCARD_INTO_DECK'
          || primitive?.type === 'SWAP_POWERS_RANDOM';
      });
      const hasSelfPunishment = primitives.some((primitive: any) => {
        const target = primitive?.params?.target;
        return target === 'self' || primitive?.type === 'DISCARD_CARDS';
      });

      expect(hasGlobalReach, card.id).toBe(true);
      expect(hasSelfPunishment, card.id).toBe(true);
    }
  });
});
