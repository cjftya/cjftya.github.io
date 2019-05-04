class Circle extends AbsShape {
    constructor(px, py, r) {
        super();
        this.radius = r;
        this.size = r * 2;

        this.pos.init(px, py);
        this.invMass = r / r;

        console.log(px);
    }

    updateVel(delta) {
        this.vel.x += (this.force.x * this.invMass) * delta;
        this.vel.y += (this.force.y * this.invMass) * delta;

        this.vel.mul(0.995);

        this.force.zero();
    }

    updatePos(delta) {
        this.pos.x += this.vel.x * delta;
        this.pos.y += this.vel.y * delta;
    }

    draw() {
        fill(100, 100, 200);
        ellipse(this.pos.x, this.pos.y, this.size, this.size);
    }
}