import { NextRequest, NextResponse } from 'next/server';
import { submitMatchAction, getMatchState } from '@/lib/matchService';

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const roomCode = params.code;
  const payload = await getMatchState(roomCode);
  if (!payload) return NextResponse.json({ error: 'Match state not found' }, { status: 404 });
  return NextResponse.json(payload);
}

export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  try {
    const roomCode = params.code;
    const body = await req.json();
    const { userId, action } = body;

    const nextPayload = await submitMatchAction(roomCode, userId, action);
    if (!nextPayload) return NextResponse.json({ error: 'Action failed' }, { status: 400 });

    return NextResponse.json(nextPayload);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
