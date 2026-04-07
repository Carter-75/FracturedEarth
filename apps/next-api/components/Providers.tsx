'use client';

import { useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';
import { THEME_PRESETS } from '@/lib/gameConfig';
import { loadLocalSettings, type LocalUserSettings } from '@/lib/localProfile';
import { initializeNativeBridge } from '@/lib/nativeBridge';
import { initializeNeuralLogging, addLog } from '@/lib/logDiagnostics';
import NeuralDiagnostics from '@/components/NeuralDiagnostics';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initializeNeuralLogging();
    const applyTheme = (settings?: LocalUserSettings) => {
      const next = settings ?? loadLocalSettings();
      const preset = THEME_PRESETS[next.theme];
      const root = document.documentElement;
      root.dataset.theme = next.theme;

      // Hex to RGB helper
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
          ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
          : '245, 158, 11'; // Default Amber
      };

      // Apply all tokens from the preset
      for (const [key, value] of Object.entries(preset)) {
        const cssKey = `--${key.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase()}`;
        root.style.setProperty(cssKey, value as string);
      }

      root.style.setProperty('--accent-rgb', hexToRgb(preset.accent));
      
      if (next.theme === 'Pale Signal') {
        root.style.setProperty('color-scheme', 'light');
      } else {
        root.style.setProperty('color-scheme', 'dark');
      }
    };

    applyTheme();
    addLog('info', `Initializing Neural_Link Identity: ${loadLocalSettings().userId}`);

    const onSettingsChanged = (event: Event) => {
      applyTheme((event as CustomEvent<LocalUserSettings>).detail);
    };

    const onStorage = () => {
      applyTheme();
    };

    window.addEventListener('fe:settings-changed', onSettingsChanged as EventListener);
    window.addEventListener('storage', onStorage);

    // Initialize Native Bridge for Capacitor
    initializeNativeBridge();

    return () => {
      window.removeEventListener('fe:settings-changed', onSettingsChanged as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return (
    <SessionProvider>
      {children}
      <NeuralDiagnostics />
    </SessionProvider>
  );
}
