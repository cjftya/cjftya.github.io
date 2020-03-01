class ParticleCircle {
    constructor() {
        this.pos = new Vector2d();
        this.vel = new Vector2d();
        this.__r = 0;
        this.__color = color(255, 255, 255);
        this.__colorSecond = color(255, 255, 255);
        this.__colorSecond.setAlpha(15);
        this.__colorThird = color(255, 255, 255);
        this.__colorThird.setAlpha(10);
        this.__life = 0;
        this.__isBlur = false;
    }

    setLife(v) {
        this.__life = v;
    }

    getLife() {
        return this.__life;
    }

    increaseLife(v) {
        this.__life += v;
    }

    decreaseLife(v) {
        this.__life -= v;
    }

    setRadius(r) {
        this.__r = r;
    }

    getRadius() {
        return this.__r;
    }

    setAlpha(a) {
        this.__color.setAlpha(a);
    }

    setAlpha3(a1, a2, a3) {
        this.__color.setAlpha(a1);
        this.__colorSecond.setAlpha(a2);
        this.__colorThird.setAlpha(a3);
    }

    setBlur(v) {
        this.__isBlur = v;
    }

    setColor(r, g, b) {
        this.__color.setRed(r);
        this.__color.setGreen(g);
        this.__color.setBlue(b);

        this.__colorSecond.setRed(r);
        this.__colorSecond.setGreen(g);
        this.__colorSecond.setBlue(b);

        this.__colorThird.setRed(r);
        this.__colorThird.setGreen(g);
        this.__colorThird.setBlue(b);
        return this;
    }

    draw() {
        if (this.__isBlur) {
            fill(this.__colorThird);
            ellipse(this.pos.x, this.pos.y, this.__r * 5, this.__r * 5);
            fill(this.__colorSecond);
            ellipse(this.pos.x, this.pos.y, this.__r * 3, this.__r * 3);
        }
        fill(this.__color);
        ellipse(this.pos.x, this.pos.y, this.__r, this.__r);
    }
}