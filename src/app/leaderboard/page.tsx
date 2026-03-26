import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { getLeaderboard } from '@/lib/kv';

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions);
  const leaders = await getLeaderboard(20);

  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
          ← Home
        </Link>
      </div>

      {leaders.length === 0 ? (
        <p className="text-gray-500">No scores yet. Be the first to play!</p>
      ) : (
        <ol className="space-y-2">
          {leaders.map((entry, i) => (
            <li
              key={entry.member}
              className="flex items-center justify-between bg-gray-800 rounded-lg px-5 py-3"
            >
              <span className="text-gray-400 w-8">#{i + 1}</span>
              <span className="flex-1 truncate">{entry.member}</span>
              <span className="font-bold text-yellow-400">{entry.score} pts</span>
            </li>
          ))}
        </ol>
      )}

      {!session && (
        <p className="mt-8 text-gray-500 text-sm">
          <Link href="/api/auth/signin" className="text-red-400 hover:underline">
            Sign in
          </Link>{' '}
          to appear on the leaderboard.
        </p>
      )}
    </main>
  );
}
