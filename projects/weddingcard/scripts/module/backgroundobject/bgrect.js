class BgRect {
    constructor() {
        this.__pos = new Vector2d();

        var winSize = TopicManager.ready().read(DISPLAY_INFO.WINDOW_SIZE);
        this.__w = winSize[0];
        this.__h = winSize[1];

        this.__color = color(255, 255, 255);
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

    getPos() {
        return this.__pos;
    }

    setHeight(h) {
        this.__h = h;
        return this;
    }

    getHeight() {
        return this.__h;
    }

    setColor(r, g, b) {
        this.__color.setRed(r);
        this.__color.setGreen(g);
        this.__color.setBlue(b);
        return this;
    }

    draw() {
        fill(this.__color);
        rect(this.__pos.x, this.__pos.y, this.__w, this.__h);
    }

    updateWithDraw() {
        this.draw();
    }
}