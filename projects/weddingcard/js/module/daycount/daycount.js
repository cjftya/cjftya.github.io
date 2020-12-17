class DayCount {
    constructor() {
        var winSize = TopicManager.ready().read(DISPLAY_INFO.WINDOW_SIZE);
        this.__w = winSize[0];
        this.__h = winSize[1];

        var dday = new Date("March 6,2021,12:30:00").getTime();
        var now = new Date();
        var distance = dday - now;
        var d = Math.floor(distance / (1000 * 60 * 60 * 24));
        var dstr = TextUtil.pad(d, 3);
        
        this.__pos = new Vector2d();
        this.__boardList = [];

        var bw = 35;
        var bh = 35;
        var space = 4;
        var size = this.__w - (bw * 5 + space * 4) - 0;
        this.__ch = bh;
        var b1 = new NumberBoard()
            .setChar("D")
            .setSize(bw, bh)
            .setPosX(size / 2);
        var b2 = new NumberBoard()
            .setChar("-")
            .setSize(bw, bh)
            .setPosX(b1.getPos().x + bw + space);
        var b3 = new NumberBoard()
            .setChar(dstr[0])
            .setSize(bw, bh)
            .setPosX(b2.getPos().x + bw + space);
        var b4 = new NumberBoard()
            .setChar(dstr[1])
            .setSize(bw, bh)
            .setPosX(b3.getPos().x + bw + space);
        var b5 = new NumberBoard()
            .setChar(dstr[2])
            .setSize(bw, bh)
            .setPosX(b4.getPos().x + bw + space);

        this.__boardList.push(b1);
        this.__boardList.push(b2);
        this.__boardList.push(b3);
        this.__boardList.push(b4);
        this.__boardList.push(b5);
    }

    inScreen(sw, sh) {
        if (this.__pos.y + this.__ch > -40 && this.__pos.y < sh + 40) {
            return true;
        }
        return false;
    }

    addPos(x, y) {
        this.__pos.x += x;
        this.__pos.y += y;
        for (var b of this.__boardList) {
            b.addPos(0, y);
        }
        return this;
    }

    setPos(x, y) {
        this.__pos.set(x, y);
        for (var b of this.__boardList) {
            b.setPosY(this.__pos.y);
        }
        return this;
    }

    getPos() {
        return this.__pos;
    }

    updateWithDraw(deltaTime) {
        this.update();
        this.draw();
    }

    update() {
    }

    draw() {
        for (var b of this.__boardList) {
            b.draw();
        }
    }
}