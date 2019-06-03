class ParticleBasic {
    constructor() {
        this.__pos = new Point();
        this.__vel = new Point();
        this.__r = Tools.randInt(5, 20);
        this.__s = this.__r * 2;
        var c = Tools.randInt(200, 230);
        this.__color = new Color(c, c, c, 180);
        this.__visible = false;
    }

    draw() {
        this.__color.applyColor();
        ellipse(this.__pos.x, this.__pos.y, this.__s, this.__s);
    }
}