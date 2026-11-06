import { createTerrainEdgeGeometry, createTerrainGeometry } from './createTerrain';
import type { TerrainConfig } from './heightfield';
import { unpackTerrainGeometry } from './terrainGeometryData';
import type { TerrainGeometryData } from './terrainGeometryData';

export async function prepareTerrain(config: TerrainConfig) {
  let worker: Worker | undefined;
  try {
    const terrainWorker = new Worker(new URL('./terrain.worker.ts', import.meta.url), {
      type: 'module',
    });
    worker = terrainWorker;
    const [terrain, edge] = await new Promise<
      [TerrainGeometryData, TerrainGeometryData]
    >((resolve, reject) => {
      terrainWorker.onmessage = (event) => resolve(event.data);
      terrainWorker.onerror = (event) => {
        event.preventDefault();
        reject(new Error(event.message || 'Terrain worker failed'));
      };
      terrainWorker.onmessageerror = () =>
        reject(new Error('Invalid terrain worker response'));
      terrainWorker.postMessage(config);
    });
    return {
      terrain: unpackTerrainGeometry(terrain),
      edge: unpackTerrainGeometry(edge),
    };
  } catch {
    // Keep the scene available when the browser cannot start or run the worker.
    const terrain = createTerrainGeometry(config);
    return { terrain, edge: createTerrainEdgeGeometry(config, terrain) };
  } finally {
    worker?.terminate();
  }
}
