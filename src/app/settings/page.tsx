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
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 flex-wrap backdrop-blur-xl">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">Player Garage</h1>
          <p className="text-white/40 text-sm mt-1">Tune your identity, theme, and tutorial progression.</p>
        </div>
        <Link href="/" className="fe-holo-btn text-xs">Return Home</Link>
      </div>

      <section className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 space-y-4 backdrop-blur-lg">
        {/* AI prompt: personalized player locker with patches, helmet icon, carved wooden UI placards, cozy warm ambient light, stylized realism */}
        
        <div className="grid sm:grid-cols-2 gap-3">
          {/* AI prompt: emoji badge set on engraved metal pins, small collectible style, high detail studio lighting */}
          
          {/* AI prompt: theme swatch board made from painted wood and enamel chips, tabletop craft aesthetic */}
          
        </div>

        <h2 className="text-lg font-semibold text-white">Profile And Theme</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <input
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:border-amber-500 outline-none transition-all"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            placeholder="Player id"
          />
          <input
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:border-amber-500 outline-none transition-all"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Display name"
          />
          <select className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none transition-all" value={emoji} onChange={(event) => setEmoji(event.target.value)}>
            {EMOJI_OPTIONS.map((candidate) => (
              <option key={candidate} value={candidate} className="bg-slate-900">{candidate}</option>
            ))}
          </select>
          <select className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none transition-all" value={theme} onChange={(event) => {
            const newTheme = event.target.value as (typeof THEME_OPTIONS)[number];
            setTheme(newTheme);
            window.dispatchEvent(new CustomEvent('fe:settings-changed', {
              detail: { ...loadLocalSettings(), theme: newTheme }
            }));
          }}>
            {THEME_OPTIONS.map((candidate) => (
              <option key={candidate} value={candidate} className="bg-slate-900">{candidate}</option>
            ))}
          </select>
        </div>

        <label className="inline-flex items-center gap-3 text-sm text-white/70 mt-4 cursor-pointer">
          <input type="checkbox" className="w-5 h-5 rounded border-white/20 bg-black/50 text-amber-500 focus:ring-amber-500" checked={soundEnabled} onChange={(event) => setSoundEnabled(event.target.checked)} />
          Sound enabled
        </label>

        <div className="pt-4 border-t border-white/10 mt-6">
           <button onClick={saveProfile} className="fe-holo-btn !py-4 w-full sm:w-auto">
             Save Settings
           </button>
        </div>
      </section>

      <section className="fe-panel fe-seat-plinth rounded-3xl p-6 space-y-4">
        {/* AI prompt: tutorial checkpoint cards stacked with wax-seal stamps, progress markers, warm game room lighting */}
        

        <h2 className="text-lg font-semibold text-white">Tutorial</h2>
        <p className="text-sm text-white/50">Status: {tutorialDone ? 'Completed' : 'Not completed'}</p>

        <div className="flex flex-wrap gap-4 mt-6">
          <button
            onClick={() => {
              resetTutorialDone();
              setTutorialState(false);
              window.location.reload();
            }}
            className="fe-holo-btn text-xs"
          >
            Replay Tutorial (reset + refresh)
          </button>

          <button
            onClick={() => {
              setTutorialDone(true);
              setTutorialState(true);
              router.refresh();
            }}
            className="fe-holo-btn text-xs !text-amber-500 !border-amber-500/50"
          >
            Mark Tutorial Done
          </button>

          <Link href="/tutorial" className="fe-holo-btn text-xs !text-sky-400 !border-sky-500/50">
            Open Tutorial
          </Link>
        </div>
      </section>

      <section className="fe-panel fe-seat-plinth rounded-3xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Rules And Cards</h2>
        <p className="text-sm text-white/50">Open the full game rules and card behavior reference.</p>
        <div className="mt-4">
           <Link href="/rules" className="fe-holo-btn text-xs">
             Open Rules Page
           </Link>
        </div>
      </section>
    </main>
  );
}
