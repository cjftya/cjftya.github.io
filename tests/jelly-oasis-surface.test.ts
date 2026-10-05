import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { LinearMipmapLinearFilter, NoColorSpace, RepeatWrapping } from 'three';
import {
  createTerrain,
  createTerrainEdge,
} from '../src/jelly-oasis/terrain/createTerrain';
import {
  createTerrainSurface,
  TERRAIN_SURFACE_CONFIG,
} from '../src/jelly-oasis/terrain/terrainSurface';

// Captured from the master heightfield before Surface v2. Protect every coordinate,
// normal and index, not just triangle totals or a few selected heights.
const baseline = {
  position: '8a7af201870943482ec44deb39a77f393a9ac97fd8c319180ce35583a99b106c',
  normal: 'dbc1ea20bf931f547a6286a56efcca16da5f96185c50a1451ab7b7a6f30fa4d7',
  index: '1ecf3ff878828939697ea5be18f2f322f5cdce6f535a3b49121d338d2e0d38e0',
};

describe('Terrain Surface v2 regression and resource budget', () => {
  it('preserves the complete terrain mesh while smoothing only its shading', () => {
    const terrain = createTerrain();
    const edge = createTerrainEdge();
    for (const key of ['position', 'normal', 'index'] as const) {
      const array = (
        key === 'index' ? terrain.geometry.index! : terrain.geometry.attributes[key]!
      ).array;
      expect(
        createHash('sha256')
          .update(new Uint8Array(array.buffer, array.byteOffset, array.byteLength))
          .digest('hex'),
      ).toBe(baseline[key]);
    }
    expect(
      terrain.geometry.index!.count / 3 + edge.geometry.attributes.position!.count / 3,
    ).toBe(13440);
    expect(terrain.children).toHaveLength(0);
    expect(terrain.material.flatShading).toBe(false);
    expect(terrain.material.displacementMap).toBeNull();
    expect(edge.material.name).not.toBe(terrain.material.name);
    terrain.geometry.dispose();
    terrain.material.dispose();
    edge.geometry.dispose();
    edge.material.dispose();
  });

  it('owns one mipmapped linear packed texture and releases it with the material', () => {
    const { material, uniforms } = createTerrainSurface(26);
    const texture = uniforms.terrainDetail.value;
    expect(texture.image.width).toBe(512);
    expect(texture.image.height).toBe(512);
    expect(texture.image.data!.byteLength).toBe(512 * 512 * 4);
    expect(texture.colorSpace).toBe(NoColorSpace);
    expect(texture.wrapS).toBe(RepeatWrapping);
    expect(texture.wrapT).toBe(RepeatWrapping);
    expect(texture.minFilter).toBe(LinearMipmapLinearFilter);
    expect(texture.generateMipmaps).toBe(true);
    const released = vi.fn();
    texture.addEventListener('dispose', released);
    material.dispose();
    expect(released).toHaveBeenCalledOnce();
  });

  it('uses soft overlapping transitions inside the measured terrain slope range', () => {
    const c = TERRAIN_SURFACE_CONFIG;
    expect(c.dirtStart).toBeGreaterThan(0);
    expect(c.rockStart).toBeGreaterThan(c.dirtStart);
    expect(c.rockStart).toBeLessThan(c.dirtEnd);
    expect(c.rockEnd).toBeGreaterThan(c.dirtEnd);
    expect(c.rockEnd).toBeLessThan(0.213);
    expect(c.textureScale).toBeGreaterThan(0);
    expect(Object.values(c).every(Number.isFinite)).toBe(true);
  });
});
