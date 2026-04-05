import { NextRequest, NextResponse } from 'next/server';
import { advanceTutorial, getTutorialStep } from '@/lib/tutorialEngine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session, action, actorUserId } = body;

    const { state, nextStepRecommended } = await advanceTutorial(
      session.match,
      action,
      session.stepIndex
    );

    const nextStepIndex = nextStepRecommended ? session.stepIndex + 1 : session.stepIndex;
    const nextStep = await getTutorialStep(nextStepIndex);
    
    // Check if tutorial is completed
    const completed = !nextStep || nextStepIndex >= 9; // 9 steps in tutorialEngine

    return NextResponse.json({
      session: {
        match: state,
        stepIndex: nextStepIndex,
        completed
      },
      step: nextStep
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
