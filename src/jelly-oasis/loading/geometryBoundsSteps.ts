import { Box3, Sphere, Vector3 } from 'three';
import type { BufferGeometry } from 'three';

/** Generated static geometry has no morph targets. Preserve Three's box-center
 * sphere calculation, but split its two linear vertex scans into small batches.
 */
export function* geometryBoundsSteps(geometry: BufferGeometry) {
  const position = geometry.attributes.position;
  if (!position || geometry.morphAttributes.position?.length) {
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    return;
  }
  const box = (geometry.boundingBox ??= new Box3());
  box.makeEmpty();
  const point = new Vector3();
  for (let i = 0; i < position.count; i++) {
    if (i % 256 === 0) yield 'geometry-bounds';
    box.expandByPoint(point.fromBufferAttribute(position, i));
  }
  const sphere = (geometry.boundingSphere ??= new Sphere());
  box.getCenter(sphere.center);
  let radiusSq = 0;
  for (let i = 0; i < position.count; i++) {
    if (i % 256 === 0) yield 'geometry-bounds';
    radiusSq = Math.max(
      radiusSq,
      sphere.center.distanceToSquared(point.fromBufferAttribute(position, i)),
    );
  }
  sphere.radius = Math.sqrt(radiusSq);
}
