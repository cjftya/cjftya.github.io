class Collisions {
    constructor() {
    }

    static module(list, timeDelta) {
        for (var [id1, obj1] of list.entries()) {
            for (var [id2, obj2] of list.entries()) {
                if (id1 == id2) {
                    continue;
                }
                this.checkCollision(obj1, obj2, timeDelta);
            }
        }
    }

    static checkCollision(s1, s2, delta) {
        // if (s1.type > s2.type) {
        //     var tmp = s1;
        //     s1 = s2;
        //     s2 = tmp;
        // }
        if (s1.type == ShapeType.Circle && s2.type == ShapeType.Circle) {
            return this.circle2circle(s1, s2, delta);
        } else if (s1.type == ShapeType.Circle && s2.type == ShapeType.Poly) {
            return this.circle2poly(s1, s2, delta);
        } else if (s1.type == ShapeType.Poly && s2.type == ShapeType.Circle) {
            return this.circle2poly(s2, s1, delta);
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
            CollisionResolver.preUpdate(s1, s2, point, dist - r, normal, delta);
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
                CollisionResolver.preUpdate(s1, s2, point, dist - s1.radius, normal.neg(), delta);
                return true;
            }
        } else {
            var point = new Vector2d().set(s1.pos.x + (n.x * (s1.radius + minDist * 0.5)),
                s1.pos.y + (n.y * (s1.radius + minDist * 0.5)));
            CollisionResolver.preUpdate(s1, s2, point, minDist, n.neg(), delta);
            return true;
        }
        return false;
    }

    static poly2poly(s1, s2, delta) {
        return false;
    }
}