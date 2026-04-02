import { NextRequest, NextResponse } from 'next/server';
import { getLanRoom } from '@/lib/lanRooms';

export async function GET(
  _req: NextRequest,
  context: { params: { code: string } },
) {
  const room = getLanRoom(context.params.code);
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }
  return NextResponse.json(room);
}
