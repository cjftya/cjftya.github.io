class Collisions {
    constructor() {
    }

    static module(timeDelta) {
        var list = ObjectPool.shape().getList();
        for (var [id1, obj1] of list.entries()) {
            for (var [id2, obj2] of list.entries()) {
                if (id1 == id2 ||
                    (obj1.mode == ShapeMode.Static && obj2.mode == ShapeMode.Static)) {
                    continue;
                }
                this.checkCollision(obj1, obj2, timeDelta);
            }
        }
    }

    static checkCollision(s1, s2, delta) {
        if (s1.type == ShapeType.Circle && s2.type == ShapeType.Circle) {
            return this.circle2circle(s1, s2, delta);
        } else if (s1.type == ShapeType.Circle && s2.type == ShapeType.Poly) {
            return this.circle2poly(s1, s2, delta);
        } else if (s1.type == ShapeType.Poly && s2.type == ShapeType.Circle) {
            return this.circle2poly(s2, s1, delta);
        } else if (s1.type == ShapeType.Poly && s2.type == ShapeType.Poly) {
            return this.poly2poly(s1, s2, delta);
        }
        return false;
    }

    static circle2point(s, p) {
        var dx = s.pos.x - p.x;
        var dy = s.pos.y - p.y;
        var d = dx * dx + dy * dy;
        return d < s.radius * s.radius;
    }

    static poly2point(s, p) {
        return s.containPoint(p);
    }

    static circle2circle(s1, s2, delta) {
        var dx = s2.pos.x - s1.pos.x;
        var dy = s2.pos.y - s1.pos.y;
        var d = dx * dx + dy * dy;
        var r = s1.radius + s2.radius;
        if (d < r * r) {
            var dist = Math.sqrt(d);
            var normal = new Vector2d().set(dx / dist, dy / dist);
            var point = new Vector2d().set(s1.pos.x + (normal.x * s1.radius), s1.pos.y + (normal.y * s1.radius));
            CollisionResolver.update(new Contact(point, normal, dist - r, s1.id, s2.id), delta);
            return true;
        }
        return false;
    }

    static circle2poly(s1, s2, delta) {
        var minDist = -999999;
        var minIdx = -1;

        for (var i = 0; i < s2.vertex.length; i++) {
            var e = s2.edge[i];
            var dist = Vector2d.dot(s1.pos, e.getNormal()) - e.getStartPos() - s1.radius;
            if (dist > 0) {
                return false;
            } else if (dist > minDist) {
                minDist = dist;
                minIdx = i;
            }
        }
        if (minIdx < 0) {
            return;
        }

        var n = s2.edge[minIdx].getNormal();
        var a = s2.vertex[minIdx];
        var b = s2.vertex[(minIdx + 1) % s2.vertex.length];
        var ap = Vector2d.cross(a, n);
        var bp = Vector2d.cross(b, n);
        var cp = Vector2d.cross(s1.pos, n);

        if (cp > ap || cp < bp) {
            var dx = s1.pos.x - (cp > ap ? a.x : b.x);
            var dy = s1.pos.y - (cp > ap ? a.y : b.y);
            var d = dx * dx + dy * dy;
            if (d < s1.radius * s1.radius) {
                var dist = Math.sqrt(d);
                var normal = new Vector2d().set(dx / dist, dy / dist);
                var point = new Vector2d().set(s1.pos.x + (normal.x * s1.radius), s1.pos.y + (normal.y * s1.radius));
                CollisionResolver.update(new Contact(point, normal.neg(), dist - s1.radius, s1.id, s2.id), delta);
                return true;
            }
        } else {
            var point = new Vector2d().set(s1.pos.x + (n.x * (s1.radius + minDist * 0.5)),
                s1.pos.y + (n.y * (s1.radius + minDist * 0.5)));
            CollisionResolver.update(new Contact(point, n.neg(), minDist, s1.id, s2.id), delta);
            return true;
        }
        return false;
    }

    static poly2poly(s1, s2, delta) {
        var minDist = 99999;
        var s1EdgeCount = s1.getEdgeCount();
        var s2EdgeCount = s2.getEdgeCount();
        var collisionNormal = null;
        var collisionPoint = null;
        var collisionEdge = null;
        var collisionDepth = 0;

        if (!s1.aabb.intersect(s2.aabb)) {
            return false;
        }

        // if (!(0 > Math.abs(s2.center.x - s1.center.x) - (s2.halfEx.x + s1.halfEx.x) &&
        //     0 > Math.abs(s2.center.y - s1.center.y) - (s2.halfEx.y + s1.halfEx.y))) {
        //     return false;
        // }

        var totalEdgeCount = s1EdgeCount + s2EdgeCount;
        for (var i = 0; i < totalEdgeCount; i++) {
            var e = i < s1EdgeCount ? s1.edge[i] : s2.edge[i - s1EdgeCount];
            var ex = e.parent.vertex[e.aIndex].pos.y - e.parent.vertex[e.bIndex].pos.y;
            var ey = e.parent.vertex[e.bIndex].pos.x - e.parent.vertex[e.aIndex].pos.x;
            var ed = 1 / Math.sqrt(ex * ex + ey * ey);
            var en = new Vector2d().set(ex * ed, ey * ed);

            var rangeA = s1.projectAxis(en);
            var rangeB = s2.projectAxis(en);

            var dist = rangeA[0] < rangeB[0] ? rangeB[0] - rangeA[1] :
                rangeA[0] - rangeB[1];

            if (dist > 0) {
                return false;
            } else if (Math.abs(dist) < minDist) {
                minDist = Math.abs(dist);
                collisionNormal = en;
                collisionEdge = e;
            }
        }
        collisionDepth = minDist;

        if (collisionEdge.parent.id != s2.id) {
            var t = s2;
            s2 = s1;
            s1 = t;
        }

        var n = Vector2d.sub(s1.center, s2.center).dot(collisionNormal);
        if (n < 0) {
            collisionNormal.neg();
        }

        var smallestDist = 99999, v, dist;
        for (var i = 0; i < s1.vertex.length; i++) {
            v = s1.vertex[i];
            dist = collisionNormal.dot(Vector2d.sub(v.pos, s2.center));

            if (dist < smallestDist) {
                smallestDist = dist;
                collisionPoint = v;
            }
        }
        CollisionResolver.resolver(collisionEdge, collisionNormal, collisionDepth, collisionPoint);
        return true;
    }
}