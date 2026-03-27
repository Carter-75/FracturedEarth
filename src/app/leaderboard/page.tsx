import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { getLeaderboard } from '@/lib/kv';
import { ImagePromptPlaceholder } from '@/components/ImagePromptPlaceholder';

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

      {/* AI prompt: engraved brass scoreboard mounted above a tabletop arena, rank plates and point markers, cinematic warm contrast, realistic texture */}
      <ImagePromptPlaceholder label="Leaderboard Crest Artwork" ratioClassName="aspect-[18/6]" className="mb-6" />
      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        {/* AI prompt: champion badge medallions arranged by rank, burnished metal and enamel, premium board-game award style */}
        <ImagePromptPlaceholder label="Rank Medallion Art" ratioClassName="aspect-[16/9]" />
        {/* AI prompt: points tracker beads on a carved wooden rail, macro tabletop shot, warm cinematic bokeh */}
        <ImagePromptPlaceholder label="Points Tracker Art" ratioClassName="aspect-[16/9]" />
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
