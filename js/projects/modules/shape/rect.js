class Rect extends AbsShape {
    constructor(x, y, w, h, mode) {
        super(ShapeType.Poly, mode);

        this.w = w;
        this.h = h;
        this.mass = (w + h) * 0.015;
        if(this.mode == ShapeMode.Static) {
            this.mass *= 1000;
        }
        this.invMass = 1 / this.mass;

        this.setVertex([
            new CtPoint(x, y),
            new CtPoint(x + w, y),
            new CtPoint(x + w, y + h),
            new CtPoint(x, y + h)
        ]);

        this.setConnection([
            new Edge(0, 1),
            new Edge(1, 2),
            new Edge(2, 3),
            new Edge(3, 0),
            new Edge(0, 2).setInner(),
            new Edge(1, 3).setInner()
        ]); 
    }

    updatePos(delta, gx, gy) {
        for (var i = 0; i < this.vertex.length; i++) {
            var p = this.vertex[i];
            p.accel.x += gx;
            p.accel.y += gy;
            var nx = ((p.pos.x * this.viscosity) - (p.oldPos.x * this.viscosity)) + p.accel.x;
            var ny = ((p.pos.y * this.viscosity) - (p.oldPos.y * this.viscosity)) + p.accel.y;
            p.oldPos.set(p.pos.x, p.pos.y);
            p.pos.x += nx;
            p.pos.y += ny;
            p.accel.zero();
        }
    }
    
    containPoint(p) {
        var d = Vector2d.sub(this.center, p).length();
        var r = (this.w < this.h ? this.w : this.h) * 0.5;
        if (d < r) {
            return true;
        }
        return false;
    }

    draw() {
        fill(this.color[0], this.color[1], this.color[2]);
        beginShape();
        for (var i = 0; i < this.vertex.length; i++) {
            vertex(this.vertex[i].pos.x, this.vertex[i].pos.y);
        }
        endShape(CLOSE);
    }
}