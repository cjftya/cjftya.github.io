class TextView extends AbsView {
    constructor() {
        super(View.Text);

        this.__text = "";
        this.__color = color(0, 0, 0);
        this.__wAlign = LEFT;
        this.__hAlign = TOP;
        this.__textSize = 10;
        this.__textGap = 10;
        this.__lineCount = 0;
        this.__textStyle = NORMAL;

        var winSize = TopicManager.ready().read(DISPLAY_INFO.WINDOW_SIZE);
        this.__w = winSize[0];
        this.__h = winSize[1];
        this.__pos = new Vector2d();
    }

    inScreen(sw, sh) {
        var gap = this.__textSize + this.__textGap * (this.__lineCount - 1);
        if (this.__pos.y > -gap &&
            this.__pos.y < sh + gap) {
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

    addText(str) {
        this.__lineCount++;
        this.__text += str + "\n";
        return this;
    }
    
    setText(str) {
        this.__text = str;
        return this;
    }

    setBound(w, h) {
        this.__w = w;
        this.__h = h;
        return this;
    }

    setAlign(wp, hp) {
        this.__wAlign = wp;
        this.__hAlign = hp;
        return this;
    }

    setTextGap(g) {
        this.__textGap = g;
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
        textAlign(this.__wAlign, this.__hAlign);
        if (this.__lineCount >= 2) {
            textLeading(this.__textGap);
        }
        text(this.__text, this.__pos.x, this.__pos.y, this.__w, this.__h);
    }
}