import { isVirusId } from '../catalog/registry';

export type CatalogCollection = 'all' | 'favorites' | 'recent';
export type FontScale = '100' | '115' | '130';

const FAVORITES_KEY = 'virus-sim-v2.5-favorites';
const RECENT_KEY = 'virus-sim-v2.5-recent';
const FONT_SCALE_KEY = 'virus-sim-v2.5-font-scale';

export function loadFavorites(storage: Storage): Set<string> {
  return new Set(loadIds(storage, FAVORITES_KEY));
}

export function saveFavorites(storage: Storage, ids: ReadonlySet<string>): void {
  write(storage, FAVORITES_KEY, JSON.stringify([...ids].filter(isVirusId)));
}

export function loadRecent(storage: Storage): string[] {
  return [...new Set(loadIds(storage, RECENT_KEY))].slice(0, 12);
}

export function pushRecent(
  storage: Storage,
  current: readonly string[],
  id: string,
): string[] {
  const next = [id, ...current.filter((candidate) => candidate !== id)]
    .filter(isVirusId)
    .slice(0, 12);
  write(storage, RECENT_KEY, JSON.stringify(next));
  return next;
}

export function loadFontScale(storage: Storage): FontScale {
  const value = read(storage, FONT_SCALE_KEY);
  return value === '115' || value === '130' ? value : '100';
}

export function saveFontScale(storage: Storage, value: FontScale): void {
  write(storage, FONT_SCALE_KEY, value);
}

function loadIds(storage: Storage, key: string): string[] {
  try {
    const value: unknown = JSON.parse(storage.getItem(key) ?? '[]');
    return Array.isArray(value)
      ? value.filter(
          (item): item is string => typeof item === 'string' && isVirusId(item),
        )
      : [];
  } catch {
    return [];
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
    // Private browsing or a full quota must not block the observatory.
  }
}
