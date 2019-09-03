class Circle extends AbsShape {
    constructor(px, py, r, mode) {
        super(ShapeType.Circle, mode);

        this.radius = r;
        this.size = r * 2;

        this.pos.set(px, py);
        this.mass = this.radius * 0.1;
        this.invMass = 1 / this.mass;
        this.inertial = 1;
        this.invInertial = 1 / this.inertial;
    }

    updateVel(delta) {
        this.vel.x += this.accel.x;
        this.vel.y += this.accel.y;
        this.vel.mul(0.9995);
        this.accel.zero();
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