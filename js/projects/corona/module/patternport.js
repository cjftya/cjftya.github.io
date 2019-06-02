class PatternPort {
    constructor(x, y, r, padding) {
        this.__body = new Circle(x, y, r - padding);
        this.__body.setColor(200, 200, 200, 100);
        this.__pickCheck = false;
    }

    getCx() {
        return this.__body.getCx();
    }

    getCy() {
        return this.__body.getCy();
    }

    pick(px, py) {
        if (this.__body.pick(px, py)) {
            this.__pickCheck = true;
            this.__body.setAlpha(230);
            return true;
        }
        return false;
    }

    isPick() {
        return this.__pickCheck;
    }

    release() {
        this.__pickCheck = false;
        this.__body.setAlpha(100);
    }

    getDate() {
        return this.__number;
    }

    update() {

    }

    draw() {
        this.__body.draw();
    }
}