import { NextRequest, NextResponse } from 'next/server';
import { getTutorialStep, startTutorial } from '@/lib/tutorialEngine';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const userId = String(body?.userId ?? 'tutorial_human').trim() || 'tutorial_human';
  const displayName = String(body?.displayName ?? 'Player').trim() || 'Player';
  const emoji = String(body?.emoji ?? '🌍').trim() || '🌍';

  const session = await startTutorial({ userId, displayName, emoji });
  const step = await getTutorialStep(session.stepIndex);

  return NextResponse.json({
    session,
    step,
  });
}
