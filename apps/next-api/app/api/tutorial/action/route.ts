import { NextRequest, NextResponse } from 'next/server';
import { advanceTutorial, getTutorialStep, TUTORIAL_SCRIPT } from '@/lib/tutorialEngine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session, action, actorUserId } = body;

    // Room context for matchEngine
    const roomPlayers = session.match.players.map((p: any) => ({
        userId: p.id,
        displayName: p.displayName,
        emoji: p.emoji,
        isBot: p.isBot
    }));

    const { state, nextStepRecommended } = await advanceTutorial(
      session.match,
      action,
      session.stepIndex,
      actorUserId,
      'TUTORIAL',
      roomPlayers
    );

    const nextStepIndex = nextStepRecommended ? session.stepIndex + 1 : session.stepIndex;
    const nextStep = await getTutorialStep(nextStepIndex);
    
    // Check if tutorial is completed
    const completed = !nextStep || nextStepIndex >= TUTORIAL_SCRIPT.length;

    return NextResponse.json({
      session: {
        match: state,
        stepIndex: nextStepIndex,
        completed
      },
      step: nextStep
    });
  } catch (e: any) {
    console.error('Tutorial Action Error:', e);
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
