import { NextRequest, NextResponse } from 'next/server';
import { startRoomMatch } from '@/lib/rooms';

export async function POST(
  req: NextRequest,
  context: { params: { code: string } },
) {
  const body = await req.json().catch(() => null);
  if (!body?.hostUserId) {
    return NextResponse.json({ error: 'hostUserId required' }, { status: 400 });
  }

  const room = await startRoomMatch({
    code: context.params.code,
    hostUserId: String(body.hostUserId),
  });

  if (!room) {
    return NextResponse.json({ error: 'Unable to start room' }, { status: 409 });
  }

  return NextResponse.json(room);
}
