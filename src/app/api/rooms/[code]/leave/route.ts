import { NextRequest, NextResponse } from 'next/server';
import { leaveRoom } from '@/lib/rooms';

export async function POST(
  req: NextRequest,
  context: { params: { code: string } },
) {
  const body = await req.json().catch(() => null);
  if (!body?.userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  const room = await leaveRoom({
    code: context.params.code,
    userId: String(body.userId),
  });

  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  return NextResponse.json(room);
}
