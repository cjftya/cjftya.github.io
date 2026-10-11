import { BufferGeometry, Color, Float32BufferAttribute, Vector3 } from 'three';
import type { Group, Mesh, MeshStandardMaterial } from 'three';
import type { LayoutGuide } from '../landmark/landmarkConfig';
import { sampleOriginalGround } from '../landmark/landmarkPlacement';
import { smoothstep } from './heightfield';
import type { TerrainConfig } from './heightfield';
import { setTerrainSampler } from './terrainSampling';

export interface ChannelSample {
  point: Vector3;
  width: number;
}
export function polygonDistance(x: number, z: number, boundary: number[][]) {
  let inside = false,
    distance = Infinity;
  for (let i = 0, j = boundary.length - 1; i < boundary.length; j = i++) {
    const a = boundary[j]!,
      b = boundary[i]!;
    if (
      a[2]! > z !== b[2]! > z &&
      x < ((b[0]! - a[0]!) * (z - a[2]!)) / (b[2]! - a[2]!) + a[0]!
    )
      inside = !inside;
    const dx = b[0]! - a[0]!,
      dz = b[2]! - a[2]!;
    const t = Math.max(
      0,
      Math.min(1, ((x - a[0]!) * dx + (z - a[2]!) * dz) / (dx * dx + dz * dz)),
    );
    distance = Math.min(distance, Math.hypot(x - a[0]! - dx * t, z - a[2]! - dz * t));
  }
  return inside ? distance : -distance;
}

/** Replace entire coarse cells. Outer edge nodes collapse onto the original
 * grid corners; degenerate faces are removed. Every retained face is shared by
 * rendering and the barycentric sampler; no hidden original floor remains. */
