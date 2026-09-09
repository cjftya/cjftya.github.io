import { V2_VIRUS_CATALOG } from '../model/virusCatalog';
import type {
  CatalogTag,
  ObservationDefinition,
  ObservationPresetId,
  VirusId,
} from '../observation/types';
import { ANIMAL_CATALOG } from './definitions/animals';
import { ARCHAEA_CATALOG } from './definitions/archaea';
import { EMERGING_CATALOG } from './definitions/emerging';
import { PHAGE_CATALOG } from './definitions/phages';
import { PLANT_CATALOG } from './definitions/plants';

export const VIRUS_CATALOG: readonly ObservationDefinition[] = [
  ...V2_VIRUS_CATALOG,
  ...PHAGE_CATALOG,
  ...PLANT_CATALOG,
  ...ANIMAL_CATALOG,
  ...ARCHAEA_CATALOG,
  ...EMERGING_CATALOG,
] as const;

export const OBSERVED_VIRUS_COUNT = VIRUS_CATALOG.filter(
  (entry) => entry.evidenceStatus === 'observed',
).length;

const BY_ID = new Map(VIRUS_CATALOG.map((entry) => [entry.id, entry]));

export function getCatalogEntry(id: ObservationPresetId): ObservationDefinition {
  return BY_ID.get(id) ?? VIRUS_CATALOG[0]!;
}

export function isVirusId(id: string): id is VirusId {
  return BY_ID.has(id);
}

export function filterVirusCatalog(
  query: string,
  tag: CatalogTag | 'all',
  ids?: ReadonlySet<string>,
): readonly ObservationDefinition[] {
  const normalized = query.trim().toLocaleLowerCase('ko-KR');
  return VIRUS_CATALOG.filter((entry) => {
    if (ids && !ids.has(entry.id)) return false;
    if (tag !== 'all' && !entry.morphologyTags.includes(tag)) return false;
    if (!normalized) return true;
    return [
      entry.name,
      entry.shortName,
      entry.nameEn,
      ...entry.aliases,
      entry.category,
      entry.description,
      entry.genomeLabel,
      entry.feature,
    ]
      .join(' ')
      .toLocaleLowerCase('ko-KR')
      .includes(normalized);
  });
}

export function nextDiscovery(
  currentId: string,
  recentIds: readonly string[],
): ObservationDefinition {
  const current = getCatalogEntry(currentId);
  const recent = new Set(recentIds.slice(0, 8));
  const differentFamily = VIRUS_CATALOG.filter(
    (entry) =>
      entry.id !== current.id &&
      !recent.has(entry.id) &&
      entry.modelBuilder !== current.modelBuilder,
  );
  const pool = differentFamily.length > 0 ? differentFamily : VIRUS_CATALOG;
  const index =
    Math.abs(hashString(`${currentId}:${recentIds.join(':')}`)) % pool.length;
  return pool[index] ?? VIRUS_CATALOG[0]!;
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
