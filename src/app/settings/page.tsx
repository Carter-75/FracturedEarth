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
    <main className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto space-y-6 overflow-y-auto">
      <div className="bg-white/5 border border-white/10 rounded-[2rem] md:rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 flex-wrap backdrop-blur-xl">
        <div>
          <h1 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-white">Player Garage</h1>
          <p className="text-white/40 text-xs mt-1">Tune your identity, theme, and tutorial progression.</p>
        </div>
        <Link href="/" className="fe-holo-btn text-xs w-full sm:w-auto text-center">Return Home</Link>
      </div>

      <section className="bg-white/[0.03] border border-white/5 rounded-[2rem] md:rounded-3xl p-6 space-y-4 backdrop-blur-lg">
        <h2 className="text-lg font-semibold text-white">Profile And Theme</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-black text-white/20 ml-1">Player Identifier</label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:border-amber-500 outline-none transition-all"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder="Player id"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-black text-white/20 ml-1">Display Name</label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:border-amber-500 outline-none transition-all"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Display name"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-black text-white/20 ml-1">Avatar Signal</label>
            <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none transition-all" value={emoji} onChange={(event) => setEmoji(event.target.value)}>
              {EMOJI_OPTIONS.map((candidate) => (
                <option key={candidate} value={candidate} className="bg-slate-900">{candidate}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-black text-white/20 ml-1">Interface Theme</label>
            <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none transition-all" value={theme} onChange={(event) => {
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
        </div>

        <label className="inline-flex items-center gap-3 text-sm text-white/70 mt-6 cursor-pointer hover:text-white transition-colors">
          <input type="checkbox" className="w-5 h-5 rounded border-white/20 bg-black/50 text-amber-500 focus:ring-amber-500" checked={soundEnabled} onChange={(event) => setSoundEnabled(event.target.checked)} />
          Neural Audio Uplink Enabled
        </label>

        <div className="pt-6 border-t border-white/10 mt-6">
           <button onClick={saveProfile} className="fe-holo-btn !py-4 w-full sm:w-auto !text-amber-500 !border-amber-500/50">
             Save Calibration
           </button>
        </div>
      </section>

      <section className="fe-panel fe-seat-plinth rounded-[2rem] md:rounded-3xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Tactical Training</h2>
        <p className="text-sm text-white/50">Neural Status: {tutorialDone ? <span className="text-sky-400 font-bold uppercase tracking-widest">CERTIFIED</span> : <span className="text-amber-500 font-bold uppercase tracking-widest">UNCERTIFIED</span>}</p>

        <div className="flex flex-col sm:flex-row flex-wrap gap-4 mt-6">
          <button
            onClick={() => {
              resetTutorialDone();
              setTutorialState(false);
              window.location.reload();
            }}
            className="fe-holo-btn text-xs flex-1 sm:flex-none text-center"
          >
            Reset Neural Path
          </button>

          <button
            onClick={() => {
              setTutorialDone(true);
              setTutorialState(true);
              router.refresh();
            }}
            className="fe-holo-btn text-xs flex-1 sm:flex-none text-center !text-amber-500 !border-amber-500/50"
          >
            Force Certification
          </button>

          <Link href="/tutorial" className="fe-holo-btn text-xs flex-1 sm:flex-none text-center !text-sky-400 !border-sky-500/50">
            Initialize Training
          </Link>
        </div>
      </section>

      <section className="fe-panel fe-seat-plinth rounded-[2rem] md:rounded-3xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Rules And Intel</h2>
        <p className="text-sm text-white/50">Open the full game rules and card behavior reference.</p>
        <div className="mt-4">
           <Link href="/rules" className="fe-holo-btn text-xs w-full sm:w-auto text-center">
             Open NeuralAtlas
           </Link>
        </div>
      </section>
    </main>
  );
}
