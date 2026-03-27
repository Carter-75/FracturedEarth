'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EMOJI_OPTIONS, THEME_OPTIONS } from '@/lib/gameConfig';
import { isTutorialDone, loadLocalSettings, resetTutorialDone, saveLocalSettings, setTutorialDone } from '@/lib/localProfile';

export default function SettingsPage() {
  const router = useRouter();
  const [tutorialDone, setTutorialState] = useState(false);
  const [userId, setUserId] = useState('web_player');
  const [displayName, setDisplayName] = useState('Web Player');
  const [emoji, setEmoji] = useState('🌍');
  const [theme, setTheme] = useState<(typeof THEME_OPTIONS)[number]>('Obsidian');
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    const settings = loadLocalSettings();
    setUserId(settings.userId);
    setDisplayName(settings.displayName);
    setEmoji(settings.emoji);
    setTheme(settings.theme);
    setSoundEnabled(settings.soundEnabled);
    setTutorialState(isTutorialDone());
  }, []);

  function saveProfile() {
    saveLocalSettings({
      userId: userId.trim() || 'web_player',
      displayName: displayName.trim() || 'Web Player',
      emoji,
      theme,
      soundEnabled,
    });
  }

  return (
    <main className="min-h-screen p-8 max-w-5xl mx-auto space-y-6">
      <div className="fe-panel rounded-3xl p-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Player Garage</h1>
          <p className="fe-muted text-sm mt-1">Tune your identity, theme, and tutorial progression.</p>
        </div>
        <Link href="/" className="fe-panel-alt rounded-xl px-4 py-2 text-sm">Home</Link>
      </div>

      <section className="fe-panel rounded-3xl p-6 space-y-4">
        <h2 className="text-lg font-semibold">Profile And Theme</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <input
            className="fe-panel-alt rounded-xl px-3 py-3"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            placeholder="Player id"
          />
          <input
            className="fe-panel-alt rounded-xl px-3 py-3"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Display name"
          />
          <select className="fe-panel-alt rounded-xl px-3 py-3" value={emoji} onChange={(event) => setEmoji(event.target.value)}>
            {EMOJI_OPTIONS.map((candidate) => (
              <option key={candidate} value={candidate}>{candidate}</option>
            ))}
          </select>
          <select className="fe-panel-alt rounded-xl px-3 py-3" value={theme} onChange={(event) => setTheme(event.target.value as (typeof THEME_OPTIONS)[number])}>
            {THEME_OPTIONS.map((candidate) => (
              <option key={candidate} value={candidate}>{candidate}</option>
            ))}
          </select>
        </div>

        <label className="inline-flex items-center gap-2 text-sm fe-muted">
          <input type="checkbox" checked={soundEnabled} onChange={(event) => setSoundEnabled(event.target.checked)} />
          Sound enabled
        </label>

        <button onClick={saveProfile} className="fe-button-primary rounded-xl px-4 py-3 font-semibold">
          Save Settings
        </button>
      </section>

      <section className="fe-panel rounded-3xl p-6 space-y-4">
        <h2 className="text-lg font-semibold">Tutorial</h2>
        <p className="text-sm fe-muted">Status: {tutorialDone ? 'Completed' : 'Not completed'}</p>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              resetTutorialDone();
              setTutorialState(false);
              window.location.reload();
            }}
            className="px-4 py-2 rounded fe-panel-alt"
          >
            Replay Tutorial (reset + refresh)
          </button>

          <button
            onClick={() => {
              setTutorialDone(true);
              setTutorialState(true);
              router.refresh();
            }}
            className="px-4 py-2 rounded fe-button-primary"
          >
            Mark Tutorial Done
          </button>

          <Link href="/tutorial" className="px-4 py-2 rounded fe-panel-alt">
            Open Tutorial
          </Link>
        </div>
      </section>

      <section className="fe-panel rounded-3xl p-6 space-y-3">
        <h2 className="text-lg font-semibold">Rules And Cards</h2>
        <p className="text-sm fe-muted">Open the full game rules and card behavior reference.</p>
        <Link href="/rules" className="inline-block px-4 py-2 rounded fe-panel-alt">
          Open Rules Page
        </Link>
      </section>
    </main>
  );
}
