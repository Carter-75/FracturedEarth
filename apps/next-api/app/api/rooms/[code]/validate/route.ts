import { NextRequest, NextResponse } from 'next/server';
import { validateRoomMember } from '@/lib/rooms';

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  try {
    const { code } = params;
    const userId = req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ valid: false, reason: 'Missing userId' }, { status: 400 });
    }

    const result = await validateRoomMember(code, userId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ valid: false, reason: error.message }, { status: 500 });
  }
}
