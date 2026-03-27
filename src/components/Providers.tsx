'use client';

import { useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';
import { THEME_PRESETS } from '@/lib/gameConfig';
import { loadLocalSettings, type LocalUserSettings } from '@/lib/localProfile';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const applyTheme = (settings?: LocalUserSettings) => {
      const next = settings ?? loadLocalSettings();
      const preset = THEME_PRESETS[next.theme];
      const root = document.documentElement;
      root.dataset.theme = next.theme;
      root.style.setProperty('--bg', preset.bg);
      root.style.setProperty('--fg', preset.fg);
      root.style.setProperty('--panel', preset.panel);
      root.style.setProperty('--panel-alt', preset.panelAlt);
      root.style.setProperty('--border', preset.border);
      root.style.setProperty('--accent', preset.accent);
      root.style.setProperty('--accent-soft', preset.accentSoft);
      root.style.setProperty('--muted', preset.muted);
    };

    applyTheme();

    const onSettingsChanged = (event: Event) => {
      applyTheme((event as CustomEvent<LocalUserSettings>).detail);
    };

    const onStorage = () => {
      applyTheme();
    };

    window.addEventListener('fe:settings-changed', onSettingsChanged as EventListener);
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('fe:settings-changed', onSettingsChanged as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return <SessionProvider>{children}</SessionProvider>;
}
