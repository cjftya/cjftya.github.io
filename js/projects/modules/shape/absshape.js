class Edge {
    constructor(n, d) {
        this.__n = n;
        this.__d = d;
    }

    set(n, d) {
        this.__n = n;
        this.__d = d;
    }

    getNormal() {
        return this.__n;
    }

    getStartPos() {
        return this.__d;
    }
}

class AbsShape extends AbsObject {
    constructor(type, mode) {
        super();

        this.type = type;
        this.mode = mode;
        this.color = [MathUtil.randNum(255), MathUtil.randNum(255), MathUtil.randNum(255)];

        this.pos = new Vector2d();
        this.vel = new Vector2d();
        this.accel = new Vector2d();
        this.angle = 0;
        this.angle_vel = 0;

        this.mass = 0;
        this.invMass = 0;
 
        this.inertial = 0;
        this.invInertial = 0;

        this.centroid = new Vector2d();

        this.trans = new Transform(this.pos, this.angle);

        this.vertex = null;
        this.vertexCpy = null;
        this.edge = null;
    }

    setVertex(vertex) {
        this.vertex = vertex;
        if (this.vertex.length > 1) {
            this.edge = [];
            this.vertexCpy = [];
        }
        for (var i = 0; i < this.vertex.length; i++) {
            var a = this.vertex[i];
            var b = this.vertex[(i + 1) % this.vertex.length];
            var n = Vector2d.normalize(Vector2d.perp(Vector2d.sub(a, b)));
            this.edge.push(new Edge(n, Vector2d.dot(n, a)));
            this.vertexCpy.push(a);
        }
    }

    syncBody() {
        this.syncTransform();
        this.syncEdge();
    }

    syncEdge() {
        for (var i = 0; i < this.vertex.length; i++) {
            var a = this.vertex[i];
            var b = this.vertex[(i + 1) % this.vertex.length];
            var n = Vector2d.normalize(Vector2d.perp(Vector2d.sub(a, b)));
            this.edge[i].set(n, Vector2d.dot(n, a));
        }
    }

    setTransform(p, a) {
        this.trans.set(p, a);
        this.pos = this.trans.transform(this.centroid);
        this.angle = a;
    }

    syncTransform() {
        this.trans.setRotation(this.angle);
        this.trans.setPosition(Vector2d.sub(this.pos, this.trans.rotate(this.centroid)));
        for (var i = 0; i < this.vertex.length; i++) {
            this.vertex[i] = this.trans.transform(this.vertexCpy[i]);
        }
    }

    containPoint(p) {
        for (var i = 0; i < this.edge.length; i++) {
            var pl = this.edge[i];
            if (Vector2d.dot(pl.getNormal(), p) - pl.getStartPos() > 0) {
                return false;
            }
        }
        return true;
    }

    distanceOnPlane(n, d) {
        var min = 999999;
        for (var i = 0; i < this.vertex.length; i++) {
            min = Math.min(min, Vector2d.dot(n, this.vertex[i]));
        }
        return min - d;
    }

    addForce(fx, fy) {
        this.accel.x += fx * this.invMass;
        this.accel.y += fy * this.invMass;
    }

    updateVel(delta) { }
    updatePos(delta) { }

    draw() { }
}