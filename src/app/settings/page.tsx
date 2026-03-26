'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isTutorialDone, resetTutorialDone, setTutorialDone } from '@/lib/localProfile';

export default function SettingsPage() {
  const router = useRouter();
  const tutorialDone = typeof window !== 'undefined' ? isTutorialDone() : false;

  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Settings</h1>
        <Link href="/" className="text-sm text-gray-400 hover:text-white">Home</Link>
      </div>

      <section className="bg-gray-800 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold">Tutorial</h2>
        <p className="text-sm text-gray-300">Status: {tutorialDone ? 'Completed' : 'Not completed'}</p>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              resetTutorialDone();
              window.location.reload();
            }}
            className="px-4 py-2 rounded bg-amber-700 hover:bg-amber-600"
          >
            Replay Tutorial (reset + refresh)
          </button>

          <button
            onClick={() => {
              setTutorialDone(true);
              router.refresh();
            }}
            className="px-4 py-2 rounded bg-emerald-700 hover:bg-emerald-600"
          >
            Mark Tutorial Done
          </button>

          <Link href="/tutorial" className="px-4 py-2 rounded bg-indigo-700 hover:bg-indigo-600">
            Open Tutorial
          </Link>
        </div>
      </section>

      <section className="bg-gray-800 rounded-xl p-6 space-y-3">
        <h2 className="text-lg font-semibold">Rules And Cards</h2>
        <p className="text-sm text-gray-300">Open the full game rules and card behavior reference.</p>
        <Link href="/rules" className="inline-block px-4 py-2 rounded bg-slate-700 hover:bg-slate-600">
          Open Rules Page
        </Link>
      </section>
    </main>
  );
}
