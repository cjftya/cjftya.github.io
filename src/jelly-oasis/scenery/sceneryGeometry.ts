import { rootedWind } from '../animation/vegetationWind';
import {
  Color,
  ConeGeometry,
  Quaternion,
  Vector3,
  CylinderGeometry,
  Float32BufferAttribute,
  IcosahedronGeometry,
} from 'three';
import type { BufferGeometry } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { SceneryKind } from './sceneryConfig';
function paint(source: BufferGeometry, hex: string) {
  const g = source.index ? source.toNonIndexed() : source;
  if (g !== source) source.dispose();
  const c = new Color(hex),
    values: number[] = [];
  for (let i = 0; i < g.attributes.position!.count; i++) values.push(c.r, c.g, c.b);
  g.setAttribute('color', new Float32BufferAttribute(values, 3));
  return g;
}
/** Three adult silhouettes and two saplings share the existing placement envelope. */
export function sceneryShapeCount(kind: SceneryKind, mobile = false): number {
  return kind === 'broad' ? (mobile ? 2 : 3) : kind === 'young' ? 2 : 1;
}
export function createSceneryGeometry(kind: SceneryKind, shape = 0) {
  const parts: BufferGeometry[] = [];
  const branch = (
    ax: number,
    ay: number,
    az: number,
    bx: number,
    by: number,
    bz: number,
    width: number,
  ) => {
    const dx = bx - ax,
      dy = by - ay,
      dz = bz - az;
    const g = new CylinderGeometry(width * 0.55, width, Math.hypot(dx, dy, dz), 6, 1);
    // This geometry is rotated about Z for lateral boughs; their bases overlap the trunk.
    g.applyQuaternion(
      new Quaternion().setFromUnitVectors(
        new Vector3(0, 1, 0),
        new Vector3(dx, dy, dz).normalize(),
      ),
    );
    g.translate((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2);
    parts.push(paint(g, '#786047'));
  };
  const crown = (
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    shade: string,
  ) => {
    const g = new IcosahedronGeometry(1, 1);
    g.scale(sx * 1.5, sy, sz * 1.5);
    g.rotateY(0.37 + x);
    g.translate(x, y, z);
    parts.push(paint(g, shade));
  };
  if (kind === 'broad') {
    if (shape === 1) {
      // A leaning trunk carries one taller crown with a low, off-centre bough.
      branch(0, 0, 0, 0.8, 5.2, -0.2, 0.43);
      branch(0.35, 2.7, -0.1, -1.25, 4.5, 0.5, 0.25);
      crown(0.65, 5.5, -0.3, 1.55, 1.85, 1.45, '#7a9154');
      crown(-1.1, 4.45, 0.45, 1.45, 1.55, 1.4, '#536f40');
      crown(1.1, 4.55, 0.8, 1.25, 1.45, 1.2, '#657f48');
    } else if (shape === 2) {
      // A low fork and unequal crowns leave a readable notch in the silhouette.
      branch(0, 0, 0, -1.15, 4.9, 0.1, 0.4);
      branch(-0.25, 1.8, 0, 1.25, 4.1, -0.4, 0.32);
      crown(-1.1, 5.25, 0.15, 1.5, 1.8, 1.4, '#7e9658');
      crown(1.2, 4.45, -0.4, 1.4, 1.55, 1.45, '#607c46');
      crown(-0.2, 4.15, 1, 1.35, 1.3, 1.3, '#526f3f');
    } else {
      branch(0, 0, 0, 0.2, 5.1, 0.1, 0.43);
      branch(0, 2.6, 0, -1.25, 4.4, 0.3, 0.25);
      branch(0.1, 3.1, 0, 1.2, 4.9, -0.5, 0.24);
      crown(-1.0, 4.55, 0.2, 1.55, 1.65, 1.5, '#536f40');
      crown(0.95, 4.95, -0.4, 1.55, 1.75, 1.4, '#718b50');
      crown(-0.1, 5.7, 0.15, 1.4, 1.65, 1.4, '#8a9e60');
      crown(0.1, 4.1, 0.85, 1.35, 1.3, 1.35, '#607d47');
    }
  } else if (kind === 'spire') {
    branch(0, 0, 0, 0, 7.3, 0, 0.32);
    for (let i = 0; i < 4; i++) {
      const g = new ConeGeometry(2.65 - i * 0.54, 3.3 - i * 0.2, 7, 1);
      g.rotateY(i * 0.63);
      g.translate(0.12 * Math.sin(i), 3.2 + i * 1.42, 0);
      parts.push(paint(g, ['#365d42', '#4b7150', '#638753', '#86a367'][i]!));
    }
  } else if (kind === 'young') {
    const lean = shape === 1 ? -0.35 : 0.15;
    branch(0, 0, 0, lean, 2.8, 0, 0.23);
    crown(lean - 0.25, 2.4, 0.15, 1.0, 1.1, 0.95, '#75944e');
    crown(lean + 0.2, shape === 1 ? 2.85 : 3.1, -0.1, 0.9, 1.05, 0.85, '#9cac62');
    if (shape === 1) {
      branch(-0.1, 1.2, 0, 0.8, 2, 0.35, 0.14);
      crown(0.85, 2.1, 0.35, 0.75, 0.85, 0.7, '#647f48');
    }
  } else if (kind === 'ridge') {
    // Three joined strata form a low outcrop with asymmetric planting shelves.
    // The lower bodies overlap; no detached slabs or floating flat bases.
    for (const [x, z, width, depth, bottom, height, yaw] of [
      [-0.5, 0, 4.7, 3.3, 0, 2.3, 0.1],
      [-1.3, -0.65, 3.1, 2.5, 1.4, 2.5, 0.32],
      [3.0, 0.7, 2.8, 2.4, 0, 1.4, -0.3],
    ]) {
      const source = new IcosahedronGeometry(1, 1),
        vertices = source.attributes.position!;
      for (let i = 0; i < vertices.count; i++) {
        const px = vertices.getX(i),
          py = vertices.getY(i),
          pz = vertices.getZ(i);
        vertices.setXYZ(
          i,
          px * (1 + 0.12 * pz) + Math.max(0, py) * 0.15,
          Math.min(0.72 + px * 0.08, Math.max(0, py)) / 0.8,
          pz * (1 - 0.09 * px),
        );
      }
      source.scale(width!, height!, depth!).rotateY(yaw!).translate(x!, bottom!, z!);
      source.computeVertexNormals();
      const g = paint(source, '#8c9080'),
        n = g.attributes.normal!,
        c = g.attributes.color!,
        moss = new Color('#879568');
      for (let i = 0; i < c.count; i++)
        if (n.getY(i) > 0.65) c.setXYZ(i, moss.r, moss.g, moss.b);
      parts.push(g);
    }
  } else {
    const g = new IcosahedronGeometry(1, 0);
    const p = g.attributes.position!;
    const size = kind === 'boulder' ? [2.1, 2.45, 1.7] : [0.8, 0.65, 0.62];
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i),
        y = p.getY(i),
        z = p.getZ(i);
      // Flattened polygonal base, irregular shoulders and slanted upper faces.
      p.setXYZ(
        i,
        x * size[0]! * (1 + 0.11 * z) + Math.max(y, 0) * 0.2,
        Math.max(0, y) * size[1]! * (0.86 + x * 0.14),
        z * size[2]! * (1 + 0.1 * x),
      );
    }
    g.deleteAttribute('normal');
    g.computeVertexNormals();
    parts.push(paint(g, kind === 'pebble' ? '#a2a08b' : '#949484'));
  }
  const result = mergeGeometries(parts, false)!;
  parts.forEach((g) => g.dispose());
  const positions = result.attributes.position!;
  for (let i = 0; i < positions.count; i++)
    positions.setY(i, Math.max(-0.04, positions.getY(i)));
  result.computeVertexNormals();
  result.computeBoundingBox();
  result.computeBoundingSphere();
  if (['broad', 'spire', 'young'].includes(kind))
    rootedWind(
      result,
      0,
      0.8,
      0,
      kind === 'young' ? 2.3 : 6,
      kind === 'young' ? 0.35 : 0.65,
    );
  return result;
}
// Actual projected vertices supplement the radial terrain probes for dry rock support.
export function projectedFootprint(
  geometry: BufferGeometry,
): readonly (readonly [number, number])[] {
  const p = geometry.attributes.position!,
    seen = new Map<string, readonly [number, number]>();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      z = p.getZ(i);
    seen.set(`${x.toFixed(5)}:${z.toFixed(5)}`, [x, z]);
  }
  return [...seen.values()];
}
