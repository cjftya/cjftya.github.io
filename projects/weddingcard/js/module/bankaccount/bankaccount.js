class BankAccount {
    constructor() {
        this.__winSize = TopicManager.ready().read(DISPLAY_INFO.WINDOW_SIZE);

        this.__w = 0;
        this.__h = 0;

        this.__pos = new Vector2d();
        this.__title = "";
        this.__bankInfo = [];
        this.__selectedIndex = -1;
        this.__titleColor = color(190, 130, 130);
    }

    inScreen(sw, sh) {
        if (this.__pos.y + this.__h > -40 && this.__pos.y < sh + 40) {
            return true;
        }
        return false;
    }

    inBound(x, y) {
        for (var i = 0; i < this.__bankInfo.length; i++) {
            if (this.__bankInfo[i].inBound(x, y)) {
                if (this.__selectedIndex != -1) {
                    if (this.__selectedIndex == i) {
                        this.copyNumber(i);
                    }
                    this.__selectedIndex = -1;
                } else {
                    this.__selectedIndex = i
                }
                return true;
            }
        }
        return false;
    }

    copyNumber(index) {
        console.log("copy : " + this.__bankInfo[index].getNumber());
    }

    addTitle(str) {
        this.__title += str + "\n";
        return this;
    }

    addBackInfo(owner, bank, number) {
        var beforePy = this.__bankInfo.length == 0 ? this.__pos.y : this.__bankInfo[this.__bankInfo.length - 1].getPos().y;
        var heightGap = this.__bankInfo.length == 0 ? 80 : 40;
        var info = new BankInfo(owner, bank, number)
            .setPos(this.__pos.x + (this.__winSize[0]*0.05), beforePy + heightGap)
            .setSize(this.__w, 50)
            .setTextColor(190, 130, 130);
        this.__bankInfo.push(info);
        return this;
    }

    addPos(x, y) {
        this.__pos.x += x;
        this.__pos.y += y;
        for (var i = 0; i < this.__bankInfo.length; i++) {
            this.__bankInfo[i].addPos(x, y);
        }
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
        return this;
    }

    updateWithDraw(deltaTime) {
        this.update();
        this.draw();
    } 

    update() {
    }

    draw() {
        fill(this.__titleColor);
        noStroke();
        textAlign(CENTER, null);
        textSize(16);
        textLeading(25);
        text(this.__title, this.__pos.x, this.__pos.y, this.__w, this.__h);

        for (var i = 0; i < this.__bankInfo.length; i++) {
            this.__bankInfo[i].draw();
        }
    }
}