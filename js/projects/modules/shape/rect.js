class Rect extends AbsShape {
    constructor(id, px, py, w, h, a, mode) {
        super(id, ShapeType.Poly, mode);

        this.pos.set(px, py);

        this.angle = a;

        this.trans.set(this.pos, this.angle);
        
        this.w = w;
        this.h = h;
        var hw = w / 2;
        var hh = h / 2;

        this.mass = (w + h) * 0.015;
        this.invMass = 1 / this.mass;

        var localX = 0;
        var localY = 0;
        this.setVertex([
            new Vector2d().set(localX - hw, localY - hh),
            new Vector2d().set(localX + hw, localY - hh),
            new Vector2d().set(localX + hw, localY + hh),
            new Vector2d().set(localX - hw, localY + hh)
        ]);

        
        var m4 = this.mass / this.vertex.length;
        for (var i = 0; i < this.vertex.length; i++) {
            var diff = Vector2d.sub(this.vertex[i], new Vector2d().set(localX, localY));
            var d = diff.length();
            this.inertial += ((d * d) * m4);
        }
        this.invInertial = 1 / this.inertial;
        console.log(this.invInertial);
        
        this.syncBody();
    }

    updateVel(delta) {
        this.angle_vel *= 0.9995;
        this.vel.x += this.accel.x;
        this.vel.y += this.accel.y;
        this.vel.mul(0.9995);
        this.accel.zero();
    }

    updatePos(delta) {
        this.angle += this.angle_vel;
        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;

        this.syncBody();
    }

    draw() {
        fill(this.color[0], this.color[1], this.color[2]);
        beginShape();
        for (var i = 0; i < this.vertex.length; i++) {
            vertex(this.vertex[i].x, this.vertex[i].y);
        }
        endShape(CLOSE);
    }
}