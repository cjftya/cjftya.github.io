class CharacterPoint {
    constructor() {
        this.pos = new Vector2d();
        this.vel = new Vector2d();

        this.__char = "";
        this.__charSize = 0;
        this.__size = 0;
        this.__halfSize = 0;
        this.__color = color(100, 100, 100);
    }

    setPos(x, y) {
        this.pos.set(x, y);
        return this;
    }

    setSize(s) {
        this.__size = s;
        this.__halfSize = s / 2;
        return this;
    }

    setCharSize(s) {
        this.__charSize = s;
        return this;
    }

    setChar(c) {
        this.__char = c;
        return this;
    }

    getChar() {
        return this.__char;
    }

    setColor(r, g, b) {
        this.__color.setRed(r);
        this.__color.setGreen(g);
        this.__color.setBlue(b);
        return this;
    }

    setAlpha(a) {
        this.__color.setAlpha(a);
    }

    draw() {
        noStroke();
        textSize(this.__charSize);
        textAlign(CENTER, CENTER);

        fill(this.__color);
     //   ellipse(this.pos.x, this.pos.y, this.__size, this.__size);

   //     fill(10, 10, 10);
        text(this.__char, this.pos.x - this.__halfSize + 5, this.pos.y - this.__halfSize + 5,
            this.__size, this.__size);
    }
}