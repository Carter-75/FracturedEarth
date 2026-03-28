import { NextRequest, NextResponse } from 'next/server';
import { getUserProfile, upsertUserProfile } from '@/lib/kv';

export async function GET(
  req: NextRequest,
) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  const profile = await getUserProfile(userId);
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  return NextResponse.json(profile);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  await upsertUserProfile({
    userId: body.userId,
    displayName: body.displayName,
    email: body.email,
    theme: body.theme,
  });

  return NextResponse.json({ success: true });
}
