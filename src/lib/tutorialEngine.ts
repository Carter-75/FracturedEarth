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

const CARD_LESSONS: Array<Pick<TutorialStep, 'title' | 'description'>> = [
  { title: 'Survival Cards', description: 'Survival cards are your primary point engine. They often add points, sometimes draw cards, and some heal.' },
  { title: 'Disaster Cards', description: 'Disaster cards pressure health. Some target one player, while GLOBAL effects hit all opponents.' },
  { title: 'Power Cards', description: 'Power cards stay active and can block matching disasters repeatedly unless removed by special effects.' },
  { title: 'Adapt Cards', description: 'Adapt cards also block disasters, but they are consumed after blocking once.' },
  { title: 'Chaos Cards', description: 'Chaos cards usually reward you while damaging every opponent. They swing tempo quickly.' },
  { title: 'Ascended Cards', description: 'Ascended cards are rarer spikes: high points, extra draws, or heal support depending on tier.' },
  { title: 'Twist Cards', description: 'Twist cards are forced effects when drawn. They can bless, curse, or alter your playable card colors.' },
  { title: 'Cataclysm Cards', description: 'Cataclysm cards are high-risk global events: strong point gain but severe health punishment.' },
];

const BASE_CARDS = generateNamedBaseCards();

function findCard(id: string): MatchCard {
  const found = BASE_CARDS.find((c) => c.id === id);
  if (!found) {
    throw new Error(`Tutorial card not found: ${id}`);
  }
  return { ...found };
}

function buildScriptedDrawPile(usedIds: Set<string>): MatchCard[] {
  const scriptedTopIds = [
    'survival_trade_route',
    'power_shield_4',
    'survival_granary',
    'chaos_raid_4',
    'ascended_phoenix_1',
    'twist_blessing_draw',
    'cataclysm_meteor',
    'survival_library',
  ];

  const scriptedTop = scriptedTopIds
    .filter((id) => !usedIds.has(id))
    .map((id) => findCard(id));

  const remainder = BASE_CARDS
    .filter((c) => !usedIds.has(c.id) && !scriptedTopIds.includes(c.id))
    .map((c) => ({ ...c }));

  return [...scriptedTop, ...remainder];
}

