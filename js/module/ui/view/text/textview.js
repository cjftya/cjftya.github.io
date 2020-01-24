class TextView extends AbsView {
    constructor(str) {
        super(1);

        this.__textSize = 10;
        this.__text = str;
        this.__color = color(0, 0, 0);
        this.__wp = LEFT;
        this.__hp = TOP;
        this.__textStyle = NORMAL;

        var winSize = TopicManager.ready().read(DISPLAY_INFO.WINDOW_SIZE);
        this.__w = winSize[0];
        this.__h = winSize[1];
        this.__pos = new Vector2d();
    }

    inScreen(sw, sh) {
        if (this.__pos.y > -this.__textSize - 50 &&
            this.__pos.y < sh + this.__textSize + 50) {
            return true;
        }
        return false;
    }

    setColor(r, g, b) {
        this.__color.setRed(r);
        this.__color.setGreen(g);
        this.__color.setBlue(b);
        return this;
    }

    setAlpha(a) {
        this.__color.setAlpha(a);
        return this;
    }

    setSize(s) {
        this.__textSize = s;
        return this;
    }

    setText(str) {
        this.__text = str;
        return this;
    }

    setAlign(wp, hp) {
        this.__wp = wp;
        this.__hp = hp;
        return this;
    }

    setTextStyle(s) {
        this.__textStyle = s;
        return this;
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

    draw() {
        textSize(this.__textSize);
        textStyle(this.__textStyle);
        noStroke();
        fill(this.__color);
        textAlign(this.__wp, this.__hp);
        text(this.__text, this.__pos.x, this.__pos.y, this.__w, this.__h);
    }
}