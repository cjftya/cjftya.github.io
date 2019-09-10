class ConstraintResolver {
    constructor() {
    }

    static resolveConstraint(connect) {
        var s1 = ObjectPool.connect().find(connect.getIdA());
        var s2 = ObjectPool.connect().find(connect.getIdB());
        var dx = s1.pos.x - s2.pos.x;
        var dy = s1.pos.y - s2.pos.y;
        var length = Math.sqrt(dx * dx + dy * dy);
        var diff = length - connect.getLength();
        if(diff < 0) {
            diff = 0;
        }
        var constraintF = connect.getConstraintForce() * diff;
        var dampF = connect.getDampForce() * diff;
        if(dampF > constraintF) {
            dampF = constraintF;
        }
        var responseF = constraintF - dampF;
        var ex = (dx / length) * responseF;
        var ey = (dy / length) * responseF;
        if (!s1.isFixed) {
            s1.pos.x -= ex;
            s1.pos.y -= ey;
        }
        if (!s2.isFixed) {
            s2.pos.x += ex;
            s2.pos.y += ey;
        }
    }

    static update(connect) {
        this.resolveConstraint(connect);
    }
}