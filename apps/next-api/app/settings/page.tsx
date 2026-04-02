'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EMOJI_OPTIONS, THEME_OPTIONS, THEME_PRESETS } from '@/lib/gameConfig';
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
          <div className="sm:col-span-2 space-y-3">
            <label className="text-[10px] uppercase font-black text-white/20 ml-1">Interface Theme</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {THEME_OPTIONS.map((candidate) => {
                const preset = THEME_PRESETS[candidate];
                const isActive = theme === candidate;
                return (
                  <button
                    key={candidate}
                    onClick={() => {
                      setTheme(candidate);
                      window.dispatchEvent(new CustomEvent('fe:settings-changed', {
                        detail: { ...loadLocalSettings(), theme: candidate }
                      }));
                    }}
                    className={`group relative flex flex-col items-center p-3 rounded-2xl border transition-all duration-300 ${isActive ? 'border-sky-400 bg-sky-400/10 scale-105 shadow-[0_0_20px_rgba(56,189,248,0.2)]' : 'border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10'}`}
                  >
                    <div
                      className="w-full aspect-square rounded-xl mb-2 flex items-center justify-center relative overflow-hidden"
                      style={{ backgroundColor: preset.bg }}
                    >
                      {/* Mini Card Representation */}
                      <div
                        className="w-8 h-10 rounded border border-white/20"
                        style={{ backgroundColor: preset.panelAlt, borderRadius: preset.radius === '0px' ? '0px' : '4px' }}
                      >
                        <div className="w-full h-1" style={{ backgroundColor: preset.accent, opacity: 0.5 }} />
                        <div className="p-1 space-y-1">
                          <div className="h-0.5 w-4 bg-white/10" />
                          <div className="h-0.5 w-3 bg-white/10" />
                        </div>
                      </div>

                      {/* Color Swatches */}
                      <div className="absolute bottom-1 right-1 flex gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: preset.accent }} />
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: preset.accentSoft }} />
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-black uppercase tracking-widest text-center leading-none ${isActive ? 'text-sky-400' : 'text-white/40 group-hover:text-white'}`}
                      style={{ fontFamily: preset.fontDisplay }}
                    >
                      {candidate}
                    </span>

                    {isActive && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-sky-400 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-2.5 h-2.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
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

      <section className="fe-panel fe-seat-plinth rounded-[2rem] md:rounded-3xl p-6 space-y-4 border-sky-500/20 bg-sky-400/[0.02]">
        <div className="flex items-center justify-between">
           <h2 className="text-lg font-semibold text-white">Sector Status</h2>
           <div className="fe-hologram text-sky-400 text-[10px] uppercase font-black px-2 py-1 border border-sky-400/30 rounded-md">Priority_Signal</div>
        </div>
        <p className="text-sm text-white/50">Current Authentication: {loadLocalSettings().adFree ? <span className="text-sky-400 font-bold uppercase tracking-widest">SECTOR_PASS_ACTIVE</span> : <span className="text-white/30 uppercase tracking-widest">STANDARD_RECRUIT</span>}</p>

        <div className="mt-4">
           <Link href="/store" className="fe-holo-btn !py-4 w-full sm:w-auto text-center !text-sky-400 !border-sky-500/50">
             {loadLocalSettings().adFree ? 'Manage Subscription' : 'Upgrade to Sector Pass'}
           </Link>
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
