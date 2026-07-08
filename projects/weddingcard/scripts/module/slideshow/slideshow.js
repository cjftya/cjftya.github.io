class SlideShow {
    constructor() {
        this.__maskImg = null;
        this.__maskSrc = null;

        this.__images = [];
        this.__imagePaths = [];
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
        this.__maskApplyCount = 0;

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

    reload() {
        var resData;
        var resource = TopicManager.ready().read(RESOURCE.DATA);
        for (var i = 0; i < this.__imagePaths.length; i++) {
            resData = resource.get(this.__imagePaths[i]);
            if (this.__images[i] == null && resData != null) {
                this.__images[i] = resData.getData();
            }
        }

        resData = resource.get(this.__maskSrc);
        if (resData != null) {
            var count = 0;
            this.__maskImg = resData.getData();
            for (var i = 0; i < this.__imagePaths.length; i++) {
                if (this.__images[i] != null) {
                    count++;
                }
            }
            if (count == this.__imagePaths.length && this.__maskApplyCount == 0) {
                this.__maskApplyCount++;
                for (var i = 0; i < this.__images.length; i++) {
                    this.__images[i].mask(this.__maskImg);
                }
            }
        }
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

    getWidth() {
        return this.__w;
    }

    getHeight() {
        return this.__h;
    }

    setWidth(w) {
        var resource = TopicManager.ready().read(RESOURCE.DATA);
        var resData = resource.get(this.__imagePaths[0]);
        if (resData == null) {
            var size = ImageMeta.getMeta(this.__imagePaths[0]);
            this.__h = (w * size[1]) / size[0];
            this.__w = w;
            this.__scale = this.__w / size[0];
        } else {
            this.__h = (w * this.__images[0].height) / this.__images[0].width;
            this.__w = w;
            this.__scale = this.__w / this.__images[0].width;
        }
        return this;
    }

    addImagePath(imgPath) {
        var resource = TopicManager.ready().read(RESOURCE.DATA);
        this.__imagePaths.push(imgPath);
        var resData = resource.get(imgPath);
        this.__images.push(resData ? resData.getData() : null);
        return this;
    }

    getCurrentIndex() {
        return this.__indexCount;
    }

    setMask(mask) {
        this.__maskSrc = mask;
        var resource = TopicManager.ready().read(RESOURCE.DATA);
        var resData = resource.get(this.__maskSrc);
        if (resData != null) {
            this.__maskImg = resData.getData();
            for (var img of this.__images) {
                if (img != null) {
                    img.mask(this.__maskImg);
                }
            }
        }
        return this;
    }

    setDelay(s) {
        this.__delay = s;
        return this;
    }

    getCurrentImage() {
        return this.__imagePaths[this.__indexCount];
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

    updateWithDraw(delta) {
        this.update(delta);
        this.draw();
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
        if (this.__images[this.__indexCount] != null) {
            imageMode(CORNER);
            image(this.__images[this.__indexCount], this.__pos.x, this.__pos.y, this.__w, this.__h);
        }

        for (var i = 0; i < this.__images.length; i++) {
            if (this.__indexCount == i) {
                fill(this.__indicatorSelectedColor);
                ellipse(this.__indicators[i].x, this.__pos.y + this.__h + 20, 13, 13);
            } else {
                fill(this.__indicatorNormalColor);
                ellipse(this.__indicators[i].x, this.__pos.y + this.__h + 20, 7, 7);
            }
        }
        // fill(200);
        // ellipse(this.__pos.x + this.__w/2, this.__pos.y + this.__h/2, 200, 200);
    }
}