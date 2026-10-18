import { sanctuarySurface } from '../environment/sanctuarySurface';
import { windWeights } from '../animation/vegetationWind';
import {
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  Float32BufferAttribute,
  Group,
  Raycaster,
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
import { foliageCrown, leafBlade } from './treeFoliage';
import { createPrecinctGarden } from './createPrecinctGarden';
import type { LayoutGuide } from './landmarkConfig';
import type { Footprint } from '../vegetation/vegetationPlacement';

// Landmark-local coordinates. The open southeast sector keeps the lake and
// existing approach clear; the ruined enclosure occupies the wooded hillside.
const segments = [
  { angle: 2.85, radius: 36, length: 15, height: 4 },
  { angle: 3.48, radius: 28, length: 15, height: 5 },
  { angle: 4.08, radius: 30, length: 17, height: 4 },
  { angle: 4.73, radius: 29, length: 16, height: 5 },
  { angle: 5.36, radius: 38, length: 12, height: 4 },
  { angle: 2.22, radius: 23, length: 10, height: 3 },
];
const tx = -12,
  tz = -18;
export function createWorldTree(
  content: Group,
  modules: Map<string, Group>,
  pond: LayoutGuide,
  approach: LayoutGuide,
  mobile = false,
) {
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
  // Patchy weathering on selected enclosure blocks; the arch material stays intact.
  const mossPalette = palette.map((color, i) =>
    color.clone().lerp(new Color('#74805a'), i === 1 ? 0.3 : 0.12),
  );
  const material = new MeshStandardMaterial({
    color: 'white',
    vertexColors: true,
    flatShading: true,
    roughness: 0.95,
  });
  material.name = 'JO_WorldTree_Faceted';
  const rootMaterial = material.clone();
  rootMaterial.name = 'JO_WorldTree_RootLight';
  rootMaterial.emissive.set('#b08ee0');
  const rootNight = { value: 0 };
  rootMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.rootNight = rootNight;
    shader.vertexShader =
      'attribute float rootGlow; varying float vRootGlow;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nvRootGlow = rootGlow;',
    );
    shader.fragmentShader =
      'uniform float rootNight; varying float vRootGlow;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\ntotalEmissiveRadiance *= vRootGlow * mix(.12, 1.5, rootNight);',
    );
  };
  rootMaterial.customProgramCacheKey = () => 'oasis-root-light-v1';
  sanctuarySurface(material);
  sanctuarySurface(rootMaterial);
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
      stones: BufferGeometry[] = [],
      vines: BufferGeometry[] = [];
    const bark = [new Color('#8b704d'), new Color('#a78c61'), new Color('#68563d')];
    // Variable-radius swept rings give branches a continuous taper, avoiding
    // cylinder joints. Every face is flat; no external textures or subdivision.
    function limb(points: Vector3[], radii: number[], into = wood, seed = 0) {
      const curve = new CatmullRomCurve3(points),
        rings = Math.max(12, points.length * (radii[0]! > 4 ? 9 : 5)),
        sides = radii[0]! > 4 ? 24 : radii[0]! > 1 ? 14 : 6;
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
            const a = (k * Math.PI * 2) / sides + 0.16 * Math.sin(t * 5 + seed);
            const r =
              radius *
              (1 + 0.16 * Math.sin(k * 2.7 + seed) + 0.055 * Math.sin(i * 0.55 + k));
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
      paintFaces(g, bark);
      if (into === wood) {
        const v = g.attributes.position!,
          colors = g.attributes.color!;
        for (let i = 0; i < v.count; i += 3) {
          const x = (v.getX(i) + v.getX(i + 1) + v.getX(i + 2)) / 3,
            y = (v.getY(i) + v.getY(i + 1) + v.getY(i + 2)) / 3,
            z = (v.getZ(i) + v.getZ(i + 1) + v.getZ(i + 2)) / 3;
          const shade =
            0.95 +
            0.12 * Math.sin(x * 2.4 + z * 1.9 + y * 0.16) +
            0.045 * Math.sin(y * 1.7 + seed);
          for (let j = i; j < i + 3; j++)
            colors.setXYZ(
              j,
              colors.getX(j) * shade,
              colors.getY(j) * shade,
              colors.getZ(j) * shade,
            );
        }
      }
      const tip = points.at(-1)!;
      const branch = into === wood && radii[0]! <= 3.2 && points[0]!.y > base + 15;
      windWeights(g, tip.x, tip.z, (x, y, z) => {
        if (!branch) return [0, 0];
        const t = Math.max(0, 1 - Math.hypot(x - tip.x, y - tip.y, z - tip.z) / 3);
        return [0.22 * t * t, 0];
      });
      into.push(g);
    }
    const p = (x: number, y: number, z: number) =>
      new Vector3(tx + x, base + y, tz + z);
    limb(
      [p(0, 0, 0), p(-1, 12, 1), p(1, 26, 0), p(-2, 39, 0), p(1, 53, -2), p(0, 64, -1)],
      [7, 5.7, 4, 2.7, 1.4, 0.25],
    );
    function trailingVine(start: Vector3, length: number, seed: number) {
      const points = Array.from({ length: 6 }, (_, i) =>
        start
          .clone()
          .add(
            new Vector3(
              Math.sin(i * 0.8 + seed) * 0.55,
              (-length * i) / 5,
              Math.cos(i * 0.9 + seed) * 0.45,
            ),
          ),
      );
      limb(points, [0.085, 0.06, 0.035, 0.012], vines, seed);
      const swayVine = (g: BufferGeometry) =>
        windWeights(g, start.x, start.z, (_x, y) => {
          const t = Math.min(1, Math.max(0, (points[0]!.y - y) / length));
          return [0.7 * t * t, 0];
        });
      swayVine(vines.at(-1)!);
      const curve = new CatmullRomCurve3(points),
        count = Math.ceil(length * 2.3);
      for (let i = 0; i < count; i++)
        for (const side of [-1, 1])
          leaves.push(
            swayVine(
              leafBlade(
                curve.getPoint(i / count),
                seed + side * 1.3,
                1.05 + 0.35 * Math.sin(i * 2.7 + seed),
                new Color(i % 3 ? '#6e8c42' : '#92a754'),
              ),
            ),
          );
    }
    function crown(x: number, y: number, z: number, width: number, seed: number) {
      leaves.push(...foliageCrown(p(x, y, z), width, seed, mobile));
      for (let i = 0; i < 3; i++) {
        const a = seed + i * 2.399;
        trailingVine(
          p(
            x + Math.cos(a) * width * 0.65,
            y - width * 0.24,
            z + Math.sin(a) * width * 0.65,
          ),
          7 + ((seed + i) % 8),
          seed + i,
        );
      }
    }
    for (let i = 0; i < 11; i++) {
      const a = i * 2.399,
        reach = 23 + (i % 3) * 3.5,
        height = 35 + (i % 4) * 6;
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
    crown(0, 62, 0, 17, 17);
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
    for (let i = 0; i < 6; i++) {
      const a = i * 2.399;
      trailingVine(
        p(Math.cos(a) * 4.4, 22 + (i % 3) * 2, Math.sin(a) * 4.4),
        12 + (i % 4),
        i + 40,
      );
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
          const seed = i * 31 + row * 7 + col * 13;
          const exposed = row === top - 1;
          const g = stoneBlock(
            0,
            0,
            0,
            2.86 + 0.08 * Math.sin(seed),
            1.44,
            2.5 + (row === 0 ? 0.6 : 0) + 0.16 * Math.cos(seed),
            seed,
            exposed ? 0.045 : 0.015,
          );
          g.rotateY(-seg.angle - Math.PI / 2 + (exposed ? 0.025 * Math.sin(seed) : 0));
          g.translate(x, floor + (row + 0.5) * 1.5, z);
          stones.push(paintFaces(g, (col + i) % 3 === 0 ? mossPalette : palette));
        }
      }
      // Grounded rubble at the broken ends, away from the open lake sector.
      for (let j = 0; j < 4; j++) {
        const x = cx - dz * (seg.length / 2 + j * 0.7) + dx * 2,
          z = cz + dx * (seg.length / 2 + j * 0.7) + dz * 2;
        const g = stoneBlock(0, 0, 0, 2.3, 1.3, 1.8, i * 7 + j, 0.07);
        g.rotateY(j * 0.7);
        g.translate(x, ground(x, z) + 0.45, z);
        stones.push(paintFaces(g, palette));
      }
      const wallTop = floor + Math.max(2, rows - 1) * 1.5;
      for (let v = 0; v < 3; v++) {
        const along = (v - 1) * seg.length * 0.23;
        trailingVine(
          new Vector3(
            cx - dz * along + dx * 1.35,
            wallTop - 1.5,
            cz + dx * along + dz * 1.35,
          ),
          Math.max(3, seg.height - 3),
          i + v,
        );
      }
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
        [2.2, 1.5, 0.95, 0.7, 0.55, 0.3, 0.04],
        wood,
        i,
      );
      for (const side of [-1, 1]) {
        const r = seg.radius * 0.55,
          x = tx + dx * r,
          z = tz + dz * r,
          ex = x - dz * side * 5 + dx * 5,
          ez = z + dx * side * 5 + dz * 5;
        limb(
          [
            new Vector3(x, ground(x, z) + 0.7, z),
            new Vector3(
              (x + ex) / 2,
              ground((x + ex) / 2, (z + ez) / 2) + 0.4,
              (z + ez) / 2,
            ),
            new Vector3(ex, ground(ex, ez) - 0.2, ez),
          ],
          [0.8, 0.4, 0.04],
          wood,
          i + side,
        );
      }
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
    // Attach foliage to the actual rock surface, rather than burying it inside the cliff.
    content.updateWorldMatrix(true, true);
    const cliff = modules.get('Cliff_Waterfall_A')!,
      ray = new Raycaster(),
      down = new Vector3(0, -1, 0);
    for (const [x, z, width] of [
      [-5, -12, 3.8],
      [1, -10, 4],
      [6, -13, 3],
      [-7, -16, 3],
    ] as const) {
      ray.set(content.localToWorld(new Vector3(x, ground(x, z) + 35, z)), down);
      const hit = ray.intersectObject(cliff, true)[0];
      if (hit) {
        const pos = content.worldToLocal(hit.point.clone());
        leaves.push(
          ...foliageCrown(pos.add(new Vector3(0, width * 0.2, 0)), width, x + z, true),
        );
      }
    }
    const front = new Vector3(0, 0, -1).transformDirection(content.matrixWorld);
    for (let col = 0; col < 7; col++) {
      const x = -7 + col * 2,
        points: Vector3[] = [];
      for (let row = 0; row < 14; row++) {
        const y = ground(x, -10) + 14 - row * 0.85;
        ray.set(
          content.localToWorld(new Vector3(x + 0.25 * Math.sin(row + col), y, 5)),
          front,
        );
        const hit = ray.intersectObject(cliff, true)[0];
        if (!hit) continue;
        const pos = content
          .worldToLocal(hit.point.clone())
          .add(new Vector3(0, 0, 0.12));
        points.push(pos);
        if ((row + col) % 3 !== 0)
          leaves.push(leafBlade(pos, col + row * 2.399, 0.9, new Color('#849f50')));
      }
      if (points.length > 2) limb(points, [0.065, 0.04, 0.01], vines, col);
    }
    const garden = createPrecinctGarden(ground, pond, approach, mobile);
    footprints.push(...garden.footprints);
    for (const vine of vines)
      paintFaces(vine, [
        new Color('#586644'),
        new Color('#65794b'),
        new Color('#47573b'),
      ]);
    for (const [name, parts] of [
      ['WorldTreeWood', wood],
      ['WorldTreeCanopy', leaves],
      ['WorldTreeRuins', stones],
      ['WorldTreeVines', vines],
      ['PrecinctPlants', garden.plants],
      ['PrecinctStones', garden.stones],
    ] as const) {
      if (!parts.length) continue;
      if (
        [
          'WorldTreeWood',
          'WorldTreeCanopy',
          'WorldTreeVines',
          'PrecinctPlants',
        ].includes(name)
      )
        for (const part of parts)
          if (!part.hasAttribute('oasisWind')) windWeights(part, 0, 0, () => [0, 0]);
      const g = mergeStoneParts(parts);
      if (name === 'WorldTreeWood') {
        const positions = g.attributes.position!;
        const glow = new Float32Array(positions.count);
        for (let i = 0; i < positions.count; i++) {
          const x = positions.getX(i),
            z = positions.getZ(i);
          const height = positions.getY(i) - ground(x, z);
          const radius = Math.hypot(x - tx, z - tz);
          const veins = Math.max(
            0,
            Math.sin(Math.atan2(z - tz, x - tx) * 9 + radius * 0.24),
          );
          glow[i] =
            Math.max(0, 1 - Math.abs(height - 0.7) / 3.2) *
            Math.max(0, 1 - radius / 27) *
            veins *
            veins;
        }
        g.setAttribute('rootGlow', new Float32BufferAttribute(glow, 1));
      }
      owned.push(g);
      const mesh = new Mesh(g, name === 'WorldTreeWood' ? rootMaterial : material);
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
    updateLighting: (night: number) => {
      rootNight.value = night;
    },
    footprints: () => footprints,
    refreshMaterials: () => {
      material.needsUpdate = true;
      rootMaterial.needsUpdate = true;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      clear();
      material.dispose();
      rootMaterial.dispose();
      group.removeFromParent();
    },
  };
}
