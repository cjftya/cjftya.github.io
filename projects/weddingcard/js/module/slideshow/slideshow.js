class SlideShow {
    constructor() {
        this.__images = [];
        this.__indexCount = 0;

        this.__pos = new Vector2d();

        var winSize = TopicManager.ready().read(DISPLAY_INFO.WINDOW_SIZE);
        this.__ws = winSize[0];
        this.__hs = winSize[1];
        this.__scale = 1;

        this.__w = 0;
        this.__h = 0;
    }

    addPos(x, y) {
        this.__pos.x += x;
        this.__pos.y += y;
    }

    setWidth(w) {
        for (var img of this.__images) {
            this.__h = (ws * img.height) / img.width;
            this.__w = w;
            this.__scale = this.__w / img.width;
        }
        return this;
    }

    addImage(img) {
        var resource = TopicManager.ready().read(RESOURCE.DATA);
        this.__images.push(resource.get(img).getData());
        return this;
    }

    setMask(mask) {
        for (var img of this.__images) {
            img.mask(mask);
        }
        return this;
    }

    next() {
        this.__indexCount++;
        if (this.__indexCount >= this.__images.length) {
            this.__indexCount = 0;
        }
    }

    update(delta) {

    }

    draw() {
        image(this.__images[this.__indexCount], this.__pos.x, this.__pos.y, this.__w, this.__h);
    }
}