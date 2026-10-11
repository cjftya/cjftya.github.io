import { BufferGeometry, Float32BufferAttribute, Vector3 } from 'three';
import type { ChannelSample } from '../../terrain/excavateTerrain';
type Polygon = Vector3[];

function split(poly: Polygon, a: Vector3, b: Vector3) {
  const inside: Polygon = [],
    outside: Polygon = [];
  const side = (p: Vector3) => (b.x - a.x) * (p.z - a.z) - (b.z - a.z) * (p.x - a.x);
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]!,
      q = poly[(i + 1) % poly.length]!,
      dp = side(p),
      dq = side(q);
    if (dp >= -1e-9) inside.push(p);
    if (dp <= 1e-9) outside.push(p);
    if ((dp > 1e-9 && dq < -1e-9) || (dp < -1e-9 && dq > 1e-9)) {
      const cut = p.clone().lerp(q, dp / (dp - dq));
      inside.push(cut);
      outside.push(cut);
    }
  }
  return { inside, outside };
}
/** Subtract each convex strip footprint from pond triangles, then insert the strip.
 * No coplanar overlap; intersections are welded in the same geometry/material. */
export function continuousSurface(pond: BufferGeometry, channel: ChannelSample[]) {
  const p = pond.attributes.position!,
    index = pond.index;
  let polygons: Polygon[] = [];
  const count = index?.count ?? p.count;
  for (let i = 0; i < count; i += 3)
    polygons.push(
      [0, 1, 2].map((j) =>
        new Vector3().fromBufferAttribute(p, index ? index.getX(i + j) : i + j),
      ),
    );
  const strips: Polygon[] = [];
  // +Z flow; use the same cross section at every joint, with no crown bulge.
  for (let i = 0; i < channel.length - 1; i++) {
    const a = channel[i]!,
      b = channel[i + 1]!;
    const quad = [
      a.point.clone().add(new Vector3(-a.width / 2, 0, 0)),
      a.point.clone().add(new Vector3(a.width / 2, 0, 0)),
      b.point.clone().add(new Vector3(b.width / 2, 0, 0)),
      b.point.clone().add(new Vector3(-b.width / 2, 0, 0)),
    ];
    const minZ = Math.min(a.point.z, b.point.z),
      maxZ = Math.max(a.point.z, b.point.z);
    const next: Polygon[] = [];
    for (const poly of polygons) {
      if (
        poly.every((v) => v.z < minZ - 1e-8) ||
        poly.every((v) => v.z > maxZ + 1e-8)
      ) {
        next.push(poly);
        continue;
      }
      let remaining = poly;
      for (let j = 0; j < 4 && remaining.length >= 3; j++) {
        const parts = split(remaining, quad[j]!, quad[(j + 1) % 4]!);
        if (parts.outside.length >= 3) next.push(parts.outside);
        remaining = parts.inside;
      }
    }
    polygons = next;
    strips.push(quad);
  }
  const positions: number[] = [],
    indices: number[] = [],
    ids = new Map<string, number>();
  function vertex(v: Vector3) {
    const key = [v.x, v.y, v.z].map((n) => n.toFixed(6)).join(':');
    if (ids.has(key)) return ids.get(key)!;
    const id = positions.length / 3;
    ids.set(key, id);
    positions.push(...v.toArray());
    return id;
  }
  const all = [...polygons, ...strips];
  all.forEach((poly) => poly.forEach(vertex));
  const vertices = Array.from(ids.values()).map((i) =>
    new Vector3().fromArray(positions, i * 3),
  );
  for (const poly of all) {
    const center = poly
      .reduce((c, p) => c.add(p), new Vector3())
      .divideScalar(poly.length);
    const centreId = vertex(center);
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i]!,
        b = poly[(i + 1) % poly.length]!,
        edge = b.clone().sub(a),
        length = edge.lengthSq();
      if (length < 1e-12) continue;
      const nodes = vertices
        .map((v) => ({ v, t: v.clone().sub(a).dot(edge) / length }))
        .filter(
          ({ v, t }) =>
            t >= -1e-7 &&
            t <= 1 + 1e-7 &&
            v.distanceToSquared(a.clone().addScaledVector(edge, t)) < 1e-12,
        )
        .sort((u, v) => u.t - v.t);
      for (let j = 0; j < nodes.length - 1; j++) {
        const u = nodes[j]!.v,
          v = nodes[j + 1]!.v;
        const area =
          (u.x - center.x) * (v.z - center.z) - (u.z - center.z) * (v.x - center.x);
        if (Math.abs(area) < 1e-10) continue;
        const tri = [centreId, vertex(u), vertex(v)];
        if (area > 0) tri.reverse();
        indices.push(...tri);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}
