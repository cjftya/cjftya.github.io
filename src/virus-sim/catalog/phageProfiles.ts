import type { ModelBuilderId } from './types';
import type {
  PhageStructuralSignature,
  StructuralComponentEvidence,
} from './structuralTypes';

export interface PhageSignatureProfile {
  readonly id: string;
  readonly virusIds: readonly string[];
  readonly builder: ModelBuilderId;
  readonly signature: PhageStructuralSignature;
  readonly evidence: readonly StructuralComponentEvidence[];
}

const evidence = (
  level: StructuralComponentEvidence['level'],
  sourceIds: readonly string[],
): readonly StructuralComponentEvidence[] => [
  { componentId: 'head-tail-architecture', level, sourceIds },
];

export const PHAGE_SIGNATURE_PROFILES: readonly PhageSignatureProfile[] = [
  {
    id: 't4-contractile-prolate',
    virusIds: ['t4'],
    builder: 't4',
    signature: {
      head: {
        shape: 'prolate',
        radius: 1.42,
        elongation: 1.22,
        surfacePattern: 'prolate-lattice',
        capsomerCount: 58,
      },
      portal: { present: true, scale: 1 },
      neck: { style: 'ringed' },
      tail: {
        type: 'contractile',
        length: 2.78,
        radius: 0.31,
        flexibility: 'rigid',
        sheathRings: 13,
        innerTube: true,
      },
      distal: {
        baseplate: 'contractile-complex',
        receptor: { kind: 'tail-fiber', count: 6, reach: 1.62, segmented: true },
      },
    },
    evidence: evidence('observed', ['pdb-7vs5', 'pdb-2bsg']),
  },
  {
    id: 'lambda-flexible-long-tail',
    virusIds: ['lambda'],
    builder: 'lambda',
    signature: {
      head: {
        shape: 'isometric',
        radius: 1.28,
        elongation: 1.02,
        surfacePattern: 'regular-lattice',
        capsomerCount: 48,
      },
      neck: { style: 'simple' },
      tail: {
        type: 'long-noncontractile',
        length: 4.35,
        radius: 0.14,
        flexibility: 'flexible',
        innerTube: false,
      },
      distal: {
        baseplate: 'simple-hub',
        receptor: { kind: 'tail-fiber', count: 6, reach: 0.72, segmented: true },
      },
    },
    evidence: evidence('observed', ['pdb-8iyd', 'pdb-8xqb']),
  },
  {
    id: 't7-compact-short-tail',
    virusIds: ['t7'],
    builder: 't7',
    signature: {
      head: {
        shape: 'isometric',
        radius: 1.5,
        elongation: 0.98,
        surfacePattern: 'regular-lattice',
        capsomerCount: 56,
      },
      portal: { present: true, scale: 1 },
      tail: {
        type: 'short',
        length: 0.8,
        radius: 0.22,
        flexibility: 'rigid',
        innerTube: true,
      },
      distal: {
        baseplate: 'simple-hub',
        receptor: { kind: 'tail-fiber', count: 6, reach: 1.02, segmented: true },
      },
    },
    evidence: evidence('observed', ['pdb-3j7v', 'pdb-7ey7']),
  },
  {
    id: 'phi29-prolate-short-tail',
    virusIds: ['phi29'],
    builder: 'phage-family',
    signature: {
      head: {
        shape: 'elongated',
        radius: 1.34,
        elongation: 1.25,
        surfacePattern: 'prolate-lattice',
        capsomerCount: 42,
      },
      portal: { present: true, scale: 0.82 },
      tail: {
        type: 'short',
        length: 1.35,
        radius: 0.15,
        flexibility: 'rigid',
        innerTube: true,
      },
      distal: {
        receptor: { kind: 'tail-fiber', count: 6, reach: 0.62, segmented: false },
      },
    },
    evidence: evidence('observed', ['pdb-6qvk']),
  },
  {
    id: 'p22-tailspike-short-tail',
    virusIds: ['p22'],
    builder: 'phage-family',
    signature: {
      head: {
        shape: 'isometric',
        radius: 1.45,
        elongation: 1.04,
        surfacePattern: 'regular-lattice',
        capsomerCount: 46,
      },
      portal: { present: true, scale: 0.94 },
      tail: {
        type: 'short',
        length: 0.82,
        radius: 0.28,
        flexibility: 'rigid',
        innerTube: false,
      },
      distal: {
        baseplate: 'hexagonal',
        receptor: { kind: 'tailspike', count: 6, reach: 0.72, segmented: false },
      },
    },
    evidence: evidence('observed', ['pdb-5uu5', 'pdb-8tvr']),
  },
  {
    id: 'hk97-crosslinked-head-minimal-tail',
    virusIds: ['hk97'],
    builder: 'phage-family',
    signature: {
      head: {
        shape: 'isometric',
        radius: 1.48,
        elongation: 1.01,
        surfacePattern: 'crosslinked-thin',
        capsomerCount: 54,
      },
      neck: { style: 'collar' },
      tail: {
        type: 'minimal',
        length: 1.35,
        radius: 0.1,
        flexibility: 'semi-flexible',
        innerTube: false,
      },
    },
    evidence: [
      { componentId: 'head', level: 'observed', sourceIds: ['pdb-2ft1'] },
      { componentId: 'tail', level: 'conceptual', sourceIds: ['pdb-2ft1'] },
    ],
  },
  {
    id: 't5-long-tail-distal-complex',
    virusIds: ['t5'],
    builder: 'phage-family',
    signature: {
      head: {
        shape: 'isometric',
        radius: 1.22,
        elongation: 1.08,
        surfacePattern: 'regular-lattice',
        capsomerCount: 38,
      },
      portal: { present: true, scale: 0.86 },
      neck: { style: 'collar' },
      tail: {
        type: 'long-noncontractile',
        length: 4.05,
        radius: 0.11,
        flexibility: 'semi-flexible',
        innerTube: false,
      },
      distal: {
        baseplate: 'hexagonal',
        receptor: { kind: 'tail-fiber', count: 6, reach: 1.08, segmented: true },
      },
    },
    evidence: evidence('observed', ['pdb-8zvi']),
  },
  {
    id: 't1-long-tail-compact-distal',
    virusIds: ['t1'],
    builder: 'phage-family',
    signature: {
      head: {
        shape: 'isometric',
        radius: 1.18,
        elongation: 1.05,
        surfacePattern: 'regular-lattice',
        capsomerCount: 36,
      },
      portal: { present: true, scale: 0.76 },
      neck: { style: 'simple' },
      tail: {
        type: 'long-noncontractile',
        length: 3.5,
        radius: 0.09,
        flexibility: 'semi-flexible',
        innerTube: false,
      },
      distal: {
        baseplate: 'simple-hub',
        receptor: { kind: 'tail-fiber', count: 6, reach: 0.72, segmented: false },
      },
    },
    evidence: evidence('observed', ['pdb-9l01']),
  },
] as const;

const PROFILE_BY_VIRUS = new Map(
  PHAGE_SIGNATURE_PROFILES.flatMap((profile) =>
    profile.virusIds.map((virusId) => [virusId, profile] as const),
  ),
);

export function getPhageSignatureProfile(
  virusId: string,
): PhageSignatureProfile | undefined {
  return PROFILE_BY_VIRUS.get(virusId);
}
