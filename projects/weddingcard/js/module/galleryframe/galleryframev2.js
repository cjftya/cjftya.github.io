class GalleryFrameV2 {
    constructor() {
        this.__winSize = TopicManager.ready().read(DISPLAY_INFO.WINDOW_SIZE);

        this.__w = 0;
        this.__h = 0;

        this.__pos = new Vector2d();

        this.__image = null;
        this.__imagePath = null;

        this.__selectAreaWidth = 0;
        this.__selectAreaHeight = 0;
        this.__selectPos = [];

        this.__color = color(200, 200, 200);
        this.__color.setAlpha(150);
    }

    inScreen(sw, sh) {
        if (this.__pos.y + this.__h > -40 && this.__pos.y < sh + 40) {
            return true;
        }
        return false;
    }

    reload() {
        var resource = TopicManager.ready().read(RESOURCE.DATA);
        if (this.__image == null && resource.get(this.__imagePath) != null) {
            this.__image = resource.get(this.__imagePath).getData();
        }
    }

    pick(x, y) {
        for (var i = 0; i < this.__selectPos.length; i++) {
            if (this.inBound(i, x, y)) {
                TopicManager.ready().publish(TOPICS.QUICK_VIEWER, i);
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

    initializeArea() {
        var space = this.__w * 0.04;
        var rsize = this.__w - space;
        var size = (rsize / 3) - space;
        this.__selectAreaWidth = this.__selectAreaHeight = size;
        var px = this.__pos.x + space;
        var py = this.__pos.y + space;
        for (var i = 0; i < 4; i++) {
            for (var k = 0; k < 3; k++) {
                this.__selectPos.push(new Vector2d());
                this.__selectPos[k + (i * 3)].x = px + ((this.__selectAreaWidth + space) * k);
                this.__selectPos[k + (i * 3)].y = py;
            }
            py += this.__selectAreaHeight + space;
        }

        return this;
    }

    setWidth(w) {
        var resource = TopicManager.ready().read(RESOURCE.DATA);
        var resData = resource.get(this.__imagePath);
        if (resData == null) {
            var size = ImageMeta.getMeta(this.__imagePath);
            this.__h = (w * size[1]) / size[0];
            this.__w = w;
            this.__scale = this.__w / size[0];
        } else {
            this.__h = (w * this.__image.height) / this.__image.width;
            this.__w = w;
            this.__scale = this.__w / this.__image.width;
        }
        return this;
    }

    getWidth() {
        return this.__w;
    }

    getHeight() {
        return this.__h;
    }

    setImage(img) {
        var resource = TopicManager.ready().read(RESOURCE.DATA);
        var resData = resource.get(img);
        this.__imagePath = img;
        this.__image = resData ? resData.getData() : null;
        return this;
    }

    updateWithDraw(deltaTime) {
        this.draw();
    }

    draw() {
        if (this.__image != null) {
            imageMode(CORNER);
            image(this.__image, this.__pos.x, this.__pos.y, this.__w, this.__h);
        }
        
        fill(this.__color);
        for (var i = 0; i < this.__selectPos.length; i++) {
            rect(this.__selectPos[i].x, this.__selectPos[i].y, this.__selectAreaWidth, this.__selectAreaHeight);
        }
    }
}