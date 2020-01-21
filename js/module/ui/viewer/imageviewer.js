class ImageViewer extends AbsViewer {
    constructor() {
        super(0);

        this.__image = null;
        this.__pos = new Vector2d();

        var winSize = TopicManager.ready().read(DISPLAY_INFO.WINDOW_SIZE);
        this.__ws = winSize[0];
        this.__hs = winSize[1];
        this.__scale = 1;

        this.__w = 0;
        this.__h = 0;

        this.__isShow = false;
    }

    addPos(x, y) {
        this.__pos.x += x;
        this.__pos.y += y;
    }

    setPos(x, y) {
        this.__pos.set(x, y);
        return this;
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

    draw() {
        if (this.__isShow) {
            fill(0, 180);
            rect(0, 0, this.__ws, this.__hs);

            imageMode(CENTER);
            image(this.__image, this.__pos.x, this.__pos.y, this.__w, this.__h);
        }
    }

    inBound(x, y) {
        var px1 = this.__pos.x - (this.__w / 2);
        var px2 = this.__pos.x + (this.__w / 2);
        var py1 = this.__pos.y - (this.__h / 2);
        var py2 = this.__pos.y + (this.__h / 2);
        if (x < px1 || x > px2 || y < py1 || y > py2) {
            return false;
        }
        return true;
    }

    isShowing() {
        return this.__isShow;
    }

    hide() {
        this.__isShow = false;
    }

    show() {
        this.__isShow = true;
    }
}