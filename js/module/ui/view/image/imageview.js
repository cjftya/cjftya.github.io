class ImageView extends AbsView {
    constructor() {
        super(0);

        this.__image = null;
        this.__mask = null;

        this.__pos = new Vector2d();

        this.__scale = 1.0;

        this.__w = 0;
        this.__h = 0;
        this.__originW = 0;
        this.__originH = 0;

        this.__cx = 0;
        this.__cy = 0;
        this.__cw = 0;
        this.__ch = 0;
        this.__cropMode = false;

        this.__imageMode = CORNER;

        this.__clickCount = 0;

        this.__listener = null;

        //width resize = (height resize * original width size) / original height size
        //height resize = (width resize * original height size) / original width size
    }

    inScreen(sw, sh) {
        if (this.__pos.y + this.__h > -20 && this.__pos.y < sh + 20) {
            return true;
        }
        return false;
    }

    getWidth() {
        return this.__w;
    }

    getHeight() {
        return this.__h;
    }

    setListener(listener) {
        this.__listener = listener;
        return this;
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

    setImagePath(path) {
        var resource = TopicManager.ready().read(RESOURCE.DATA)
        this.__src = path;
        this.__image = resource.get(path).getData();
        this.__w = this.__image.width;
        this.__h = this.__image.height;
        this.__originW = this.__w;
        this.__originH = this.__h;
        return this;
    }

    setWidth(rw) {
        if (this.__w != rw) {
            if (this.isScale()) {
                this.changeOriginalSize();
            }
            this.__h = (rw * this.__h) / this.__w;
            this.__w = rw;
        }
        return this;
    }

    setHeight(rh) {
        if (this.__h != rh) {
            if (this.isScale()) {
                this.changeOriginalSize();
            }
            this.__w = (rh * this.__w) / this.__h;
            this.__h = rh;
        }
        return this;
    }

    setImageMode(m) {
        this.__imageMode = m;
        return this;
    }

    setCropMode(v) {
        this.__cropMode = v;
        return this;
    }

    setCropSize(w, h) {
        this.__cw = w;
        this.__ch = h;
        return this;
    }

    setCropSrcPos(cx, cy) {
        this.__cx = cx;
        this.__cy = cy;
        return this;
    }

    addCropSrcPos(x, y) {
        this.__cx += x;
        this.__cy += y;
        return this;
    }

    setScale(s) {
        if (this.__scale == s) {
            return;
        }

        this.__scale = s;
        if (this.isScale()) {
            this.changeOriginalSize();
        }
        var reSizeW = this.__w * s;
        this.__h = (reSizeW * this.__h) / this.__w;
        this.__w = reSizeW;
        return this;
    }

    isScale() {
        return this.__originW != this.__w || this.__originH != this.__h;
    }

    changeOriginalSize() {
        this.__w = this.__originW;
        this.__h = this.__originH;
        this.__scale = 1.0;
    }

    setMaskPath(patb) {
        var resource = TopicManager.ready().read(RESOURCE.DATA)
        this.__mask = resource.get(patb).getData();
        this.__image.mask(this.__mask);
        return this;
    }

    // onTouchDown(x, y) {
    //     if (this.inBound(x, y)) {
    //         this.__clickCount++;
    //     }
    // }

    // onTouchUp(x, y) {
    //     if (this.inBound(x, y)) {
    //         this.__clickCount++;
    //         if (this.__clickCount == 2) {
    //             this.__listener();
    //         }
    //     }
    //     this.__clickCount = 0;
    // }

    inBound(x, y) {
        if (x < this.__pos.x || x > this.__pos.x + this.__w ||
            y < this.__pos.y || y > this.__pos.y + this.__h) {
            return false;
        }
        return true;
    }

    draw() {
       imageMode(this.__imageMode);
        if (this.__cropMode) {
            image(this.__image, this.__pos.x, this.__pos.y, this.__cw, this.__ch,
                this.__cx, this.__cy, this.__cw, this.__ch);
        } else {
            image(this.__image, this.__pos.x, this.__pos.y, this.__w, this.__h);
        }
    }
}