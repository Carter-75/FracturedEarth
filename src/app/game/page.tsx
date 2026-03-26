import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { getUserProfile } from '@/lib/kv';
import { LocalStatsPanel } from '@/components/LocalStatsPanel';

export default async function GameDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/api/auth/signin');

  const userId = (session.user as { id?: string }).id ?? '';
  const profile = await getUserProfile(userId);

  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{session.user.name ?? 'Commander'}</h1>
          <p className="text-gray-400 text-sm">{session.user.email}</p>
        </div>
        <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
          ← Home
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Games Played" value={profile?.totalGamesPlayed ?? 0} />
        <StatCard label="Total Wins"   value={profile?.totalWins ?? 0} />
        <StatCard label="Active Theme" value={profile?.theme ?? 'Obsidian'} />
      </div>

      <section className="bg-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-2">Play Cross-Platform</h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          Create a room and play from web or Android. Room state syncs through shared backend data.
        </p>
        <div className="mt-4 flex gap-3 flex-wrap">
          <Link href="/lan" className="px-4 py-2 rounded bg-red-700 hover:bg-red-600 text-sm font-semibold">
            Open Room Lobby
          </Link>
          <Link href="/tutorial" className="px-4 py-2 rounded bg-teal-700 hover:bg-teal-600 text-sm font-semibold">
            Guided Tutorial
          </Link>
          <Link href="/settings" className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 text-sm font-semibold">
            Settings
          </Link>
          <Link href="/privacy" className="px-4 py-2 rounded border border-gray-500 hover:border-gray-300 text-sm">
            Privacy Policy
          </Link>
        </div>
      </section>

      <div className="mt-6">
        <LocalStatsPanel />
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-800 rounded-xl p-5">
      <p className="text-gray-400 text-xs uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}
