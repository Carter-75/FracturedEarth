import Link from 'next/link';
import { LocalStatsPanel } from '@/components/LocalStatsPanel';

export default function GameDashboard() {
  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto dark-technical-grain">
      <div className="flex items-center justify-between mb-12 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-[var(--fg)] mb-2">Commander</h1>
          <p className="text-[var(--accent-soft)] text-[10px] uppercase tracking-[0.2em] font-bold">Local Secure Profile</p>
        </div>
        <Link href="/" className="text-sm text-[var(--fg)] opacity-50 hover:opacity-100 transition-opacity flex items-center gap-2 group">
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Return
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        <StatCard label="Games Played" value="0" />
        <StatCard label="Total Wins" value="0" />
        <StatCard label="Active Theme" value="Active" />
      </div>

      <section className="bg-[var(--panel)] border border-[var(--border)] rounded-[var(--radius)] p-8 mb-12 backdrop-blur-sm">
        <h2 className="text-2xl font-bold mb-3 tracking-tight text-[var(--fg)]">Play Cross-Platform</h2>
        <p className="text-[var(--fg)] opacity-40 text-sm leading-relaxed max-w-xl mb-8">
          Create a room and play from web or Android. Room state syncs through shared backend data across the local network. No external servers or authentication required.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link href="/lan" className="px-6 py-3 rounded bg-[var(--accent-soft)] hover:bg-[var(--accent)] active:scale-95 text-white text-sm font-bold tracking-wide transition-all cursor-pointer shadow-lg shadow-[var(--accent-rgb)]/20">
            Open Room Lobby
          </Link>
          <Link href="/tutorial" className="px-6 py-3 rounded bg-white/5 hover:bg-white/10 active:scale-95 text-[var(--fg)] text-sm font-bold tracking-wide transition-all cursor-pointer">
            Guided Tutorial
          </Link>
          <Link href="/settings" className="px-6 py-3 rounded bg-white/5 hover:bg-white/10 active:scale-95 text-[var(--fg)] text-sm font-bold tracking-wide transition-all cursor-pointer">
            Settings
          </Link>
        </div>
      </section>

      <div className="mt-8">
        <LocalStatsPanel />
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-[var(--panel-alt)] border border-[var(--border)] rounded-[var(--radius-sm)] p-6 transition-all hover:bg-[var(--panel)] flex flex-col justify-between group cursor-default">
      <p className="text-[var(--fg)] opacity-40 group-hover:text-[var(--accent-soft)] group-hover:opacity-100 transition-all text-[10px] uppercase font-bold tracking-[0.15em] mb-4">{label}</p>
      <p className="text-5xl font-black tracking-tighter text-[var(--fg)]">{value}</p>
    </div>
  );
}
