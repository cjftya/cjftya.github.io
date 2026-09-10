import { getCatalogEntry, isVirusId } from '../registry';
import { createGenericExplanation } from './common';
import { FAMILY_STRUCTURE_EXPLANATIONS } from './families';
import { REPRESENTATIVE_STRUCTURE_EXPLANATIONS } from './representative';
import type {
  StructureExplanation,
  StructureExplanationContent,
  StructureExplanationTarget,
} from './types';

export { REPRESENTATIVE_VIRUS_IDS } from './representative';
export type {
  StructureExplanation,
  StructureExplanationEvidence,
  StructureExplanationTarget,
} from './types';

const entryExplanations = new Map<string, StructureExplanationContent>();
const familyExplanations = new Map<string, StructureExplanationContent>();

for (const registration of REPRESENTATIVE_STRUCTURE_EXPLANATIONS) {
  for (const target of registration.targets) {
    addUnique(
      entryExplanations,
      entryKey(registration.virusId, target),
      registration.explanation,
    );
  }
}

for (const registration of FAMILY_STRUCTURE_EXPLANATIONS) {
  for (const target of registration.targets) {
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
