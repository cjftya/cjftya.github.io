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

/** Conforming edge splits on the flat pond, not exponential full-surface passes. */
export function tessellatePond(source: BufferGeometry, maxEdge: number, level: number) {
  const p = source.attributes.position!;
  const positions: number[] = [];
  for (let i = 0; i < p.count; i++) positions.push(p.getX(i), p.getY(i), p.getZ(i));
  let indices = Array.from(source.index!.array);
  const key = (a: number, b: number) => (a < b ? `${a}:${b}` : `${b}:${a}`);
  for (let pass = 0; pass < 8; pass++) {
    const marked = new Map<string, number>();
    for (let i = 0; i < indices.length; i += 3) {
      const ids = indices.slice(i, i + 3);
      for (let j = 0; j < 3; j++) {
        const a = ids[j]!,
          b = ids[(j + 1) % 3]!;
        if (
          Math.abs(positions[a * 3 + 1]! - level) > 1e-5 ||
          Math.abs(positions[b * 3 + 1]! - level) > 1e-5
        )
          continue;
        if (
          Math.hypot(
            positions[a * 3]! - positions[b * 3]!,
            positions[a * 3 + 2]! - positions[b * 3 + 2]!,
          ) <= maxEdge
        )
          continue;
        const edge = key(a, b);
        if (!marked.has(edge)) {
          marked.set(edge, positions.length / 3);
          for (let axis = 0; axis < 3; axis++)
            positions.push((positions[a * 3 + axis]! + positions[b * 3 + axis]!) / 2);
        }
      }
    }
    if (!marked.size) break;
    const next: number[] = [];
    for (let i = 0; i < indices.length; i += 3) {
      const ids = indices.slice(i, i + 3),
        mids = ids.map((a, j) => marked.get(key(a, ids[(j + 1) % 3]!)));
      const count = mids.filter((m) => m !== undefined).length;
      if (!count) {
        next.push(...ids);
        continue;
      }
      if (count === 3) {
        const [a, b, c] = ids,
          [ab, bc, ca] = mids;
        next.push(a!, ab!, ca!, ab!, b!, bc!, ca!, bc!, c!, ab!, bc!, ca!);
      } else {
        const pivot =
          count === 1
            ? mids.findIndex((m) => m !== undefined)
            : mids.findIndex(
                (m, j) => m !== undefined && mids[(j + 1) % 3] !== undefined,
              );
        const a = ids[pivot]!,
          b = ids[(pivot + 1) % 3]!,
          c = ids[(pivot + 2) % 3]!,
          ab = mids[pivot]!;
        if (count === 1) next.push(a, ab, c, ab, b, c);
        else {
          const bc = mids[(pivot + 1) % 3]!;
          next.push(a, ab, c, ab, bc, c, ab, b, bc);
        }
      }
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
