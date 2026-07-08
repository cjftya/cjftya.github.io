class GalleryFrame {
    constructor() {
        this.__winSize = TopicManager.ready().read(DISPLAY_INFO.WINDOW_SIZE);

        this.__w = 0;
        this.__h = 0;
        this.__scale = 1;

        this.__pos = new Vector2d();

        this.__indexCount = 0;
        this.__images = [];
        this.__imagePaths = [];

        this.__selectAreaColor = color(255, 255, 255);
        this.__selectAreaColor.setAlpha(80);
        this.__selectAreaWidth = 0;
        this.__selectAreaHeight = 0;
        this.__selectPos = [];

        this.__delay = 3;
        this.__delayCount = 0;
    }

    inScreen(sw, sh) {
        if (this.__pos.y + this.__h > -40 && this.__pos.y < sh + 40) {
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
    }

    pick(x, y) {
        for (var i = 0; i < this.__selectPos.length; i++) {
            if (this.inBound(i, x, y)) {
                this.__indexCount = i + 1;
                this.__delayCount = 0;
                break;
            }
        }
    }

    inBound(i, x, y) {
        if (x < this.__selectPos[i].x || x > this.__selectPos[i].x + this.__selectAreaWidth) {
            return false;
        }
        if (y < this.__selectPos[i].y || y > this.__selectPos[i].y + this.__selectAreaHeight) {
            return false;
        }
        return true;
    }

    addPos(x, y) {
        this.__pos.x += x;
        this.__pos.y += y;
        for (var i = 0; i < this.__selectPos.length; i++) {
            this.__selectPos[i].x += x;
            this.__selectPos[i].y += y;
        }
        return this;
    }

    setPos(x, y) {
        this.__pos.set(x, y);
        return this;
    }

    getPos() {
        return this.__pos;
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

    getWidth() {
        return this.__w;
    }

    getHeight() {
        return this.__h;
    }

    setMainImage(img) {
        var resource = TopicManager.ready().read(RESOURCE.DATA);
        var resData = resource.get(img);
        this.__imagePaths.push(img);
        this.__images.push(resData ? resData.getData() : null);
        return this;
    }

    addImage(img) {
        var resource = TopicManager.ready().read(RESOURCE.DATA);
        var resData = resource.get(img);
        this.__imagePaths.push(img);
        this.__images.push(resData ? resData.getData() : null);
        return this;
    }

    initializeArea() {
        this.__selectAreaWidth = this.__w / (this.__images.length - 1);
        this.__selectAreaHeight = this.__h;
        for (var i = 0; i < this.__images.length; i++) {
            this.__selectPos.push(new Vector2d().set(i * this.__selectAreaWidth, this.__pos.y));
        }
        return this;
    }

    updateWithDraw(deltaTime) {
        this.update(deltaTime);
        this.draw();
    }

    update(deltaTime) {
        if (this.__indexCount > 0) {
            this.__delayCount += deltaTime;
            if (this.__delayCount >= this.__delay) {
                this.__delayCount = 0;
                this.__indexCount = 0;
            }
        }
    }

    draw() {
        if (this.__images[this.__indexCount] != null) {
            imageMode(CORNER);
            image(this.__images[this.__indexCount], this.__pos.x, this.__pos.y, this.__w, this.__h);
        }
        if (this.__indexCount > 0) {
            fill(this.__selectAreaColor);
            rect(this.__selectPos[this.__indexCount - 1].x, this.__selectPos[this.__indexCount - 1].y,
                this.__selectAreaWidth, this.__selectAreaHeight);
        }
    }
}