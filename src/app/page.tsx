import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  return (
    <>
      <main className="min-h-screen flex flex-col items-center justify-center gap-8 px-4 text-center">
        <div>
          <h1 className="text-6xl font-bold tracking-tighter text-white">FRACTURED EARTH</h1>
          <p className="mt-3 text-xl text-gray-400">A Chaos Survival Card Game</p>
        </div>

        <div className="flex flex-wrap gap-4 justify-center">
          {session ? (
            <>
              <p className="w-full text-green-400 text-sm">
                Signed in as {session.user?.name}
              </p>
              <Link
                href="/game"
                className="px-8 py-3 bg-red-700 hover:bg-red-600 rounded-lg font-semibold transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/leaderboard"
                className="px-8 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
              >
                Leaderboard
              </Link>
              <Link
                href="/lan"
                className="px-8 py-3 bg-indigo-700 hover:bg-indigo-600 rounded-lg font-semibold transition-colors"
              >
                Play Rooms
              </Link>
              <Link
                href="/tutorial"
                className="px-8 py-3 bg-teal-700 hover:bg-teal-600 rounded-lg font-semibold transition-colors"
              >
                Tutorial
              </Link>
              <Link
                href="/settings"
                className="px-8 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition-colors"
              >
                Settings
              </Link>
              <Link
                href="/privacy"
                className="px-8 py-3 border border-gray-600 hover:border-gray-400 rounded-lg font-semibold transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/api/auth/signout"
                className="px-8 py-3 border border-gray-600 hover:border-gray-400 rounded-lg font-semibold transition-colors"
              >
                Sign Out
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/api/auth/signin"
                className="px-8 py-3 bg-red-700 hover:bg-red-600 rounded-lg font-semibold transition-colors"
              >
                Sign In with Google
              </Link>
              <Link
                href="/leaderboard"
                className="px-8 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
              >
                Leaderboard
              </Link>
              <Link
                href="/lan"
                className="px-8 py-3 bg-indigo-700 hover:bg-indigo-600 rounded-lg font-semibold transition-colors"
              >
                Play Rooms
              </Link>
              <Link
                href="/tutorial"
                className="px-8 py-3 bg-teal-700 hover:bg-teal-600 rounded-lg font-semibold transition-colors"
              >
                Tutorial
              </Link>
              <Link
                href="/settings"
                className="px-8 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition-colors"
              >
                Settings
              </Link>
              <Link
                href="/privacy"
                className="px-8 py-3 border border-gray-600 hover:border-gray-400 rounded-lg font-semibold transition-colors"
              >
                Privacy
              </Link>
            </>
          )}
        </div>

        <p className="text-gray-600 text-sm max-w-sm">
          Full gameplay on Android. Sign in to sync your stats, themes, and leaderboard rank.
        </p>
      </main>
    </>
  );
}
