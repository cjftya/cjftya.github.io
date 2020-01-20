class TextView extends AbsView {
    constructor(str) {
        super(1);

        this.__textSize = 10;
        this.__text = str;
        this.__color = color(0, 0, 0);
        this.__wp = LEFT;
        this.__hp = TOP;

        var winSize = TopicManager.ready().read(DISPLAY_INFO.WINDOW_SIZE);
        this.__w = winSize[0];
        this.__h = winSize[1];
        this.__px = 0;
        this.__py = 0;
    }

    setColor(r, g, b) {
        this.__color.setRed(r);
        this.__color.setGreen(g);
        this.__color.setBlue(b);
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

    setPos(x, y) {
        this.__px = x;
        this.__py = y;
        return this;
    }

    draw() {
        textSize(this.__textSize);
        noStroke();
        fill(this.__color);
        textAlign(this.__wp, this.__hp);
        text(this.__text, this.__px, this.__py, this.__w, this.__h);
    }
}