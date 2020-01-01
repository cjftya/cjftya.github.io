class Transform {
    constructor(pos, angle) {
        this.__t = new Vector2d().set(pos.x, pos.y);
        this.__c = Math.cos(angle);
        this.__s = Math.sin(angle);
    }

    set(pos, angle) {
        this.__t.set(pos.x, pos.y);
        this.__c = Math.cos(angle);
        this.__s = Math.sin(angle);
        return this;
    }

    setRotation(angle) {
        this.__c = Math.cos(angle);
        this.__s = Math.sin(angle);
        return this;
    }

    setPosition(pos) {
        this.__t.set(pos.x, pos.y);
        return this;
    }

    identity() {
        this.__t.zero();
        this.__c = 1;
        this.__s = 0;
    }

    rotate(p) {
        return new Vector2d().set(p.x * this.__c - p.y * this.__s,
            p.x * this.__s + p.y * this.__c);
    }

    unRotate(p) {
        return new Vector2d().set(p.x * this.__c + p.y * this.__s,
            -p.x * this.__s + p.y * this.__c);
    }

    transform(p) {
        return new Vector2d().set(p.x * this.__c - p.y * this.__s + this.__t.x,
            p.x * this.__s + p.y * this.__c + this.__t.y);
    }

    unTransform(p) {
        var tx = p.x - this.__t.x;
        var ty = p.y - this.__t.y;
        return new Vector2d().set(tx * this.__c + ty * this.__s,
            -tx * this.__s + ty * this.__c + this.__t.y);
    }
}