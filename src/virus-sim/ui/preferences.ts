import type { DecorationLevel } from '../observation/types';

export type FontScale = '100' | '115' | '130';

const FONT_SCALE_KEY = 'virus-sim-v2.5-font-scale';
const SETTINGS_KEY = 'virus-sim-v3.5-settings';
const LEGACY_KEYS = [
  'virus-sim:lab-config:v1',
  'virus-sim-v2.5-favorites',
  'virus-sim-v2.5-recent',
] as const;

export interface VirusSimPreferences {
  readonly version: 1;
  readonly decorationLevel: DecorationLevel;
  readonly decorationPaused: boolean;
}

export function loadFontScale(storage: Storage): FontScale {
  const value = read(storage, FONT_SCALE_KEY);
  return value === '115' || value === '130' ? value : '100';
}

export function saveFontScale(storage: Storage, value: FontScale): void {
  write(storage, FONT_SCALE_KEY, value);
}

export function loadVirusSimPreferences(
  storage: Storage,
  reducedMotion: boolean,
): VirusSimPreferences {
  const fallback: VirusSimPreferences = {
    version: 1,
    decorationLevel: 'subtle',
    decorationPaused: reducedMotion,
  };
  try {
    const value: unknown = JSON.parse(storage.getItem(SETTINGS_KEY) ?? 'null');
    if (!value || typeof value !== 'object') return fallback;
    const candidate = value as Record<string, unknown>;
    return {
      version: 1,
      decorationLevel: candidate.decorationLevel === 'off' ? 'off' : 'subtle',
      decorationPaused:
        typeof candidate.decorationPaused === 'boolean'
          ? candidate.decorationPaused
          : reducedMotion,
    };
  } catch {
    return fallback;
  }
}

export function saveVirusSimPreferences(
  storage: Storage,
  preferences: VirusSimPreferences,
): void {
  write(storage, SETTINGS_KEY, JSON.stringify(preferences));
}

export function removeLegacyVirusSimStorage(storage: Storage): void {
  for (const key of LEGACY_KEYS) {
    try {
      storage.removeItem(key);
    } catch {
      // Storage access must never prevent the viewer from starting.
    }
  }
}

function read(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function write(storage: Storage, key: string, value: string): void {
  try {
    storage.setItem(key, value);
  } catch {
    // Private browsing or a full quota must not block the viewer.
  }
}
