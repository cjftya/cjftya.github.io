class PinLock {
    constructor(resultCallBack) {
        this.__myGirlPattern = "1375";
        this.__motherOfMyGirlPattern = "1458";

        this.setPatternPort();

        this.__selectedList = [];
        this.__patternString = "";
        this.__point = new Point();

        this.__callback = resultCallBack;
    }

    setPatternPort() {
        this.__patternPorts = [];

        var r = windowWidth / 7;
        var sx = ((windowWidth - (r * 3)) / 2) - (r / 2);
        var sy = ((windowHeight - (r * 3)) / 2) - (r / 2);

        for (var i = 0; i < 3; i++) {
            for (var k = 0; k < 3; k++) {
                var nx = sx + (k * r * 2);
                var ny = sy + (i * r * 2);
                this.__patternPorts.push(new PatternPort(nx, ny, r, 20));
            }
        }
    }

    pick(px, py) {
        for (var i = 0; i < this.__patternPorts.length; i++) {
            if (this.__patternPorts[i].pick(px, py)) {
                this.__selectedList.push(i);
                this.__patternString += i.toString();
                console.log(i);
                break;
            }
        }
        this.__point.set(px, py);
    }

    drag(px, py) {
        if (this.__selectedList.length > 0) {
            for (var i = 0; i < this.__patternPorts.length; i++) {
                if (!this.__patternPorts[i].isPick() && this.__patternPorts[i].pick(px, py)) {
                    this.__selectedList.push(i);
                    this.__patternString += i.toString();
                    console.log(i);
                    break;
                }
            }
            this.__point.set(px, py);
        }
    }

    release(px, py) {
        if (this.__patternString == this.__myGirlPattern) {
            this.__callback("__myGirlPattern");
        } else if (this.__patternString == this.__motherOfMyGirlPattern) {
            this.__callback("__motherOfMyGirlPattern");
        }

        for (var i = 0; i < this.__patternPorts.length; i++) {
            this.__patternPorts[i].release();
        }
        this.__patternString = "";
        this.__selectedList = [];
    }

    update() {
    }

    draw() {
        for (var i = 0; i < this.__patternPorts.length; i++) {
            this.__patternPorts[i].draw();
        }

        noFill();
        stroke(150);
        strokeWeight(9);
        for (var i = 0; i < this.__selectedList.length; i++) {
            if (i < this.__selectedList.length - 1) {
                var cx = this.__patternPorts[this.__selectedList[i]].getCx();
                var cy = this.__patternPorts[this.__selectedList[i]].getCy();
                var cx2 = this.__patternPorts[this.__selectedList[i + 1]].getCx();
                var cy2 = this.__patternPorts[this.__selectedList[i + 1]].getCy();
                line(cx, cy, cx2, cy2);
            } else {
                var cx = this.__patternPorts[this.__selectedList[this.__selectedList.length - 1]].getCx();
                var cy = this.__patternPorts[this.__selectedList[this.__selectedList.length - 1]].getCy();
                line(cx, cy, this.__point.x, this.__point.y);
            }
        }
    }
}