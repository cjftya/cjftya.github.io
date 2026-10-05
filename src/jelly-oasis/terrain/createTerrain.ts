import {
  BufferGeometry,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
} from 'three';

export interface TerrainConfig {
  size: number;
  segments: number;
  maxHeight: number;
  seed: number;
  flatCenterRadius: number;
  flatCenterFeather: number;
}

export const DEFAULT_TERRAIN_CONFIG: TerrainConfig = {
  size: 320,
  segments: 80,
  maxHeight: 18,
  seed: 0x4a4f5953,
  flatCenterRadius: 42,
  flatCenterFeather: 72,
};

export function createTerrain(
  config: TerrainConfig = DEFAULT_TERRAIN_CONFIG,
): Mesh<BufferGeometry, MeshStandardMaterial> {
  const geometry = new PlaneGeometry(
    config.size,
    config.size,
    config.segments,
    config.segments,
  );
  geometry.rotateX(-Math.PI / 2);

  const positions = geometry.attributes.position;
  if (!positions) {
    throw new Error('Terrain geometry is missing a position attribute.');
  }

  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const z = positions.getZ(index);
    positions.setY(index, sampleTerrainHeight(x, z, config));
  }

  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  const material = new MeshStandardMaterial({
    color: 0x789071,
    roughness: 1,
    metalness: 0,
    flatShading: true,
  });

  const terrain = new Mesh(geometry, material);
  terrain.name = 'JellyOasisTerrain';
  terrain.receiveShadow = true;

  return terrain;
}

export function sampleTerrainHeight(
  x: number,
  z: number,
  config: TerrainConfig = DEFAULT_TERRAIN_CONFIG,
): number {
  const broad = fbm(x * 0.0105, z * 0.0105, config.seed, 4);
  const medium = fbm(x * 0.024, z * 0.024, config.seed + 71, 3);
  const detail = fbm(x * 0.055, z * 0.055, config.seed + 149, 2);

  const radialDistance = Math.hypot(x, z);
  const centerBlend = smoothstep(
    config.flatCenterRadius,
    config.flatCenterRadius + config.flatCenterFeather,
    radialDistance,
  );
  const amplitude = lerp(0.12, 1, centerBlend);

  return (
    (broad * 0.72 + medium * 0.21 + detail * 0.07) *
    config.maxHeight *
    amplitude
  );
}

function fbm(
  x: number,
  z: number,
  seed: number,
  octaveCount: number,
): number {
  let amplitude = 0.5;
  let frequency = 1;
  let total = 0;
  let normalization = 0;

  for (let octave = 0; octave < octaveCount; octave += 1) {
    total +=
      valueNoise(x * frequency, z * frequency, seed + octave * 1013) *
      amplitude;
    normalization += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }

  return normalization === 0 ? 0 : total / normalization;
}

function valueNoise(x: number, z: number, seed: number): number {
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const x1 = x0 + 1;
  const z1 = z0 + 1;

  const tx = smootherstep(x - x0);
  const tz = smootherstep(z - z0);

  const a = hashToSignedUnit(x0, z0, seed);
  const b = hashToSignedUnit(x1, z0, seed);
  const c = hashToSignedUnit(x0, z1, seed);
  const d = hashToSignedUnit(x1, z1, seed);

  return lerp(lerp(a, b, tx), lerp(c, d, tx), tz);
}

function hashToSignedUnit(x: number, z: number, seed: number): number {
  let value = Math.imul(x, 374761393);
  value = Math.imul(value ^ Math.imul(z, 668265263), 1274126177);
  value ^= seed;
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  value ^= value >>> 16;

  return ((value >>> 0) / 0xffffffff) * 2 - 1;
}

function smootherstep(value: number): number {
  const clamped = Math.min(Math.max(value, 0), 1);
  return clamped * clamped * clamped * (clamped * (clamped * 6 - 15) + 10);
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  if (edge0 === edge1) {
    return value < edge0 ? 0 : 1;
  }

  const t = Math.min(Math.max((value - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}
