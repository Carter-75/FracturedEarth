import { NextRequest, NextResponse } from 'next/server';
import { getRoom } from '@/lib/rooms';

export async function GET(
  _req: NextRequest,
  context: { params: { code: string } },
) {
  const room = await getRoom(context.params.code);
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }
  return NextResponse.json(room);
}
