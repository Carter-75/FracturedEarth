import { NextRequest, NextResponse } from 'next/server';
import { getRoomGameState, putRoomGameState } from '@/lib/rooms';

export async function GET(
  _req: NextRequest,
  context: { params: { code: string } },
) {
  const state = await getRoomGameState(context.params.code);
  if (!state) {
    return NextResponse.json({ error: 'State not found' }, { status: 404 });
  }
  return NextResponse.json(state);
}

export async function PUT(
  req: NextRequest,
  context: { params: { code: string } },
) {
  const body = await req.json().catch(() => null);
  if (!body?.userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  const state = await putRoomGameState({
    code: context.params.code,
    userId: String(body.userId),
    payload: body.payload,
    expectedRevision:
      typeof body.expectedRevision === 'number' ? Number(body.expectedRevision) : undefined,
  });

  if (!state) {
    return NextResponse.json({ error: 'Unable to persist state' }, { status: 409 });
  }

  if (
    typeof body.expectedRevision === 'number' &&
    state.revision !== Number(body.expectedRevision) + 1
  ) {
    return NextResponse.json(
      { error: 'Revision conflict', current: state },
      { status: 409 },
    );
  }

  return NextResponse.json(state);
}
