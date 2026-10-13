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
export function createSceneryGeometry(kind: SceneryKind) {
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
    branch(0, 0, 0, 0.2, 4.9, 0.1, 0.43);
    branch(0, 2.6, 0, -1.4, 4.9, 0.3, 0.24);
    branch(0.1, 3.1, 0, 1.35, 5.4, -0.5, 0.23);
    crown(-1.0, 5.3, 0.2, 1.9, 1.4, 1.8, '#536f40');
    crown(1.0, 5.85, -0.35, 1.8, 1.35, 1.6, '#768d51');
    crown(0.05, 6.3, 0.15, 1.7, 0.95, 1.7, '#8a9e60');
    crown(0.1, 4.9, 1, 1.7, 1.2, 1.7, '#607d47');
  } else if (kind === 'spire') {
    branch(0, 0, 0, 0, 7.3, 0, 0.32);
    for (let i = 0; i < 4; i++) {
      const g = new ConeGeometry(2.65 - i * 0.54, 3.3 - i * 0.2, 7, 1);
      g.rotateY(i * 0.63);
      g.translate(0.12 * Math.sin(i), 3.2 + i * 1.42, 0);
      parts.push(paint(g, ['#365d42', '#4b7150', '#638753', '#86a367'][i]!));
    }
  } else if (kind === 'young') {
    branch(0, 0, 0, 0.15, 2.5, 0, 0.23);
    crown(-0.3, 2.4, 0, 1.15, 0.9, 1.05, '#75944e');
    crown(0.25, 3.15, 0, 1.2, 0.9, 1.1, '#9cac62');
  } else {
    const g = new IcosahedronGeometry(1, kind === 'ridge' ? 1 : 0);
    const p = g.attributes.position!;
    const size =
      kind === 'ridge'
        ? [9, 12, 5]
        : kind === 'boulder'
          ? [2.1, 2.45, 1.7]
          : [0.8, 0.65, 0.62];
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
    parts.push(
      paint(
        g,
        kind === 'pebble' ? '#a2a08b' : kind === 'boulder' ? '#949484' : '#838a7c',
      ),
    );
  }
  const result = mergeGeometries(parts, false)!;
  parts.forEach((g) => g.dispose());
  const positions = result.attributes.position!;
  for (let i = 0; i < positions.count; i++)
    positions.setY(i, Math.max(-0.04, positions.getY(i)));
  result.computeVertexNormals();
  result.computeBoundingBox();
  result.computeBoundingSphere();
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
