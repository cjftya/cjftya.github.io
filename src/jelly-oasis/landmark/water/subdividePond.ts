import { BufferGeometry, Float32BufferAttribute } from 'three';

/** Subdivide existing triangles; original polygon edges and level stay exact. */
export function subdividePond(source: BufferGeometry, passes: number) {
  const attribute = source.attributes.position!;
  const positions: number[] = [];
  for (let i = 0; i < attribute.count; i++)
    positions.push(attribute.getX(i), attribute.getY(i), attribute.getZ(i));
  let indices = source.index
    ? Array.from(source.index.array)
    : Array.from({ length: attribute.count }, (_, i) => i);
  for (let pass = 0; pass < passes; pass++) {
    const edges = new Map<string, number>(),
      next: number[] = [];
    const midpoint = (a: number, b: number) => {
      const key = a < b ? `${a}:${b}` : `${b}:${a}`;
      const cached = edges.get(key);
      if (cached !== undefined) return cached;
      const i = positions.length / 3;
      for (let axis = 0; axis < 3; axis++)
        positions.push((positions[a * 3 + axis]! + positions[b * 3 + axis]!) / 2);
      edges.set(key, i);
      return i;
    };
    for (let i = 0; i < indices.length; i += 3) {
      const a = indices[i]!,
        b = indices[i + 1]!,
        c = indices[i + 2]!,
        ab = midpoint(a, b),
        bc = midpoint(b, c),
        ca = midpoint(c, a);
      next.push(a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca);
    }
    indices = next;
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}
