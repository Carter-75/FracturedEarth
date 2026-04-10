import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication Required' }, { status: 401 });
    }

    const { adFree, isLifetime, entitlements } = await req.json();
    const userId = (session.user as any).id;

    await dbConnect();
    
    const user = await User.findOneAndUpdate(
      { id: userId },
      { 
        adFree, 
        isLifetime, 
        entitlements,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, user });
  } catch (e: any) {
    console.error('Subscription Sync Error:', e);
    return NextResponse.json({ error: e.message || 'Sync Failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication Required' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    await dbConnect();
    
    const user = await User.findOne({ id: userId });
    return NextResponse.json({
       adFree: user?.adFree ?? false,
       isLifetime: user?.isLifetime ?? false
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'Fetch Failed' }, { status: 500 });
  }
}
