import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // providerAccountId from NextAuth
  displayName: String,
  email: String,
  adFree: { type: Boolean, default: false },
  isLifetime: { type: Boolean, default: false },
  entitlements: [String],
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
