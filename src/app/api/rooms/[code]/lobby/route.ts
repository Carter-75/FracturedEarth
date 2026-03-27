import { NextRequest, NextResponse } from 'next/server';
import { addBotToRoom, removeRoomMember } from '@/lib/rooms';

export async function POST(
  req: NextRequest,
  context: { params: { code: string } },
) {
  const body = await req.json().catch(() => null);
  if (!body?.hostUserId || !body?.operation) {
    return NextResponse.json({ error: 'hostUserId and operation required' }, { status: 400 });
  }

  const code = context.params.code;
  const hostUserId = String(body.hostUserId);
  const operation = String(body.operation);

  if (operation === 'ADD_BOT') {
    const room = await addBotToRoom({ code, hostUserId });
    if (!room) {
      return NextResponse.json({ error: 'Unable to add bot' }, { status: 409 });
    }
    return NextResponse.json(room);
  }

  if (operation === 'REMOVE_MEMBER') {
    if (!body?.targetUserId) {
      return NextResponse.json({ error: 'targetUserId required' }, { status: 400 });
    }
    const room = await removeRoomMember({
      code,
      hostUserId,
      targetUserId: String(body.targetUserId),
    });
    if (!room) {
      return NextResponse.json({ error: 'Unable to remove member' }, { status: 409 });
    }
    return NextResponse.json(room);
  }

  return NextResponse.json({ error: 'Unsupported operation' }, { status: 400 });
}
