import { describe, expect, it, vi } from 'vitest';
import type { BufferGeometry } from 'three';
import {
  createTerrainEdgeGeometry,
  createTerrainGeometry,
} from '../src/jelly-oasis/terrain/createTerrain';
import { unpackTerrainGeometry } from '../src/jelly-oasis/terrain/terrainGeometryData';
import type { TerrainGeometryData } from '../src/jelly-oasis/terrain/terrainGeometryData';
import { createWorldConfig } from '../src/jelly-oasis/terrain/worldLayout';

function expectSameGeometry(actual: BufferGeometry, expected: BufferGeometry) {
  expect(Object.keys(actual.attributes)).toEqual(Object.keys(expected.attributes));
  for (const [name, attribute] of Object.entries(expected.attributes)) {
    const result = actual.getAttribute(name);
    expect(result.itemSize).toBe(attribute.itemSize);
    expect(result.normalized).toBe(attribute.normalized);
    expect(Buffer.from(result.array.buffer)).toEqual(
      Buffer.from(attribute.array.buffer),
    );
  }
  const actualIndex = actual.index?.array;
  const expectedIndex = expected.index?.array;
  expect(actualIndex?.constructor).toBe(expectedIndex?.constructor);
  if (actualIndex && expectedIndex) {
    expect(
      Buffer.from(actualIndex.buffer).equals(Buffer.from(expectedIndex.buffer)),
    ).toBe(true);
  }
}

describe('Oasis terrain worker', () => {
  it.each([192, 224, 320])(
    'preserves the %s-unit terrain and edge after transfer',
    async (size) => {
      const config = createWorldConfig(size);
      const terrain = createTerrainGeometry(config);
      const edge = createTerrainEdgeGeometry(config, terrain);
      const postMessage = vi.fn(
        (data: TerrainGeometryData[], options: StructuredSerializeOptions) =>
          structuredClone(data, options),
      );
      const worker = {
        onmessage: vi.fn<(_event: { data: typeof config }) => void>(),
        postMessage,
      };
      vi.stubGlobal('self', worker);
      try {
        vi.resetModules();
        await import('../src/jelly-oasis/terrain/terrain.worker');
        worker.onmessage({ data: config });
        expect(postMessage).toHaveBeenCalledOnce();
        const [terrainData, edgeData] = postMessage.mock.results[0]!.value!;
        expect(
          postMessage.mock.calls[0]![0][0]!.attributes.position!.array.byteLength,
        ).toBe(0);
        const result = unpackTerrainGeometry(terrainData!);
        expectSameGeometry(result, terrain);
        expect(result.boundingBox).toEqual(terrain.boundingBox);
        expect(result.boundingSphere).toEqual(terrain.boundingSphere);
        expectSameGeometry(unpackTerrainGeometry(edgeData!), edge);
      } finally {
        vi.unstubAllGlobals();
      }
    },
  );
});
