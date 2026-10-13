import {
  Box3,
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
  Vector3,
} from 'three';
import { polygonDistance } from '../terrain/excavateTerrain';
import type { LayoutGuide } from './landmarkConfig';

/** Four legible, broad-leaved colonies and five source-rock variations. Rock
 * geometry/materials are borrowed from the loaded modules, never re-disposed. */
export function createLakeEcology(
  content: Group,
  modules: Map<string, Group>,
  guide: LayoutGuide,
) {
  const group = new Group();
  group.name = 'SacredLakeEcology';
  content.add(group);
  const material = new MeshStandardMaterial({
    color: 'white',
    vertexColors: true,
    side: DoubleSide,
    flatShading: true,
    roughness: 0.9,
  });
  material.name = 'JO_Aquatic_Sage';
  let geometry: BufferGeometry | undefined,
    disposed = false;
  let anchors: { kind: string; x: number; y: number; z: number; depth: number }[] = [];
  function place(ground: (x: number, z: number) => number, waterY: number) {
    if (disposed) return;
    group.clear();
    geometry?.dispose();
    anchors = [];
    const positions: number[] = [],
      colors: number[] = [];
    const leafColor = new Color('#648a57'),
      shadowColor = new Color('#476f54'),
      reedColor = new Color('#7e965a');
    function triangle(a: number[], b: number[], c: number[], color: Color) {
      positions.push(...a, ...b, ...c);
      for (let j = 0; j < 3; j++) colors.push(color.r, color.g, color.b);
    }
    function blade(
      x: number,
      y: number,
      z: number,
      angle: number,
      height: number,
      width: number,
      bend: number,
    ) {
      const dx = Math.cos(angle),
        dz = Math.sin(angle);
      for (let i = 0; i < 4; i++) {
        const points = (t: number, side: number) => {
          const w = width * Math.sin(Math.PI * (0.12 + t * 0.88));
          return [
            x + dx * bend * t * t - dz * w * side,
            y + height * t,
            z + dz * bend * t * t + dx * w * side,
          ];
        };
        const a = points(i / 4, -1),
          b = points(i / 4, 1),
          c = points((i + 1) / 4, 1),
          d = points((i + 1) / 4, -1);
        triangle(a, b, c, i % 2 ? shadowColor : leafColor);
        triangle(a, c, d, leafColor);
      }
    }
    const colonies = [
      [-10.2, 8.6],
      [-5.8, 15.1],
      [5.8, 1.7],
      [10.3, 6.8],
    ];
    for (let colony = 0; colony < colonies.length; colony++) {
      const [cx, cz] = colonies[colony]!;
      let count = 0;
      for (let i = 0; i < 16; i++) {
        const a = i * 2.399 + colony,
          r = 0.3 + Math.sqrt(i / 16) * (colony === 0 ? 2.7 : 2.0);
        const x = cx! + Math.cos(a) * r,
          z = cz! + Math.sin(a) * r * 0.65,
          d = polygonDistance(x, z, guide.positions);
        const floor = ground(x, z),
          depth = waterY - floor;
        if (d < 0.35 || depth < 0.22 || depth > 2.0) continue;
        anchors.push({ kind: 'plant', x, y: floor, z, depth });
        count++;
        for (let leaf = 0; leaf < 4; leaf++)
          blade(
            x,
            floor - 0.025,
            z,
            a + leaf * 1.7,
            Math.min(depth + (i % 3 === 0 ? 0.35 : -0.12), 0.75 + (i % 4) * 0.2),
            0.15 + (i % 3) * 0.04,
            0.35,
          );
        if (depth < 0.8 && i % 3 === 0) {
          // A thick, connected reed leaf rises from the same rooted colony.
          const p = [x, floor, z],
            tip = [x + 0.16, floor + depth + 0.9, z + 0.1];
          triangle(p, [x + 0.12, floor + depth * 0.5, z], tip, reedColor);
        }
      }
      group.userData[`colony${colony}`] = count;
    }
    const stones = [
      [-8.3, 9.8, 0.29],
      [-7.0, 11.6, 0.24],
      [5.1, 3.1, 0.35],
      [8.9, 7.3, 0.26],
      [3.8, 14.5, 0.23],
    ];
    for (let i = 0; i < stones.length; i++) {
      const [x, z, scale] = stones[i]!,
        source = modules.get(`Rock_Large_${'ABCDE'[i]}`)!;
      const object = source.clone(true);
      object.name = `SubmergedRock_${i}`;
      object.position.set(0, 0, 0);
      object.scale.setScalar(scale!);
      object.rotation.y = i * 0.81;
      const bounds = new Box3().setFromObject(object),
        floor = ground(x!, z!);
      const fits: number[] = [];
      const point = new Vector3();
      object.traverse((child) => {
        if (!(child instanceof Mesh)) return;
        const vertices = child.geometry.attributes.position!;
        for (let j = 0; j < vertices.count; j++) {
          point.fromBufferAttribute(vertices, j).applyMatrix4(child.matrixWorld);
          if (point.y <= bounds.min.y + 0.2 * scale!)
            fits.push(ground(x! + point.x, z! + point.z) - point.y);
        }
      });
      object.position.set(x!, Math.min(...fits) - 0.06, z!);
      object.traverse((child) => {
        if (child instanceof Mesh) child.castShadow = child.receiveShadow = true;
      });
      group.add(object);
      anchors.push({
        kind: 'rock',
        x: x!,
        y: object.position.y,
        z: z!,
        depth: waterY - floor,
      });
    }
    const pads = [
      [-6.8, 14.2, 0.65],
      [-8, 13.1, 0.51],
      [-5.3, 14.9, 0.47],
      [9.7, 8.5, 0.58],
      [10.3, 7.5, 0.43],
      [5.8, 2.4, 0.48],
      [4.8, 2.0, 0.38],
    ];
    for (const [x, z, r] of pads) {
      if (
        polygonDistance(x!, z!, guide.positions) < 0.3 ||
        ground(x!, z!) > waterY - 0.15
      )
        continue;
      const y = waterY + 0.065;
      // Ten-sided leaf, open notch and raised central rib; no generic disc decal.
      for (let i = 0; i < 9; i++) {
        const a = ((i + 0.35) * Math.PI * 2) / 10,
          b = ((i + 1.35) * Math.PI * 2) / 10;
        triangle(
          [x!, y + 0.025, z!],
          [x! + Math.cos(b) * r!, y, z! + Math.sin(b) * r! * 0.88],
          [x! + Math.cos(a) * r!, y, z! + Math.sin(a) * r! * 0.88],
          i % 2 ? leafColor : reedColor,
        );
      }
      anchors.push({ kind: 'pad', x: x!, y, z: z!, depth: waterY - ground(x!, z!) });
    }
    geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    const plants = new Mesh(geometry, material);
    plants.name = 'AquaticColonies';
    plants.receiveShadow = true;
    group.add(plants);
    group.updateMatrixWorld(true);
  }
  return {
    group,
    place,
    snapshot: () => ({
      colonies: 4,
      anchors: anchors.map((p) => ({ ...p })),
      rocks: anchors.filter((p) => p.kind === 'rock').length,
      pads: anchors.filter((p) => p.kind === 'pad').length,
      plantTriangles: (geometry?.attributes.position!.count ?? 0) / 3,
      visible: group.visible,
    }),
    refreshMaterials: () => {
      material.needsUpdate = true;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      group.clear();
      group.removeFromParent();
      geometry?.dispose();
      material.dispose();
    },
  };
}
