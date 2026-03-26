'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isTutorialDone, setTutorialDone } from '@/lib/localProfile';

export function TutorialLaunchGate() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hiddenPath = pathname.startsWith('/tutorial') || pathname.startsWith('/api');
    setVisible(!hiddenPath && !isTutorialDone());
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 p-6 space-y-4 shadow-2xl">
        <h2 className="text-2xl font-bold">Start Tutorial?</h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          A guided practice round with one bot is ready. You can skip now and mark tutorial as complete,
          or start it and learn card flow step-by-step.
        </p>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/tutorial"
            className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 font-semibold"
          >
            Start Tutorial
          </Link>
          <button
            onClick={() => {
              setTutorialDone(true);
              setVisible(false);
            }}
            className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600"
          >
            Skip and mark done
          </button>
        </div>
      </div>
    </div>
  );
}
