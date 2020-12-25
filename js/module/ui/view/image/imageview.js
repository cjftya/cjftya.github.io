class ImageView extends AbsView {
    constructor() {
        super(View.Image);

        this.__image = null;
        this.__maskImage = null;

        this.__pos = new Vector2d();

        this.__src = null;
        this.__maskSrc = null;

        this.__scale = 1.0;

        this.__w = 0;
        this.__h = 0;
        this.__originW = 0;
        this.__originH = 0;

        this.__cropPos = new Vector2d();
        this.__cw = 0;
        this.__ch = 0;
        this.__cropMode = false;

        this.__imageMode = CORNER;

        this.__debug = false;

        this.__maskApplyCount = 0;

        //width resize = (height resize * original width size) / original height size
        //height resize = (width resize * original height size) / original width size
    }

    inScreen(sw, sh) {
        if(this.__imageMode == CORNER) {
            if (this.__pos.y + this.__h > -20 && this.__pos.y < sh + 20) {
                return true;
            }
        } else {
            if (this.__pos.y + (this.__h / 2) > -20 &&
                this.__pos.y - (this.__h / 2) < sh + 20) {
                return true;
            }
        }
        return false;
    }

    reload() {
        var resource = TopicManager.ready().read(RESOURCE.DATA);
        if (this.__image == null && resource.get(this.__src) != null) {
            this.__image = resource.get(this.__src).getData();
        }

        if (this.__image != null && resource.get(this.__maskSrc) != null && this.__maskApplyCount == 0) {
            this.__maskImage = resource.get(this.__maskSrc).getData();
            this.__image.mask(this.__maskImage);
            this.__maskApplyCount++;
        }
    }

    setImagePath(path) {
        var resource = TopicManager.ready().read(RESOURCE.DATA);
        if (resource.get(path) == null) {
            var size = ImageMeta.getMeta(path);
            this.__w = size[0];
            this.__h = size[1];
        } else {
            this.__image = resource.get(path).getData();
            this.__w = this.__image.width;
            this.__h = this.__image.height;
        }
        this.__originW = this.__w;
        this.__originH = this.__h;
        this.__src = path;
        return this;
    }

    setMaskPath(path) {
        this.__maskSrc = path;
        if (this.__image != null) {
            var resource = TopicManager.ready().read(RESOURCE.DATA)
            this.__maskImage = resource.get(this.__maskSrc).getData();
            this.__image.mask(this.__maskImage);
        }
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

    getWidth() {
        return this.__w;
    }

    getHeight() {
        return this.__h;
    }

    setWidth(rw, keepRatio) {
        if (keepRatio) {
            this.__h = (rw * this.__h) / this.__w;
        }
        this.__w = rw;
        if(this.__src == ResourcePath.MainImage) {
            // alert(this.__w);
        }
        return this;
    }

    setHeight(rh, keepRatio) {
        if (keepRatio) {
            this.__w = (rh * this.__w) / this.__h;
        }
        this.__h = rh;
        return this;
    }

    setImageMode(m) {
        this.__imageMode = m;
        return this;
    }

    setEnableCrop(v) {
        this.__cropMode = v;
        return this;
    }

    setCropSize(w, h) {
        this.__cw = w;
        this.__ch = h;
        return this;
    }

    setCropSrcPos(cx, cy) {
        this.__cropPos.set(cx, cy);
        return this;
    }

    addCropSrcPos(x, y) {
        this.__cropPos.x += x;
        this.__cropPos.y += y;
        return this;
    }

    setScale(s) {
        if (this.__scale == s) {
            return;
        }

        this.__scale = s;
        var reSizeW = this.__w * s;
        this.__h = (reSizeW * this.__h) / this.__w;
        this.__w = reSizeW;
        return this;
    }

    getHeightScale() {
        return this.__cropMode ? (this.__ch / this.__originH) :
            (this.__h / this.__originH);
    }

    getWidthScale() {
        return this.__cropMode ? (this.__cw / this.__originW) :
        (this.__w / this.__originW);
    }

    setDebug(v) {
        this.__debug = v;
        return this;
    }

    draw() {
        if (this.__image != null) {
            imageMode(this.__imageMode);
            if (this.__cropMode) {
                image(this.__image, this.__pos.x, this.__pos.y, this.__cw, this.__ch,
                    this.__cropPos.x, this.__cropPos.y, this.__cw, this.__ch);
            } else {
                image(this.__image, this.__pos.x, this.__pos.y, this.__w, this.__h);
            }
        }
    }
}