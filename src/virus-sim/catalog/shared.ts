import type { ObservationDefinition } from '../observation/types';

type DerivedKeys = 'identityKey' | 'aliases' | 'evidenceStatus' | 'representation';

export type CatalogEntryInput = Omit<ObservationDefinition, DerivedKeys> & {
  readonly aliases?: readonly string[];
  readonly evidenceStatus: ObservationDefinition['evidenceStatus'];
  readonly representation?: ObservationDefinition['representation'];
};

export function defineVirus(input: CatalogEntryInput): ObservationDefinition {
  const {
    aliases = [],
    evidenceStatus,
    representation = 'source-informed-procedural',
    ...entry
  } = input;
  return {
    ...entry,
    identityKey: entry.id,
    aliases: [entry.shortName, entry.nameEn, ...aliases],
    evidenceStatus,
    representation,
  };
}

export function layer(
  id: ObservationDefinition['layers'][number]['id'],
  name: string,
  note?: string,
): ObservationDefinition['layers'][number] {
  return { id, name, note };
}
