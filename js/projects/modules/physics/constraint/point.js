class Point extends AbsObject {
    constructor(px, py) {
        super();

        this.pos = new Vector2d().set(px, py);
        this.oldPos = new Vector2d().set(px, py);
        this.accel = new Vector2d();

        this.color = [0, 0, 0];

        this.radius = 7;
        this.size = this.radius * 2;

        this.mass = 1;
        this.invMass = 1 / this.mass;

        this.isFixed = false;
    }

    fixPoint() {
        this.isFixed = true;
    }

    unFixPoint() {
        this.isFixed = false;
    }

    addForce(fx, fy) {
        if(this.isFixed) {
            return;
        }
        this.accel.x += fx * this.invMass;
        this.accel.y += fy * this.invMass;
    }

    updatePos(delta) {
        if(this.isFixed) {
            return;
        }
        var nx = this.pos.x + ((this.pos.x - this.oldPos.x) * 0.9995) + this.accel.x;
        var ny = this.pos.y + ((this.pos.y - this.oldPos.y) * 0.9995) + this.accel.y;
        this.oldPos.set(this.pos.x, this.pos.y);
        this.pos.set(nx, ny);
        this.accel.zero();
    }

    pick(px, py) {
        this.isFixed = true;
        this.pos.set(px, py);
        this.oldPos.set(px, py);
    }

    move(px, py) {
        this.pos.set(px, py);
        this.oldPos.set(px, py);        
    }

    release(px, py) {
        this.isFixed = false;
        this.pos.set(px, py);
        this.oldPos.set(px, py);
    }

    draw() {
        // fill(this.color[0], this.color[1], this.color[2]);
        // ellipse(this.pos.x, this.pos.y, this.size, this.size);
    }
}