class RainDrop {
    constructor(px, py) {
        this.pos = new Vector2d(px, py);
        this.vel = new Vector2d(0, 0);
    }

    onDraw() {
        fill(100, 100, 200);
        ellipse(this.pos.x, this.pos.y, 2, 12);
    }
}