class Vector2d {
    constructor(px, py) {
        this.__x = px;
        this.__y = py;
    }

    getX() {
        return this.__x;
    }

    getY() {
        return this.__y;
    }

    set(px, py) {
        this.__x = px;
        this.__y = py;
    }

    addX(delta) {
        this.__x += delta;
    }

    addY(delta) {
        this.__y += delta;
    }

    add(deltaX, deltaY) {
        this.__x += deltaX;
        this.__y += deltaY;
    }

    mul(deltaX, deltaY) {
        this.__x *= deltaX;
        this.__y *= deltaY;
    }
}