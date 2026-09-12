import { getCatalogEntry, isVirusId, VIRUS_CATALOG } from '../registry';
import { getStructureSource } from '../sources';
import {
  FULL_CATALOG_PROFILE_IDS,
  FULL_CATALOG_STRUCTURE_EXPLANATIONS,
  TARGETED_ENTRY_OVERRIDE_IDS,
  TARGETED_ENTRY_STRUCTURE_EXPLANATIONS,
} from './catalogEntries';
import { createGenericExplanation } from './common';
import { FAMILY_STRUCTURE_EXPLANATIONS } from './families';
import {
  REPRESENTATIVE_STRUCTURE_EXPLANATIONS,
  REPRESENTATIVE_VIRUS_IDS,
} from './representative';
import type {
  StructureExplanation,
  StructureExplanationContent,
  StructureExplanationTarget,
} from './types';

export { REPRESENTATIVE_VIRUS_IDS } from './representative';
export { FULL_CATALOG_PROFILE_IDS } from './catalogEntries';
export type {
  StructureExplanation,
  StructureExplanationEvidence,
  StructureExplanationTarget,
} from './types';

const entryExplanations = new Map<string, StructureExplanationContent>();
const familyExplanations = new Map<string, StructureExplanationContent>();

for (const registration of [
  ...REPRESENTATIVE_STRUCTURE_EXPLANATIONS,
  ...FULL_CATALOG_STRUCTURE_EXPLANATIONS,
  ...TARGETED_ENTRY_STRUCTURE_EXPLANATIONS,
]) {
  if (!isVirusId(registration.virusId)) {
    throw new Error(`Unknown virus explanation registration: ${registration.virusId}`);
  }
  const definition = getCatalogEntry(registration.virusId);
  validateSources(registration.explanation, `entry:${registration.virusId}`);
  for (const target of registration.targets) {
    if (!isAvailable(definition, target)) {
      throw new Error(
        `Orphan structure explanation: ${entryKey(registration.virusId, target)}`,
      );
    }
    addUnique(
      entryExplanations,
      entryKey(registration.virusId, target),
      registration.explanation,
    );
  }
}

for (const registration of FAMILY_STRUCTURE_EXPLANATIONS) {
  validateSources(registration.explanation, `family:${registration.modelBuilder}`);
  for (const target of registration.targets) {
    const hasCatalogTarget = VIRUS_CATALOG.some(
      (definition) =>
        definition.modelBuilder === registration.modelBuilder &&
        isAvailable(definition, target),
    );
    if (!hasCatalogTarget) {
      throw new Error(
        `Orphan family structure explanation: ${familyKey(registration.modelBuilder, target)}`,
      );
    }
    addUnique(
      familyExplanations,
      familyKey(registration.modelBuilder, target),
      registration.explanation,
    );
  }
}

export const STRUCTURE_EXPLANATION_KEYS = [
  ...entryExplanations.keys(),
  ...familyExplanations.keys(),
] as const;

export const STRUCTURE_EXPLANATION_ENTRY_IDS = [
  ...REPRESENTATIVE_VIRUS_IDS,
  ...FULL_CATALOG_PROFILE_IDS,
  ...TARGETED_ENTRY_OVERRIDE_IDS,
] as const;

export function getStructureExplanation(
  virusId: string,
  target: StructureExplanationTarget,
): StructureExplanation | null {
  if (!isVirusId(virusId)) return null;
  const definition = getCatalogEntry(virusId);
  if (!isAvailable(definition, target)) return null;

  const entryExplanation = entryExplanations.get(entryKey(virusId, target));
  if (entryExplanation) return { ...entryExplanation, scope: 'entry' };

  const familyExplanation = familyExplanations.get(
    familyKey(definition.modelBuilder, target),
  );
  if (familyExplanation) return { ...familyExplanation, scope: 'family' };

  return createGenericExplanation(definition, target);
}

function isAvailable(
  definition: ReturnType<typeof getCatalogEntry>,
  target: StructureExplanationTarget,
): boolean {
  if (target.kind === 'part') return definition.parts.includes(target.id);
  if (target.kind === 'layer') {
    return definition.layers.some((layer) => layer.id === target.id);
  }
  return false;
}

function entryKey(virusId: string, target: StructureExplanationTarget): string {
  return `entry:${virusId}:${targetKey(target)}`;
}

function familyKey(modelBuilder: string, target: StructureExplanationTarget): string {
  return `family:${modelBuilder}:${targetKey(target)}`;
}

function targetKey(target: StructureExplanationTarget): string {
  return `${target.kind}:${target.id}`;
}

function addUnique(
  registry: Map<string, StructureExplanationContent>,
  key: string,
  explanation: StructureExplanationContent,
): void {
  if (registry.has(key)) throw new Error(`Duplicate structure explanation: ${key}`);
  registry.set(key, explanation);
}

function validateSources(
  explanation: StructureExplanationContent,
  scope: string,
): void {
  if (explanation.sourceIds.length === 0) {
    throw new Error(`Structure explanation has no source: ${scope}`);
  }
  for (const sourceId of explanation.sourceIds) {
    if (!getStructureSource(sourceId)) {
      throw new Error(`Unknown structure source ${sourceId}: ${scope}`);
    }
  }
}
