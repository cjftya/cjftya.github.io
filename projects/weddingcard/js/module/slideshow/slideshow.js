class SlideShow {
    constructor() {
        this.__images = [];
        this.__indexCount = 0;

        this.__pos = new Vector2d();
        this.__indicators = [];

        var winSize = TopicManager.ready().read(DISPLAY_INFO.WINDOW_SIZE);
        this.__ws = winSize[0];
        this.__hs = winSize[1];
        this.__scale = 1;

        this.__w = 0;
        this.__h = 0;

        this.__second = 0;
        this.__delay = 0;

        this.__active = true;

        this.__indicatorSelectedColor = color(210, 130, 130);
        this.__indicatorNormalColor = color(210, 130, 130);
        this.__indicatorNormalColor.setAlpha(80);

        var pw = this.__ws - (this.__ws / 4) * 2;
        var slice = pw / 5;
        var ps;
        for (var i = 0; i < 6; i++) {
            ps = new Vector2d().set((this.__ws / 4) + (slice * i), 0);
            this.__indicators.push(ps);
        }
    }

    inScreen(sw, sh) {
        if (this.__pos.y < sh + 30 && this.__pos.y + this.__h > -30) {
            return true;
        }
        return false;
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

    addImagePath(imgPath) {
        var resource = TopicManager.ready().read(RESOURCE.DATA);
        this.__images.push(resource.get(imgPath).getData());
        return this;
    }

    getCurrentIndex() {
        return this.__indexCount;
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

    inBound(x, y) {
        var dx = (this.__pos.x + this.__w / 2) - x;
        var dy = (this.__pos.y + this.__h / 2) - y;
        var d = dx * dx + dy * dy;
        if (d < (this.__w / 3) * (this.__w / 3)) {
            return true;
        }
        return false;
    }

    selectIndicator(x, y) {
        var py = this.__pos.y + this.__h + 20;
        for (var i = 0; i < this.__indicators.length; i++) {
            var dx = x - this.__indicators[i].x;
            var dy = y - py;
            var d = dx * dx + dy * dy;
            if (d < 250) {
                this.__indexCount = i;
                this.__second = 0;
                break;
            }
        }
    }

    pause() {
        this.__active = false;
    }

    resume() {
        this.__active = true;
    }

    update(delta) {
        if (!this.__active) {
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

        for (var i = 0; i < this.__images.length; i++) {
            if (this.__indexCount == i) {
                fill(this.__indicatorSelectedColor);
                ellipse(this.__indicators[i].x, this.__pos.y + this.__h + 20, 13, 13);
            } else {
                fill(this.__indicatorNormalColor);
                ellipse(this.__indicators[i].x, this.__pos.y + this.__h + 20, 7, 7);
            }
        }
        // fill(200,150);
        // ellipse(this.__pos.x + this.__w/2, this.__pos.y + this.__h/2, 200, 200);
    }
}