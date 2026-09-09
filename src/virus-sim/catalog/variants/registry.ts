import type { SpecimenVariant, StructureChange } from '../types';

export const SPECIMEN_VARIANTS: readonly SpecimenVariant[] = [
  {
    id: 'ebov-mayinga-1976',
    parentVirusId: 'ebola-virus',
    label: 'Mayinga 1976 기준 표본',
    kind: 'isolate',
    referenceLabel: 'EBOV/Mayinga/1976',
    sourceIds: ['ictv-orthoebolavirus'],
    changeIds: ['ebov-gp-a82v'],
  },
  {
    id: 'ebov-makona-c15',
    parentVirusId: 'ebola-virus',
    label: 'Makona C15 대표 표본',
    kind: 'isolate',
    referenceLabel: 'EBOV/Makona-C15',
    sourceIds: ['ebola-makona-a82v'],
    changeIds: ['ebov-gp-a82v'],
  },
  {
    id: 'hiv1-m-b',
    parentVirusId: 'hiv-1',
    label: 'HIV-1 group M subtype B',
    kind: 'subtype',
    referenceLabel: 'Group M · subtype B',
    sourceIds: ['hiv-env-diversity'],
    changeIds: ['hiv1-env-v3'],
  },
  {
    id: 'hiv1-m-c',
    parentVirusId: 'hiv-1',
    label: 'HIV-1 group M subtype C',
    kind: 'subtype',
    referenceLabel: 'Group M · subtype C',
    sourceIds: ['hiv-env-diversity'],
    changeIds: ['hiv1-env-v3'],
  },
  {
    id: 'hiv2-group-a',
    parentVirusId: 'hiv-2',
    label: 'HIV-2 group A',
    kind: 'subtype',
    referenceLabel: 'HIV-2 group A',
    sourceIds: ['nih-hiv2'],
    changeIds: [],
  },
  {
    id: 'hiv2-group-b',
    parentVirusId: 'hiv-2',
    label: 'HIV-2 group B',
    kind: 'subtype',
    referenceLabel: 'HIV-2 group B',
    sourceIds: ['nih-hiv2'],
    changeIds: [],
  },
  {
    id: 'sars2-reference',
    parentVirusId: 'sars-cov-2',
    label: '초기 기준 표본',
    kind: 'isolate',
    referenceLabel: 'Wuhan-Hu-1 reference',
    sourceIds: ['who-sars-variants'],
    changeIds: [],
  },
  {
    id: 'sars2-alpha',
    parentVirusId: 'sars-cov-2',
    label: 'Alpha',
    kind: 'lineage',
    referenceLabel: 'B.1.1.7',
    sourceIds: ['who-sars-variants'],
    changeIds: [],
  },
  {
    id: 'sars2-beta',
    parentVirusId: 'sars-cov-2',
    label: 'Beta',
    kind: 'lineage',
    referenceLabel: 'B.1.351',
    sourceIds: ['who-sars-variants'],
    changeIds: [],
  },
  {
    id: 'sars2-gamma',
    parentVirusId: 'sars-cov-2',
    label: 'Gamma',
    kind: 'lineage',
    referenceLabel: 'P.1',
    sourceIds: ['who-sars-variants'],
    changeIds: [],
  },
  {
    id: 'sars2-delta',
    parentVirusId: 'sars-cov-2',
    label: 'Delta',
    kind: 'lineage',
    referenceLabel: 'B.1.617.2',
    sourceIds: ['who-sars-variants', 'pdb-7tov'],
    changeIds: ['sars2-spike-rbd'],
  },
  {
    id: 'sars2-ba1',
    parentVirusId: 'sars-cov-2',
    label: 'Omicron BA.1',
    kind: 'lineage',
    referenceLabel: 'BA.1',
    sourceIds: ['who-sars-variants', 'pdb-7t9j'],
    changeIds: ['sars2-spike-rbd'],
  },
  {
    id: 'sars2-ba2',
    parentVirusId: 'sars-cov-2',
    label: 'Omicron BA.2',
    kind: 'lineage',
    referenceLabel: 'BA.2',
    sourceIds: ['who-sars-variants'],
    changeIds: [],
  },
  {
    id: 'sars2-ba5',
    parentVirusId: 'sars-cov-2',
    label: 'Omicron BA.5',
    kind: 'lineage',
    referenceLabel: 'BA.5',
    sourceIds: ['who-sars-variants'],
    changeIds: [],
  },
  {
    id: 'sars2-xbb15',
    parentVirusId: 'sars-cov-2',
    label: 'XBB.1.5',
    kind: 'lineage',
    referenceLabel: 'XBB.1.5',
    sourceIds: ['who-sars-variants'],
    changeIds: [],
  },
  {
    id: 'sars2-jn1',
    parentVirusId: 'sars-cov-2',
    label: 'JN.1',
    kind: 'lineage',
    referenceLabel: 'JN.1',
    sourceIds: ['who-sars-variants'],
    changeIds: [],
  },
] as const;

