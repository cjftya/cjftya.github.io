class Circle {
    constructor(x, y, r) {
        this.__x = x;
        this.__y = y;
        this.__r = r;
        this.__s = r * 2;
    }

    getCx() {
        return this.__x;
    }

    getCy() {
        return this.__y;
    }

    pick(px, py) {
        var dx = px - this.__x;
        var dy = py - this.__y;
        var d = dx * dx + dy * dy;
        return d < this.__r * this.__r;
    }

    setColor(r, g, b, a) {
        this.__color = new Color(r, g, b, a);
    }

    setAlpha(a) {
        this.__color.setAlpha(a);
    }

    draw() {
        this.__color.applyColor();
        ellipse(this.__x, this.__y, this.__s, this.__s);

        noStroke();
        fill(255, 255, 255, 255);
        ellipse(this.__x, this.__y, this.__r / 2, this.__r / 2);
    }
}