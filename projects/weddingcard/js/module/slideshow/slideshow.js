class SlideShow {
    constructor() {
        this.__images = [];
        this.__paths = [];
        this.__indexCount = 0;

        this.__pos = new Vector2d();

        var winSize = TopicManager.ready().read(DISPLAY_INFO.WINDOW_SIZE);
        this.__ws = winSize[0];
        this.__hs = winSize[1];
        this.__scale = 1;

        this.__w = 0;
        this.__h = 0;

        this.__second = 0;
        this.__delay = 0;

        this.__active = true;
    }

    addPos(x, y) {
        this.__pos.x += x;
        this.__pos.y += y;
    }

    setPos(x, y) {
        this.__pos.set(x, y);
        return this;
    }

    getPos() {
        return this.__pos;
    }

    getHeight() {
        return this.__h;
    }

    setWidth(w) {
        for (var img of this.__images) {
            this.__h = (w * img.height) / img.width;
            this.__w = w;
            this.__scale = this.__w / img.width;
        }
        return this;
    }

    addImage(img) {
        this.__paths.push(img);
        var resource = TopicManager.ready().read(RESOURCE.DATA);
        this.__images.push(resource.get(img).getData());
        return this;
    }

    setMask(mask) {
        var resource = TopicManager.ready().read(RESOURCE.DATA);
        for (var img of this.__images) {
            img.mask(resource.get(mask).getData());
        }
        return this;
    }

    setDelay(s) {
        this.__delay = s;
        return this;
    }

    next() {
        this.__indexCount++;
        if (this.__indexCount >= this.__images.length) {
            this.__indexCount = 0;
        }
    }

    getCurrentImage() {
        return this.__paths[this.__indexCount];
    }

    inBound(x, y) {
        var dx = (this.__pos.x + this.__w / 2) - x;
        var dy = (this.__pos.y + this.__h / 2) - y;
        var d = dx * dx + dy * dy;
        if (d < (this.__w / 3) * (this.__w / 3)) {
            return true;
        }
        return false;
    }

    pause() {
        this.__active = false;
    }

    resume() {
        this.__active = true;
    }

    update(delta) {
        if(!this.__active) {
            return;
        }

        this.__second += delta;
        if (this.__second >= this.__delay) {
            this.next();
            this.__second = 0;
        }
    }

    draw() {
        imageMode(CORNER);
        image(this.__images[this.__indexCount], this.__pos.x, this.__pos.y, this.__w, this.__h);
        // fill(200,150);
        // ellipse(this.__pos.x + this.__w/2, this.__pos.y + this.__h/2, 200, 200);
    }
}