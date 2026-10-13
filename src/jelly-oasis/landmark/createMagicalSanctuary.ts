import {
  Box3,
  Color,
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
  Vector3,
} from 'three';
import type { Footprint } from '../vegetation/vegetationPlacement';
import {
  mergeStoneParts,
  paintFaces,
  stoneBlock,
  stoneHull,
} from './sanctuaryGeometry';

// East of the protected circulation annulus. The low trail crosses it at grade;
// the raised terrace and steps start beyond its outer edge.
export const SANCTUARY_SITE = { x: 47, z: 9, yaw: -Math.PI / 3 };

export function createMagicalSanctuary(content: Group, originalArch: Group) {
  const group = new Group();
  group.name = 'MagicalSanctuary';
  content.add(group);
  const palette: Color[] = [];
  // Explicit names in the source GLB define warm/light/shadow order.
  originalArch.traverse((child) => {
    if (!(child instanceof Mesh)) return;
    for (const material of Array.isArray(child.material)
      ? child.material
      : [child.material]) {
      if (!(material instanceof MeshStandardMaterial)) continue;
      const index = material.name.includes('WarmGray')
        ? 0
        : material.name.includes('LightStone')
          ? 1
          : 2;
      palette[index] = material.color.clone();
    }
  });
  const material = new MeshStandardMaterial({
    color: 'white',
    vertexColors: true,
    flatShading: true,
    roughness: 0.85,
    metalness: 0,
  });
  material.name = 'JO_Sanctuary_ExistingRuinPalette';
  let disposed = false;
  let deckHeight = 0;
  let mainArchHeight = 0;
  let structureDimensions: number[] = [];
  const owned = new Set<BufferGeometry>();
  const c = Math.cos(SANCTUARY_SITE.yaw),
    s = Math.sin(SANCTUARY_SITE.yaw);
  const transform = (x: number, z: number) => ({
    x: SANCTUARY_SITE.x + x * c + z * s,
    z: SANCTUARY_SITE.z - x * s + z * c,
  });
  const inverse = (x: number, z: number) => ({
    x: (x - SANCTUARY_SITE.x) * c - (z - SANCTUARY_SITE.z) * s,
    z: (x - SANCTUARY_SITE.x) * s + (z - SANCTUARY_SITE.z) * c,
  });
  function clear() {
    group.clear();
    owned.forEach((geometry) => geometry.dispose());
    owned.clear();
  }
  function place(ground: (x: number, z: number) => number) {
    if (disposed) return;
    clear();
    group.position.set(SANCTUARY_SITE.x, 0, SANCTUARY_SITE.z);
    group.rotation.y = SANCTUARY_SITE.yaw;
    const heights: number[] = [];
    for (let x = -11; x <= 11; x += 2.2)
      for (let z = -6; z <= 6; z += 2) {
        const p = transform(x, z);
        heights.push(ground(p.x, p.z));
      }
    deckHeight = Math.max(...heights) + 0.48;
    const parts: BufferGeometry[] = [];
    const add = (g: BufferGeometry) => parts.push(paintFaces(g, palette));
    const block = (
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      seed = 0,
    ) => add(stoneBlock(x, y, z, w, h, d, seed));
    // Eight deep retaining faces follow the real slope down into the ground.
    const outline = [
      [-8, -6],
      [8, -6],
      [11, -3],
      [11, 3],
      [8, 6],
      [-8, 6],
      [-11, 3],
      [-11, -3],
    ];
    const bottom = outline.map(([x, z]) => {
      const p = transform(x!, z!);
      return ground(p.x, p.z) - 0.2;
    });
    for (let i = 0; i < outline.length; i++) {
      const a = outline[i]!,
        b = outline[(i + 1) % outline.length]!;
      const corners = [
        new Vector3(0, Math.min(...bottom), 0),
        new Vector3(a[0], bottom[i], a[1]),
        new Vector3(b[0], bottom[(i + 1) % bottom.length], b[1]),
        new Vector3(0, Math.min(...bottom), 0.05),
        new Vector3(0, deckHeight - 0.2, 0),
        new Vector3(a[0], deckHeight - 0.2, a[1]),
        new Vector3(b[0], deckHeight - 0.2, b[1]),
        new Vector3(0, deckHeight - 0.2, 0.05),
      ];
      // Convex closed sector with a narrow central spine; sectors meet beneath
      // the floor rather than hiding unsupported edges behind a floating plane.
      add(stoneHull(corners, 0.015));
    }
    // Large slabs, offset joints, no grid of tiny pavement blocks.
    for (let row = 0; row < 3; row++)
      for (let col = 0; col < 4; col++) {
        const x = -7.8 + col * 5.2 + (row === 1 ? 0.16 : 0),
          z = -3.75 + row * 3.75;
        const width = col === 0 || col === 3 ? 4.1 : 5.1;
        block(x, deckHeight - 0.14, z, width, 0.36, 3.66, row * 4 + col);
      }
    const base = deckHeight + 0.07;
    // Broad footings, slightly tapering courses, thick segmental voussoirs.
    for (const side of [-1, 1]) {
      block(side * 6.3, base + 0.35, -1.2, 3.9, 0.7, 4.1, side + 4);
      for (let row = 0; row < 3; row++)
        block(
          side * (6.25 - row * 0.09),
          base + 0.72 + row * 2.3 + 1.12,
          -1.2,
          2.85 - row * 0.1,
          2.24,
          3.05,
          row + (side + 1) * 3,
        );
      block(side * 6.08, base + 7.78, -1.2, 3.35, 0.55, 3.65, side + 7);
    }
    const spring = base + 7.64;
    for (let i = 0; i < 15; i++) {
      const a = (i * Math.PI) / 15 + 0.004,
        b = ((i + 1) * Math.PI) / 15 - 0.004;
      const outer = 7.45 + (i === 9 ? -0.36 : i === 2 ? 0.14 : 0);
      const corners: Vector3[] = [];
      for (const z of [-2.76, 0.34])
        for (const [r, t] of [
          [5.15, a],
          [outer, a],
          [outer, b],
          [5.15, b],
        ])
          corners.push(new Vector3(Math.cos(t!) * r!, spring + Math.sin(t!) * r!, z));
      const archStone = stoneHull(corners, i === 9 ? 0.09 : 0.035);
      archStone.computeBoundingBox();
      mainArchHeight = Math.max(
        mainArchHeight,
        archStone.boundingBox!.max.y - deckHeight,
      );
      add(archStone);
    }
    // Altar pedestal; a small inlay is reserved without adding glow or lights.
    block(0, base + 0.22, 2.15, 4.8, 0.44, 3.8, 13);
    block(0, base + 0.7, 2.15, 3.4, 0.52, 2.7, 14);
    block(0, base + 1.42, 2.15, 2.0, 0.95, 1.7, 15);
    block(0, base + 2.12, 2.15, 3.7, 0.5, 2.75, 16);
    block(-1.34, base + 2.47, 2.15, 0.4, 0.2, 2.15, 20);
    block(1.34, base + 2.47, 2.15, 0.4, 0.2, 2.15, 21);
    block(0, base + 2.47, 1.27, 2.35, 0.2, 0.4, 22);
    block(0, base + 2.47, 3.03, 2.35, 0.2, 0.4, 23);
    const inlay = stoneBlock(0, base + 2.38, 2.15, 2.13, 0.05, 1.32, 24);
    const inlayColor = palette[2]!.clone().lerp(new Color('#687c76'), 0.65);
    parts.push(paintFaces(inlay, [inlayColor, inlayColor, inlayColor]));
    for (const [x, z, h] of [
      [-9.1, 3.65, 5.2],
      [8.8, 2.9, 2.5],
    ]) {
      block(x!, base + 0.3, z!, 2.8, 0.6, 2.65, 17);
      for (let row = 0; row < Math.ceil(h! / 1.7); row++)
        block(x!, base + 0.6 + row * 1.7 + 0.78, z!, 1.75, 1.56, 1.8, row + 18);
    }
    // Wide steps start outside the six-metre loop; each has deep terrain support.
    for (let step = 0; step < 4; step++) {
      const z = 6.15 + step * 0.75,
        p = transform(0, z),
        floor = ground(p.x, p.z) - 0.14;
      const top = deckHeight - (step + 1) * 0.22;
      block(0, (floor + top) / 2, z, 5.2, Math.max(0.22, top - floor), 0.82, step + 24);
    }
    const structureBounds = new Box3();
    for (const part of parts) {
      part.computeBoundingBox();
      structureBounds.union(part.boundingBox!);
    }
    structureDimensions = structureBounds.getSize(new Vector3()).toArray();
    // Curve around Rock_Large_C. The tops query the same rendered terrain
    // sampler at a 0.3m spacing, so slabs do not clip into sloping ground.
    const end = transform(0, 9.6);
    const path = [
      [13.7, 12.2],
      [19.5, 13.6],
      [28, 13.6],
      [end.x, end.z],
    ];
    const trailPositions: number[] = [];
    const face = (a: number[], b: number[], d: number[]) =>
      trailPositions.push(...a, ...b, ...d);
    for (let i = 0; i < 13; i++) {
      const progress = (i / 12) * (path.length - 1),
        span = Math.min(path.length - 2, Math.floor(progress)),
        t = progress - span;
      const a = path[span]!,
        b = path[span + 1]!,
        dx = b[0]! - a[0]!,
        dz = b[1]! - a[1]!,
        len = Math.hypot(dx, dz);
      const centerX = a[0]! + dx * t,
        centerZ = a[1]! + dz * t;
      for (const side of [-1, 1]) {
        const offset = side * 0.95;
        const vertex = (u: number, v: number) => {
          const x = centerX + (dx / len) * v - (dz / len) * (u + offset),
            z = centerZ + (dz / len) * v + (dx / len) * (u + offset);
          const local = inverse(x, z);
          return [local.x, ground(x, z) + 0.028, local.z];
        };
        const n = 6;
        for (let j = 0; j < n; j++)
          for (let k = 0; k < n; k++) {
            const u = -0.86 + (j * 1.72) / n,
              v = -0.85 + (k * 1.7) / n;
            const p = vertex(u, v),
              q = vertex(u + 1.72 / n, v),
              r = vertex(u + 1.72 / n, v + 1.7 / n),
              s = vertex(u, v + 1.7 / n);
            face(p, q, s);
            face(q, r, s);
          }
        for (let edge = 0; edge < 4; edge++) {
          const corners = [
            [-0.86, -0.85],
            [0.86, -0.85],
            [0.86, 0.85],
            [-0.86, 0.85],
          ];
          const a = corners[edge]!,
            b = corners[(edge + 1) % 4]!;
          const p = vertex(a[0]!, a[1]!),
            q = vertex(b[0]!, b[1]!),
            r = [q[0]!, q[1]! - 0.23, q[2]!],
            s = [p[0]!, p[1]! - 0.23, p[2]!];
          face(p, q, r);
          face(p, r, s);
        }
      }
    }
    const trail = new BufferGeometry();
    trail.setAttribute('position', new Float32BufferAttribute(trailPositions, 3));
    trail.computeVertexNormals();
    add(trail);
    const geometry = mergeStoneParts(parts);
    owned.add(geometry);
    const mesh = new Mesh(geometry, material);
    mesh.name = 'SanctuaryStonework';
    mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
    group.updateMatrixWorld(true);
  }
  function footprints(): Footprint[] {
    return [
      { minX: 34.9, maxX: 59, minZ: -4, maxZ: 22.5 },
      { minX: 13, maxX: 39.5, minZ: 10, maxZ: 16 },
    ];
  }
  return {
    group,
    place,
    footprints,
    snapshot: () => {
      const bounds = new Box3().setFromObject(group);
      return {
        site: SANCTUARY_SITE,
        deckHeight,
        worldBounds: { min: bounds.min.toArray(), max: bounds.max.toArray() },
        structureDimensions: [...structureDimensions],
        mainArchHeightAboveDeck: mainArchHeight,
        terraceFootprint: [22, 12],
        archOpening: 10.3,
        triangles: [...owned].reduce((n, g) => n + g.attributes.position!.count / 3, 0),
        materials: 1,
        palette: palette.map((c) => c.toArray()),
        visible: group.visible,
      };
    },
    refreshMaterials: () => {
      material.needsUpdate = true;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      clear();
      material.dispose();
      group.removeFromParent();
    },
  };
}
