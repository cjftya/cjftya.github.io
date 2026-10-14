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

// The raised precinct sits outside the existing circulation loop. Its entrance
// faces the lake; the side arcades describe a real open hall, not a single gate.
export const SANCTUARY_SITE = { x: 40, z: 38, yaw: -Math.PI / 3 };
const HALF_WIDTH = 18;
const HALF_DEPTH = 15;

export function createMagicalSanctuary(content: Group, originalArch: Group) {
  const group = new Group();
  group.name = 'MagicalSanctuary';
  content.add(group);
  const palette: Color[] = [];
  originalArch.traverse((child) => {
    if (!(child instanceof Mesh)) return;
    for (const m of Array.isArray(child.material) ? child.material : [child.material]) {
      if (!(m instanceof MeshStandardMaterial)) continue;
      palette[m.name.includes('WarmGray') ? 0 : m.name.includes('LightStone') ? 1 : 2] =
        m.color.clone();
    }
  });
  const material = new MeshStandardMaterial({
    color: 'white',
    vertexColors: true,
    flatShading: true,
    roughness: 0.9,
    metalness: 0,
  });
  material.name = 'JO_Sanctuary_ExistingRuinPalette';
  const owned = new Set<BufferGeometry>();
  let disposed = false,
    deckHeight = 0,
    mainArchHeight = 0;
  let structureDimensions: number[] = [];
  const c = Math.cos(SANCTUARY_SITE.yaw),
    s = Math.sin(SANCTUARY_SITE.yaw);
  const transform = (x: number, z: number) => ({
    x: SANCTUARY_SITE.x + x * c + z * s,
    z: SANCTUARY_SITE.z - x * s + z * c,
  });
  function clear() {
    group.clear();
    owned.forEach((g) => g.dispose());
    owned.clear();
  }
  function place(ground: (x: number, z: number) => number) {
    if (disposed) return;
    clear();
    mainArchHeight = 0;
    group.position.set(SANCTUARY_SITE.x, 0, SANCTUARY_SITE.z);
    group.rotation.y = SANCTUARY_SITE.yaw;
    const floorAt = (x: number, z: number) => {
      const p = transform(x, z);
      return ground(p.x, p.z);
    };
    const heights: number[] = [];
    for (let x = -HALF_WIDTH; x <= HALF_WIDTH; x += 3)
      for (let z = -HALF_DEPTH; z <= HALF_DEPTH; z += 3) heights.push(floorAt(x, z));
    deckHeight = Math.min(...heights) + 0.15;
    const parts: BufferGeometry[] = [];
    let ordinal = 0;
    const add = (g: BufferGeometry, moss = false) => {
      const tint = 0.94 + Math.sin(++ordinal * 7.13) * 0.055;
      const colors = palette.map((p) => p.clone().multiplyScalar(tint));
      if (moss) colors[1]!.lerp(new Color('#76836a'), 0.46);
      parts.push(paintFaces(g, colors));
    };
    const block = (
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      seed = 0,
      moss = false,
    ) => add(stoneBlock(x, y, z, w, h, d, seed), moss);
    const base = deckHeight + 0.08;
    // Pier courses use believable masonry scale, with larger footings/capitals.
    const pier = (x: number, z: number, h: number, w = 3.5, d = 4.4) => {
      block(x, base + 0.45, z, w + 1.6, 0.9, d + 1.6, ordinal, true);
      const rows = Math.ceil((h - 1.5) / 1.65),
        course = (h - 1.5) / rows;
      for (let row = 0; row < rows; row++) {
        const taper = 1 - (0.07 * row) / rows;
        // Bonded seams alternate in the thick masonry, not floating thin plates.
        for (const side of [-1, 1])
          block(
            x + (side * w * taper) / 4,
            base + 0.9 + (row + 0.5) * course,
            z,
            (w * taper) / 2 - 0.035,
            course - 0.045,
            d * (row % 2 ? 0.98 : 1),
            ordinal,
          );
      }
      block(x, base + h - 0.3, z, w + 0.7, 0.6, d + 0.8, ordinal);
    };
    const arch = (
      cx: number,
      z: number,
      spring: number,
      inner: number,
      thickness: number,
      depth: number,
      yaw = 0,
      broken = false,
    ) => {
      const n = 19,
        outer = inner + thickness;
      for (let i = 0; i < n; i++) {
        if (broken && i > 6) continue;
        const a = (i * Math.PI) / n + 0.0015,
          b = ((i + 1) * Math.PI) / n - 0.0015;
        const corners: Vector3[] = [];
        for (const zz of [-depth / 2, depth / 2])
          for (const [r, t] of [
            [inner, a],
            [outer, a],
            [outer, b],
            [inner, b],
          ]) {
            const xx = Math.cos(t!) * r!;
            corners.push(
              new Vector3(
                cx + xx * Math.cos(yaw) + zz * Math.sin(yaw),
                base + spring + Math.sin(t!) * r!,
                z - xx * Math.sin(yaw) + zz * Math.cos(yaw),
              ),
            );
          }
        add(stoneHull(corners, broken && i === 6 ? 0.13 : 0.022 + (i % 4) * 0.006));
      }
    };
    // Tall sanctuary end: deep main vault ring and two massive buttressed piers.
    const rear = -10.5;
    for (const side of [-1, 1]) {
      pier(side * 10.25, rear, 17.1, 4.5, 5.3);
      for (let row = 0; row < (side === -1 ? 9 : 8); row++) {
        const h = 1.85,
          w = 4.1 - row * 0.22;
        block(
          side * 14.1,
          base + (row + 0.5) * h,
          rear + 0.9,
          w,
          h - 0.05,
          6.6 - row * 0.34,
          ordinal,
          row === 0,
        );
      }
    }
    arch(0, rear, 17.0, 8.0, 4.2, 5.3);
    mainArchHeight = 29.2;
    block(-14.1, base + 16.8, rear, 4.7, 0.85, 4.3, 41);
    // A broken clerestory survives on the left wing, anchored on the pier.
    for (let row = 0; row < 4; row++) {
      block(
        -13.9,
        base + 17.0 + (row + 0.5) * 2.0,
        rear,
        4.6 - row * 0.45,
        1.95,
        3.8,
        ordinal,
      );
    }
    block(-14.6, base + 25.9, rear, 2.9, 1.65, 3.5, 31, true);
    // Lower entrance with enough open sky to see the high rear arch and altar.
    for (const side of [-1, 1]) pier(side * 9.25, 10.7, 11.8, 3.5, 3.8);
    arch(0, 10.7, 11.6, 7.5, 3.5, 3.8);
    // Two side bays form the nave. One bay is broken, with its fallen masonry
    // grounded beside it, making the silhouette asymmetric without random noise.
    for (const side of [-1, 1]) {
      for (const z of [-10.5, 0.1, 10.7]) {
        if (z !== -10.5)
          pier(side * 14.2, z, side === 1 && z === 10.7 ? 7.5 : 12.4, 2.5, 3.2);
      }
      arch(side * 14.2, -5.2, 12.2, 3.8, 1.75, 2.65, Math.PI / 2);
      arch(side * 14.2, 5.4, 12.2, 3.8, 1.75, 2.65, Math.PI / 2, side === 1);
      // Partial side enclosure, large staggered stones, visibly ruined top edge.
      for (let row = 0; row < 3; row++)
        for (let bay = 0; bay < 4; bay++) {
          if (side === 1 && bay > 1 && row > 0) continue;
          block(
            side * 16,
            base + 0.8 + row * 1.58,
            -8 + bay * 5.4,
            2.5,
            1.52,
            5.28,
            ordinal,
            row === 2,
          );
        }
    }
    // Broad stepped dais and a substantial stone altar at the end of the hall.
    for (let i = 0; i < 3; i++)
      block(0, base + 0.3 + i * 0.55, -5.5, 12 - i * 1.4, 0.58, 9 - i * 1.2, ordinal);
    block(0, base + 2.15, -5.5, 5.2, 1.6, 3.5, ordinal);
    block(0, base + 3.17, -5.5, 7.2, 0.55, 4.9, ordinal);
    const inlay = stoneBlock(0, base + 3.46, -5.5, 4.9, 0.055, 2.7, 21);
    const jade = new Color('#5e8279');
    parts.push(paintFaces(inlay, [jade, jade, jade]));
    // Fallen sections rest on the deck, kept away from the central aisle.
    for (let i = 0; i < 7; i++) {
      const stone = stoneBlock(
        10.5 + (i % 2) * 2.3,
        base + 0.8,
        2.5 + i * 1.18,
        2.4,
        1.55,
        2.0,
        i + 3,
      );
      stone
        .translate(-11.5, -base, -6)
        .rotateY(i * 0.47)
        .translate(11.5, base, 6);
      add(stone, i % 3 === 0);
    }
    const structureBounds = new Box3();
    for (const p of parts) {
      p.computeBoundingBox();
      structureBounds.union(p.boundingBox!);
    }
    structureDimensions = structureBounds.getSize(new Vector3()).toArray();
    // Low broad approach stones grounded at their corners. Avoid the old
    // bright double row of paving dots. This crosses the loop at ground level.
    const end = transform(0, 23);
    for (let i = 0; i < 12; i++) {
      const t = i / 11,
        wx = 18 + (end.x - 18) * t,
        wz = 17 + (end.z - 17) * t;
      const lx = (wx - SANCTUARY_SITE.x) * c - (wz - SANCTUARY_SITE.z) * s;
      const lz = (wx - SANCTUARY_SITE.x) * s + (wz - SANCTUARY_SITE.z) * c;
      const vertices: number[] = [];
      const point = (x: number, z: number, lower = false) => [
        x,
        floorAt(x, z) + (lower ? -0.23 : 0.025),
        z,
      ];
      const triangle = (a: number[], b: number[], c: number[]) =>
        vertices.push(...a, ...b, ...c);
      const n = 12;
      for (let j = 0; j < n; j++)
        for (let k = 0; k < n; k++) {
          const x = lx - 1.7 + (j * 3.4) / n,
            z = lz - 1.2 + (k * 2.4) / n;
          const a = point(x, z),
            b = point(x + 3.4 / n, z),
            c = point(x + 3.4 / n, z + 2.4 / n),
            d = point(x, z + 2.4 / n);
          triangle(a, d, b);
          triangle(b, d, c);
        }
      for (const [ax, az, bx, bz] of [
        [-1.7, -1.2, 1.7, -1.2],
        [1.7, -1.2, 1.7, 1.2],
        [1.7, 1.2, -1.7, 1.2],
        [-1.7, 1.2, -1.7, -1.2],
      ]) {
        for (let k = 0; k < n; k++) {
          const x1 = lx + ax! + ((bx! - ax!) * k) / n,
            z1 = lz + az! + ((bz! - az!) * k) / n;
          const x2 = lx + ax! + ((bx! - ax!) * (k + 1)) / n,
            z2 = lz + az! + ((bz! - az!) * (k + 1)) / n;
          const a = point(x1, z1),
            b = point(x2, z2),
            c = point(x2, z2, true),
            d = point(x1, z1, true);
          triangle(a, b, c);
          triangle(a, c, d);
        }
      }
      const slab = new BufferGeometry();
      slab.setAttribute('position', new Float32BufferAttribute(vertices, 3));
      slab.computeVertexNormals();
      add(slab, true);
    }
    const geometry = mergeStoneParts(parts);
    owned.add(geometry);
    const mesh = new Mesh(geometry, material);
    mesh.name = 'SanctuaryStonework';
    mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
    group.updateMatrixWorld(true);
  }
  function footprints(): Footprint[] {
    const corners = [
      transform(-19, -16),
      transform(19, -16),
      transform(-19, 23),
      transform(19, 23),
    ];
    return [
      {
        minX: Math.min(...corners.map((p) => p.x)),
        maxX: Math.max(...corners.map((p) => p.x)),
        minZ: Math.min(...corners.map((p) => p.z)),
        maxZ: Math.max(...corners.map((p) => p.z)),
      },
      // Keep the foreground sightline open, including tree canopy radii.
      { minX: 34, maxX: 70, minZ: 36, maxZ: 66 },
      { minX: 17, maxX: 42, minZ: 14, maxZ: 23 },
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
        terraceFootprint: [0, 0],
        archOpening: 16,
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
