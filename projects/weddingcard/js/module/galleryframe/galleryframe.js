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

    inBound(x, y) {
        return false;
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

    setMainImage() {
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

    setSize(w, h) {
        this.__w = w;
        this.__h = h;
        return this;
    }

    updateWithDraw(deltaTime) {
        this.update(deltaTime);
        this.draw();
    }

    update(deltaTime) {
    }

    draw() {
        if (this.__images[this.__indexCount] != null) {
            imageMode(CORNER);
            image(this.__images[this.__indexCount], this.__pos.x, this.__pos.y, this.__w, this.__h);
        }
    }
}