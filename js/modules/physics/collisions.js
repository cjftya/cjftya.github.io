class Collisions {
    constructor() {
    }

    static checkCollision(s1, s2, delta) {
        if (s1.type == ShapeType.Circle && s2.type == ShapeType.Circle) {
            return this.circle2circle(s1, s2, delta);
        }
        return false;
    }

    static circle2point(s, p) {
        var dx = s.pos.x - p.x;
        var dy = s.pos.y - p.y;
        var d = dx * dx + dy * dy;
        return d < s.radius * s.radius;
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
            ContactResolver.preUpdate(s1, s2, point, dist - r, normal, delta);
            return true;
        }
        return false;
    }

    static circle2poly(s1, s2, delta) {
        return false;
    }

    static poly2poly(s1, s2, delta) {
        return false;
    }
}