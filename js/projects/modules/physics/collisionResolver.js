class CollisionResolver {
    constructor() {
    }

    static resolver(e, n, d, p) {
        var rx = n.x * d;
        var ry = n.y * d;
        var p0 = e.parent.vertex[e.aIndex].pos;
        var p1 = e.parent.vertex[e.bIndex].pos;
        var o0 = e.parent.vertex[e.aIndex].oldPos;
        var o1 = e.parent.vertex[e.bIndex].oldPos;
        var vp = p.pos;
        var vo = p.oldPos;

        var t = Math.abs(p0.x - p1.x) > Math.abs(p0.y - p1.y)
            ? (vp.x - rx - p0.x) / (p1.x - p0.x)
            : (vp.y - ry - p0.y) / (p1.y - p0.y);
        var lambda = 1 / (t * t + (1 - t) * (1 - t));

        // mass coefficient
        var m0 = p.parent.mass,
            m1 = e.parent.mass,
            tm = m0 + m1,
            m0 = m0 / tm,
            m1 = m1 / tm;

        // apply the collision response
        p0.x -= rx * (1 - t) * lambda * m0;
        p0.y -= ry * (1 - t) * lambda * m0;
        p1.x -= rx * t * lambda * m0;
        p1.y -= ry * t * lambda * m0;

        vp.x += rx * m1;
        vp.y += ry * m1;

        // compute relative velocity
        var relVx = vp.x - vo.x - (p0.x + p1.x - o0.x - o1.x) * 0.5;
        var relVy = vp.y - vo.y - (p0.y + p1.y - o0.y - o1.y) * 0.5;

        // axis perpendicular
        var tangent = Vector2d.perp(n);

        // project the relative velocity onto tangent
        var relTv = relVx * tangent.x + relVy * tangent.y;
        var rx = tangent.x * relTv;
        var ry = tangent.y * relTv;

        // apply tangent friction
        var kf = 0.4;
        vo.x += rx * kf * m1;
        vo.y += ry * kf * m1;

        o0.x -= rx * (1 - t) * kf * lambda * m0;
        o0.y -= ry * (1 - t) * kf * lambda * m0;
        o1.x -= rx * t * kf * lambda * m0;
        o1.y -= ry * t * kf * lambda * m0;
    }
}