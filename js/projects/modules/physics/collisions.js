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
        if(minIdx < 0) {
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

    static __findMSA(s, edge, num) {
        var minDist = -999999;
        var minIndex = -1;
        for (var i = 0; i < num; i++) {
            var dist = s.distanceOnPlane(edge[i].getNormal(), edge[i].getStartPos());
            if (dist > 0) {
                return [0, -1];
            }
            else if (dist > minDist) {
                minDist = dist;
                minIndex = i;
            }
        }
        return [minDist, minIndex];
    }

    static __findVerts(s1, s2, n, depth, delta) {
        if(s1.id == s2.id) {
            return false;
        }
        
        var num = 0;
        var contact = [];
        for (var i = 0; i < s1.vertex.length; i++) {
            var e = s1.vertex[i];
            if (s2.containPoint(e)) {
                contact.push(e);
                num++;
            }
        }
        for (var i = 0; i < s2.vertex.length; i++) {
            var e = s2.vertex[i];
            if (s1.containPoint(e)) {
                contact.push(e);
                num++;
            }
        }

        var df = depth / num;
        for (var i = 0; i < contact.length; i++) {
            CollisionResolver.update(new Contact(contact[i], n, df, s1.id, s2.id), delta);
        }
        return num > 0;
    }

    static poly2poly(s1, s2, delta) {
        var msa1 = this.__findMSA(s2, s1.edge, s1.vertex.length);
        if (msa1[1] == -1) {
            return false;
        }

        var msa2 = this.__findMSA(s1, s2.edge, s2.vertex.length);
        if (msa2[1] == -1) {
            return false;
        }

        if (msa1[0] > msa2[0]) {
            return this.__findVerts(s1, s2, s1.edge[msa1[1]].getNormal(), msa1[0], delta);
        }
        return this.__findVerts(s1, s1, Vector2d.neg(s2.edge[msa2[1]].getNormal()), msa2[0], delta);
    }
}