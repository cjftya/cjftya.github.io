class TextPointer {
    constructor() {
        this.__pos = new Vector2d();
        this.__vel = new Vector2d();

        var winSize = TopicManager.ready().read(DISPLAY_INFO.WINDOW_SIZE);
        this.__w = winSize[0];
        this.__h = winSize[1];

        this.__delayCounter = 0;

        this.__textArr = [];
        this.__textIndexCounter = 0;

        this.__center = new Vector2d();

        this.__color = color(255, 255, 255);

        var radius = MathUtil.angle2rad(MathUtil.randInt(0, 360));
        this.__vel.x = Math.cos(radius) * (MathUtil.randInt(1, 3) * 0.07);
        this.__vel.y = Math.sin(radius) * (MathUtil.randInt(1, 3) * 0.07);
        this.__alphaMax = 0;
        this.__alpha = 0;
        this.__alphaOffset = 10;
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

    getPos() {
        return this.__pos;
    }

    addText(str) {
        this.__textArr.push(str);
        return this;
    }

    setColor(r, g, b) {
        this.__color.setRed(r);
        this.__color.setGreen(g);
        this.__color.setBlue(b);
        return this;
    }

    setAlpha(a) {
        this.__alphaMax = a;
        return this;
    }

    setCenter(x, y) {
        this.__center.set(x, y);
        return this;
    }

    start() {
        var radius = MathUtil.angle2rad(MathUtil.randInt(0, 360));
        this.__pos.x = this.__center.x + (MathUtil.randInt(1, 80) - 40);
        this.__pos.y = this.__center.y + (MathUtil.randInt(1, 80) - 40);
        this.__vel.x = Math.cos(radius) * (MathUtil.randInt(1, 3) * 0.07);
        this.__vel.y = Math.sin(radius) * (MathUtil.randInt(1, 3) * 0.07);
        this.__alpha = 0;
        this.__alphaOffset = 10;
    }

    update(delta) {
        this.__pos.x += this.__vel.x;
        this.__pos.y += this.__vel.y;

        if (this.__alpha >=  this.__alphaMax && this.__alphaOffset >= 0) {
            this.__alpha =  this.__alphaMax;
            this.__alphaOffset = 0;
            this.__delayCounter += delta;
            if (this.__delayCounter >= 3) {
                this.__alphaOffset = -6;
            }
        }

        if (this.__delayCounter >= 3) {
            if (this.__alpha < 0) {
                this.__alpha = 0;
                this.__textIndexCounter++;
                if (this.__textIndexCounter >= this.__textArr.length) {
                    this.__textIndexCounter = 0;
                }
                this.__delayCounter = 0;
                this.start();
            }
        }
        this.__alpha += this.__alphaOffset;
    }

    draw() {
        this.__color.setAlpha(this.__alpha);
        fill(this.__color);

        textSize(17);
        textStyle(BOLD);
        noStroke();
        textAlign(CENTER, null);
        text(this.__textArr[this.__textIndexCounter],
            this.__pos.x, this.__pos.y, this.__w, this.__h);
    }
}