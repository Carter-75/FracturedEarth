import { NextRequest, NextResponse } from 'next/server';
import { getRoomsByMode } from '@/lib/rooms';

export async function GET(req: NextRequest) {
  try {
    // Return all open rooms in LOCAL_WIFI mode for "Discovery" simulation
    const rooms = await getRoomsByMode('LOCAL_WIFI');
    const activeRooms = (rooms || []).filter((r: any) => r.status === 'OPEN');
    return NextResponse.json(activeRooms);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
