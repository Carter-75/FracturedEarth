import { NextRequest, NextResponse } from 'next/server';
import { joinLanRoom } from '@/lib/lanRooms';

export async function POST(
  req: NextRequest,
  context: { params: { code: string } },
) {
  const body = await req.json().catch(() => null);
  if (!body?.userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  const room = joinLanRoom({
    code: context.params.code,
    userId: String(body.userId),
    displayName: String(body.displayName ?? 'Player'),
  });

  if (!room) {
    return NextResponse.json({ error: 'Room unavailable' }, { status: 409 });
  }

  return NextResponse.json(room);
}
