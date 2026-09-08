import type {
  ObservationDefinition,
  ObservationPartId,
  TourStop,
} from '../observation/types';

type DerivedKeys =
  | 'identityKey'
  | 'aliases'
  | 'evidenceStatus'
  | 'representation'
  | 'motionProfileId'
  | 'localMotion'
  | 'tourStops';

export type CatalogEntryInput = Omit<ObservationDefinition, DerivedKeys> & {
  readonly aliases?: readonly string[];
  readonly motionProfileId?: 'active' | 'calm';
  readonly localMotion?: ObservationDefinition['localMotion'];
  readonly tourParts: readonly [
    ObservationPartId,
    ObservationPartId,
    ...ObservationPartId[],
  ];
};

export function defineVirus(input: CatalogEntryInput): ObservationDefinition {
  const {
    aliases = [],
    motionProfileId = 'active',
    localMotion = 'none',
    tourParts,
    ...entry
  } = input;
  const views = ['surface', 'section', 'exploded'] as const;
  const tourStops: TourStop[] = tourParts.map((partId, index) => ({
    partId,
    label:
      index === 0
        ? `${entry.shortName}의 ${entry.feature}`
        : index === 1
          ? `${entry.shortName}의 내부 층`
          : `${entry.shortName}의 분리된 구조`,
    view: views[Math.min(index, views.length - 1)] ?? 'surface',
    genomeVisible: index > 0,
  }));
  return {
    ...entry,
    identityKey: entry.id,
    aliases: [entry.shortName, entry.nameEn, ...aliases],
    evidenceStatus: 'verified',
    representation: 'source-informed-procedural',
    motionProfileId,
    localMotion,
    tourStops,
  };
}

export function layer(
  id: ObservationDefinition['layers'][number]['id'],
  name: string,
  note?: string,
): ObservationDefinition['layers'][number] {
  return { id, name, note };
}
