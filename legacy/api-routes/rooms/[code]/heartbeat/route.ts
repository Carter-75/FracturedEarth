import { NextRequest, NextResponse } from 'next/server';
import { getRoom, heartbeatRoom } from '@/lib/rooms';

export async function POST(
  req: NextRequest,
  context: { params: { code: string } },
) {
  const body = await req.json().catch(() => null);
  if (!body?.userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  const code = context.params.code;
  const userId = String(body.userId);
  const room = await getRoom(code);

  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  const updated = await heartbeatRoom({ code, userId });
  if (!updated) {
    return NextResponse.json({ error: 'Unable to update heartbeat' }, { status: 409 });
  }

  return NextResponse.json(updated);
}
