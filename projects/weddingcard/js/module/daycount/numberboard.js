class NumberBoard {
    constructor() {
        this.__pos = new Vector2d();
        this.__w = 0;
        this.__h = 0;

        this.__color = color(200, 150, 150);
        this.__color.setAlpha(130);
        this.__charColor = color(250, 250, 250);
        this.__char = "";
        this.__isBackground = true;
    }

    setChar(c) {
        this.__char = c;
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

    setPosX(x) {
        this.__pos.set(x, this.__pos.y);
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

    setCharColor(r, g, b) {
        this.__charColor = color(r, g, b);
        return this;
    }

    setBackground(v) {
        this.__isBackground = v;
        return this;
    }

    draw() {
        if (this.__isBackground) {
            fill(this.__color);
            rect(this.__pos.x, this.__pos.y, this.__w, this.__h, 14);
        }
        textSize(15);
        textStyle(BOLD);
        textAlign(CENTER, null);
        noStroke();
        fill(this.__charColor);
        text(this.__char,
            this.__pos.x + 3, this.__pos.y + this.__h / 2 + 6,
            this.__w, this.__h);
    }
}