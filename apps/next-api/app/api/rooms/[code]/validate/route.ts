import { NextRequest, NextResponse } from 'next/server';
import { validateRoomMember } from '@/lib/rooms';

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const roomCode = params.code;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const result = await validateRoomMember(roomCode, userId);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
