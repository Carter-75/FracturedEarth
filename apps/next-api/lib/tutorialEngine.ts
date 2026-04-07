import { type MatchPayload, type MatchAction, applyMatchAction } from './matchEngine';
import { generateNamedBaseCards } from './cardCatalog';

export interface TutorialStep {
  id: number;
  title: string;
  description: string;
  expectedActionType: MatchAction['type'] | 'SET_WINNER';
  expectedCardId?: string;
  botActions?: MatchAction[]; // Actions the bot takes after the player's action
  narrativeOnly?: boolean;
}

export const TUTORIAL_SCRIPT: TutorialStep[] = [
  // ROUND 1: SURVIVAL
  {
    id: 0,
    title: 'Cycle 01: Procurement',
    description: 'Welcome to the simulation. Every cycle begins with PROCUREMENT. Retrieve your first tactical unit from the Core Deck.',
    expectedActionType: 'DRAW_CARD',
  },
  {
    id: 1,
    title: 'Neural Link: Survival',
    description: 'Energy (NRG) is our primary resource. Deploy the Hydroponic Bay to secure a consistent yield. This unit will grant you survival points.',
    expectedActionType: 'PLAY_CARD',
    expectedCardId: 'survival_hydroponic_bay',
  },
  {
    id: 2,
    title: 'Cycle Termination',
    description: 'With your primary protocols active, terminate the cycle to allow the environment to stabilize.',
    expectedActionType: 'END_TURN',
    botActions: [
        { type: 'DRAW_CARD' } as any,
        { type: 'END_TURN' } as any
    ]
  },
  // ROUND 2: POWER & DISASTERS
  {
    id: 3,
    title: 'Cycle 02: Fortification',
    description: 'The Nexus AI is mounting a planetary disturbance. Draw a unit to expand your tactical options.',
    expectedActionType: 'DRAW_CARD',
  },
  {
    id: 4,
    title: 'Static Defense: Power',
    description: 'Planetary disasters are persistent. Deploy a Thermal Shield (Power) to block Heat-based disasters indefinitely. Power cards stay "pinned" to your profile.',
    expectedActionType: 'PLAY_CARD',
    expectedCardId: 'power_thermal_shield',
  },
  {
    id: 5,
    title: 'Environmental Stabilization',
    description: 'End your turn. Watch how your Thermal Shield mitigates the incoming Solar Flare disaster from the AI.',
    expectedActionType: 'END_TURN',
    botActions: [
        { type: 'DRAW_CARD' } as any,
        { type: 'PLAY_CARD', cardId: 'disaster_solar_flare' } as any, // This should be in bot hand
        { type: 'END_TURN' } as any
    ]
  },
  // ROUND 3: ADAPT & CHAOS
  {
    id: 6,
    title: 'Cycle 03: Rapid Response',
    description: 'A Kinetic Impact is imminent! Draw your next unit immediately.',
    expectedActionType: 'DRAW_CARD',
  },
  {
    id: 7,
    title: 'Reactive Protocol: Adapt',
    description: 'Adapt cards provide instant, one-time mitigation. Deploy the Kinetic Field to survive the AI\'s impact. Note: Adapt cards clear after the cycle ends.',
    expectedActionType: 'PLAY_CARD',
    expectedCardId: 'adapt_kinetic_field',
  },
  {
    id: 8,
    title: 'Resource Disruption: Chaos',
    description: 'Offense is essential. Execute an Orbital Strike (Chaos) to disrupt the AI\'s energy reserves and claim them for yourself.',
    expectedActionType: 'PLAY_CARD',
    expectedCardId: 'chaos_orbital_strike',
  },
  {
    id: 9,
    title: 'Tactical Superiority',
    description: 'End the cycle. The AI is losing structural integrity.',
    expectedActionType: 'END_TURN',
    botActions: [
        { type: 'DRAW_CARD' } as any,
        { type: 'END_TURN' } as any
    ]
  },
  // ROUND 4: ASCENDED
  {
    id: 10,
    title: 'Cycle 04: Evolution',
    description: 'Draw a unit. Simulation is detecting high-priority data packets.',
    expectedActionType: 'DRAW_CARD',
  },
  {
    id: 11,
    title: 'Elite Status: Ascended',
    description: 'Ascended units represent peak tactical evolution. Deploy Phoenix Rebirth to gain an EXTRA ACTION this turn.',
    expectedActionType: 'PLAY_CARD',
    expectedCardId: 'ascended_phoenix_rebirth',
  },
  {
    id: 12,
    title: 'Overdrive Protocol',
    description: 'With your extra action, deploy the Energy Siphon to maximize your resource gain before the AI can react.',
    expectedActionType: 'PLAY_CARD',
    expectedCardId: 'survival_energy_siphon',
  },
  {
    id: 13,
    title: 'Consolidating Gains',
    description: 'Terminate the cycle.',
    expectedActionType: 'END_TURN',
    botActions: [
        { type: 'DRAW_CARD' } as any,
        { type: 'END_TURN' } as any
    ]
  },
  // ROUND 5: TWIST (Cycle 05)
  {
    id: 14,
    title: 'Cycle 05: Data Corruption',
    description: 'Procure a unit. Twist cards like Blessing of Unity trigger immediately upon procurement, shifting the state for all participants.',
    expectedActionType: 'DRAW_CARD',
  },
  {
    id: 15,
    title: 'Cycle 06: Resource Management',
    description: 'The Nexus AI is attempting to drain your resources. End your turn. Watch how the AI forces a discard.',
    expectedActionType: 'END_TURN',
    botActions: [
        { type: 'DRAW_CARD' } as any,
        { type: 'PLAY_CARD', cardId: 'chaos_scavenger_raid' } as any,
        { type: 'END_TURN' } as any
    ]
  },
  // ROUND 7: REDIRECTION
  {
    id: 16,
    title: 'Cycle 07: Tactical Redirection',
    description: 'Draw a unit. You have procured a Redirection protocol. This will permit you to move negative effects to an opponent.',
    expectedActionType: 'DRAW_CARD',
  },
  {
    id: 17,
    title: 'Active Defense: Redirect',
    description: 'Deploy the Energy Field. The next time the AI attempts to steal points or health, the effect will be redirected back to them.',
    expectedActionType: 'PLAY_CARD',
    expectedCardId: 'survival_energy_field',
  },
  {
    id: 18,
    title: 'Cycle Termination',
    description: 'End the cycle.',
    expectedActionType: 'END_TURN',
    botActions: [
        { type: 'DRAW_CARD' } as any,
        { type: 'PLAY_CARD', cardId: 'chaos_orbital_strike' } as any, // This should be redirected!
        { type: 'END_TURN' } as any
    ]
  },
  // ROUND 9: CATACLYSM
  {
    id: 19,
    title: 'Cycle 09: Global Instability',
    description: 'A global catastrophic event is approaching. Procure the final data packet to stabilize the sector.',
    expectedActionType: 'DRAW_CARD',
    // The Apocalypse will auto-trigger
  },
  {
    id: 20,
    title: 'Final Authority',
    description: 'The simulation has concluded. You have successfully navigated 10 cycles of resource warfare. Finalize protocol for planetary authority.',
    expectedActionType: 'SET_WINNER',
  }
];

