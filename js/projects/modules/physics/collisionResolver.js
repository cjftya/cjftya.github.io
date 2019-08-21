class CollisionResolver {
    constructor() {
    }

    static preUpdate(s1, s2, point, depth, normal, delta) {
        var fdepth = depth * 0.5;
        var nx = normal.x * fdepth;
        var ny = normal.y * fdepth;

        if (s1.mode == ShapeMode.Dynamic) {
            s1.pos.x += nx;
            s1.pos.y += ny;
            s1.vel.x += nx;
            s1.vel.y += ny;
        }
        if (s2.mode == ShapeMode.Dynamic) {
            s2.pos.x -= nx;
            s2.pos.y -= ny;
            s2.vel.x -= nx;
            s2.vel.y -= ny;
        } 

        if (s1.type == ShapeType.Poly) {
            if (delta != 0) {
                var na1 = Vector2d.cross(Vector2d.sub(s1.pos, point), new Vector2d().set(nx, ny)) * s1.invInertial;
                s1.angle -= na1;
                s1.angle_vel -= na1;
            }
            s1.syncBody();
        }
        if (s2.type == ShapeType.Poly) {
            if (delta != 0) {
                var na2 = Vector2d.cross(Vector2d.sub(s2.pos, point), new Vector2d().set(nx, ny)) * s2.invInertial;
                s2.angel += na2;
                s2.angle_vel += na2;
            }
            s2.syncBody();
        }
    }

    static update(delta) {
    }
}