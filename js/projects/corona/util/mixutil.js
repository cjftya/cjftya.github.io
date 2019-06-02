class Point {
    constructor() {
        this.x = 0;
        this.y = 0;
    }

    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }
}

class TPoint {
    constructor() {
        this.pos = new Point();
        this.vel = new Point();
    }
}

class Color {
    constructor(r, g, b, a) {
        this.set(r, g, b, a);
    }

    set(r, g, b, a) {
        this.__r = r;
        this.__g = g;
        this.__b = b;
        this.__a = a;
        this.__color = color(this.__r, this.__g, this.__b, this.__a);
    }

    setAlpha(a) {
        this.__color.setAlpha(a);
    }

    applyColor() {
        fill(this.__color);
    }
}

class Tools {
    constructor() { }
    
    static randNum(a) {
        return Math.floor(Math.random() * a) + 1;
    }

    static randInt(min, max) {
        return Math.floor(Math.random() * ((max - min) + 1)) + min;
    }
}