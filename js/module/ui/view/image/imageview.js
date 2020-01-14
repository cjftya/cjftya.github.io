class ImageView extends AbsView {
    constructor() {
        super(0);

        this.__image = null;
        this.__mask = null;
        this.__src = null;
        this.__maskSrc = null;

        this.__pos = new Vector2d();

        this.__w = 0;
        this.__h = 0;
        this.__scale = 1.0;

        this.__originW = 0;
        this.__originH = 0;

        this.__listener = null;

        this.__loadComplete = false;

        //width resize = (height resize * original width size) / original height size
        //height resize = (width resize * original height size) / original width size
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
        if (this.__loadComplete && this.__w != rw) {
            if (this.isScale()) {
                this.changeOriginalSize();
            }
            this.__h = (rw * this.__h) / this.__w;
            this.__w = rw;
        }
    }

    setHeight(rh) {
        if (this.__loadComplete && this.__h != rh) {
            if (this.isScale()) {
                this.changeOriginalSize();
            }
            this.__w = (rh * this.__w) / this.__h;
            this.__h = rh;
        }
    }

    setScale(s) {
        if(this.__scale == s) {
            return;
        }

        this.__scale = s;
        if (this.__loadComplete) {
            if (this.isScale()) {
                this.changeOriginalSize();
            }
            var reSizeW = this.__w * s;
            this.__h = (reSizeW * this.__h) / this.__w;
            this.__w = reSizeW;
        }
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

    setImageSrc(src) {
        this.__loadComplete = false;
        this.__src = src;
        this.__image = loadImage(src);

        let thisO = this;
        var img = new Image();
        img.src = src;
        img.onload = function () {
            thisO.__loadComplete = true;

            var reSizeW = this.width * thisO.__scale;
            thisO.__h = (reSizeW * this.height) / this.width;
            thisO.__w = reSizeW;
            thisO.__originW = this.width;
            thisO.__originH = this.height;
        }
        return this;
    }

    setMaskSrc(maskSrc) {
        this.__maskSrc = maskSrc;
        this.__mask = loadImage(maskSrc);
        this.__image.mask(this.__mask);
        return this;
    }

    update(delta) {
    }

    draw() {
        if (this.__loadComplete) {
            image(this.__image, this.__pos.x, this.__pos.y, this.__w, this.__h);
        }
    }
}