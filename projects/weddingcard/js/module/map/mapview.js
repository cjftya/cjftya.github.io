class MapView {
    constructor(mapData) {
        var resource = TopicManager.ready().read(RESOURCE.DATA);
        this.__map = resource.get(mapData).getData();
        this.__pos = new Vector2d();
        this.__cp = new Vector2d();
        this.__cw = 0;
        this.__ch = 0;
        this.__sizeGap = new Vector2d();

        var winSize = TopicManager.ready().read(DISPLAY_INFO.WINDOW_SIZE);
        this.__ws = winSize[0];
        this.__hs = winSize[1];

        this.__inMapCliked = false;
    }

    inScreen(sw, sh) {
        if (this.__pos.y + this.__ch > -40 && this.__pos.y < sh + 20) {
            return true;
        }
        return false;
    }

    setShortcutText(s) {
        this.__text = s;
        return this;
    }

    setPos(x, y) {
        this.__pos.set(x, y);
        return this;
    }

    addPos(x, y) {
        this.__pos.x += x;
        this.__pos.y += y;
        return this;
    }

    setCropSize(w, h) {
        this.__cw = w;
        this.__ch = h;
        this.__sizeGap.set((w * 1.4) - w, (h * 1.4) - h);
        this.__cp.x += -this.__sizeGap.x/2;
        this.__cp.y += -this.__sizeGap.y/2;
        return this;
    }

    setCropSrcPos(cx, cy) {
        this.__cp.set(cx, cy);
        return this;
    }

    addCropSrcPos(x, y) {
        this.__cp.x += x;
        this.__cp.y += y;
        if (this.__cp.x < 0) {
            this.__cp.x = 0;
        } else if (this.__cp.x > this.__map.width - this.__ws - this.__sizeGap.x) {
            this.__cp.x = this.__map.width - this.__ws - this.__sizeGap.x;
        }
        if (this.__cp.y < 0) {
            this.__cp.y = 0;
        } else if (this.__cp.y > this.__map.height - this.__ch - this.__sizeGap.y) {
            this.__cp.y = this.__map.height - this.__ch - this.__sizeGap.y;
        }
        return this;
    }

    getHeight() {
        return this.__ch;
    }

    getPos() {
        return this.__pos;
    }

    inBound(x, y) {
        if (x < this.__pos.x || x > this.__pos.x + this.__cw ||
            y < this.__pos.y || y > this.__pos.y + this.__ch) {
            return false;
        }
        return true;
    }

    setMapController(v) {
        this.__inMapCliked = v;
    }

    isMapController() {
        return this.__inMapCliked;
    }

    moveToNaverMap(x, y) {
        var py = this.__pos.y + this.__ch;
        if (!(x < this.__pos.x || x > this.__pos.x + this.__cw ||
            y < py || y > py + 35)) {
            location.href = "https://m.map.naver.com/search2/site.nhn?query=%EB%8D%94%EC%B1%84%ED%94%8C%EC%95%B3%EC%B2%AD%EB%8B%B4&sm=hty&style=v5&code=34120522#/map";
        }
    }

    draw() {
        imageMode(CORNER);
        image(this.__map, this.__pos.x, this.__pos.y, this.__cw, this.__ch,
            this.__cp.x, this.__cp.y, this.__cw * 1.4, this.__ch * 1.4);
        fill(150);
        rect(this.__pos.x, this.__pos.y + this.__ch, this.__cw, 35);

        fill(240);
        noStroke();
        textAlign(CENTER, 0);
        textSize(15);
        text(this.__text, this.__pos.x, this.__pos.y + this.__ch + 12, this.__cw, 35);
    }
}