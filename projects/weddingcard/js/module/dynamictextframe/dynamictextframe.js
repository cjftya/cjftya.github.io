class DynamicTextFrame {
    constructor() {
        this.__pos = new Vector2d();

        this.reload();
        this.__cw = 0;
        this.__ch = 0;

        var winSize = TopicManager.ready().read(DISPLAY_INFO.WINDOW_SIZE);
        this.__cropPos = new Vector2d().set(0, 350);

        this.__debug = false;

        this.__textPointer = new TextPointer();
    }

    inScreen(sw, sh) {
        if (this.__pos.y + this.__ch + 70 > 0 && this.__pos.y - 70 < sh) {
            return true;
        }
        return false;
    }

    reload() {
        var resource = TopicManager.ready().read(RESOURCE.DATA)
        var resData = resource.get(ResourcePath.DynamicTextFrameImage);
        if (this.__background == null && resData != null) {
            this.__background = resData.getData();
        }
    }

    setPos(x, y) {
        this.__pos.set(x, y);
        this.__textPointer.setPos(0, this.__pos.y + this.__ch / 2);
        return this;
    }

    addPos(x, y) {
        this.__pos.x += x;
        this.__pos.y += y;
        this.__textPointer.addPos(x, y);
        return this;
    }

    getPos() {
        return this.__pos;
    }

    addCropSrcPos(x, y) {
        this.__cropPos.x += x;
        this.__cropPos.y += y;
        return this;
    }

    addText(str) {
        this.__textPointer.addText(str);
        return this;
    }

    setSize(w, h) {
        this.__cw = w;
        this.__ch = h;
        return this;
    }

    setColor(r, g, b) {
        this.__textPointer.setColor(r, g, b);
        return this;
    }

    setAlpha(a) {
        this.__textPointer.setAlpha(a);
        return this;
    }

    setDebug(v) {
        this.__debug = v;
        return this;
    }

    updateWithDraw(delta) {
        this.update(delta);
        this.draw();
    }

    update(delta) {
        this.__textPointer.setCenter(0, this.__pos.y + this.__ch / 2);
        this.__textPointer.update(delta);
    }

    draw() {
        if (this.__background != null) {
            imageMode(CORNER);
            image(this.__background, this.__pos.x, this.__pos.y, this.__cw, this.__ch,
                this.__cropPos.x, this.__cropPos.y, this.__cw, this.__ch);
            this.__textPointer.draw();
        }
        fill(255, 0, 0);
    }
}