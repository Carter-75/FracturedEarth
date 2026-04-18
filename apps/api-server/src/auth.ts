import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { connectToDatabase, isDatabaseConnected } from './db.js';
import { UserModel } from './models.js';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  displayName: string;
  emoji: string;
  isGuest?: boolean;
}

const memoryUsers = new Map<string, AuthenticatedUser>();
const googleClient = config.googleClientId ? new OAuth2Client(config.googleClientId) : null;

function issueToken(user: AuthenticatedUser) {
  return jwt.sign(user, config.jwtSecret, { expiresIn: '7d' });
}

export function issueGuestSession(displayName: string, emoji = '🌍'): { token: string; user: AuthenticatedUser } {
  const user: AuthenticatedUser = {
    userId: `guest_${Math.random().toString(36).slice(2, 10)}`,
    email: '',
    displayName,
    emoji,
    isGuest: true,
  };

  return { token: issueToken(user), user };
}

export async function registerOrLogin(
  email: string,
  displayName: string,
  emoji = '🌍'
): Promise<{ token: string; user: AuthenticatedUser }> {
  await connectToDatabase();

  if (isDatabaseConnected()) {
    const doc = await UserModel.findOneAndUpdate(
      { email },
      { email, displayName, emoji, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    const user = {
      userId: String(doc._id),
      email: doc.email,
      displayName: doc.displayName,
      emoji: doc.emoji || emoji,
    };
    return { token: issueToken(user), user };
  }

  const existing = Array.from(memoryUsers.values()).find((user) => user.email === email);
  const user = existing || {
    userId: `user_${Math.random().toString(36).slice(2, 10)}`,
    email,
    displayName,
    emoji,
  };
  memoryUsers.set(user.userId, user);
  return { token: issueToken(user), user };
}

export async function loginWithGoogleIdToken(
  idToken: string,
  emoji = '🌍'
): Promise<{ token: string; user: AuthenticatedUser }> {
  if (!googleClient || !config.googleClientId) {
    throw new Error('Google auth is not configured');
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: config.googleClientId,
  });
  const payload = ticket.getPayload();
  const email = payload?.email?.trim().toLowerCase();
  if (!email) {
    throw new Error('Google account did not return an email');
  }

  const displayName = payload?.name?.trim() || email.split('@')[0] || 'Commander';
  return registerOrLogin(email, displayName, emoji);
}

export function verifyToken(token?: string): AuthenticatedUser | null {
  if (!token) return null;
  try {
    return jwt.verify(token, config.jwtSecret) as AuthenticatedUser;
  } catch {
    return null;
  }
}
