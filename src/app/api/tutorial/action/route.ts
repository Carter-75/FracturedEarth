import { NextRequest, NextResponse } from 'next/server';
import { applyTutorialAction, getTutorialStep, type TutorialAction, type TutorialSession } from '@/lib/tutorialEngine';
import type { MatchAction } from '@/lib/matchEngine';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const session = body?.session as TutorialSession | undefined;
  const action = body?.action as (MatchAction | TutorialAction) | undefined;
  const actorUserId = String(body?.actorUserId ?? '').trim();

  if (!session || !action?.type || !actorUserId) {
    return NextResponse.json({ error: 'session, action and actorUserId required' }, { status: 400 });
  }

  try {
    const next = applyTutorialAction({
      session,
      action,
      actorUserId,
    });

    return NextResponse.json({
      session: next,
      step: getTutorialStep(next.stepIndex),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Tutorial action failed';
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
