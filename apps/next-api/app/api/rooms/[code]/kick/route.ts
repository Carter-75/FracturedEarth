import { NextRequest, NextResponse } from 'next/server';
import { kickMember } from '@/lib/rooms';

export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  try {
    const body = await req.json();
    const roomCode = params.code;
    const { hostUserId, targetUserId } = body;

    const room = await kickMember({
      code: roomCode,
      hostUserId,
      targetUserId
    });
    
    if (!room) return NextResponse.json({ error: 'Failed to kick member' }, { status: 400 });
    return NextResponse.json(room);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
