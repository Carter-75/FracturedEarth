import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ImagePromptPlaceholder } from '@/components/ImagePromptPlaceholder';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  return (
    <main className="min-h-screen px-4 py-8 sm:px-8">
      <section className="fe-hero-shell rounded-[2rem] max-w-6xl mx-auto px-5 py-6 sm:px-8 sm:py-8 overflow-hidden relative">
        <div className="relative z-10 grid lg:grid-cols-[1.15fr_0.85fr] gap-6 items-start">
          <div className="space-y-5">
            <div className="inline-flex items-center rounded-full border border-amber-200/30 bg-amber-100/10 px-3 py-1 text-[11px] tracking-[0.22em] uppercase text-amber-100">
              Analog Tabletop Mode
            </div>

            <div>
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black leading-[0.95] text-amber-50">
                FRACTURED
                <br />
                EARTH
              </h1>
              <p className="mt-4 max-w-xl text-base sm:text-lg text-amber-50/85">
                Survive the collapse, build your line of defense, and outlast everyone around a living tabletop.
              </p>
            </div>

            {session ? (
              <p className="text-sm text-emerald-200/95">
                Connected as {session.user?.name ?? 'Commander'}.
              </p>
            ) : (
              <p className="text-sm text-amber-100/80">
                Instant local play works without sign-in. Account linking is optional for synced profile and leaderboard.
              </p>
            )}

            <div className="grid sm:grid-cols-2 gap-3 max-w-2xl">
              <Link href="/lan" className="fe-button-primary rounded-xl px-5 py-3 font-semibold text-center">
                Enter Room Lobby
              </Link>
              <Link href="/tutorial" className="fe-nav-tile rounded-xl px-5 py-3 font-semibold text-center">
                Launch Tutorial
              </Link>
            </div>
          </div>

          <div className="fe-rift-banner rounded-[1.6rem] p-4 sm:p-5 space-y-4">
            {/* AI prompt: cinematic tabletop command bunker, cracked earth hologram map, warm amber practical lights, survival game mood, high detail concept art */}
            <ImagePromptPlaceholder label="Command Bunker Hero Art" ratioClassName="aspect-[4/3]" />
            <div className="grid grid-cols-2 gap-3">
              {/* AI prompt: close-up of hand-painted faction emblems on metal tokens, worn edges, warm workshop light, realistic macro shot */}
              <ImagePromptPlaceholder label="Faction Token Art" ratioClassName="aspect-square" />
              {/* AI prompt: tactical mission card spread with stamped objective labels, gritty analog paper, dramatic side lighting, board game product photo */}
              <ImagePromptPlaceholder label="Mission Card Spread" ratioClassName="aspect-square" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="fe-nav-tile rounded-xl p-3">
                <p className="text-[10px] tracking-[0.2em] uppercase fe-muted">Session</p>
                <p className="mt-1 text-lg font-semibold">{session ? 'Online' : 'Offline-ready'}</p>
              </div>
              <div className="fe-nav-tile rounded-xl p-3">
                <p className="text-[10px] tracking-[0.2em] uppercase fe-muted">Matches</p>
                <p className="mt-1 text-lg font-semibold">2-4 Players</p>
              </div>
            </div>

            <div className="fe-paper-note rounded-xl p-4">
              <p className="text-xs uppercase tracking-[0.2em] fe-muted">Command Board</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <Link href="/game" className="fe-nav-tile rounded-lg px-3 py-2 text-center">Hangar</Link>
                <Link href="/leaderboard" className="fe-nav-tile rounded-lg px-3 py-2 text-center">Leaderboard</Link>
                <Link href="/settings" className="fe-nav-tile rounded-lg px-3 py-2 text-center">Settings</Link>
                <Link href="/rules" className="fe-nav-tile rounded-lg px-3 py-2 text-center">Rules</Link>
                <Link href="/privacy" className="fe-nav-tile rounded-lg px-3 py-2 text-center col-span-2">Privacy</Link>
              </div>
            </div>

            {session && (
              <Link href="/api/auth/signout" className="block text-center fe-nav-tile rounded-xl px-4 py-2 text-sm">
                Sign Out
              </Link>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
