'use client';

import { useEffect, useMemo, useState } from 'react';
import { loadLocalSettings, loadMatchHistory, type LocalMatchOutcome } from '@/lib/localProfile';

export function LocalStatsPanel() {
  const [history, setHistory] = useState<LocalMatchOutcome[]>([]);
  const [settings, setSettings] = useState(loadLocalSettings());

  useEffect(() => {
    setSettings(loadLocalSettings());
    setHistory(loadMatchHistory());
  }, []);

  const winRate = useMemo(() => {
    if (history.length === 0) return '0%';
    const wins = history.filter((h) => h.didWin).length;
    return `${Math.round((wins / history.length) * 100)}%`;
  }, [history]);

  return (
    <section className="bg-panel rounded-xl p-6 space-y-4">
      <h2 className="text-lg font-semibold">Local Device Stats</h2>
      <div className="grid sm:grid-cols-4 gap-3">
        <Stat label="Local Matches" value={history.length} />
        <Stat label="Win Rate" value={winRate} />
        <Stat label="Theme" value={settings.theme} />
        <Stat label="Sound" value={settings.soundEnabled ? 'On' : 'Off'} />
      </div>
      <ul className="space-y-2">
        {history.slice(0, 8).map((h) => (
          <li key={h.id} className="bg-panel-alt rounded px-3 py-2 flex items-center justify-between">
            <span className="truncate">{h.roomCode} - Winner: {h.winnerDisplayName}</span>
            <span className={h.didWin ? 'text-accent text-sm' : 'text-muted text-sm'}>
              {h.didWin ? 'You won' : 'You lost'}
            </span>
          </li>
        ))}
        {history.length === 0 && <li className="text-muted text-sm">No local matches recorded yet.</li>}
      </ul>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-panel-alt rounded p-3">
      <p className="text-muted text-xs uppercase">{label}</p>
      <p className="text-xl font-semibold mt-1">{value}</p>
    </div>
  );
}