export async function buildInitialMatch(humanUserId: string): Promise<MatchPayload> {
  const BASE_CARDS = await generateNamedBaseCards();
  const findCard = (id: string) => {
    const card = BASE_CARDS.find((c) => c.id === id);
    if (!card) throw new Error(`Tutorial card not found: ${id}`);
    return { ...card };
  };

  const human = {
    id: humanUserId,
    displayName: 'Candidate',
    emoji: '🌍',
    isBot: false,
    survivalPoints: 10,
    health: 5,
    hand: [
      findCard('survival_hydroponic_bay'),
      findCard('power_thermal_shield'),
      findCard('adapt_kinetic_field'),
      findCard('chaos_orbital_strike'),
      findCard('survival_energy_siphon'),
    ],
    powers: [],
    traits: [],
    triggers: [],
  };

  const bot = {
    id: 'tutorial_bot',
    displayName: 'Nexus_AI',
    emoji: '🤖',
    isBot: true,
    survivalPoints: 20,
    health: 3,
    hand: [
        findCard('disaster_solar_flare'),
        findCard('disaster_kinetic_impact'),
    ],
    powers: [],
    traits: [],
    triggers: [],
  };

  // Structured draw pile to ensure the script triggers correctly
  const drawPile = [
    findCard('survival_biodome'),           // For Round 2 draw (Step 3) - wait, user draws this, but the script says thermal shield? 
    // Let's re-fix: hand starts with Bay, AI Flare, etc.
    // If I want player to DRAW thermal shield, it should be top of deck.
  ];

  // Let's refine the initial hands and deck for 100% parity with script
  human.hand = [findCard('survival_hydroponic_bay')];
  bot.hand = [
      findCard('disaster_solar_flare'),
      findCard('disaster_kinetic_impact'),
      findCard('chaos_scavenger_raid'),
      findCard('chaos_orbital_strike'),
  ];
  
  const scriptedDraws = [
      findCard('power_thermal_shield'),      // Round 2
      findCard('survival_biodome'),          // Round 3
      findCard('adapt_kinetic_field'),       // Round 4
      findCard('chaos_orbital_strike'),      // Round 5 (wait, already in bot hand? no, let's give player some)
      findCard('ascended_phoenix_rebirth'),  // Round 6
      findCard('twist_blessing_of_unity'),   // Round 7
      findCard('survival_energy_field'),      // Round 8
      findCard('survival_energy_siphon'),    // Round 9
      findCard('cataclysm_the_apocalypse'),  // Round 10
  ];

  return {
    round: 1,
    activePlayerIndex: 0,
    players: [human, bot],
    drawPile: scriptedDraws,
    discardPile: [],
    turnPile: [],
    turnHistory: [],
    topCard: undefined,
    turnDirection: 1,
    isGlobalDisasterPhase: false,
    cardsPlayedThisTurn: 0,
    hasDrawnThisTurn: false,
    winnerId: undefined,
  };
}

