class ImageViewer extends AbsViewer {
    constructor() {
        super(0);

        this.__images = [];
        this.__pos = new Vector2d();
        this.__posOffset = new Vector2d();
        this.__guide = new Vector2d();

        this.__indexCount = 0;

        var winSize = TopicManager.ready().read(DISPLAY_INFO.WINDOW_SIZE);
        this.__ws = winSize[0];
        this.__hs = winSize[1];
        this.__scale = 1;

        this.__prevBtn = new Vector2d();
        this.__nextBtn = new Vector2d();

        this.__scaleMin = -2;
        this.__scaleMax = -2;

        this.__w = 0;
        this.__h = 0;
        this.__originW = 0;
        this.__originH = 0;

        this.__isShow = false;
        this.__alphaCount = 0;
        this.__inputDelay = 0;
        this.__isDelay = false;
    }

    setup() {
        var img = this.__images[this.__indexCount];
        this.__originW = img.width;
        this.__originH = img.height;
        this.setFitScreen(img);

        this.__scaleMin = this.__scale;
        this.__scaleMax = this.__scale + 0.3;

        this.updateGuideRap();
    }

    addPos(x, y) {
        this.__posOffset.x += x;
        this.__posOffset.y += y;

        if (this.__posOffset.x > this.__guide.x) {
            this.__posOffset.x = this.__guide.x;
        } else if (this.__posOffset.x < -this.__guide.x) {
            this.__posOffset.x = -this.__guide.x;
        }
        if (this.__posOffset.y > this.__guide.y) {
            this.__posOffset.y = this.__guide.y;
        } else if (this.__posOffset.y < -this.__guide.y) {
            this.__posOffset.y = -this.__guide.y;
        }
    }

    setPos(x, y) {
        this.__pos.set(x, y);
        return this;
    }

    getPos() {
        return this.__pos;
    }

    addImagePath(path) {
        var resource = TopicManager.ready().read(RESOURCE.DATA);
        var img = resource.get(path).getData();
        this.__images.push(img);
        return this;
    }

    setFitScreen(img) {
        this.__h = (this.__ws * img.height) / img.width;
        this.__w = this.__ws;
        this.__scale = this.__w / img.width;
    }

    setScale(s) {
        this.__scale = s;
        var reSizeW = this.__originW * s;
        this.__h = (reSizeW * this.__originH) / this.__originW;
        this.__w = reSizeW;
    }

    addScale(a) {
        var s = this.__scale + a;
        if (s > this.__scaleMax) {
            s = this.__scale;
        } else if (s < this.__scaleMin) {
            s = this.__scale;
        }
        this.setScale(s);
        this.updateGuideRap();
    }

    setIndex(index) {
        this.__indexCount = index;
        return this;
    }

    updateGuideRap() {
        var gx = this.__pos.x - (this.__w / 2);
        var gy = this.__pos.y - (this.__h / 2);
        gy = gy < 0 ? gy - 50 : gy;
        this.__guide.set(Math.abs(gx) + 50, Math.abs(gy));
    }

    inBound(x, y) {
        var ax = this.__pos.x + this.__posOffset.x;
        var ay = this.__pos.y + this.__posOffset.y;
        var px1 = ax - (this.__w / 2);
        var px2 = ax + (this.__w / 2);
        var py1 = ay - (this.__h / 2);
        var py2 = ay + (this.__h / 2);
        if (x < px1 || x > px2 || y < py1 || y > py2) {
            return false;
        }
        return true;
    }

    isShowing() {
        return this.__isShow;
    }

    isInputDelay() {
        return this.__isDelay;
    }

    hide() {
        this.__isDelay = true;
        this.__inputDelay = 1;
        this.__posOffset.set(0, 0);
        this.__isShow = false;
    }

    show() {
        this.__isDelay = true;
        this.__inputDelay = 1;
        this.__isShow = true;
        this.__alphaCount = 0;
        this.setup();
    }

    update(delta) {
        if(this.__isDelay) {
            this.__inputDelay -= delta;
            if(this.__inputDelay <= 0) {
                this.__inputDelay = 0;
                this.__isDelay = false;
            }
        }
    }

    draw() {
        if (this.__isShow) {
            if (this.__alphaCount <= 210) {
                this.__alphaCount += 15;
            }
            fill(0, this.__alphaCount);
            rect(0, 0, this.__ws, this.__hs);

            if(this.__alphaCount >= 210) {
                imageMode(CENTER);
                image(this.__images[this.__indexCount], this.__pos.x + this.__posOffset.x, this.__pos.y + this.__posOffset.y, this.__w, this.__h);
            }
        }
    }
}