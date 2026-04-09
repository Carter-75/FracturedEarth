import { isThemeName, type ThemeName } from '@/lib/gameConfig';

export interface LocalUserSettings {
  userId: string;
  displayName: string;
  emoji: string;
  theme: ThemeName;
  soundEnabled: boolean;
  adFree?: boolean;
  roomPin?: LocalRoomPin | null;
}

export interface LocalMatchOutcome {
  id: string;
  roomCode: string;
  playedAtEpochMs: number;
  winnerUserId: string;
  winnerDisplayName: string;
  participants: Array<{ userId: string; displayName: string; emoji: string }>;
  didWin: boolean;
}

export interface LocalRoomPin {
  code: string;
  userId: string;
  displayName: string;
  emoji: string;
  savedAtEpochMs: number;
  expiresAtEpochMs: number;
}

const SETTINGS_KEY = 'fe:user-settings:v1';
const HISTORY_KEY = 'fe:match-history:v1';
const ROOM_PIN_KEY = 'fe:room-pin:v1';
const TUTORIAL_DONE_KEY = 'fe:tutorial-done:v1';

const generateGuestId = () => {
  if (typeof window === 'undefined') return 'guest_ssr_placeholder';
  return `guest_${Math.random().toString(36).substring(2, 11)}`;
};

const defaultSettings: LocalUserSettings = {
  userId: 'guest_pending',
  displayName: 'Guest Player',
  emoji: '🌍',
  theme: 'Obsidian',
  soundEnabled: true,
};

export function loadLocalSettings(): LocalUserSettings {
  if (typeof window === 'undefined') return defaultSettings;
  const raw = window.localStorage.getItem(SETTINGS_KEY);
  
  if (!raw) {
    const updated = { ...defaultSettings, userId: generateGuestId() };
    saveLocalSettings(updated);
    return updated;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<LocalUserSettings>;
    let userId = (parsed.userId || '').trim();
    
    // 🔥 AUDIT FIX: Eliminate the "web_player" collision vector once and for all.
    // Any legacy user with the generic ID is force-migrated to a new unique guest entry.
    if (!userId || userId === 'web_player') {
      userId = generateGuestId();
      const updated = {
        ...defaultSettings,
        userId,
        displayName: 'Guest Player'
      };
      saveLocalSettings(updated);
      return updated;
    }

    return {
      userId,
      displayName: (parsed.displayName || defaultSettings.displayName).trim(),
      emoji: (parsed.emoji || defaultSettings.emoji).trim(),
      theme: isThemeName(String(parsed.theme ?? '').trim())
        ? String(parsed.theme).trim() as ThemeName
        : defaultSettings.theme,
      soundEnabled: parsed.soundEnabled ?? defaultSettings.soundEnabled,
      adFree: parsed.adFree ?? false,
    };
  } catch {
    return defaultSettings;
  }
}

export function saveLocalSettings(next: LocalUserSettings): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('fe:settings-changed', { detail: next }));
}

export function loadMatchHistory(): LocalMatchOutcome[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(HISTORY_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as LocalMatchOutcome[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function appendMatchOutcome(outcome: LocalMatchOutcome): void {
  if (typeof window === 'undefined') return;
  const current = loadMatchHistory();
  const deduped = current.filter((x) => x.id !== outcome.id);
  deduped.unshift(outcome);
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(deduped.slice(0, 100)));
}

export function loadRoomPin(): LocalRoomPin | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(ROOM_PIN_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<LocalRoomPin>;
    if (!parsed.code || !parsed.userId || !parsed.expiresAtEpochMs) return null;
    const now = Date.now();
    if (Number(parsed.expiresAtEpochMs) <= now) {
      clearRoomPin();
      return null;
    }
    return {
      code: String(parsed.code).trim().toUpperCase(),
      userId: String(parsed.userId).trim(),
      displayName: String(parsed.displayName ?? ''),
      emoji: String(parsed.emoji ?? '🌍'),
      savedAtEpochMs: Number(parsed.savedAtEpochMs ?? now),
      expiresAtEpochMs: Number(parsed.expiresAtEpochMs),
    };
  } catch {
    clearRoomPin();
    return null;
  }
}

export function saveRoomPin(input: {
  code: string;
  userId: string;
  displayName: string;
  emoji: string;
  ttlMs?: number;
}): void {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  // Standardize on 1 minute for all resumes
  const ttlMs = input.ttlMs ?? 60_000;
  const value: LocalRoomPin = {
    code: input.code.trim().toUpperCase(),
    userId: input.userId.trim(),
    displayName: input.displayName,
    emoji: input.emoji,
    savedAtEpochMs: now,
    expiresAtEpochMs: now + ttlMs,
  };
  window.localStorage.setItem(ROOM_PIN_KEY, JSON.stringify(value));
}

export function clearRoomPin(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ROOM_PIN_KEY);
}

export function isTutorialDone(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(TUTORIAL_DONE_KEY) === '1';
}

export function setTutorialDone(done: boolean): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TUTORIAL_DONE_KEY, done ? '1' : '0');
}

export function resetTutorialDone(): void {
  setTutorialDone(false);
}
