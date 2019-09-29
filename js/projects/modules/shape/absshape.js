class Edge {
    constructor(a, b) {
        this.aIndex = a;
        this.bIndex = b;
        this.dist = 0;
        this.inner = false;
        this.parent = null;
    }

    setInner() {
        this.inner = true;
        return this;
    }

    setParent(p) {
        this.parent = p;
    }
}

 // constraint point
class CtPoint {
    constructor(x, y) {
        this.pos = new Vector2d().set(x, y);
        this.oldPos = new Vector2d().set(x, y);
        this.accel = new Vector2d();
        this.parent = null;
    }

    setParent(p) {
        this.parent = p;
    }
}

class AbsShape extends AbsObject {
    constructor(type, mode) {
        super();

        this.type = type;
        this.mode = mode;
        this.color = [MathUtil.randInt(100, 255),
        MathUtil.randInt(100, 255), MathUtil.randInt(100, 255)];

        this.center = new Vector2d();
        this.halfEx = new Vector2d();

        this.aabb = new AABB();

        this.mass = 0;
        this.invMass = 0;

        this.viscosity = 1.0;

        this.vertex = [];
        this.edge = [];

        this.innerEdgeCount = 0;

        this.syncBody();
    }

    setVertex(vertexList) {
        for (var i = 0; i < vertexList.length; i++) {
            vertexList[i].setParent(this);
            this.vertex.push(vertexList[i]);
        }
    }

    setConnection(connectList) {
        for (var i = 0; i < connectList.length; i++) {
            var connect = connectList[i];
            connect.dist = Vector2d.lengthSqrt(this.vertex[connect.aIndex].pos, this.vertex[connect.bIndex].pos);
            connect.setParent(this);
            if (connect.inner) {
                this.innerEdgeCount++;
            }
            this.edge.push(connect);
        }
    }

    getEdgeCount() {
        return this.edge.length - this.innerEdgeCount;
    }

    movePos(vx, vy) {
        for (var i = 0; i < this.vertex.length; i++) {
            this.vertex[i].pos.x += vx;
            this.vertex[i].pos.y += vy;
            // this.vertex[i].oldPos.x += vx;
            // this.vertex[i].oldPos.y += vy;
        }
    }

    syncBody() {
        if (this.vertex.length == 0) {
            return;
        }

        var minX = 99999.0, minY = 99999.0, maxX = -99999.0, maxY = -99999.0;
        for (var i = 0; i < this.vertex.length; i++) {
            var v = this.vertex[i];
            if (v.pos.x > maxX) {
                maxX = v.pos.x;
            }
            if (v.pos.y > maxY) {
                maxY = v.pos.y;
            }
            if (v.pos.x < minX) {
                minX = v.pos.x;
            }
            if (v.pos.y < minY) {
                minY = v.pos.y;
            }
		}
        this.center.set((minX + maxX) * 0.5, (minY + maxY) * 0.5);
        this.halfEx.set((maxX - minX) * 0.5, (maxY - minY) * 0.5);

        this.aabb.update(minX, minY, maxX - minX, maxY - minY);
    }

    projectAxis(axis) {
        var d = this.vertex[0].pos.dot(axis);
        var min = d;
        var max = d;

        for (var i = 1; i < this.vertex.length; i++) {
            d = this.vertex[i].pos.dot(axis);
            if (d > max) {
                max = d;
            }
            if (d < min) {
                min = d;
            }
        }
        return [min, max];
    }

    containPoint(p) {
        

        return false;
    }

    updateConstraint() {
        for (var i = 0; i < this.edge.length; i++) {
            var e = this.edge[i];
            var dx = this.vertex[e.bIndex].pos.x - this.vertex[e.aIndex].pos.x;
            var dy = this.vertex[e.bIndex].pos.y - this.vertex[e.aIndex].pos.y;
 
            // using square root approximation
            var delta = e.dist / (dx * dx + dy * dy + e.dist) - 0.5;

            dx *= delta;
            dy *= delta;

            this.vertex[e.aIndex].pos.x -= dx;
            this.vertex[e.aIndex].pos.y -= dy;
            this.vertex[e.bIndex].pos.x += dx;
            this.vertex[e.bIndex].pos.y += dy;
        }
    }

    updatePos(delta) {
    }

    draw() { }
}