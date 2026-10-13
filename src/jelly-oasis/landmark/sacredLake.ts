import { Mesh, Vector3 } from 'three';
import type { Group } from 'three';
import type { LayoutGuide } from './landmarkConfig';

export const SACRED_LAKE_SCALE = { west: 1.16, east: 1, z: 1.1 };
export const SACRED_LAKE_BASIN = { depth: 2.8, shelfWidth: 1.8, deepWidth: 5.8 };

export function pondArea(guide: LayoutGuide): number {
  return (
    Math.abs(
      guide.positions.reduce((sum, p, i, points) => {
        const q = points[(i + 1) % points.length]!;
        return sum + p[0]! * q[2]! - q[0]! * p[2]!;
      }, 0),
    ) / 2
  );
}

/** Version 3 retains all 57 contour samples and their topology. Apply the same
 * piecewise map to the guide and every bank/rock vertex, in module coordinates.
 * Preserve the east bank beside the existing arch approach.
 * Existing GLBs and the original layout manifest remain immutable. */
export function expandSacredLake(guide: LayoutGuide, bank: Group): LayoutGuide {
  const result = {
    positions: guide.positions.map(([x, y, z]) => [
      x! * (x! < 0 ? SACRED_LAKE_SCALE.west : SACRED_LAKE_SCALE.east),
      y!,
      7 + (z! - 7) * SACRED_LAKE_SCALE.z,
    ]),
    indices: guide.indices.map((face) => [...face]),
  };
  bank.updateMatrixWorld(true);
  const point = new Vector3();
  bank.traverse((child) => {
    if (!(child instanceof Mesh)) return;
    const inverse = child.matrixWorld.clone().invert();
    const p = child.geometry.attributes.position!;
    for (let i = 0; i < p.count; i++) {
      point.fromBufferAttribute(p, i).applyMatrix4(child.matrixWorld);
      point.x *= point.x < 0 ? SACRED_LAKE_SCALE.west : SACRED_LAKE_SCALE.east;
      point.z *= SACRED_LAKE_SCALE.z;
      point.applyMatrix4(inverse);
      p.setXYZ(i, point.x, point.y, point.z);
    }
    p.needsUpdate = true;
    child.geometry.computeVertexNormals();
    child.geometry.computeBoundingBox();
    child.geometry.computeBoundingSphere();
  });
  bank.userData.pondBoundaryVersion = 3;
  return result;
}
