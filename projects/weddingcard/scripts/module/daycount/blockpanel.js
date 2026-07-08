class BlockPanel {
    constructor() {
        this.__pos = new Vector2d();
        this.__w = 0;
        this.__h = 0;

        this.__alphaRate = [];
        this.__alpha = 255;
        this.__color = color(255, 255, 255);
    }

    getAlpha() {
        return this.__alpha;
    }

    addAlpha(a) {
        this.__alpha += a * this.__alphaRate[a > 0 ? 1 : 0];
        if (this.__alpha > 230) {
            this.__alpha = 230;
        } else if (this.__alpha < 0) {
            this.__alpha = 0;
        }
        return this;
    }

    setAlphaIncreaseRate(r1, r2) {
        this.__alphaRate.push(r1);
        this.__alphaRate.push(r2);
        return this;
    }

    setAlpha(a) {
        this.__alpha = a;
        return this;
    }

    addPos(x, y) {
        this.__pos.x += x;
        this.__pos.y += y;
        return this;
    }

    setPos(x, y) {
        this.__pos.set(x, y);
        return this;
    }

    setPosY(y) {
        this.__pos.set(this.__pos.x, y);
        return this;
    }

    getPos() {
        return this.__pos;
    }

    setSize(w, h) {
        this.__w = w;
        this.__h = h;
        return this;
    }

    setColor(r, g, b) {
        this.__color = color(r, g, b);
        return this;
    }

    draw() {
        this.__color.setAlpha(this.__alpha);
        fill(this.__color);
        rect(this.__pos.x, this.__pos.y, this.__w, this.__h);
    }
}