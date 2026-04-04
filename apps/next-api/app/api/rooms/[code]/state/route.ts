import { NextRequest, NextResponse } from 'next/server';
import { getMatchState } from '@/lib/matchService';

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  try {
    const roomCode = params.code;
    const stateEnvelope = await getMatchState(roomCode);
    
    if (!stateEnvelope) {
      return NextResponse.json({ error: 'Match state not found' }, { status: 404 });
    }

    return NextResponse.json(stateEnvelope);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
