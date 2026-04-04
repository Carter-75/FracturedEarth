'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function LegacyTabletopRedirect() {
  const router = useRouter();
  const params = useParams();
  const code = params.code;

  useEffect(() => {
    if (code) {
      // Correct the path-based URL to the query-based URL format
      router.replace(`/tabletop?code=${code.toString().toUpperCase()}`);
    }
  }, [code, router]);

  return (
    <div className="fe-scene flex-1 flex flex-col items-center justify-center bg-black">
      <div className="fe-hologram animate-pulse text-[var(--accent-soft)] text-xl tracking-[0.5em] fe-flicker uppercase">
        Redirecting_Sector_Frequency...
      </div>
    </div>
  );
}
