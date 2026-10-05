import { describe, expect, it } from 'vitest';
import {
  createTerrain,
  createTerrainEdge,
} from '../src/jelly-oasis/terrain/createTerrain';
import {
  DEFAULT_TERRAIN_CONFIG as config,
  sampleTerrainHeight as height,
} from '../src/jelly-oasis/terrain/heightfield';

describe('Jelly Oasis terrain foundation', () => {
  it('retains its polygon and texture budget when the world grows', () => {
    for (const size of [320, 640]) {
      const terrain = createTerrain({ ...config, size });
      const edge = createTerrainEdge({ ...config, size });
      expect(terrain.geometry.index!.count / 3).toBe(12800);
      expect(edge.geometry.attributes.position!.count / 3).toBe(640);
      expect(
        terrain.geometry.boundingBox!.max.x - terrain.geometry.boundingBox!.min.x,
      ).toBe(size);
      expect(terrain.material.map).toBeNull();
      expect(terrain.geometry.attributes.color!.count).toBe(6561);
      terrain.geometry.dispose();
      terrain.material.dispose();
      edge.geometry.dispose();
      edge.material.dispose();
    }
  });
  it('has a broad flat center, elevated northern shelf, and eastern basin', () => {
    for (let x = -28; x <= 28; x += 4) {
      for (let z = -28; z <= 28; z += 4)
        expect(Math.abs(height(x, z))).toBeLessThan(0.2);
    }
    expect(height(10, -112)).toBeGreaterThan(22);
    expect(height(74, 64)).toBeLessThan(-4);
    expect(height(-112, -22)).toBeGreaterThan(12);
  });
  it('is deterministic and changes gently with the seed', () => {
    expect(height(100, -100)).toBe(height(100, -100));
    expect(height(100, -100, { ...config, seed: 123 })).not.toBe(height(100, -100));
    for (let x = -160; x <= 156; x += 4) {
      for (let z = -160; z <= 156; z += 4) {
        expect(Number.isFinite(height(x, z))).toBe(true);
        expect(Math.abs(height(x + 4, z) - height(x, z))).toBeLessThan(4);
        expect(Math.abs(height(x, z + 4) - height(x, z))).toBeLessThan(4);
      }
    }
  });
  it('rejects malformed geometry settings', () => {
    expect(() => createTerrain({ ...config, segments: 0 })).toThrow();
    expect(() => createTerrain({ ...config, size: NaN })).toThrow();
  });
});
