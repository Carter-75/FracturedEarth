import { NextRequest, NextResponse } from 'next/server';
import { joinRoom } from '@/lib/rooms';

export async function POST(
  req: NextRequest,
  context: { params: { code: string } },
) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const room = await joinRoom({
      code: context.params.code,
      userId: String(body.userId),
      displayName: String(body.displayName ?? 'Player'),
      emoji: String(body.emoji ?? '🌍'),
    });

    if (!room) {
      return NextResponse.json({ error: 'Room unavailable' }, { status: 409 });
    }

    return NextResponse.json(room);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Room unavailable';
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
