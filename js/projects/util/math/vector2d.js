class Vector2d {
    constructor() {
        this.x = 0;
        this.y = 0;
    }

    set(px, py) {
        this.x = px;
        this.y = py;
        return this;
    }

    zero() {
        this.x = 0;
        this.y = 0;
        return this;
    }

    add(other) {
        this.x += other.x;
        this.y += other.y;
        return this;
    }

    static add(a, b) {
        return new Vector2d().set(a.x + b.x, a.y + b.y);
    }

    sub(other) {
        this.x -= other.x;
        this.y -= other.y;
    }

    static sub(a, b) {
        return new Vector2d().set(a.x - b.x, a.y - b.y);
    }

    mul(delta) {
        this.x *= delta;
        this.y *= delta;
        return this;
    }

    static mul(a, b) {
        return new Vector2d().set(a.x * b.x, a.y * b.y);
    }

    div(a) {
        this.x /= a.x;
        this.y /= a.y;
        return this;
    }

    static div(a, b) {
        return new Vector2d().set(a.x / b.x, a.y / b.y);
    }

    length() {
        return Math.sqrt(this.dot(this));
    }

    static lengthSqrt(a, b) {
        var dx = b.x - a.x;
        var dy = b.y - a.y;
        return dx * dx + dy * dy;
    }

    normalize() {
        var dn = this.length();
        this.x /= dn;
        this.y /= dn;
        return this;
    }

    static normalize(a) {
        var dn = Math.sqrt(this.dot(a, a));
        return new Vector2d().set(a.x / dn, a.y / dn);
    }

    dot() {
        return this.x * this.x + this.y * this.y;
    }

    dot(other) {
        return this.x * other.x + this.y * other.y;
    }

    static dot(a, b) {
        return a.x * b.x + a.y * b.y;
    }

    cross(other) {
        return this.x * other.y - this.y * other.x;
    }

    static cross(a, b) {
        return a.x * b.y - a.y * b.x;
    }

    neg() {
        this.mul(-1);
        return this;
    }

    static neg(a) {
        return new Vector2d().set(-a.x, -a.y);
    }

    perp() {
        var temp = this.x;
        this.x = -this.y;
        this.y = temp;
        return this;
    }

    static perp(a) {
        return new Vector2d().set(-a.y, a.x);
    }
}