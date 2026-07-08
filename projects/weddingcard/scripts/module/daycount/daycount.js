class DayCount {
    constructor() {
        var size = TopicManager.ready().read(DISPLAY_INFO.WINDOW_SIZE);
        this.__startLine = (size[1] / 2);

        this.__w = 0;
        this.__h = 0;

        this.__pos = new Vector2d();

        this.__textColor = color(0, 0, 0);

        this.__dayStr = "";
        this.__countStr = "";

        this.__panelList = [];
        for (var i = 0; i < 5; i++) {
            var panel = new BlockPanel()
                .setColor(10, 10, 10)
                .setAlpha(230);
            this.__panelList.push(panel);
        }
        this.__panelList[0].setAlphaIncreaseRate(1.2, 0.4);
        this.__panelList[1].setAlphaIncreaseRate(1, 0.6);
        this.__panelList[2].setAlphaIncreaseRate(0.8, 0.8);
        this.__panelList[3].setAlphaIncreaseRate(0.6, 1);
        this.__panelList[4].setAlphaIncreaseRate(0.4, 1.2);
    }

    inScreen(sw, sh) {
        if (this.__pos.y + this.__h > -40 && this.__pos.y < sh + 40) {
            return true;
        }
        return false;
    }

    addPos(x, y) {
        this.__pos.x += x;
        this.__pos.y += y;
        for (var i = 0; i < this.__panelList.length; i++) {
            this.__panelList[i].addPos(x, y);
            if (this.__pos.y < this.__startLine && y < 0) {
                this.__panelList[i].addAlpha(y * 2);
            } else if (this.__pos.y + this.__h > this.__startLine && y > 0) {
                this.__panelList[i].addAlpha(y * 2);
            }
        }
        this.__textColor.setAlpha(this.__panelList[0].getAlpha());
        return this;
    }

    setPos(x, y) {
        this.__pos.set(x, y);
        return this;
    }

    getPos() {
        return this.__pos;
    }

    setSize(w, h) {
        this.__w = w;
        this.__h = h;
        var slice = this.__h / this.__panelList.length;
        for (var i = 0; i < this.__panelList.length; i++) {
            this.__panelList[i].setSize(w, slice+0.2)
                .setPos(0, this.__pos.y + (i * slice));
        }
        return this;
    }

    setTextColor(r, g, b) {
        this.__textColor.setRed(r);
        this.__textColor.setGreen(g);
        this.__textColor.setBlue(b);
        return this;
    }

    setDay(day) {
        this.__dayStr = day;
        return this;
    }

    setCounter(count) {
        this.__countStr = count;
        return this;
    }

    updateWithDraw(deltaTime) {
        this.update();
        this.draw();
    }

    update() {
    }

    draw() {
        for (var i = 0; i < this.__panelList.length; i++) {
            this.__panelList[i].draw();
        }

        fill(this.__textColor);
        textStyle(BOLD);
        noStroke();
        textAlign(CENTER, null);

        textSize(30);
        text(this.__dayStr, this.__pos.x, this.__pos.y + (this.__h / 2.1), this.__w, this.__h);

        textSize(20);
        text(this.__countStr, this.__pos.x, this.__pos.y + (this.__h / 1.6), this.__w, this.__h);
    }
}