class Vector2d {
    constructor() {
        this.x = 0;
        this.y = 0;
    }

    init(px, py) {
        this.x = px;
        this.y = py;
    }

    set(other) {
        this.x = other.x;
        this.y = other.y;
        return this;
    }

    zero() {
        this.x = 0;
        this.y = 0;
    }

    add(other) {
        this.x += other.x;
        this.y += other.y;
    }

    mul(delta) {
        this.x *= delta;
        this.y *= delta;
    }
}