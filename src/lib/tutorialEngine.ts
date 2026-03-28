import { generateNamedBaseCards } from '@/lib/cardCatalog';
import { applyMatchAction, type MatchAction, type MatchCard, type MatchPayload, type MatchPlayer } from '@/lib/matchEngine';

export type TutorialAction = MatchAction | { type: 'ACK' };

export interface TutorialStep {
  id: number;
  title: string;
  description: string;
  expectedActionType: TutorialAction['type'];
  expectedCardId?: string;
  expectedTargetPlayerId?: string;
}

export interface TutorialSession {
  match: MatchPayload;
  stepIndex: number;
  completed: boolean;
}

const HUMAN_ID = 'tutorial_human';
const BOT_ID = 'tutorial_bot_0';

const BASE_CARDS = generateNamedBaseCards();

function findCard(idOrName: string): MatchCard {
  const found = BASE_CARDS.find((c) => c.id === idOrName || c.name === idOrName);
  if (!found) {
    throw new Error(`Tutorial card not found: ${idOrName}`);
  }
  return { ...found };
}

function buildSteps(): TutorialStep[] {
  const steps: TutorialStep[] = [];
  let id = 1;
  const push = (step: Omit<TutorialStep, 'id'>) => {
    steps.push({ id, ...step });
    id += 1;
  };

  push({
    title: 'Training Protocol Initiated',
    description: 'Welcome, candidate. This simulation will prepare you for survival on Fractured Earth. Follow the instructions strictly.',
    expectedActionType: 'ACK',
  });

  push({
    title: 'Phase 1: Procurement',
    description: 'Every turn begins with the DRAW phase. Access the deck to retrieve tactical data.',
    expectedActionType: 'DRAW_CARD',
  });

  push({
    title: 'Phase 2: Deployment',
    description: 'You can play up to 3 cards per turn. Deploy your first Survival card to gain Energy (points).',
    expectedActionType: 'PLAY_CARD',
    expectedCardId: 'survival_agriculture',
  });

  push({
    title: 'Tactical Flexibility',
    description: 'Notice you can play another card! On this turn, we\'ll play a second card to pressure the opponent.',
    expectedActionType: 'PLAY_CARD',
    expectedCardId: 'disaster_earthquake_1',
    expectedTargetPlayerId: BOT_ID,
  });

  push({
    title: 'Ending Control',
    description: 'You have played 2 of your 3 maximum cards. End your turn now to see the opponent\'s response.',
    expectedActionType: 'END_TURN',
  });

  push({
    title: 'Defensive Posture',
    description: 'The bot responded with pressure. Start your next turn by drawing another card.',
    expectedActionType: 'DRAW_CARD',
  });

  push({
    title: 'Persistent Defense',
    description: 'Deploy a POWER card. These stay on the table and block matching disasters repeatedly.',
    expectedActionType: 'PLAY_CARD',
    expectedCardId: 'power_shield_1',
  });

  push({
    title: 'Strategic Spike',
    description: 'Now, use an ASCENDED card. This one grants an EXTRA ACTION, allowing you to play more than 3 cards if timed correctly.',
    expectedActionType: 'PLAY_CARD',
    expectedCardId: 'ascended_phoenix_1',
  });

  push({
    title: 'Mastering the Turn',
    description: 'With your extra action, you can still play more cards. For now, end your turn to conclude this training module.',
    expectedActionType: 'END_TURN',
  });

  push({
    title: 'Simulation Complete',
    description: 'You have mastered the core cycle of Fractured Earth. You are now authorized for live combat.',
    expectedActionType: 'SET_WINNER',
  });

  return steps;
}

const STEPS: TutorialStep[] = buildSteps();

function buildInitialMatch(userId: string, displayName: string, emoji: string): MatchPayload {
  const human: MatchPlayer = {
    id: userId,
    displayName,
    emoji,
    isBot: false,
    survivalPoints: 0,
    health: 5,
    hand: [
      findCard('survival_agriculture'),
      findCard('power_shield_1'),
      findCard('disaster_earthquake_1'),
      findCard('ascended_phoenix_1'),
      findCard('chaos_raid_2'),
    ],
    powers: [],
  };

  const bot: MatchPlayer = {
    id: BOT_ID,
    displayName: 'Training Bot',
    emoji: '🤖',
    isBot: true,
    survivalPoints: 0,
    health: 5,
    hand: [findCard('disaster_earthquake_2'), findCard('survival_harvest')],
    powers: [],
  };

  const usedIds = new Set<string>([...human.hand, ...bot.hand].map((c) => c.id));
  
  // Scripted draw pile to ensure tutorial cards are available
  const drawPile = [
    findCard('survival_trade_route'),
    findCard('power_shield_4'),
    ...BASE_CARDS.filter(c => !usedIds.has(c.id)).map(c => ({...c}))
  ];

  return {
    round: 1,
    activePlayerIndex: 0,
    players: [human, bot],
    drawPile,
    discardPile: [findCard('survival_library')],
    turnPile: [],
    topCard: findCard('survival_library'),
    turnDirection: 1,
    isGlobalDisasterPhase: false,
    cardsPlayedThisTurn: 0,
    hasDrawnThisTurn: false,
  };
}

export function startTutorial(input: { userId: string; displayName: string; emoji: string }): TutorialSession {
  return {
    match: buildInitialMatch(input.userId, input.displayName, input.emoji),
    stepIndex: 0,
    completed: false,
  };
}

export function getTutorialStep(stepIndex: number): TutorialStep | null {
  return STEPS[stepIndex] ?? null;
}

export function applyTutorialAction(input: {
  session: TutorialSession;
  action: TutorialAction;
  actorUserId: string;
}): TutorialSession {
  if (input.session.completed) return input.session;

  const step = getTutorialStep(input.session.stepIndex);
  if (!step) {
    return { ...input.session, completed: true };
  }

  if (input.action.type !== step.expectedActionType) {
    throw new Error(`Tutorial step requires action ${step.expectedActionType}`);
  }

  if (step.expectedActionType === 'PLAY_CARD') {
    if (step.expectedCardId && input.action.type === 'PLAY_CARD' && input.action.cardId !== step.expectedCardId) {
      throw new Error('Play the highlighted tutorial card first');
    }
    if (
      step.expectedTargetPlayerId &&
      input.action.type === 'PLAY_CARD' &&
      input.action.targetPlayerId !== step.expectedTargetPlayerId
    ) {
      throw new Error('Select the bot as target for this tutorial step');
    }
  }

  if (input.action.type === 'ACK') {
    const nextStep = input.session.stepIndex + 1;
    return {
      ...input.session,
      stepIndex: nextStep,
      completed: nextStep >= STEPS.length,
    };
  }

  const nextMatch = applyMatchAction({
    current: input.session.match,
    action: input.action,
    actorUserId: input.actorUserId,
    roomPlayers: [
      { userId: input.actorUserId, displayName: 'You', emoji: '🌍', isBot: false },
      { userId: BOT_ID, displayName: 'Training Bot', emoji: '🤖', isBot: true },
    ],
    roomCode: 'TUTORIAL_FIXED',
  });

  const nextStep = input.session.stepIndex + 1;
  const completed = nextStep >= STEPS.length;

  return {
    match: nextMatch,
    stepIndex: nextStep,
    completed,
  };
}
