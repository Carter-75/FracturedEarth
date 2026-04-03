import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { MongoDBAdapter } from '@auth/mongodb-adapter'; // Note: Ensure this is installed if needed
import clientPromise from '@/lib/mongodb'; // Using the existing clientPromise
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  // adapter: MongoDBAdapter(clientPromise), // Optional: Use this if you want next-auth to manage the DB
  callbacks: {
    async session({ session, token, user }) {
      // Fetch or create the user in our custom schema on every session check
      await dbConnect();
      let dbUser = await User.findOne({ email: session.user?.email });
      if (!dbUser && session.user?.email) {
          dbUser = await User.create({
              email: session.user.email,
              name: session.user.name,
              image: session.user.image,
              displayName: session.user.name,
          });
      }
      
      if (session.user) {
          (session.user as any).id = dbUser?._id;
          (session.user as any).emoji = dbUser?.emoji;
          (session.user as any).totalWins = dbUser?.totalWins;
          (session.user as any).isPro = dbUser?.isPro;
      }
      
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
