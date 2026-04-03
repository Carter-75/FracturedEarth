import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../lib/mongodb';
import { Room } from '../../../../models/Room';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req.query;
  const { userId } = req.body;

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    
    const room = await Room.findOne({ code: (code as string).toUpperCase() });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Update heartbeat for the specific user
    const memberIndex = room.members.findIndex((m: any) => m.userId === userId);
    if (memberIndex === -1) {
      return res.status(403).json({ message: 'User not in room' });
    }

    room.members[memberIndex].lastHeartbeatEpochMs = Date.now();
    room.members[memberIndex].disconnectedAtEpochMs = undefined; // Reset if reconnected
    room.updatedAtEpochMs = Date.now();
    
    await room.save();

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Heartbeat update failed', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
