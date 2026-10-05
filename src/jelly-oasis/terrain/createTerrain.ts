import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
} from 'three';
import {
  DEFAULT_TERRAIN_CONFIG,
  sampleTerrainHeight,
  smoothstep,
  validateTerrainConfig,
} from './heightfield';
import type { TerrainConfig } from './heightfield';
import { createTerrainSurface } from './terrainSurface';
export { DEFAULT_TERRAIN_CONFIG, sampleTerrainHeight } from './heightfield';
export type { TerrainConfig } from './heightfield';

export function createTerrain(
  config: TerrainConfig = DEFAULT_TERRAIN_CONFIG,
  material?: MeshStandardMaterial,
): Mesh<PlaneGeometry, MeshStandardMaterial> {
  validateTerrainConfig(config);
  const geometry = new PlaneGeometry(
    config.size,
    config.size,
    config.segments,
    config.segments,
  );
  geometry.rotateX(-Math.PI / 2);
  const positions = geometry.attributes.position!;
  const colors = new Float32Array(positions.count * 3);
  const meadow = new Color('#89a875');
  const highland = new Color('#b5b68a');
  const basin = new Color('#688f80');
  const color = new Color();
  for (let index = 0; index < positions.count; index += 1) {
    const height = sampleTerrainHeight(
      positions.getX(index),
      positions.getZ(index),
      config,
    );
    positions.setY(index, height);
    color.copy(meadow).lerp(highland, smoothstep(3, config.maxHeight, height));
    color.lerp(basin, smoothstep(0, config.maxHeight * 0.2, -height));
    color.toArray(colors, index * 3);
  }
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  const terrain = new Mesh(
    geometry,
    material ?? createTerrainSurface(config.maxHeight).material,
  );
  terrain.name = 'JellyOasisTerrain';
  terrain.receiveShadow = true;
  return terrain;
}
/** Close cut edges without adding environment objects: 640 extra triangles. */
export function createTerrainEdge(
  config = DEFAULT_TERRAIN_CONFIG,
): Mesh<BufferGeometry, MeshStandardMaterial> {
  validateTerrainConfig(config);
  const vertices: number[] = [];
  const half = config.size / 2;
  const floor = -config.maxHeight * 0.6;
  const corners = [
    [-half, -half],
    [half, -half],
    [half, half],
    [-half, half],
  ] as const;
  for (let side = 0; side < 4; side += 1) {
    const a = corners[side]!;
    const b = corners[(side + 1) % 4]!;
    for (let i = 0; i < config.segments; i += 1) {
      const t0 = i / config.segments;
      const t1 = (i + 1) / config.segments;
      const x0 = a[0] + (b[0] - a[0]) * t0;
      const z0 = a[1] + (b[1] - a[1]) * t0;
      const x1 = a[0] + (b[0] - a[0]) * t1;
      const z1 = a[1] + (b[1] - a[1]) * t1;
      const y0 = sampleTerrainHeight(x0, z0, config);
      const y1 = sampleTerrainHeight(x1, z1, config);
      vertices.push(
        x0,
        y0,
        z0,
        x1,
        y1,
        z1,
        x0,
        floor,
        z0,
        x1,
        y1,
        z1,
        x1,
        floor,
        z1,
        x0,
        floor,
        z0,
      );
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  const edge = new Mesh(
    geometry,
    new MeshStandardMaterial({ color: '#827d62', roughness: 1 }),
  );
  edge.name = 'TerrainCutEdge';
  return edge;
}
