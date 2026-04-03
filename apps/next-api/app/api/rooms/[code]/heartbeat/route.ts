import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Room } from '@/models/Room';

export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  try {
    const { code } = params;
    const body = await req.json();
    const { userId } = body;

    await dbConnect();
    
    const room = await Room.findOne({ code: code.toUpperCase() });
    if (!room) {
      return NextResponse.json({ message: 'Room not found' }, { status: 404 });
    }

    // Update heartbeat for the specific user
    const memberIndex = room.members.findIndex((m: any) => m.userId === userId);
    if (memberIndex === -1) {
      return NextResponse.json({ message: 'User not in room' }, { status: 403 });
    }

    room.members[memberIndex].lastHeartbeatEpochMs = Date.now();
    room.members[memberIndex].disconnectedAtEpochMs = undefined; // Reset if reconnected
    room.updatedAtEpochMs = Date.now();
    
    await room.save();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Heartbeat update failed', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
