import { NextRequest, NextResponse } from 'next/server';
import { initMatchService } from '@/lib/matchService';

export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  try {
    const body = await req.json();
    const roomCode = params.code;
    const { hostUserId } = body;

    const initialPayload = await initMatchService(roomCode, hostUserId);
    if (!initialPayload) return NextResponse.json({ error: 'Failed to initiate match' }, { status: 400 });

    return NextResponse.json(initialPayload);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
