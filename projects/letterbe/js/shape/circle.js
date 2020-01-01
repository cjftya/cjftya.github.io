class Circle extends AbsShape {
    constructor(px, py, size) {
        super();

        this.pos = new Vector2d().set(px, py);
        this.vel = new Vector2d();
        this.__r = size;
    }

    update() {
        //nothing..
    }

    draw() {
        ellipse(this.pos.x, this.pos.y, this.__r, this.__r);
    }
}