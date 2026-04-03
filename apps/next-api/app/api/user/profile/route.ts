import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      profile: {
        email: user.email,
        displayName: user.displayName,
        emoji: user.emoji,
        totalWins: user.totalWins,
        isPro: user.isPro,
        metadata: user.metadata || {}
      }
    });
  } catch (error) {
    console.error('Profile Fetch Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates = await req.json();
    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generic Update Logic
    if (updates.displayName !== undefined) user.displayName = updates.displayName;
    if (updates.emoji !== undefined) user.emoji = updates.emoji;
    if (updates.totalWins !== undefined) user.totalWins = updates.totalWins;
    
    // Sync Metadata (merge)
    if (updates.metadata) {
      const currentMetadata = user.metadata || new Map();
      Object.entries(updates.metadata).forEach(([key, value]) => {
        currentMetadata.set(key, value);
      });
      user.metadata = currentMetadata;
    }

    user.lastActive = new Date();
    await user.save();

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: {
        email: user.email,
        displayName: user.displayName,
        emoji: user.emoji,
        totalWins: user.totalWins,
        isPro: user.isPro,
        metadata: user.metadata
      }
    });
  } catch (error) {
    console.error('Profile Update Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