export async function advanceTutorial(
  current: MatchPayload,
  action: MatchAction,
  stepIndex: number,
  actorUserId: string,
  roomCode: string,
  roomPlayers: any[]
): Promise<{ state: MatchPayload; nextStepRecommended: boolean }> {
  const steps = TUTORIAL_SCRIPT;
  const step = steps[stepIndex];
  if (!step) return { state: current, nextStepRecommended: false };

  // Special handling for SET_WINNER step
  if (step.expectedActionType === 'SET_WINNER') {
    return { state: { ...current, winnerId: current.players[0].id, revision: (current.revision || 0) + 1 }, nextStepRecommended: true };
  }

  // Validate action type
  if (action.type !== step.expectedActionType) {
    throw new Error(`Invalid action for tutorial step: expected ${step.expectedActionType}, got ${action.type}`);
  }

  // Finalize action
  let next = await applyMatchAction({
    current,
    action,
    actorUserId,
    roomPlayers,
    roomCode,
  });

  // Apply scripted bot actions if any
  if (step.botActions) {
      for (const botAction of step.botActions) {
          // Temporarily swap active player to allow bot action
          const botIdx = next.players.findIndex(p => p.id === 'tutorial_bot');
          if (botIdx !== -1) {
              next = await applyMatchAction({
                  current: next,
                  action: botAction,
                  actorUserId: 'tutorial_bot',
                  roomPlayers,
                  roomCode,
              });
          }
      }
  }

  return { state: next, nextStepRecommended: true };
}

export async function getTutorialStep(index: number): Promise<TutorialStep | null> {
  return TUTORIAL_SCRIPT[index] || null;
}

export async function startTutorial(input: {
  userId: string;
  displayName: string;
  emoji: string;
}): Promise<{ match: MatchPayload; stepIndex: number; completed: boolean }> {
  const match = await buildInitialMatch(input.userId);
  return {
    match,
    stepIndex: 0,
    completed: false,
  };
}
