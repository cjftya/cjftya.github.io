class ImageViewer extends AbsViewer {
    constructor() {
        super(0);

        this.__image = null;
        this.__pos = new Vector2d();
        this.__posOffset = new Vector2d();

        var winSize = TopicManager.ready().read(DISPLAY_INFO.WINDOW_SIZE);
        this.__ws = winSize[0];
        this.__hs = winSize[1];
        this.__scale = 1;

        this.__w = 0;
        this.__h = 0;

        this.__isShow = false;
        this.__alphaCount = 0;
        this.__inputDelay = 0;
    }

    addPos(x, y) {
        this.__posOffset.x += x;
        this.__posOffset.y += y;
    }

    setPos(x, y) {
        this.__pos.set(x, y);
        return this;
    }

    getPos() {
        return this.__pos;
    }

    setImage(img) {
        this.__image = img;
        this.setFitScreen(img);
        return this;
    }

    setFitScreen(img) {
        this.__h = (this.__ws * img.height) / img.width;
        this.__w = this.__ws;
        this.__scale = this.__w / img.width;
    }

    setScale(s) {
        this.__scale = s;
        var reSizeW = this.__w * s;
        this.__h = (reSizeW * this.__h) / this.__w;
        this.__w = reSizeW;
    }

    addScale(a) {
        this.this.setScale(this.__scale + a);
    }

    getCenterX() {
        return 0;
    }

    getCenterY() {
        return 0;
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
        return this.__inputDelay > 0;
    }

    hide() {
        this.__inputDelay = 2;
        this.__posOffset.set(0, 0);
        this.__isShow = false;
    }

    show() {
        this.__isShow = true;
        this.__alphaCount = 0;
    }

    update(delta) {
        if(!this.__isShow) {
            this.__inputDelay -= delta;
            if(this.__inputDelay <= 0) {
                this.__inputDelay = 0;
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
                imageMode(CORNER);
                image(this.__image, this.__pos.x + this.__posOffset.x, this.__pos.y + this.__posOffset.y, this.__w, this.__h);
            }
        }
    }
}