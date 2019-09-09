class ConstraintResolver {
    constructor() {
    }

    static resolveConstraint(connect) {
        var s1 = ObjectPool.connect().find(connect.getIdA());
        var s2 = ObjectPool.connect().find(connect.getIdB());
        var dp = Vector2d.sub(s1.pos, s2.pos);
        var length = dp.length();
        var diff = length - connect.getLength();
        var constraintF = connect.getConstraintForce() * diff;
        var dampF = connect.getDampForce() * diff;
        if(dampF > constraintF) {
            dampF = constraintF;
        }
        var responseF = constraintF - dampF;
        var ex = (dp.x / length) * responseF;
        var ey = (dp.y / length) * responseF;
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