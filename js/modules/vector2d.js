class Vector2d {
    constructor(px, py) {
        this.x = px;
        this.y = py;
    }

    zero() {
        this.x = 0;
        this.y = 0;
    }

    add(deltaX, deltaY) {
        this.x += deltaX;
        this.y += deltaY;        
    }

    add(other) {
        this.x += other.x;
        this.y += other.y;
    }

    mul(deltaX, deltaY) {
        this.x *= deltaX;
        this.y *= deltaY;
    }

    mul(delta) {
        this.x *= delta;
        this.y *= delta;
    }
}