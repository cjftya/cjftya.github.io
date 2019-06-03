class Particle {
    constructor() {
        this.__pos = new Point().set(Tools.randInt(0, windowWidth), Tools.randInt(0, windowHeight));
        this.__vel = new Point().set(Tools.randInt(-10, 10), Tools.randInt(-10, 10));
        this.__r = Tools.randInt(3, 35);
        this.__vel.x *= (this.__r / 500);
        this.__vel.y *= (this.__r / 500);
        this.__s = this.__r * 2;
        this.__cr = Tools.randInt(170, 230);
        this.__cg = this.__cr;
        this.__cb = this.__cr;
        this.__ca = Tools.randInt(5, 30);
    }

    update() {
        if (this.__pos.x < 0 - this.__r) {
            this.__pos.x = windowWidth + this.__r;
        } else if (this.__pos.x > windowWidth + this.__r) {
            this.__pos.x = -this.__r;
        }
        if (this.__pos.y < 0 - this.__r) {
            this.__pos.y = windowHeight + this.__r;
        } else if (this.__pos.y > windowHeight + this.__r) {
            this.__pos.y = -this.__r;
        }

        this.__pos.x += this.__vel.x;
        this.__pos.y += this.__vel.y;
    }

    draw() {
        fill(this.__cr, this.__cg, this.__cb, this.__ca);
        ellipse(this.__pos.x, this.__pos.y, this.__s, this.__s);
    }
}