class ImageView extends AbsView {
    constructor(src) {
        super(0);

        var resource = TopicManager.ready().read(RESOURCE.DATA)
        this.__src = src;
        this.__image = resource.get(src).getData();

        this.__mask = null;
        this.__maskSrc = null;

        this.__pos = new Vector2d();

        this.__w = this.__image.width;
        this.__h = this.__image.height;
        this.__scale = 1.0;

        this.__cw = 0;
        this.__ch = 0;

        this.__originW = this.__w;
        this.__originH = this.__h;

        this.__listener = null;

        this.__cropMode = false;

        //width resize = (height resize * original width size) / original height size
        //height resize = (width resize * original height size) / original width size
    }

    getWidth() {
        return this.__w;
    }

    getHeight() {
        return this.__h;
    }

    setListener(listener) {
        this.__listener = listener;
        // .setListener(() => {
        //     TopicManager.ready().publish(TOPICS.SCENE_LOADER, SCENES.MAIN);
        // });
        return this;
    }

    setPos(x, y) {
        this.__pos.set(x, y);
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

    setCropMode(v) {
        this.__cropMode = v;
        return this;
    }

    setCropSize(w, h) {
        this.__cw = w;
        this.__ch = h;
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

    setMaskSrc(maskSrc) {
        var resource = TopicManager.ready().read(RESOURCE.DATA)
        this.__maskSrc = maskSrc;
        this.__mask = resource.get(maskSrc).getData();
        this.__image.mask(this.__mask);
        return this;
    }

    draw() {
        if (this.__cropMode) {
            image(this.__image, this.__pos.x, this.__pos.y, this.__cw, this.__ch,
                160, 200, this.__cw, this.__ch);
        } else {
            image(this.__image, this.__pos.x, this.__pos.y, this.__w, this.__h);
        }
    }
}