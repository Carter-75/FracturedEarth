import mongoose, { Schema, model, models } from 'mongoose';

const RoomMemberSchema = new Schema({
  userId: { type: String, required: true },
  displayName: { type: String, required: true },
  emoji: { type: String, required: true },
  joinedAtEpochMs: { type: Number, required: true },
  lastHeartbeatEpochMs: { type: Number, required: true },
  disconnectedAtEpochMs: { type: Number },
  isBot: { type: Boolean, default: false },
});

const RoomSchema = new Schema({
  code: { type: String, required: true, unique: true, uppercase: true, index: true },
  hostUserId: { type: String, required: true },
  hostDisplayName: { type: String, required: true },
  mode: { type: String, default: 'LOCAL_WIFI' },
  status: { type: String, enum: ['OPEN', 'IN_GAME', 'CLOSED'], default: 'OPEN' },
  maxPlayers: { type: Number, default: 4 },
  members: [RoomMemberSchema],
  kickedUserIds: { type: [String], default: [] },
  createdAtEpochMs: { type: Number, required: true },
  updatedAtEpochMs: { type: Number, required: true },
}, { timestamps: true });

const RoomGameStateSchema = new Schema({
  roomCode: { type: String, required: true, unique: true, uppercase: true, index: true },
  revision: { type: Number, default: 0 },
  updatedAtEpochMs: { type: Number, required: true },
  updatedByUserId: { type: String, required: true },
  payload: { type: Schema.Types.Mixed, required: true },
}, { timestamps: true });

export const Room = models['Room'] || model('Room', RoomSchema);
export const RoomGameState = models['RoomGameState'] || model('RoomGameState', RoomGameStateSchema);
