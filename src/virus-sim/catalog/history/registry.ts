import { VIRUS_CATALOG } from '../registry';
import { ANIMAL_HISTORY } from './animal';
import { ARCHAEA_HISTORY } from './archaea';
import { HUMAN_HISTORY } from './human';
import { PHAGE_HISTORY } from './phage';
import { PLANT_HISTORY } from './plant';
import type { VirusHistoryImpact } from './types';

export const VIRUS_HISTORY: readonly VirusHistoryImpact[] = [
  ...HUMAN_HISTORY,
  ...ANIMAL_HISTORY,
  ...PLANT_HISTORY,
  ...PHAGE_HISTORY,
  ...ARCHAEA_HISTORY,
];

const HISTORY_BY_ID = new Map(VIRUS_HISTORY.map((entry) => [entry.virusId, entry]));

export function getVirusHistory(virusId: string): VirusHistoryImpact {
  const entry = HISTORY_BY_ID.get(virusId);
  if (entry) return entry;
  const fallback = VIRUS_HISTORY[0];
  if (!fallback) throw new Error('Virus history registry is empty');
  return fallback;
}

export function getMissingHistoryIds(): readonly string[] {
  return VIRUS_CATALOG.filter((entry) => !HISTORY_BY_ID.has(entry.id)).map(
    (entry) => entry.id,
  );
}