export const STRUCTURE_CHANGES: readonly StructureChange[] = [
  {
    id: 'ebov-gp-a82v',
    comparisonPairId: 'ebov-mayinga-1976::ebov-makona-c15',
    partId: 'spike',
    regionId: 'GP receptor-binding region',
    precision: 'region',
    evidence: 'observed',
    sourceIds: ['ebola-makona-a82v'],
    note: 'Makona 계열에서 연구된 GP A82V 위치를 표면 당단백질 영역 수준으로 표시해요. 절차 입자 표면의 점을 잔기 좌표라고 주장하지 않아요.',
  },
  {
    id: 'hiv1-env-v3',
    comparisonPairId: 'hiv1-m-b::hiv1-m-c',
    partId: 'spike',
    regionId: 'Env gp120 V3 region',
    precision: 'region',
    evidence: 'observed',
    sourceIds: ['hiv-env-diversity'],
    note: '아형 B/C의 Env 다양성을 V3 영역 수준으로 안내해요. 전체 성숙 입자의 외형 차이로 확대하지 않아요.',
  },
  {
    id: 'sars2-spike-rbd',
    comparisonPairId: 'sars2-delta::sars2-ba1',
    partId: 'spike',
    regionId: 'Spike receptor-binding domain',
    precision: 'region',
    evidence: 'observed',
    sourceIds: ['pdb-7tov', 'pdb-7t9j'],
    note: 'Delta와 Omicron BA.1 spike의 변화가 집중된 RBD를 영역 수준으로 표시해요. 서로 다른 구조물의 결합 파트너와 상태가 같다고 가정하지 않아요.',
  },
] as const;

const VARIANT_BY_ID = new Map(
  SPECIMEN_VARIANTS.map((variant) => [variant.id, variant]),
);
const CHANGE_BY_ID = new Map(STRUCTURE_CHANGES.map((change) => [change.id, change]));

export function getVariantsForVirus(virusId: string): readonly SpecimenVariant[] {
  return SPECIMEN_VARIANTS.filter((variant) => variant.parentVirusId === virusId);
}

export function getVariant(id: string | null): SpecimenVariant | undefined {
  return id ? VARIANT_BY_ID.get(id) : undefined;
}

export function getChangesForVariants(
  firstId: string | null,
  secondId: string | null,
): readonly StructureChange[] {
  if (!firstId || !secondId) return [];
  const direct = `${firstId}::${secondId}`;
  const reverse = `${secondId}::${firstId}`;
  return STRUCTURE_CHANGES.filter(
    (change) =>
      change.comparisonPairId === direct || change.comparisonPairId === reverse,
  );
}

export function resolveVariantChanges(
  variantId: string | null,
): readonly StructureChange[] {
  const variant = getVariant(variantId);
  return variant
    ? variant.changeIds
        .map((id) => CHANGE_BY_ID.get(id))
        .filter((change): change is StructureChange => Boolean(change))
    : [];
}
