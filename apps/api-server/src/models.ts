import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  emoji: { type: String, default: '🌍' },
  entitlements: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const RoomSchema = new Schema({
  code: { type: String, required: true, unique: true },
  mode: { type: String, required: true },
  ownerUserId: { type: String, required: true },
  members: {
    type: [
      {
        userId: { type: String, required: true },
        displayName: { type: String, required: true },
        emoji: { type: String, required: true },
        isBot: { type: Boolean, default: false },
      },
    ],
    default: [],
  },
  memberIds: { type: [String], default: [] },
  started: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const MatchHistorySchema = new Schema({
  matchId: { type: String, required: true, unique: true },
  mode: { type: String, required: true },
  winnerUserId: { type: String },
  participantIds: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
});

const ActiveMatchSchema = new Schema({
  matchId: { type: String, required: true, unique: true },
  mode: { type: String, required: true },
  roomCode: { type: String, required: true },
  revision: { type: Number, required: true },
  payload: { type: Schema.Types.Mixed, required: true },
  updatedAtEpochMs: { type: Number, required: true },
});

export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
export const RoomModel = mongoose.models.Room || mongoose.model('Room', RoomSchema);
export const MatchHistoryModel = mongoose.models.MatchHistory || mongoose.model('MatchHistory', MatchHistorySchema);
export const ActiveMatchModel = mongoose.models.ActiveMatch || mongoose.model('ActiveMatch', ActiveMatchSchema);
