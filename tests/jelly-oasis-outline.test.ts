import { expect, it } from 'vitest';
import { Group, MeshStandardMaterial, Raycaster, Vector3 } from 'three';
import {
  createTerrain,
  createTerrainEdge,
} from '../src/jelly-oasis/terrain/createTerrain';
import { createWorldConfig } from '../src/jelly-oasis/terrain/worldLayout';
import {
  insideTerrain,
  terrainBoundary,
} from '../src/jelly-oasis/terrain/terrainOutline';
import { excavateTerrain } from '../src/jelly-oasis/terrain/excavateTerrain';
import { sampleGround } from '../src/jelly-oasis/landmark/landmarkPlacement';

it('cuts rounded corners, closes their exact boundary, and retains the outline after excavation', () => {
  const config = createWorldConfig();
  const terrain = createTerrain(config, new MeshStandardMaterial());
  const original = terrain.geometry;
  const edge = createTerrainEdge(config, original);
  const boundary = terrainBoundary(original);
  expect(insideTerrain(110, 110, config)).toBe(false);
  expect(insideTerrain(0, 0, config)).toBe(true);
  const p = original.attributes.position!;
  for (let i = 0; i < p.count; i++)
    expect(insideTerrain(p.getX(i), p.getZ(i), config)).toBe(true);
  const wall = edge.geometry.attributes.position!;
  expect(wall.count).toBe(boundary.length * 6);
  boundary.forEach(([a, b], i) => {
    expect([wall.getX(i * 6), wall.getY(i * 6), wall.getZ(i * 6)]).toEqual([
      p.getX(b),
      p.getY(b),
      p.getZ(b),
    ]);
    expect([wall.getX(i * 6 + 1), wall.getY(i * 6 + 1), wall.getZ(i * 6 + 1)]).toEqual([
      p.getX(a),
      p.getY(a),
      p.getZ(a),
    ]);
  });
  const root = new Group();
  root.updateMatrixWorld(true);
  const excavation = excavateTerrain(
    terrain,
    config,
    root,
    {
      positions: [
        [-8, 0, -8],
        [8, 0, -8],
        [8, 0, 8],
        [-8, 0, 8],
      ],
      indices: [],
    },
    -1,
    [],
  );
  const clipped = terrain.geometry.attributes.position!;
  const rebuiltBoundary = terrainBoundary(terrain.geometry);
  const points = (positions: typeof p, pairs: [number, number][]) =>
    pairs
      .map(([a, b]) =>
        [a, b]
          .map((i) =>
            [positions.getX(i), positions.getY(i), positions.getZ(i)].join(','),
          )
          .sort()
          .join('|'),
      )
      .sort();
  expect(points(clipped, rebuiltBoundary)).toEqual(points(p, boundary));
  for (const [x, z] of [
    [0.3, 0.4],
    [4.2, 2.1],
  ]) {
    const ray = new Raycaster(new Vector3(x!, 100, z!), new Vector3(0, -1, 0));
    const hit = ray.intersectObject(terrain)[0]!;
    expect(hit).toBeDefined();
    expect(sampleGround(x!, z!, config)).toBeCloseTo(hit.point.y, 5);
  }
  expect(
    new Raycaster(new Vector3(110, 100, 110), new Vector3(0, -1, 0)).intersectObject(
      terrain,
    ),
  ).toHaveLength(0);
  excavation.dispose();
  original.dispose();
  terrain.material.dispose();
  edge.geometry.dispose();
  edge.material.dispose();
});
