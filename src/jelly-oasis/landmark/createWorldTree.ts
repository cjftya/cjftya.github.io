import {
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshStandardMaterial,
  Vector3,
} from 'three';
import {
  mergeStoneParts,
  paintFaces,
  stoneBlock,
  stoneHull,
} from './sanctuaryGeometry';
import type { Footprint } from '../vegetation/vegetationPlacement';

// Landmark-local coordinates. The open southeast sector keeps the lake and
// existing approach clear; the ruined enclosure occupies the wooded hillside.
const segments = [
  { angle: 2.85, radius: 36, length: 15, height: 9 },
  { angle: 3.48, radius: 28, length: 15, height: 13 },
  { angle: 4.08, radius: 30, length: 17, height: 10 },
  { angle: 4.73, radius: 29, length: 16, height: 15 },
  { angle: 5.36, radius: 38, length: 12, height: 10 },
  { angle: 2.22, radius: 23, length: 10, height: 6 },
];
const tx = -12,
  tz = -18;
export function createWorldTree(content: Group, modules: Map<string, Group>) {
  const group = new Group();
  group.name = 'WorldTreePrecinct';
  content.add(group);
  const original = modules.get('Tree_Landmark_Blockout')!;
  const palette = [new Color('#77786b'), new Color('#a6a68b'), new Color('#555e55')];
  modules.get('Ruin_Arch_A')!.traverse((o) => {
    if (!(o instanceof Mesh)) return;
    for (const m of Array.isArray(o.material) ? o.material : [o.material])
      if (m instanceof MeshStandardMaterial)
        palette[
          m.name.includes('WarmGray') ? 0 : m.name.includes('LightStone') ? 1 : 2
        ] = m.color.clone();
  });
  const material = new MeshStandardMaterial({
    color: 'white',
    vertexColors: true,
    flatShading: true,
    roughness: 0.95,
  });
  material.name = 'JO_WorldTree_Faceted';
  let owned: BufferGeometry[] = [],
    disposed = false;
  const footprints: Footprint[] = [];
  function clear() {
    group.clear();
    owned.forEach((g) => g.dispose());
    owned = [];
    footprints.length = 0;
  }
  function place(ground: (x: number, z: number) => number) {
    if (disposed) return;
    clear();
    // Keep loaded source assets available for audits and resource disposal.
    for (const name of [
      'Tree_Landmark_Blockout',
      'Root_Tree_Base_Blockout',
      'Root_Large_A',
    ])
      modules.get(name)!.children.forEach((o) => {
        o.visible = false;
      });
    const base = ground(tx, tz) - 0.5;
    const wood: BufferGeometry[] = [],
      leaves: BufferGeometry[] = [],
      stones: BufferGeometry[] = [];
    const bark = [new Color('#66513d'), new Color('#857052'), new Color('#493f33')];
    const canopy = [new Color('#577b3a'), new Color('#83a655'), new Color('#3f6135')];
    // Variable-radius swept rings give branches a continuous taper, avoiding
    // cylinder joints. Every face is flat; no external textures or subdivision.
    function limb(points: Vector3[], radii: number[], into = wood, seed = 0) {
      const curve = new CatmullRomCurve3(points),
        rings = Math.max(12, points.length * 5),
        sides = 9;
      const frames = curve.computeFrenetFrames(rings, false);
      const positions: number[] = [],
        ring: Vector3[][] = [];
      for (let i = 0; i <= rings; i++) {
        const t = i / rings,
          p = curve.getPoint(t);
        const right = frames.normals[i]!;
        const up = frames.binormals[i]!.clone().negate();
        const f = t * (radii.length - 1),
          j = Math.min(radii.length - 2, Math.floor(f));
        const radius = radii[j]! + (radii[j + 1]! - radii[j]!) * (f - j);
        ring.push(
          Array.from({ length: sides }, (_, k) => {
            const a = (k * Math.PI * 2) / sides;
            const r =
              radius *
              (1 + 0.12 * Math.sin(k * 2.7 + seed) + 0.035 * Math.sin(i * 0.8 + k));
            return p
              .clone()
              .addScaledVector(right, Math.cos(a) * r)
              .addScaledVector(up, Math.sin(a) * r);
          }),
        );
      }
      const tri = (a: Vector3, b: Vector3, c: Vector3) =>
        positions.push(...a.toArray(), ...c.toArray(), ...b.toArray());
      for (let i = 0; i < rings; i++)
        for (let j = 0; j < sides; j++) {
          const k = (j + 1) % sides;
          tri(ring[i]![j]!, ring[i]![k]!, ring[i + 1]![j]!);
          tri(ring[i]![k]!, ring[i + 1]![k]!, ring[i + 1]![j]!);
        }
      for (let j = 0; j < sides; j++) {
        tri(points[0]!, ring[0]![(j + 1) % sides]!, ring[0]![j]!);
        tri(points.at(-1)!, ring[rings]![j]!, ring[rings]![(j + 1) % sides]!);
      }
      const g = new BufferGeometry();
      g.setAttribute('position', new Float32BufferAttribute(positions, 3));
      g.computeVertexNormals();
      into.push(paintFaces(g, bark));
    }
    const p = (x: number, y: number, z: number) =>
      new Vector3(tx + x, base + y, tz + z);
    limb(
      [p(0, 0, 0), p(-1, 12, 1), p(1, 26, 0), p(-2, 39, 0), p(1, 53, -2), p(0, 64, -1)],
      [5.7, 4.8, 3.6, 2.5, 1.4, 0.25],
    );
    function crown(x: number, y: number, z: number, width: number, seed: number) {
      // Overlapping asymmetric lobes form a broad layered canopy, with small
      // peripheral clusters breaking the silhouette instead of a stack of balls.
      for (let j = 0; j < 8; j++) {
        const a = j * 2.399 + seed,
          r = j ? width * (0.5 + (j % 3) * 0.09) : 0;
        const g = new IcosahedronGeometry(1, 1);
        const v = g.attributes.position!;
        for (let k = 0; k < v.count; k++) {
          const xx = v.getX(k),
            yy = v.getY(k),
            zz = v.getZ(k);
          const d = 1 + 0.12 * Math.sin(xx * 7 + zz * 9 + seed);
          v.setXYZ(k, xx * d, yy * d, zz * d);
        }
        const w = width * (j ? 0.47 + (j % 3) * 0.065 : 0.75);
        g.scale(w, w * (0.35 + 0.06 * (j % 3)), w * 0.83);
        g.rotateY(a);
        g.translate(
          tx + x + Math.cos(a) * r,
          base + y + Math.sin(j * 4 + seed) * 1.8,
          tz + z + Math.sin(a) * r,
        );
        g.computeVertexNormals();
        leaves.push(
          paintFaces(
            g,
            canopy.map((c) =>
              c.clone().multiplyScalar(0.93 + 0.08 * Math.sin(seed + j)),
            ),
          ),
        );
      }
    }
    for (let i = 0; i < 11; i++) {
      const a = i * 2.399,
        reach = 23 + (i % 3) * 3.5,
        height = 37 + (i % 4) * 6;
      const dx = Math.cos(a),
        dz = Math.sin(a);
      limb(
        [
          p(0, 18 + i * 1.8, 0),
          p(dx * 7, height - 12, dz * 6),
          p(dx * reach * 0.7, height - 4, dz * reach * 0.7),
          p(dx * reach, height, dz * reach),
        ],
        [3.2 - i * 0.12, 2.3, 1.1, 0.13],
        wood,
        i,
      );
      crown(dx * reach * 0.83, height + 3, dz * reach * 0.83, 10 + (i % 3), i);
      for (const side of [-1, 1]) {
        const b = a + side * 0.38;
        limb(
          [
            p(dx * reach * 0.6, height - 6, dz * reach * 0.6),
            p(Math.cos(b) * reach * 0.9, height - 1, Math.sin(b) * reach * 0.9),
            p(Math.cos(b) * reach, height + 2, Math.sin(b) * reach),
          ],
          [1.2, 0.7, 0.08],
          wood,
          i + side,
        );
      }
    }
    crown(0, 64, 0, 17, 17);
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5 + 0.4;
      const x = Math.cos(a) * 15,
        z = Math.sin(a) * 15;
      limb(
        [p(-2, 39, 0), p(x * 0.55, 51, z * 0.55), p(x, 58, z)],
        [2.1, 1.1, 0.12],
        wood,
        i + 30,
      );
      crown(x, 59 + (i % 2) * 2, z, 13.5, i + 22);
    }
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i]!,
        dx = Math.cos(seg.angle),
        dz = Math.sin(seg.angle);
      const cx = tx + dx * seg.radius,
        cz = tz + dz * seg.radius;
      const floor = ground(cx, cz) - 0.25;
      const rows = Math.ceil(seg.height / 1.5),
        cols = Math.ceil(seg.length / 3);
      for (let col = 0; col < cols; col++) {
        const top = Math.max(
          2,
          rows -
            Math.floor(Math.abs(col - cols * 0.4) * 0.75) -
            (col % 3 === 0 ? 1 : 0),
        );
        for (let row = 0; row < top; row++) {
          const along = (col - (cols - 1) / 2) * 3 + (row % 2 ? 0.28 : -0.15);
          const x = cx - dz * along,
            z = cz + dx * along;
          const g = stoneBlock(
            0,
            0,
            0,
            2.94,
            1.44,
            2.5 + (row === 0 ? 0.6 : 0),
            i * 19 + row + col,
          );
          g.rotateY(-seg.angle - Math.PI / 2);
          g.translate(x, floor + (row + 0.5) * 1.5, z);
          stones.push(paintFaces(g, palette));
        }
      }
      // Grounded rubble at the broken ends, away from the open lake sector.
      for (let j = 0; j < 4; j++) {
        const x = cx - dz * (seg.length / 2 + j * 0.7) + dx * 2,
          z = cz + dx * (seg.length / 2 + j * 0.7) + dz * 2;
        const g = stoneBlock(0, 0, 0, 2.3, 1.3, 1.8, j);
        g.rotateY(j * 0.7);
        g.translate(x, ground(x, z) + 0.45, z);
        stones.push(paintFaces(g, palette));
      }
      const wallTop = floor + Math.max(2, rows - 1) * 1.5;
      const point = (r: number, y: number, bend = 0) =>
        new Vector3(tx + dx * r - dz * bend, y, tz + dz * r + dx * bend);
      const inner = seg.radius - 5,
        outer = seg.radius + 5;
      limb(
        [
          p(dx * 2, 2, dz * 2),
          point(inner * 0.5, ground(tx + dx * inner * 0.5, tz + dz * inner * 0.5) + 1),
          point(inner, ground(tx + dx * inner, tz + dz * inner) + 1.4),
          point(seg.radius - 1.5, wallTop + 0.8),
          point(seg.radius + 1.5, wallTop + 0.6, 0.7),
          point(outer, ground(tx + dx * outer, tz + dz * outer) + 0.6, 1),
          point(
            outer + 4,
            ground(tx + dx * (outer + 4), tz + dz * (outer + 4)) - 0.2,
            1,
          ),
        ],
        [3.5, 2.6, 1.9, 1.45, 1.25, 0.65, 0.08],
        wood,
        i,
      );
      footprints.push({
        minX: cx - (Math.abs(dz) * seg.length) / 2 - 4,
        maxX: cx + (Math.abs(dz) * seg.length) / 2 + 4,
        minZ: cz - (Math.abs(dx) * seg.length) / 2 - 4,
        maxZ: cz + (Math.abs(dx) * seg.length) / 2 + 4,
      });
    }
    // A small intact arch in the western enclosure, separate from the main hall.
    const ax = tx - 25,
      az = tz - 8,
      ay = ground(ax, az);
    for (const side of [-1, 1])
      for (let row = 0; row < 4; row++)
        stones.push(
          paintFaces(
            stoneBlock(ax + side * 3.6, ay + (row + 0.5) * 1.5, az, 2, 1.45, 2.5, row),
            palette,
          ),
        );
    for (let j = 0; j < 11; j++) {
      const corners: Vector3[] = [];
      for (const z of [-1.25, 1.25])
        for (const [r, a] of [
          [2.6, (j * Math.PI) / 11],
          [4.6, (j * Math.PI) / 11],
          [4.6, ((j + 1) * Math.PI) / 11],
          [2.6, ((j + 1) * Math.PI) / 11],
        ])
          corners.push(
            new Vector3(ax + Math.cos(a!) * r!, ay + 6 + Math.sin(a!) * r!, az + z),
          );
      stones.push(paintFaces(stoneHull(corners), palette));
    }
    // Exposed buttresses settle into the earth before reaching the circulation loop.
    for (let i = 0; i < 9; i++) {
      const a = (i * Math.PI * 2) / 9,
        dx = Math.cos(a),
        dz = Math.sin(a),
        reach = 10 + (i % 3) * 1.7;
      limb(
        [
          p(dx, 5, dz),
          p(dx * 5, 1, dz * 5),
          new Vector3(
            tx + dx * reach,
            ground(tx + dx * reach, tz + dz * reach) - 0.2,
            tz + dz * reach,
          ),
        ],
        [2.2, 1.5, 0.08],
        wood,
        i,
      );
    }
    // The six-metre circulation ring stays open. Roots dive under its soil,
    // then emerge on the far side; masonry intersecting that band is omitted.
    for (const g of wood) {
      const v = g.attributes.position!;
      for (let i = 0; i < v.count; i++) {
        const x = v.getX(i),
          z = v.getZ(i),
          y = v.getY(i),
          floor = ground(x, z);
        const d = Math.abs(Math.hypot(x / 34, z / 32) - 1);
        if (y < floor + 5 && d < 0.25) {
          const t = Math.min(1, (0.25 - d) / 0.08);
          v.setY(i, y + (Math.min(y, floor - 0.55) - y) * t);
        }
      }
      g.computeVertexNormals();
    }
    for (let i = stones.length - 1; i >= 0; i--) {
      const g = stones[i]!,
        v = g.attributes.position!;
      let lo = Infinity,
        hi = -Infinity;
      for (let j = 0; j < v.count; j++) {
        const q = Math.hypot(v.getX(j) / 34, v.getZ(j) / 32);
        lo = Math.min(lo, q);
        hi = Math.max(hi, q);
      }
      if (lo < 1.13 && hi > 0.87) {
        g.dispose();
        stones.splice(i, 1);
      }
    }
    for (const [name, parts] of [
      ['WorldTreeWood', wood],
      ['WorldTreeCanopy', leaves],
      ['WorldTreeRuins', stones],
    ] as const) {
      const g = mergeStoneParts(parts);
      owned.push(g);
      const mesh = new Mesh(g, material);
      mesh.name = name;
      mesh.castShadow = mesh.receiveShadow = true;
      group.add(mesh);
    }
    original.updateMatrixWorld(true);
    group.updateMatrixWorld(true);
  }
  return {
    group,
    place,
    footprints: () => footprints,
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
