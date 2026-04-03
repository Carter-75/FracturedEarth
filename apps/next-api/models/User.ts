import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name?: string;
  image?: string;
  
  // Custom Profile
  displayName?: string;
  emoji?: string;
  
  // Stats
  totalWins: number;
  gamesPlayed: number;
  
  // Preferences
  isPro: boolean;
  theme?: 'dark' | 'light';
  
  lastActive: Date;
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String },
  image: { type: String },
  
  displayName: { type: String },
  emoji: { type: String, default: '👤' },
  
  totalWins: { type: Number, default: 0 },
  gamesPlayed: { type: Number, default: 0 },
  
  isPro: { type: Boolean, default: false },
  theme: { type: String, default: 'dark' },
  
  lastActive: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

// Avoid re-compiling the model in Next.js HMR
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
