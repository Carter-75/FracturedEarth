import { applyMatchAction, type MatchAction, type MatchCard, type MatchPayload, type MatchPlayer } from '@/lib/matchEngine';

export interface TutorialStep {
  id: number;
  title: string;
  description: string;
  expectedActionType: MatchAction['type'];
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

const STEPS: TutorialStep[] = [
  {
    id: 1,
    title: 'Draw A Card',
    description: 'Start by drawing one card from the draw pile.',
    expectedActionType: 'DRAW_CARD',
  },
  {
    id: 2,
    title: 'Play Survival',
    description: 'Play Shelter Build to gain survival points.',
    expectedActionType: 'PLAY_CARD',
    expectedCardId: 'survival_shelter',
  },
  {
    id: 3,
    title: 'End Turn',
    description: 'End your turn. The bot will take a simple response turn.',
    expectedActionType: 'END_TURN',
  },
  {
    id: 4,
    title: 'Use Disaster',
    description: 'Play Quake Strike and target the bot to pressure its health.',
    expectedActionType: 'PLAY_CARD',
    expectedCardId: 'disaster_quake',
    expectedTargetPlayerId: BOT_ID,
  },
  {
    id: 5,
    title: 'Finish Round',
    description: 'End your turn to complete the tutorial walkthrough.',
    expectedActionType: 'END_TURN',
  },
];

function card(input: {
  id: string;
  name: string;
  type: MatchCard['type'];
  pointsDelta: number;
  drawCount?: number;
  disasterKind?: MatchCard['disasterKind'];
  blocksDisaster?: MatchCard['blocksDisaster'];
}): MatchCard {
  return {
    id: input.id,
    name: input.name,
    type: input.type,
    pointsDelta: input.pointsDelta,
    drawCount: input.drawCount ?? 0,
    disasterKind: input.disasterKind,
    blocksDisaster: input.blocksDisaster,
  };
}

function buildInitialMatch(userId: string, displayName: string, emoji: string): MatchPayload {
  const human: MatchPlayer = {
    id: userId,
    displayName,
    emoji,
    isBot: false,
    survivalPoints: 0,
    health: 3,
    hand: [
      card({ id: 'survival_shelter', name: 'Shelter Build', type: 'SURVIVAL', pointsDelta: 3 }),
      card({ id: 'trait_stonewall', name: 'Stonewall Trait', type: 'TRAIT', pointsDelta: 0, blocksDisaster: 'EARTHQUAKE' }),
      card({ id: 'disaster_quake', name: 'Quake Strike', type: 'DISASTER', pointsDelta: -1, disasterKind: 'EARTHQUAKE' }),
      card({ id: 'adapt_quickfix', name: 'Quick Fix', type: 'ADAPT', pointsDelta: 0, blocksDisaster: 'FLOOD' }),
      card({ id: 'chaos_burst', name: 'Chaos Burst', type: 'CHAOS', pointsDelta: 3, disasterKind: 'GLOBAL' }),
    ],
    traits: [],
  };

  const bot: MatchPlayer = {
    id: BOT_ID,
    displayName: 'Training Bot',
    emoji: '🤖',
    isBot: true,
    survivalPoints: 0,
    health: 3,
    hand: [
      card({ id: 'bot_survival_1', name: 'Bot Survival', type: 'SURVIVAL', pointsDelta: 2 }),
      card({ id: 'bot_survival_2', name: 'Bot Salvage', type: 'SURVIVAL', pointsDelta: 2 }),
    ],
    traits: [],
  };

  return {
    round: 1,
    activePlayerIndex: 0,
    players: [human, bot],
    drawPile: [
      card({ id: 'draw_support_1', name: 'Supply Cache', type: 'SURVIVAL', pointsDelta: 2 }),
      card({ id: 'draw_support_2', name: 'Reinforce', type: 'TRAIT', pointsDelta: 0, blocksDisaster: 'PLAGUE' }),
      card({ id: 'draw_support_3', name: 'Flood Alert', type: 'DISASTER', pointsDelta: -1, disasterKind: 'FLOOD' }),
    ],
    discardPile: [],
    isGlobalDisasterPhase: false,
    cardsPlayedThisTurn: 0,
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
  action: MatchAction;
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

  const nextMatch = applyMatchAction({
    current: input.session.match,
    action: input.action,
    actorUserId: input.actorUserId,
    roomPlayers: [
      { userId: input.actorUserId, displayName: 'You', emoji: '🌍', isBot: false },
      { userId: BOT_ID, displayName: 'Training Bot', emoji: '🤖', isBot: true },
    ],
    roomCode: 'TUTORIAL',
  });

  const nextStep = input.session.stepIndex + 1;
  const completed = nextStep >= STEPS.length;

  return {
    match: nextMatch,
    stepIndex: nextStep,
    completed,
  };
}
