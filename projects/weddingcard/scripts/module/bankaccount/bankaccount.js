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

        this.__popupInfo = new PopupInfo()
            .setPos(0, this.__winSize[1] / 2 - 35)
            .setSize(this.__winSize[0], 35);
    }

    inScreen(sw, sh) {
        if (this.__pos.y + this.__h > -40 && this.__pos.y < sh + 40) {
            return true;
        } else {
            this.__popupInfo.hide();
        }
        return false;
    }

    pick(x, y) {
        for (var i = 0; i < this.__bankInfo.length; i++) {
            if (this.__bankInfo[i].inBound(x, y)) {
                this.copyNumber(i);
                break;
            }
        }
    }

    copyNumber(index) {
        if (!this.__popupInfo.isShowing()) {
            var textArea = document.createElement("textarea");
            textArea.value = this.__bankInfo[index].getNumber();
            document.body.appendChild(textArea);
            textArea.select();
            textArea.setSelectionRange(0, 9999);
            document.execCommand("copy");
            document.body.removeChild(textArea);

            this.__popupInfo
                .setText(this.__bankInfo[index].getOwner() + "님의 계좌가 복사되었습니다")
                .show();
        }
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
        this.update(deltaTime);
        this.draw();
    }

    update(deltaTime) {
        this.__popupInfo.update(deltaTime);
    }

    draw() {
        fill(this.__titleColor);
        noStroke();
        textAlign(CENTER, null);
        textSize(16);
        textLeading(30);
        text(this.__title, this.__pos.x, this.__pos.y, this.__w, this.__h);

        for (var i = 0; i < this.__bankInfo.length; i++) {
            this.__bankInfo[i].draw();
        }

        this.__popupInfo.draw();
    }
}