class ParticleCircle {
    constructor() {
        this.pos = new Vector2d();
        this.vel = new Vector2d();
        this.__r = 0;
        this.__color = color(255, 255, 255);
        this.__life = 0;
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

    setColor(r, g, b) {
        this.__color.setRed(r);
        this.__color.setGreen(g);
        this.__color.setBlue(b);
    }

    draw() {
        fill(this.__color);
        ellipse(this.pos.x, this.pos.y, this.__r, this.__r);
    }
}