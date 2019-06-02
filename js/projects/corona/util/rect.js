class Rect {
    constructor(x, y, w, h) {
        this.__x = x;
        this.__y = y;
        this.__w = w;
        this.__h = h;
        this.__hw = w / 2;
        this.__hh = h / 2;
    }

    pick(px, py) {
        if (px < this.__x || px > this.__x + this.__w ||
            py < this.__y || py > this.__y + this.__h) {
            return false;
        }
        return true;
    }

    setColor(r, g, b) {
        this.__color = new Color(r, g, b);
    }

    setAlpha(a) {
        this.__color.setAlpha(a);
    }

    draw() {
       /// this.__color.applyColor();
       noFill();
        strokeWeight(3);
        stroke(100);
        rect(this.__x, this.__y, this.__w, this.__h);
    }
}