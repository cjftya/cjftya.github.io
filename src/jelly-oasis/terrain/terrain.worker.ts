import { createTerrainEdgeGeometry, createTerrainGeometry } from './createTerrain';
import type { TerrainConfig } from './heightfield';
import { packTerrainGeometry } from './terrainGeometryData';

self.onmessage = ({ data: config }: MessageEvent<TerrainConfig>) => {
  const terrain = createTerrainGeometry(config);
  const edge = createTerrainEdgeGeometry(config, terrain);
  const geometries = [packTerrainGeometry(terrain), packTerrainGeometry(edge)];
  const transfer = new Set<ArrayBuffer>();
  for (const { attributes, index } of geometries) {
    for (const { array } of Object.values(attributes)) {
      transfer.add(array.buffer as ArrayBuffer);
    }
    if (index) transfer.add(index.array.buffer as ArrayBuffer);
  }
  self.postMessage(geometries, { transfer: [...transfer] });
};
