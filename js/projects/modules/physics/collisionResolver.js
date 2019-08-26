class CollisionResolver {
    constructor() {
    }

    static preResolveVelocity(contact, delta) {
        //in 2d : cross(w, r) = perp(r) * w
        var s1 = ObjectPool.shape().find(contact.getIdA());
        var s2 = ObjectPool.shape().find(contact.getIdB());
        var np = contact.getNormal();
        var rVel = Vector2d.sub(s1.vel, s2.vel);
        var vDotN = rVel.dot(np);
        if(vDotN < 0) {
            return;
        }
        var n1 = -(1.0 + 0.4)*vDotN;
        var n2 = Vector2d.dot(np, np) * (s1.invMass + s2.invMass);
        var j = n1 / n2;
        s1.vel.x += (j * np.x) * s1.invMass;
        s1.vel.y += (j * np.y) * s1.invMass;
        s2.vel.x -= (j * np.x) * s2.invMass;
        s2.vel.y -= (j * np.y) * s2.invMass;

        // if (s1.type == ShapeType.Poly) {
        //     var na1 = Vector2d.cross(Vector2d.sub(s1.pos, contact.getPoint()), np) * s1.invInertial;
        //     s1.angle_vel += na1;
        //     //s1.angle += na1;
        //     s1.syncBody();
        // }
        // if (s2.type == ShapeType.Poly) {
        //     var na2 = Vector2d.cross(Vector2d.sub(s2.pos, contact.getPoint()), np) * s2.invInertial;
        //     s2.angle_vel -= na2;
        //  //   s2.angle -= na2;
        //     s2.syncBody();
        // }
    }

    static preResolvePosition(contact, delta) {
        var s1 = ObjectPool.shape().find(contact.getIdA());
        var s2 = ObjectPool.shape().find(contact.getIdB());
        var fdepth = contact.getDepth() * 0.5;
       // fdepth /= (delta);
        var nx = contact.getNormal().x * fdepth;
        var ny = contact.getNormal().y * fdepth;

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
                var na1 = Vector2d.cross(Vector2d.sub(s1.pos, contact.getPoint()), new Vector2d().set(nx, ny)) * s1.invInertial;
                s1.angle -= na1;
                s1.angle_vel -= na1;
            }
            s1.syncBody();
        }
        if (s2.type == ShapeType.Poly) {
            if (delta != 0) {
                var na2 = Vector2d.cross(Vector2d.sub(s2.pos, contact.getPoint()), new Vector2d().set(nx, ny)) * s2.invInertial;
                s2.angel += na2;
                s2.angle_vel += na2;
            }
            s2.syncBody();
        }
    }

    static update(contact, delta) {
        this.preResolvePosition(contact, delta);
        this.preResolveVelocity(contact, delta)
    }
}