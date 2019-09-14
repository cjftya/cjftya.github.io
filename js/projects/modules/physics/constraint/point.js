class Point extends AbsObject {
    constructor(px, py) {
        super();

        this.pos = new Vector2d().set(px, py);
        this.oldPos = new Vector2d().set(px, py);
        this.accel = new Vector2d();

        this.color = [0, 0, 0];

        this.radius = 15;
        this.size = this.radius * 2;

        this.mass = 1;
        this.invMass = 1 / this.mass;

        this.isFixed = false;
        this.isPicked = false;
    }

    fixPoint() {
        this.isFixed = true;
    }

    unFixPoint() {
        this.isFixed = false;
    }

    addForce(fx, fy) {
        if (this.isFixed || this.isPicked) {
            return;
        }
        this.accel.x += fx * this.invMass;
        this.accel.y += fy * this.invMass;
    }

    updatePos(delta) {
        if (this.isFixed || this.isPicked) {
            return;
        }
        var nx = this.pos.x + ((this.pos.x - this.oldPos.x) * 0.9995) + this.accel.x;
        var ny = this.pos.y + ((this.pos.y - this.oldPos.y) * 0.9995) + this.accel.y;
        this.oldPos.set(this.pos.x, this.pos.y);
        this.pos.set(nx, ny);
        this.accel.zero();
    }

    pick(px, py) {
        this.isPicked = true;
        this.pos.set(px, py);
        this.oldPos.set(px, py);
    }

    move(px, py) {
        this.pos.set(px, py);
        this.oldPos.set(px, py);
    }

    release(px, py) {
        this.isPicked = false;
        this.pos.set(px, py);
        this.oldPos.set(px, py);
    }

    draw() {
        // fill(this.color[0], this.color[1], this.color[2]);
        // ellipse(this.pos.x, this.pos.y, 8, 8);
    }
}