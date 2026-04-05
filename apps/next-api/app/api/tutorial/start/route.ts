import { NextRequest, NextResponse } from 'next/server';
import { startTutorial, getTutorialStep } from '@/lib/tutorialEngine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, displayName, emoji } = body;

    const session = await startTutorial({ userId, displayName, emoji });
    const step = await getTutorialStep(0);

    return NextResponse.json({ session, step });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