export function excavateTerrain(
  mesh: Mesh<BufferGeometry, MeshStandardMaterial>,
  config: TerrainConfig,
  root: Group,
  guide: LayoutGuide,
  waterY: number,
  channel: ChannelSample[],
  protectedZones: { min: number[]; max: number[] }[] = [],
) {
  const original = mesh.geometry;
  const inverse = root.matrixWorld.clone().invert();
  const step = config.size / config.segments,
    half = config.size / 2;
  const margin = 4 * root.scale.x;
  const area = [
    ...guide.positions.map((p) => root.localToWorld(new Vector3(p[0], 0, p[2]))),
    ...channel.map((s) => root.localToWorld(s.point.clone())),
  ];
  const x0 =
    Math.floor((Math.min(...area.map((p) => p.x)) - margin + half) / step) * step -
    half;
  const x1 =
    Math.ceil((Math.max(...area.map((p) => p.x)) + margin + half) / step) * step - half;
  const z0 =
    Math.floor((Math.min(...area.map((p) => p.z)) - margin + half) / step) * step -
    half;
  const z1 =
    Math.ceil((Math.max(...area.map((p) => p.z)) + margin + half) / step) * step - half;
  const divisions = 8,
    fine = step / divisions;
  const positions: number[] = [],
    indices: number[] = [],
    colors: number[] = [];
  const ids = new Map<string, number>(),
    cells = new Map<string, number[]>();
  const color = new Color(),
    meadow = new Color('#89a875'),
    highland = new Color('#b5b68a'),
    wet = new Color('#566f62'),
    basinColor = new Color('#688f80');
  let maxDepth = 0,
    patchTriangles = 0,
    removedTriangles = 0;
  const local = new Vector3();
  function height(x: number, z: number) {
    const base = sampleOriginalGround(x, z, config);
    local.set(x, base, z).applyMatrix4(inverse);
    if (
      protectedZones.some(
        (zone) =>
          local.x >= zone.min[0]! - 0.35 &&
          local.x <= zone.max[0]! + 0.35 &&
          local.z >= zone.min[2]! - 0.35 &&
          local.z <= zone.max[2]! + 0.35,
      )
    )
      return base;
    const d = polygonDistance(local.x, local.z, guide.positions);
    let y = local.y;
    if (d > 0) {
      const bankWidth = 1.1 + 0.23 * Math.sin(local.x * 0.71 + local.z * 0.31);
      const bed = waterY - 0.08 - 1.85 * smoothstep(0, 3.8, d);
      y = Math.min(y, local.y + (bed - local.y) * smoothstep(0, bankWidth, d));
    }
    for (let i = 0; i < channel.length - 1; i++) {
      const a = channel[i]!,
        b = channel[i + 1]!;
      const dx = b.point.x - a.point.x,
        dz = b.point.z - a.point.z;
      const t = Math.max(
        0,
        Math.min(
          1,
          ((local.x - a.point.x) * dx + (local.z - a.point.z) * dz) /
            (dx * dx + dz * dz),
        ),
      );
      const distance = Math.hypot(
        local.x - a.point.x - dx * t,
        local.z - a.point.z - dz * t,
      );
      const width = a.width + (b.width - a.width) * t;
      const surface = a.point.y + (b.point.y - a.point.y) * t;
      const edge = width / 2 + 0.85;
      if (distance < edge) {
        const bed = surface - 0.26;
        const blend = 1 - smoothstep(width * 0.31, edge, distance);
        y = Math.min(y, local.y + (bed - local.y) * blend);
      }
    }
    const worldY = root.position.y + y * root.scale.x;
    maxDepth = Math.max(maxDepth, base - worldY);
    return Math.min(base, worldY);
  }
  function vertex(x: number, z: number, excavated: boolean) {
    // Only outer rectangle edges snap; all internal cells share their fine grid.
    if (excavated && (Math.abs(x - x0) < 1e-6 || Math.abs(x - x1) < 1e-6))
      z = Math.round((z + half) / step) * step - half;
    if (excavated && (Math.abs(z - z0) < 1e-6 || Math.abs(z - z1) < 1e-6))
      x = Math.round((x + half) / step) * step - half;
    const key = `${x.toFixed(6)},${z.toFixed(6)}`;
    if (ids.has(key)) return ids.get(key)!;
    const boundary = x === x0 || x === x1 || z === z0 || z === z1;
    const base = sampleOriginalGround(x, z, config),
      y = excavated && !boundary ? height(x, z) : base;
    const id = positions.length / 3;
    ids.set(key, id);
    positions.push(x, y, z);
    color.copy(meadow).lerp(highland, smoothstep(3, config.maxHeight, y));
    color.lerp(basinColor, smoothstep(0, config.maxHeight * 0.2, -y));
    color.lerp(wet, smoothstep(0.02, 0.4, base - y) * 0.62);
    color.toArray(colors, id * 3);
    return id;
  }
  function face(a: number, b: number, c: number, patch: boolean, cell: string) {
    if (a === b || b === c || a === c) return;
    const ax = positions[a * 3]!,
      az = positions[a * 3 + 2]!,
      bx = positions[b * 3]!,
      bz = positions[b * 3 + 2]!,
      cx = positions[c * 3]!,
      cz = positions[c * 3 + 2]!;
    const area = (bx - ax) * (cz - az) - (bz - az) * (cx - ax);
    if (Math.abs(area) < 1e-9) return;
    if (area > 0) [b, c] = [c, b]; // +Y normals.
    const index = indices.length;
    indices.push(a, b, c);
    if (patch) {
      patchTriangles++;
      const list = cells.get(cell) ?? [];
      list.push(index);
      cells.set(cell, list);
    }
  }
  for (let iz = 0; iz < config.segments; iz++)
    for (let ix = 0; ix < config.segments; ix++) {
      const x = ix * step - half,
        z = iz * step - half;
      const patch = x >= x0 && x < x1 && z >= z0 && z < z1,
        n = patch ? divisions : 1,
        h = patch ? fine : step;
      const cell = `${ix},${iz}`;
      if (patch) removedTriangles += 2;
      for (let j = 0; j < n; j++)
        for (let i = 0; i < n; i++) {
          const a = vertex(x + i * h, z + j * h, patch),
            b = vertex(x + i * h, z + (j + 1) * h, patch),
            d = vertex(x + (i + 1) * h, z + j * h, patch),
            c = vertex(x + (i + 1) * h, z + (j + 1) * h, patch);
          face(a, b, d, patch, cell);
          face(b, c, d, patch, cell);
        }
    }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  mesh.geometry = geometry;
  // Query Float32 positions, exactly as uploaded to the GPU, not the analytic bed.
  const p = geometry.attributes.position!;
  function sample(x: number, z: number) {
    if (x < x0 || x > x1 || z < z0 || z > z1) return undefined;
    const ix = Math.min(config.segments - 1, Math.floor((x + half) / step)),
      iz = Math.min(config.segments - 1, Math.floor((z + half) / step));
    for (const k of cells.get(`${ix},${iz}`) ?? []) {
      const a = indices[k]!,
        b = indices[k + 1]!,
        c = indices[k + 2]!;
      const ax = p.getX(a),
        az = p.getZ(a),
        bx = p.getX(b),
        bz = p.getZ(b),
        cx = p.getX(c),
        cz = p.getZ(c);
      const det = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz);
      const u = ((bz - cz) * (x - cx) + (cx - bx) * (z - cz)) / det,
        v = ((cz - az) * (x - cx) + (ax - cx) * (z - cz)) / det;
      if (u >= -1e-6 && v >= -1e-6 && u + v <= 1 + 1e-6)
        return u * p.getY(a) + v * p.getY(b) + (1 - u - v) * p.getY(c);
    }
    return undefined;
  }
  setTerrainSampler(config, sample);
  return {
    snapshot: () => ({
      excavationBounds: { x0, x1, z0, z1 },
      excavationDepth: maxDepth,
      terrainPatchTriangles: patchTriangles,
      removedTerrainTriangles: removedTriangles,
      patchSpacing: fine,
      waterSurfaceHeight: root.position.y + waterY * root.scale.x,
    }),
    dispose() {
      setTerrainSampler(config);
      mesh.geometry = original;
      geometry.dispose();
    },
  };
}
