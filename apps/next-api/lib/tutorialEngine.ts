import { type MatchPayload, type MatchAction, applyMatchAction } from './matchEngine';
import { generateNamedBaseCards } from './cardCatalog';

export interface TutorialStep {
  title: string;
  description: string;
  expectedActionType: MatchAction['type'] | 'SET_WINNER';
  expectedCardId?: string;
  expectedTargetId?: string;
}

export async function buildTutorialSteps(): Promise<TutorialStep[]> {
  const steps: TutorialStep[] = [];
  const push = (step: TutorialStep) => steps.push(step);

  // PHASE 1: PROCUREMENT & SURVIVAL (Turns 1-10)
  push({
    title: 'Phase 1: Procurement Base',
    description: 'Welcome to the simulation. Every turn begins with PROCUREMENT. Draw your first tactical unit.',
    expectedActionType: 'DRAW_CARD',
  });

  push({
    title: 'Resource Extraction',
    description: 'Survival is paramount. Deploy your Hydroponic Bay to secure consistent Energy gain.',
    expectedActionType: 'PLAY_CARD',
    expectedCardId: 'survival_hydroponic_bay',
  });

  push({
    title: 'Ending the Cycle',
    description: 'Once your actions are spent, terminate your turn to allow the environment to stabilize.',
    expectedActionType: 'END_TURN',
  });

  // PHASE 2: TACTICAL FORTIFICATION (Turns 11-25)
  push({
    title: 'Phase 2: Tactical Wall',
    description: 'Simulation accelerated to Turn 15. The bot is preparing a KINETIC disaster. Deploy a Kinetic Dampener (Power) to block it indefinitely.',
    expectedActionType: 'PLAY_CARD',
    expectedCardId: 'power_kinetic_dampener',
  });

  push({
    title: 'Reactive Adaptation',
    description: 'Bypassing current defenses? Use an ADAPT card like the Kinetic Field for an instant, one-time block.',
    expectedActionType: 'PLAY_CARD',
    expectedCardId: 'adapt_kinetic_field',
  });

  // PHASE 3: CHAOS & ASCENSION (Turns 26-40)
  push({
    title: 'Phase 3: The Chaos Threshold',
    description: 'Bypassing Turn 30. Standard defenses are failing. Deploy an Orbital Strike (Chaos) to steal energy from the AI.',
    expectedActionType: 'PLAY_CARD',
    expectedCardId: 'chaos_orbital_strike',
  });

  push({
    title: 'Phoenix Protocol',
    description: 'ASCENDED cards are elite. Playing the Phoenix Rebirth grants you an EXTRA ACTION this turn. Turn the tide now.',
    expectedActionType: 'PLAY_CARD',
    expectedCardId: 'ascended_phoenix_rebirth',
  });

  // PHASE 4: THE FINAL CATACLYSM (Turns 41-50)
  push({
    title: 'Phase 4: Sudden Twists',
    description: 'Turn 45. The event horizon is near. TWISTS trigger IMMEDIATELY on draw. Draw to trigger the blessing.',
    expectedActionType: 'DRAW_CARD',
  });

  push({
    title: 'The Cataclysmic Burden',
    description: 'A CATACLYSM has arrived. It triggers instantly, damaging everyone. Draw the final data packet to conclude.',
    expectedActionType: 'DRAW_CARD',
  });

  push({
    title: 'Ascension Profile Locked',
    description: 'Simulation Complete. You have mastered 50 turns of tactical evolution. Authorized for planetary authority.',
    expectedActionType: 'SET_WINNER',
  });

  return steps;
}

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
    survivalPoints: 20,
    health: 5,
    hand: [
      findCard('survival_hydroponic_bay'),
      findCard('power_kinetic_dampener'),
      findCard('disaster_megaquake'),
      findCard('adapt_kinetic_field'),
      findCard('chaos_orbital_strike'),
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
    survivalPoints: 15,
    health: 5,
    hand: [findCard('disaster_megaquake'), findCard('survival_deep_core_drill')],
    powers: [],
    traits: [],
    triggers: [],
  };

  const usedIds = new Set<string>([...human.hand, ...bot.hand].map((c) => c.id));
  
  // Scripted draw pile to ensure tutorial cards are available for the 4 phases
  const drawPile = [
    findCard('twist_blessing_of_unity'), // Phase 4
    findCard('cataclysm_the_apocalypse'), // Phase 4
    findCard('ascended_phoenix_rebirth'), // Phase 3
    ...BASE_CARDS.filter(c => !usedIds.has(c.id)).map(c => ({...c}))
  ];

  return {
    round: 1,
    activePlayerIndex: 0,
    players: [human, bot],
    drawPile,
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
  stepIndex: number
): Promise<{ state: MatchPayload; nextStepRecommended: boolean }> {
  const steps = await buildTutorialSteps();
  const step = steps[stepIndex];
  if (!step) return { state: current, nextStepRecommended: false };

  // Special handling for SET_WINNER step
  if (step.expectedActionType === 'SET_WINNER') {
    return { state: { ...current, winnerId: current.players[0].id }, nextStepRecommended: true };
  }

  // Validate action type
  if (action.type !== step.expectedActionType) {
    throw new Error(`Invalid action for tutorial step: expected ${step.expectedActionType}, got ${action.type}`);
  }

  // Finalize action
  const next = await applyMatchAction({
    current,
    action,
    actorUserId: current.players[0].id,
    roomPlayers: current.players.map(p => ({
      userId: p.id,
      displayName: p.displayName,
      emoji: p.emoji,
      isBot: p.isBot
    })),
    roomCode: 'TUTORIAL',
  });

  return { state: next, nextStepRecommended: true };
}

export async function getTutorialStep(index: number): Promise<TutorialStep | null> {
  const steps = await buildTutorialSteps();
  return steps[index] || null;
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
