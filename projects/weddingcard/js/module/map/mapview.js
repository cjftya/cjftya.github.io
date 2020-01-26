class MapView {
    constructor(mapData) {
        var resource = TopicManager.ready().read(RESOURCE.DATA);
        this.__map = resource.get(mapData).getData();
        this.__pos = new Vector2d();
        this.__cp = new Vector2d();
        this.__cw = 0;
        this.__ch = 0;
    }

    inScreen(sw, sh) {
        if (this.__pos.y + this.__ch > -40 && this.__pos.y < sh + 20) {
            return true;
        }
        return false;
    }

    setShortcutText(s) {
        this.__text = s;
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
        return this;
    }

    setCropSrcPos(cx, cy) {
        this.__cp.set(cx, cy);
        return this;
    }

    addCropSrcPos(x, y) {
        this.__cp.x += x;
        this.__cp.y += y;
        return this;
    }

    inBound(x, y) {
        if (x < this.__pos.x || x > this.__pos.x + this.__cw ||
            y < this.__pos.y || y > this.__pos.y + this.__ch) {
            return false;
        }
        return true;
    }

    moveToNaverMap(x, y) {
        var py = this.__pos.y + this.__ch;
        if (!(x < this.__pos.x || x > this.__pos.x + this.__cw ||
            y < py || y > py + 20)) {
            location.href = "https://m.map.naver.com/search2/site.nhn?query=%EA%B4%91%ED%99%94%EB%AC%B8%EC%95%84%ED%8E%A0%EA%B0%80%EB%AA%A8&sm=shistory&style=v5&code=31738014#/map";
        }
    }

    draw() {
        imageMode(CORNER);
        image(this.__map, this.__pos.x, this.__pos.y, this.__cw, this.__ch,
            this.__cp.x, this.__cp.y, this.__cw, this.__ch);
        fill(150);
        rect(this.__pos.x, this.__pos.y + this.__ch, this.__cw, 20);

        fill(240);
        noStroke();
        textAlign(this.__cw, 20);
        textSize(13);
        text(this.__pos.x, this.__pos.y + this.__ch, this.__text);
    }
}