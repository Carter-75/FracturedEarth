import { NextRequest, NextResponse } from 'next/server';
import { recordGameResult } from '@/lib/kv';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  await recordGameResult(
    body.userId,
    Boolean(body.won),
    Number(body.survivalPoints ?? 0)
  );

  return NextResponse.json({ success: true });
}
