import { V2_VIRUS_CATALOG } from '../model/virusCatalog';
import type {
  ObservationDefinition,
  ObservationPresetId,
  VirusId,
} from '../observation/types';
import { ANIMAL_CATALOG } from './definitions/animals';
import { ARCHAEA_CATALOG } from './definitions/archaea';
import { EMERGING_CATALOG } from './definitions/emerging';
import { PHAGE_CATALOG } from './definitions/phages';
import { PLANT_CATALOG } from './definitions/plants';
import { HUMAN_EXPANSION_CATALOG } from './definitions/humanExpansion';

export const VIRUS_CATALOG: readonly ObservationDefinition[] = [
  ...V2_VIRUS_CATALOG,
  ...PHAGE_CATALOG,
  ...PLANT_CATALOG,
  ...ANIMAL_CATALOG,
  ...ARCHAEA_CATALOG,
  ...EMERGING_CATALOG,
  ...HUMAN_EXPANSION_CATALOG,
] as const;

const BY_ID = new Map(VIRUS_CATALOG.map((entry) => [entry.id, entry]));

export function getCatalogEntry(id: ObservationPresetId): ObservationDefinition {
  return BY_ID.get(id) ?? VIRUS_CATALOG[0]!;
}

export function isVirusId(id: string): id is VirusId {
  return BY_ID.has(id);
}
