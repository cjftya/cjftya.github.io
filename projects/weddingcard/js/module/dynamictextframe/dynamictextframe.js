class DynamicTextFrame {
    constructor() {
        this.__pos = new Vector2d();

        var resource = TopicManager.ready().read(RESOURCE.DATA)
        this.__background = resource.get(ResourcePath.DynamicTextFrameImage).getData();
        this.__w = this.__background.width;
        this.__h = this.__background.height;

        var winSize = TopicManager.ready().read(DISPLAY_INFO.WINDOW_SIZE);
        this.__cw = winSize[0];
        this.__ch = 200;
        this.__cropPos = new Vector2d().set(((1300 - winSize[0]) / 2) - 50, 500);

        this.__debug = false;

        this.__textPointer = new TextPointer();
    }

    inScreen(sw, sh) {
        if(this.__pos.y + this.__h + 70 > 0 && this.__pos.y - 70 < sh) {
            return true;
        }
        return false;
    }

    setPos(x, y) {
        this.__pos.set(x, y);
        this.__textPointer.setPos(x, y - 230);
        this.__textPointer.setCenter(x, y - 230);
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

    setWidth(rw) {
        this.__h = (rw * this.__h) / this.__w;
        this.__w = rw;
        return this;
    }

    setColor(r, g, b) {
        this.__textPointer.setColor(r, g, b);
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
        this.__textPointer.update(delta);
    }

    draw() {
        imageMode(CORNER);
        image(this.__background, this.__pos.x, this.__pos.y, this.__cw, this.__ch,
            this.__cropPos.x, this.__cropPos.y, this.__cw, this.__ch);
        this.__textPointer.draw();
    }
}