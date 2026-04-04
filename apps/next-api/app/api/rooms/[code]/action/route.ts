import { NextRequest, NextResponse } from 'next/server';
import { submitMatchAction } from '@/lib/matchService';

export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  try {
    const roomCode = params.code;
    const body = await req.json();
    const { userId, action } = body;

    const stateEnvelope = await submitMatchAction(roomCode, userId, action);
    if (!stateEnvelope) {
      return NextResponse.json({ error: 'Action failed' }, { status: 400 });
    }

    return NextResponse.json(stateEnvelope);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
