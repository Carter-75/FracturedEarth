import { NextRequest, NextResponse } from 'next/server';
import { startLanMatch } from '@/lib/lanRooms';

export async function POST(
  req: NextRequest,
  context: { params: { code: string } },
) {
  const body = await req.json().catch(() => null);
  if (!body?.hostUserId) {
    return NextResponse.json({ error: 'hostUserId required' }, { status: 400 });
  }

  const room = startLanMatch({
    code: context.params.code,
    hostUserId: String(body.hostUserId),
  });

  if (!room) {
    return NextResponse.json({ error: 'Unable to start match' }, { status: 409 });
  }

  return NextResponse.json(room);
}