function buildSteps(): TutorialStep[] {
  const steps: TutorialStep[] = [];
  let id = 1;
  const push = (step: Omit<TutorialStep, 'id'>) => {
    steps.push({ id, ...step });
    id += 1;
  };

  push({
    title: 'Welcome To Full-Length Training',
    description: 'This is a long tutorial run (50+ steps). You will practice real turn flow and review every card family with bot responses.',
    expectedActionType: 'ACK',
  });
  push({
    title: 'Turn Structure',
    description: 'Each turn follows draw first, play up to 3 cards, then end turn. The script enforces this sequence.',
    expectedActionType: 'ACK',
  });
  push({
    title: 'Seat Order',
    description: 'Turns move clockwise from bottom seat (you). The training bot acts after your end-turn.',
    expectedActionType: 'ACK',
  });

  push({ title: 'Draw A Card', description: 'Start the first guided turn by drawing one card.', expectedActionType: 'DRAW_CARD' });
  push({
    title: 'Play Survival For Points',
    description: 'Play Agriculture to see the basic survival point gain pattern.',
    expectedActionType: 'PLAY_CARD',
    expectedCardId: 'survival_agriculture',
  });
  push({ title: 'End Turn', description: 'End your turn and let the bot run its scripted response.', expectedActionType: 'END_TURN' });
  push({
    title: 'Bot Replay Review',
    description: 'Notice the bot replay text. Bots always draw, then prioritize disruptive plays before utility cards.',
    expectedActionType: 'ACK',
  });

  push({ title: 'Block Demo: Draw', description: 'Draw one card before setting your defensive block.', expectedActionType: 'DRAW_CARD' });
  push({
    title: 'Block Demo: Play Power',
    description: 'Play Stone Shield. It blocks EARTHQUAKE disasters while it stays active.',
    expectedActionType: 'PLAY_CARD',
    expectedCardId: 'power_shield_1',
  });
  push({ title: 'Block Demo: End Turn', description: 'End turn and watch the bot attempt an EARTHQUAKE attack into your shield.', expectedActionType: 'END_TURN' });
  push({ title: 'Block Demo: Result', description: 'Your Power blocked the incoming disaster. This is persistent defense behavior.', expectedActionType: 'ACK' });

  push({ title: 'Attack Demo: Draw', description: 'Draw one card to begin your offense turn.', expectedActionType: 'DRAW_CARD' });
  push({
    title: 'Attack Demo: Play Disaster',
    description: 'Play Tremor and target the bot. This demonstrates targeted damage pressure.',
    expectedActionType: 'PLAY_CARD',
    expectedCardId: 'disaster_earthquake_1',
    expectedTargetPlayerId: BOT_ID,
  });
  push({ title: 'Attack Demo: End Turn', description: 'End turn and observe follow-up bot behavior.', expectedActionType: 'END_TURN' });
  push({ title: 'Attack Demo: Result', description: 'Disasters reduce health and can eliminate opponents if they cannot block.', expectedActionType: 'ACK' });

  push({ title: 'Chaos Demo: Draw', description: 'Draw one card before testing a chaos play.', expectedActionType: 'DRAW_CARD' });
  push({
    title: 'Chaos Demo: Play Chaos',
    description: 'Play Assault. Chaos boosts your points while pressuring all opponents.',
    expectedActionType: 'PLAY_CARD',
    expectedCardId: 'chaos_raid_2',
  });
  push({ title: 'Chaos Demo: End Turn', description: 'End turn and check score and health changes.', expectedActionType: 'END_TURN' });
  push({ title: 'Chaos Demo: Result', description: 'Chaos cards swing tempo quickly by rewarding offense and table-wide pressure.', expectedActionType: 'ACK' });

  push({ title: 'Ascended Demo: Draw', description: 'Draw now. The deck is scripted so you receive an Ascended card.', expectedActionType: 'DRAW_CARD' });
  push({
    title: 'Ascended Demo: Play Ascended',
    description: 'Play Phoenix Rising to see a high-impact tiered card effect.',
    expectedActionType: 'PLAY_CARD',
    expectedCardId: 'ascended_phoenix_1',
  });
  push({ title: 'Ascended Demo: End Turn', description: 'End turn after resolving your Ascended effect.', expectedActionType: 'END_TURN' });
  push({ title: 'Ascended Demo: Result', description: 'Ascended cards are premium tempo tools with stronger mixed effects.', expectedActionType: 'ACK' });

  push({ title: 'Twist Demo: Draw', description: 'Draw now. The scripted deck gives a Twist card that auto-resolves immediately.', expectedActionType: 'DRAW_CARD' });
  push({ title: 'Twist Demo: Result', description: 'Twists do not stay in hand when drawn. Their effect applies instantly to match state.', expectedActionType: 'ACK' });
  push({ title: 'Twist Demo: End Turn', description: 'End turn after observing the Twist outcome.', expectedActionType: 'END_TURN' });

  push({ title: 'Cataclysm Demo: Draw', description: 'Draw now. You will trigger a Cataclysm auto-resolution.', expectedActionType: 'DRAW_CARD' });
  push({ title: 'Cataclysm Demo: Result', description: 'Cataclysm cards create global impact with major risk to the player who drew it.', expectedActionType: 'ACK' });
  push({ title: 'Cataclysm Demo: End Turn', description: 'End turn after the Cataclysm resolves.', expectedActionType: 'END_TURN' });

  push({ title: 'Adapt Demo: Draw', description: 'Draw one card and prepare a one-time defensive block.', expectedActionType: 'DRAW_CARD' });
  push({
    title: 'Adapt Demo: Play Adapt',
    description: 'Play Swim. Adapt blocks matching disaster once, then is consumed.',
    expectedActionType: 'PLAY_CARD',
    expectedCardId: 'adapt_dodge_4',
  });
  push({ title: 'Adapt Demo: End Turn', description: 'End turn and watch how bot pressure interacts with your defenses.', expectedActionType: 'END_TURN' });
  push({ title: 'Adapt Demo: Result', description: 'Adapt is tactical timing defense; Power is long-term defensive investment.', expectedActionType: 'ACK' });

  for (const lesson of CARD_LESSONS) {
    push({
      title: lesson.title,
      description: lesson.description,
      expectedActionType: 'ACK',
    });
  }

  for (let cycle = 1; cycle <= 4; cycle++) {
    push({
      title: `Cycle ${cycle}: Draw`,
      description: 'Draw exactly one card at start of turn.',
      expectedActionType: 'DRAW_CARD',
    });
    push({
      title: `Cycle ${cycle}: Play`,
      description: 'Play one legal card from your hand. If you choose a targeted disaster, pick the bot as target.',
      expectedActionType: 'PLAY_CARD',
    });
    push({
      title: `Cycle ${cycle}: End Turn`,
      description: 'End turn to hand control to the bot and observe the response sequence.',
      expectedActionType: 'END_TURN',
    });
    push({
      title: `Cycle ${cycle}: Bot Analysis`,
      description: 'Review what the bot just did. Track whether it chose disaster pressure or score-building.',
      expectedActionType: 'ACK',
    });
  }

  push({
    title: 'Final Lesson',
    description: 'You have completed the full-length curriculum. Mark yourself as the tutorial winner to close the session.',
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
    health: 10,
    hand: [
      findCard('survival_agriculture'),
      findCard('power_shield_1'),
      findCard('disaster_earthquake_1'),
      findCard('adapt_dodge_4'),
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
    health: 10,
    hand: [findCard('disaster_earthquake_2'), findCard('survival_harvest'), findCard('chaos_raid_3')],
    powers: [],
  };

  const usedIds = new Set<string>([...human.hand, ...bot.hand].map((c) => c.id));
  const drawPile = buildScriptedDrawPile(usedIds);

  return {
    round: 1,
    activePlayerIndex: 0,
    players: [human, bot],
    drawPile,
    discardPile: [],
    turnPile: [],
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
