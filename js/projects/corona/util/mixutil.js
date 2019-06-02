class Point {
    constructor() {
        this.x = 0;
        this.y = 0;
    }

    set(x, y){
        this.x = x;
        this.y = y;
        return this;
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

    setAlpha(a){
        this.__color.setAlpha(a);
    }

    applyColor() {
        fill(this.__color);
    }
}