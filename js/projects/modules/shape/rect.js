class Rect extends AbsShape {
    constructor(px, py, w, h, a) {
        super(ShapeType.Poly);

        this.pos.set(px, py);

        this.angle = a;

        this.invMass = 1;
        
        this.w = w;
        this.h = h;
        var hw = w / 2;
        var hh = h / 2;

        var localX = 0;
        var localY = 0;
        this.setVertex([
            new Vector2d().set(localX - hw, localY - hh),
            new Vector2d().set(localX + hw, localY - hh),
            new Vector2d().set(localX + hw, localY + hh),
            new Vector2d().set(localX - hw, localY + hh)
        ]);
        
        this.syncBody();
    }

    updateVel(delta) {
        this.vel.x += (this.force.x * this.invMass);
        this.vel.y += (this.force.y * this.invMass);
        this.vel.mul(0.995);
        this.force.zero();
    }

    updatePos(delta) {
        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;
        // this.angle += 0.01;

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