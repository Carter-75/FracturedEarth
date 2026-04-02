import { NextRequest, NextResponse } from 'next/server';
import { advanceTutorial, getTutorialStep } from '@/lib/tutorialEngine';
import type { MatchAction, MatchPayload } from '@/lib/matchEngine';

export interface TutorialSession {
  match: MatchPayload;
  stepIndex: number;
  completed: boolean;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const session = body?.session as TutorialSession | undefined;
  const action = body?.action as any;
  const actorUserId = String(body?.actorUserId ?? '').trim();

  if (!session || !action?.type || !actorUserId) {
    return NextResponse.json({ error: 'session, action and actorUserId required' }, { status: 400 });
  }

  try {
    const { state, nextStepRecommended } = await advanceTutorial(
      session.match,
      action as any,
      session.stepIndex
    );

    const nextSession = {
      match: state,
      stepIndex: session.stepIndex + (nextStepRecommended ? 1 : 0),
      completed: state.winnerId !== undefined,
    };

    return NextResponse.json({
      session: nextSession,
      step: await getTutorialStep(nextSession.stepIndex),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Tutorial action failed';
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
