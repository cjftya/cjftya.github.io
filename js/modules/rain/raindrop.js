class RainDrop {
    constructor(px, py) {
        this.__pos = new Vector2d(px, py);
        this.__vel = new Vector2d(0, 0);
    }

    addForce(fx, fy) {
        this.__vel.add(fx, fy);
    }

    onUpdate(timeDelta) {
        this.__vel.addY(9.8 * timeDelta);
        this.__vel.mul(0.998, 0.998);
        this.__pos.add(this.__vel.getX(), this.__vel.getY());
    }

    onDraw() {
        fill(100, 100, 200);
        ellipse(this.__pos.getX(), this.__pos.getY(), 20, 20);
    }
}