class BlurCircle {
    constructor() {
        this.pos = new Vector2d();
        this.vel = new Vector2d();
        this.__r = 0;
        this.__blurR = [];
        this.__blurR.push(0);
        this.__blurR.push(0);

        this.__color = color(255, 255, 255);
        this.__blurColor = [];
        this.__blurColor.push(color(255, 255, 255));
        this.__blurColor.push(color(255, 255, 255));
        this.__blurColor[0].setAlpha(15);
        this.__blurColor[1].setAlpha(10);

        this.__life = 0;
    }

    setLife(v) {
        this.__life = v;
    }

    getLife() {
        return this.__life;
    }

    addLife(v) {
        this.__life += v;
    }

    setRadius(r) {
        this.__r = r;
    }

    setRadiusWithBlur(r, bR1, bR2) {
        this.__r = r;
        this.__blurR[0] = bR1;
        this.__blurR[1] = bR2;
    }

    getRadius() {
        return this.__r;
    }

    setAlpha(a) {
        this.__color.setAlpha(a);
    }

    setAlphaWithBlur(a, bA1, bA2) {
        this.__color.setAlpha(a);
        this.__blurColor[0].setAlpha(bA1);
        this.__blurColor[1].setAlpha(bA2);
        return this;
    }

    setColor(r, g, b) {
        this.__color.setRed(r);
        this.__color.setGreen(g);
        this.__color.setBlue(b);
        this.__blurColor[0].setRed(r);
        this.__blurColor[0].setGreen(g);
        this.__blurColor[0].setBlue(b);
        this.__blurColor[1].setRed(r);
        this.__blurColor[1].setGreen(g);
        this.__blurColor[1].setBlue(b);
        return this;
    }

    draw() {
        // blur
        for (var i = 1; i >= 0; i--) {
            fill(this.__blurColor[i]);
            ellipse(this.pos.x, this.pos.y, this.__blurR[i], this.__blurR[i]);
        }
        // point
        fill(this.__color);
        ellipse(this.pos.x, this.pos.y, this.__r, this.__r);
    }
}