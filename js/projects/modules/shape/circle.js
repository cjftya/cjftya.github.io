class Circle extends AbsShape {
    constructor(id, px, py, r, mode) {
        super(id, ShapeType.Circle, mode);

        this.radius = r;
        this.size = r * 2;

        this.pos.set(px, py);
        this.invMass = 1;
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
    }

    draw() {
        fill(this.color[0], this.color[1], this.color[2]);
        ellipse(this.pos.x, this.pos.y, this.size, this.size);
    }
}