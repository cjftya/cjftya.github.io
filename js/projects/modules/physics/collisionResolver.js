class CollisionResolver {
    constructor() {
    }

    static preUpdate(s1, s2, point, depth, normal, delta) {
        var fdepth = depth * 0.5;
        var nx = normal.x * fdepth;
        var ny = normal.y * fdepth;

        s1.pos.x += nx;
        s1.pos.y += ny;
        s2.pos.x -= nx;
        s2.pos.y -= ny;

        if (s1.type == ShapeType.Poly) {
            s1.syncBody();
        }
        if (s2.type == ShapeType.Poly) {
            s2.syncBody();
        }
    }

    static update(delta) {
    }
}