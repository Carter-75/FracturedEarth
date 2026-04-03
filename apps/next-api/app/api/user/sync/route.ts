import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { guestStats } = await req.json();
    await dbConnect();

    // Find the authenticated user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Merge Guest stats into the primary account
    if (guestStats) {
      if (guestStats.totalWins !== undefined) {
        // We only add wins from guest if they are higher (or just add them depending on preference)
        // For now, let's just add them to the account total
        user.totalWins += guestStats.totalWins;
      }
      
      if (guestStats.emoji && user.emoji === '👤') {
        user.emoji = guestStats.emoji;
      }
      
      if (guestStats.displayName && (!user.displayName || user.displayName === 'Player')) {
        user.displayName = guestStats.displayName;
      }
      
      if (guestStats.metadata) {
        const currentMetadata = user.metadata || new Map();
        Object.entries(guestStats.metadata).forEach(([key, value]) => {
          // Merge metadata from guest if it doesn't exist on account
          if (!currentMetadata.has(key)) {
            currentMetadata.set(key, value);
          }
        });
        user.metadata = currentMetadata;
      }
      
      user.lastActive = new Date();
      await user.save();
    }

    return NextResponse.json({ 
      message: 'Profile synced successfully',
      profile: {
        email: user.email,
        displayName: user.displayName,
        emoji: user.emoji,
        totalWins: user.totalWins,
        isPro: user.isPro,
        metadata: user.metadata || {}
      }
    });
  } catch (error: any) {
    console.error('Sync Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
