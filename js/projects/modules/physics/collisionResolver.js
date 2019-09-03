class CollisionResolver {
    constructor() {
    }

    static preResolveVelocity(contact, delta) {
        //in 2d : cross(w, r) = perp(r) * w
        // var s1 = ObjectPool.shape().find(contact.getIdA());
        // var s2 = ObjectPool.shape().find(contact.getIdB());
        // var np = contact.getNormal();
        // var rVel = Vector2d.sub(s1.vel, s2.vel);
        // var vDotN = rVel.dot(np);
        // if(vDotN < 0) {
        //     return;
        // }
        // var n1 = -(1.0 + 0.9) * vDotN;
        // var n2 = Vector2d.dot(np, np) * (s1.invMass + s2.invMass);
        // var j = n1 / n2;
        // if(s1.mode == ShapeMode.Static || s2.mode == ShapeMode.Static) {
        //     //j *= 2;
        // }
        // s1.vel.x += (j * np.x) * s1.invMass;
        // s1.vel.y += (j * np.y) * s1.invMass;
        // s2.vel.x -= (j * np.x) * s2.invMass;
        // s2.vel.y -= (j * np.y) * s2.invMass;


        var s1 = ObjectPool.shape().find(contact.getIdA());
        var s2 = ObjectPool.shape().find(contact.getIdB());
        var np = contact.getNormal();
        var cp1 = Vector2d.sub(contact.getPoint(), s1.pos);
        var cp2 = Vector2d.sub(contact.getPoint(), s2.pos);
        var v1 = Vector2d.add(s1.vel, Vector2d.perp(cp1).mul(s1.angle_vel));
        var v2 = Vector2d.add(s2.vel, Vector2d.perp(cp2).mul(s2.angle_vel));
        var rVel = Vector2d.sub(v1, v2);
        var vDotN = rVel.dot(np);
        if (vDotN < 0) {
            return;
        }
        var n1 = -(1.0 + 0.4) * vDotN;
        var n2 = Vector2d.dot(np, np) * (s1.invMass + s2.invMass);
        var ccp1 = Vector2d.cross(cp1, np) * s1.invInertial;
        var ccp2 = Vector2d.cross(cp2, np) * s2.invInertial;
        var s = Vector2d.add(Vector2d.perp(cp1).mul(ccp1), Vector2d.perp(cp2).mul(ccp2));
        n2 += (s.x * s.x + s.y * s.y);
        var j = n1 / n2;
        var rp = new Vector2d().set(np.x * j, np.y * j);

        s1.vel.x += rp.x * s1.invMass;
        s1.vel.y += rp.y * s1.invMass;
        s2.vel.x -= rp.x * s2.invMass;
        s2.vel.y -= rp.y * s2.invMass;

        var fri = s1.type == ShapeType.Circle ? 0.95 : 0.8;
        if (s1.type == ShapeType.Poly) {
            if (s1.mode == ShapeMode.Dynamic) {
                s1.vel = Vector2d.normalize(s1.vel).mul(s1.vel.length() * fri);
                var na1 = Vector2d.cross(cp1, rp) * s1.invInertial;
                s1.angle_vel += na1;
            }
            s1.syncBody();
        }
        if (s2.type == ShapeType.Poly) {
            if (s2.mode == ShapeMode.Dynamic) {
                s2.vel = Vector2d.normalize(s2.vel).mul(s2.vel.length() * fri);

                var na2 = Vector2d.cross(cp2, rp) * s2.invInertial;
                s2.angle_vel -= na2;
            }
            s2.syncBody();
        }
    }

    static preResolvePosition(contact, delta) {
        var s1 = ObjectPool.shape().find(contact.getIdA());
        var s2 = ObjectPool.shape().find(contact.getIdB());
        var cp1 = Vector2d.sub(contact.getPoint(), s1.pos);
        var cp2 = Vector2d.sub(contact.getPoint(), s2.pos);
        var np = contact.getNormal();
        var mpE = contact.getDepth() / (s1.invMass + s2.invMass);
        var mpx = np.x * mpE;
        var mpy = np.y * mpE;
        var n1x = mpx * s1.invMass;
        var n1y = mpy * s1.invMass;
        var n2x = mpx * s2.invMass;
        var n2y = mpy * s2.invMass;

        if (s1.mode == ShapeMode.Dynamic) {
            s1.pos.x += n1x;
            s1.pos.y += n1y;
            s1.vel.x += n1x;
            s1.vel.y += n1y;
        }
        if (s2.mode == ShapeMode.Dynamic) {
            s2.pos.x -= n2x;
            s2.pos.y -= n2y;
            s2.vel.x -= n2x;
            s2.vel.y -= n2y;
        }
        if (s1.type == ShapeType.Poly) {
            if (s1.mode == ShapeMode.Dynamic) {
                var na1 = Vector2d.cross(cp1, contact.getNormal()) * s1.invInertial;
                s1.angle -= na1;
                s1.angle_vel -= na1;
            }
            s1.syncBody();
        }
        if (s2.type == ShapeType.Poly) {
            if (s2.mode == ShapeMode.Dynamic) {
                var na2 = Vector2d.cross(cp2, contact.getNormal()) * s2.invInertial;
                s2.angle += na2;
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