import type { GeometryFamily } from '../observation/types';

export interface GeometryProfile {
  readonly id: string;
  readonly family: GeometryFamily;
  readonly radius: number;
  readonly elongation?: number;
  readonly unitCount?: number;
  readonly unitScale?: number;
  readonly protrusion?: number;
  readonly spikeCount?: number;
  readonly tailLength?: number;
  readonly tailStyle?: 'short' | 'long' | 'spiked';
  readonly layers?: 2 | 3;
  readonly filamentLength?: number;
  readonly filamentRadius?: number;
  readonly bend?: number;
  readonly lobeSpacing?: number;
  readonly terminalTails?: 1 | 2;
  readonly turretCount?: number;
}

type ProfileInput = Omit<GeometryProfile, 'id'>;

const profile = (
  family: GeometryFamily,
  input: Omit<ProfileInput, 'family'>,
): ProfileInput => ({
  family,
  ...input,
});

export const GEOMETRY_PROFILES: Readonly<Record<string, ProfileInput>> = {
  t4: profile('phage', {
    radius: 1.42,
    elongation: 1.22,
    unitCount: 58,
    tailLength: 3.6,
    tailStyle: 'spiked',
  }),
  lambda: profile('phage', {
    radius: 1.28,
    unitCount: 48,
    tailLength: 4.35,
    tailStyle: 'long',
  }),
  t7: profile('phage', {
    radius: 1.5,
    unitCount: 56,
    tailLength: 0.8,
    tailStyle: 'short',
  }),
  ms2: profile('icosahedral', {
    radius: 1.95,
    unitCount: 72,
    unitScale: 0.15,
    protrusion: 0.08,
  }),
  tmv: profile('filament', {
    radius: 1,
    filamentLength: 6.5,
    filamentRadius: 0.69,
    unitCount: 68,
  }),
  m13: profile('filament', {
    radius: 1,
    filamentLength: 7.8,
    filamentRadius: 0.3,
    unitCount: 82,
    bend: 0.22,
  }),
  'adenovirus-5': profile('icosahedral', {
    radius: 1.9,
    unitCount: 86,
    unitScale: 0.17,
    protrusion: 1.35,
    spikeCount: 12,
  }),
  'rotavirus-rrv': profile('layered', {
    radius: 2.08,
    unitCount: 64,
    unitScale: 0.16,
    layers: 3,
    protrusion: 0.16,
  }),
  hsv1: profile('enveloped', {
    radius: 2.35,
    unitCount: 48,
    spikeCount: 42,
    protrusion: 0.25,
    layers: 2,
  }),
  'influenza-a': profile('enveloped', {
    radius: 2.1,
    unitCount: 28,
    spikeCount: 46,
    protrusion: 0.34,
    layers: 2,
  }),
  'vsv-indiana': profile('enveloped', {
    radius: 1.75,
    elongation: 1.8,
    unitCount: 32,
    spikeCount: 34,
    protrusion: 0.3,
    layers: 2,
  }),
  'vaccinia-mv': profile('layered', {
    radius: 2.4,
    elongation: 1.45,
    unitCount: 24,
    layers: 3,
    protrusion: 0.08,
  }),
  'filovirus-v3.5': profile('filament', {
    radius: 1,
    filamentLength: 8.2,
    filamentRadius: 0.58,
    unitCount: 76,
    bend: 0.28,
    spikeCount: 42,
    protrusion: 0.14,
  }),
  'lentivirus-v3.5': profile('enveloped', {
    radius: 2.25,
    unitCount: 42,
    spikeCount: 36,
    protrusion: 0.28,
    layers: 2,
  }),
  'coronavirus-v3.5': profile('enveloped', {
    radius: 2.35,
    unitCount: 46,
    spikeCount: 54,
    protrusion: 0.38,
    layers: 2,
  }),
  'ico-spiked-t1': profile('icosahedral', {
    radius: 1.64,
    unitCount: 12,
    unitScale: 0.2,
    protrusion: 0.32,
    spikeCount: 12,
  }),
  'ico-rna-t3-asymmetric': profile('icosahedral', {
    radius: 1.62,
    unitCount: 48,
    unitScale: 0.16,
    protrusion: 0.08,
  }),
  'phage-prolate-short': profile('phage', {
    radius: 1.34,
    elongation: 1.25,
    unitCount: 42,
    tailLength: 1.35,
    tailStyle: 'short',
  }),
  'phage-p22-tailspike': profile('phage', {
    radius: 1.45,
    elongation: 1.04,
    unitCount: 46,
    tailLength: 0.82,
    tailStyle: 'spiked',
  }),
  'phage-hk97-thin': profile('phage', {
    radius: 1.48,
    elongation: 1.01,
    unitCount: 54,
    tailLength: 0.72,
    tailStyle: 'short',
  }),
  'phage-long-t5': profile('phage', {
    radius: 1.22,
    elongation: 1.08,
    unitCount: 38,
    tailLength: 4.05,
    tailStyle: 'long',
  }),
  'phage-long-t1': profile('phage', {
    radius: 1.18,
    elongation: 1.05,
    unitCount: 36,
    tailLength: 3.5,
    tailStyle: 'long',
  }),
  'layered-prd1': profile('layered', {
    radius: 1.76,
    unitCount: 44,
    unitScale: 0.15,
    layers: 2,
    protrusion: 0.08,
  }),
  'enveloped-phi6': profile('enveloped', {
    radius: 1.88,
    unitCount: 34,
    spikeCount: 28,
    protrusion: 0.32,
    layers: 2,
  }),
  'layered-pm2': profile('layered', {
    radius: 1.7,
    unitCount: 40,
    unitScale: 0.14,
    layers: 2,
    protrusion: 0.06,
  }),
  'ico-ap205-compact': profile('icosahedral', {
    radius: 1.48,
    unitCount: 36,
    unitScale: 0.15,
    protrusion: 0.06,
  }),
  'ico-plant-t3-soft': profile('icosahedral', {
    radius: 1.66,
    unitCount: 44,
    unitScale: 0.16,
    protrusion: 0.05,
  }),
  'ico-plant-t3-compact': profile('icosahedral', {
    radius: 1.59,
    unitCount: 42,
    unitScale: 0.15,
    protrusion: 0.03,
  }),
  'ico-plant-pseudo-t3': profile('icosahedral', {
    radius: 1.72,
    unitCount: 50,
    unitScale: 0.15,
    protrusion: 0.09,
  }),
  'ico-plant-t3-protruding': profile('icosahedral', {
    radius: 1.72,
    unitCount: 48,
    unitScale: 0.16,
    protrusion: 0.2,
    spikeCount: 24,
  }),
  'ico-stmv-small': profile('icosahedral', {
    radius: 1.35,
    unitCount: 30,
    unitScale: 0.14,
    protrusion: 0.02,
  }),
  'ico-cmv-fny': profile('icosahedral', {
    radius: 1.61,
    unitCount: 44,
    unitScale: 0.15,
    protrusion: 0.07,
  }),
  'ico-tymv-dense': profile('icosahedral', {
    radius: 1.63,
    unitCount: 58,
    unitScale: 0.13,
    protrusion: 0.04,
  }),
  'filament-pvx-flexible': profile('filament', {
    radius: 1,
    filamentLength: 6.6,
    filamentRadius: 0.48,
    unitCount: 82,
    bend: 0.17,
  }),
  'filament-papmv-flexible': profile('filament', {
    radius: 1,
    filamentLength: 6.1,
    filamentRadius: 0.5,
    unitCount: 76,
    bend: 0.2,
  }),
  'filament-pvy-thin': profile('filament', {
    radius: 1,
    filamentLength: 6.8,
    filamentRadius: 0.39,
    unitCount: 88,
    bend: 0.14,
  }),
  'ico-camv-rounded': profile('icosahedral', {
    radius: 1.72,
    unitCount: 42,
    unitScale: 0.17,
    protrusion: 0.02,
  }),
  'geminate-msv': profile('geminate', {
    radius: 1.22,
    unitCount: 32,
    unitScale: 0.16,
    lobeSpacing: 1.45,
  }),
  'geminate-tylcv': profile('geminate', {
    radius: 1.18,
    unitCount: 30,
    unitScale: 0.15,
    lobeSpacing: 1.36,
  }),
  'ico-aav2-dimpled': profile('icosahedral', {
    radius: 1.58,
    unitCount: 36,
    unitScale: 0.16,
    protrusion: 0.16,
    spikeCount: 20,
  }),
  'ico-cpv-cylinders': profile('icosahedral', {
    radius: 1.62,
    unitCount: 38,
    unitScale: 0.17,
    protrusion: 0.23,
    spikeCount: 12,
  }),
  'ico-pcv2-small': profile('icosahedral', {
    radius: 1.4,
    unitCount: 30,
    unitScale: 0.14,
    protrusion: 0.04,
  }),
  'ico-papilloma-pentamers': profile('icosahedral', {
    radius: 1.8,
    unitCount: 42,
    unitScale: 0.19,
    protrusion: 0.2,
  }),
  'ico-polyoma-sv40': profile('icosahedral', {
    radius: 1.77,
    unitCount: 42,
    unitScale: 0.18,
    protrusion: 0.15,
  }),
  'ico-polyoma-murine': profile('icosahedral', {
    radius: 1.77,
    unitCount: 42,
    unitScale: 0.18,
    protrusion: 0.1,
  }),
  'ico-calici-protruding': profile('icosahedral', {
    radius: 1.72,
    unitCount: 48,
    unitScale: 0.17,
    protrusion: 0.26,
    spikeCount: 24,
  }),
  'ico-rhdv-protruding': profile('icosahedral', {
    radius: 1.75,
    unitCount: 48,
    unitScale: 0.18,
    protrusion: 0.32,
    spikeCount: 24,
  }),
  'ico-astro-spiked': profile('icosahedral', {
    radius: 1.66,
    unitCount: 40,
    unitScale: 0.16,
    protrusion: 0.28,
    spikeCount: 12,
  }),
  'enveloped-hbv-dane': profile('enveloped', {
    radius: 1.9,
    unitCount: 38,
    spikeCount: 34,
    protrusion: 0.16,
    layers: 2,
  }),
  'enveloped-alphavirus-sindbis': profile('enveloped', {
    radius: 1.98,
    unitCount: 42,
    spikeCount: 52,
    protrusion: 0.28,
    layers: 2,
  }),
  'enveloped-alphavirus-sfv': profile('enveloped', {
    radius: 1.98,
    unitCount: 44,
    spikeCount: 60,
    protrusion: 0.25,
    layers: 2,
  }),
  'ico-fhv-t3': profile('icosahedral', {
    radius: 1.62,
    unitCount: 46,
    unitScale: 0.15,
    protrusion: 0.07,
  }),
  'layered-ibdv-double': profile('layered', {
    radius: 1.84,
    unitCount: 44,
    unitScale: 0.16,
    layers: 2,
    protrusion: 0.1,
  }),
  'layered-bluetongue-triple': profile('layered', {
    radius: 2.02,
    unitCount: 52,
    unitScale: 0.16,
    layers: 3,
    protrusion: 0.12,
  }),
  'layered-reovirus-turret': profile('layered', {
    radius: 2.12,
    unitCount: 52,
    unitScale: 0.16,
    layers: 3,
    protrusion: 0.14,
    turretCount: 12,
  }),
  'spindle-ssv1-one-tail': profile('spindle', {
    radius: 1.25,
    elongation: 2.05,
    terminalTails: 1,
    tailLength: 0.8,
    unitCount: 34,
  }),
  'rod-sirv2-fibers': profile('rod', {
    radius: 0.68,
    filamentLength: 5.5,
    terminalTails: 2,
    tailLength: 0.72,
    unitCount: 50,
  }),
  'layered-stiv-turret': profile('layered', {
    radius: 1.85,
    unitCount: 42,
    unitScale: 0.16,
    layers: 2,
    protrusion: 0.12,
    turretCount: 12,
  }),
  'spindle-atv-two-tail': profile('spindle', {
    radius: 1.18,
    elongation: 2.2,
    terminalTails: 2,
    tailLength: 1.35,
    unitCount: 36,
  }),
};

export function getGeometryProfile(id: string): GeometryProfile {
  const value = GEOMETRY_PROFILES[id];
  if (!value) throw new Error(`Unknown Virus Sim geometry profile: ${id}`);
  return { id, ...value };
}
