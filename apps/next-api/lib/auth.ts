import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { dbConnect } from './mongodb';
import User from './models/User';

// 72 Hours in seconds
const SESSION_MAX_AGE = 72 * 60 * 60;

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: SESSION_MAX_AGE,
  },
  callbacks: {
    async jwt({ token, account, user }) {
      if (account) token.sub = account.providerAccountId;
      
      // Initial sign in or session refresh
      if (token.sub) {
        try {
          await dbConnect();
          const dbUser = await User.findOne({ id: token.sub });
          if (dbUser) {
            token.adFree = dbUser.adFree;
            token.isLifetime = dbUser.isLifetime;
          }
        } catch (e) {
          console.error('NextAuth JWT Callback Error:', e);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as any).id = token.sub;
        (session as any).adFree = token.adFree ?? false;
        (session as any).isLifetime = token.isLifetime ?? false;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'secret_for_dev_only_do_not_use_in_prod',
};
