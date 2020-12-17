class Directions {
    constructor() {
        var winSize = TopicManager.ready().read(DISPLAY_INFO.WINDOW_SIZE);
        this.__w = winSize[0];
        this.__h = winSize[1];

        this.__pos = new Vector2d();
        this.__selectedIndex = 0;
        this.__selectorList = [];

        var size = (this.__w / 4) - 5;
        var rsize = size - 15;
        var space = size / 2 + 10;
        this.__ch = rsize + 70;

        var s1 = new DSelector()
            .setToggle(true)
            .addText("버스")
            .addText("안내")
            .setSize(rsize)
            .setPosX(space);
        var s2 = new DSelector()
            .addText("지하철")
            .addText("안내")
            .setSize(rsize)
            .setPosX(space + size);
        var s3 = new DSelector()
            .addText("주차")
            .addText("안내")
            .setSize(rsize)
            .setPosX(space + size * 2);
        var s4 = new DSelector()
            .addText("셔틀버스")
            .addText("안내")
            .setSize(rsize)
            .setPosX(space + size * 3);

        this.__selectorList.push(s1);
        this.__selectorList.push(s2);
        this.__selectorList.push(s3);
        this.__selectorList.push(s4);

        this.__descriptionText = [
            "간선 : 301, 342, 472 / 지선 : 3011, 4412\n영동고교 앞 하차 후 학동사거리 방면 100m건물",
            "7호선 분당선 강남구청역 3-1번 출구로 나와\n좌측 방향으로 570m 도보 후 좌측 건물",
            "90분 무료주차\n(# 웨딩홀 주변 교통체증으로 가급적 대중교통이용)",
            "강남구청역 3번 출구(7호선, 분당선) 앞\n셔틀버스 탑승"
        ];
    }

    inScreen(sw, sh) {
        if (this.__pos.y + this.__ch > -40 && this.__pos.y < sh + 40) {
            return true;
        }
        return false;
    }

    selectDirectionInfo(x, y) {
        for (var i = 0; i < this.__selectorList.length; i++) {
            if (this.__selectorList[i].inBound(x, y)) {
                this.__selectorList[this.__selectedIndex].setToggle(false);
                this.__selectorList[i].setToggle(!this.__selectorList[i].getToggle());
                this.__selectedIndex = i;
                break;
            }
        }
    }

    addPos(x, y) {
        this.__pos.x += x;
        this.__pos.y += y;
        for (var s of this.__selectorList) {
            s.addPos(0, y);
        }
        return this;
    }

    setPos(x, y) {
        this.__pos.set(x, y);
        for (var s of this.__selectorList) {
            s.setPosY(this.__pos.y);
        }
        return this;
    }

    getPos() {
        return this.__pos;
    }

    updateWithDraw(delta) {
        this.update();
        this.draw();
    }

    update() {
    }

    draw() {
        for (var s of this.__selectorList) {
            s.draw();
        }
        textStyle(NORMAL);
        if (this.__selectedIndex >= 0) {
            textSize(14);
            textLeading(20);
            textAlign(LEFT, null);
            noStroke();
            fill(190, 130, 130);
            text(this.__descriptionText[this.__selectedIndex],
                20,
                this.__selectorList[0].getPos().y + 70,
                this.__w, this.__h);
        }
    }
}