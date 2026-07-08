class BgBubble {
    constructor(w, h) {
        this.__bubleColor = color(250, 190, 190);
        this.__bubleColor.setAlpha(0);

        this.__bubleArr = [];

        var x, y, r;
        for (var i = 0; i < 8; i++) {
            x = MathUtil.randInt(50, w - 50);
            y = MathUtil.randInt(h / 2 + 50, h - 50);
            r = MathUtil.randInt(250, 800);
            this.__bubleArr.push({ x, y, r });
        }
    }

    draw() {
        fill(this.__bubleColor);
        for (var b of this.__bubleArr) {
            ellipse(b.x, b.y, b.r, b.r);
        }
    }
}