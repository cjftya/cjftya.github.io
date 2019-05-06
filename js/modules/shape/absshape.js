class AbsShape {
    constructor(type) {
        this.type = type;
        this.id = type + ObjectPool.ready().getCounter();
        this.color = [MathUtil.randNum(255), MathUtil.randNum(255), MathUtil.randNum(255)];

        this.pos = new Vector2d();
        this.vel = new Vector2d();
        this.angle = 0;
        this.angle_vel = 0;

        this.invMass = 0;

        this.centroid = new Vector2d();
        this.force = new Vector2d();

        this.transform = new Transform(this._pos, this._angle);
    }

    addForce(fx, fy) {
        this.force.x += fx;
        this.force.y += fy;
    }

    updateVel(delta) { }
    updatePos(delta) { }

    draw() { }
}