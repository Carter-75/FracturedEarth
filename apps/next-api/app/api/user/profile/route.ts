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

    // 1. Prepare Atomic Update Object
    const setQuery: any = { lastActive: new Date() };
    const coreFields = ['displayName', 'emoji', 'totalWins', 'isPro'];

    // Universal Mapping: Automatically move ANY non-core field to metadata
    Object.entries(updates).forEach(([key, value]) => {
      if (coreFields.includes(key)) {
        setQuery[key] = value;
      } else if (key !== 'id' && key !== 'email') {
        // Map to metadata sub-field atomically
        if (key === 'metadata' && typeof value === 'object') {
          // Flatten nested metadata if provided explicitly
          Object.entries(value as object).forEach(([mKey, mVal]) => {
            setQuery[`metadata.${mKey}`] = mVal;
          });
        } else {
          setQuery[`metadata.${key}`] = value;
        }
      }
    });

    // 2. Perform Atomic Update
    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: setQuery },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: {
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        emoji: updatedUser.emoji,
        totalWins: updatedUser.totalWins,
        isPro: updatedUser.isPro,
        metadata: updatedUser.metadata
      }
    });
  } catch (error) {
    console.error('Profile Update Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
