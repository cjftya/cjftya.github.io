class DSelector {
    constructor() {
        this.__pos = new Vector2d();
        this.__size = 0;

        this.__color = color(230, 170, 170);
        this.__textColor = color(250, 250, 250);
        this.__lineCount = 0;
        this.__text = "";
        this.__toggle = false;
    }

    setToggle(v) {
        this.__toggle = v;
        if(this.__toggle) {
            this.__color = color(200, 170, 170);
        } else {
            this.__color = color(230, 170, 170);
        }
        return this;
    }

    getToggle() {
        return this.__toggle;
    }

    addPos(x, y) {
        this.__pos.x += x;
        this.__pos.y += y;
        return this;
    }

    setPos(x, y) {
        this.__pos.set(x, y);
        return this;
    }

    setPosX(x) {
        this.__pos.set(x, this.__pos.y);
        return this;
    }

    setPosY(y) {
        this.__pos.set(this.__pos.x, y);
        return this;
    }

    getPos() {
        return this.__pos;
    }

    setSize(s) {
        this.__size = s;
        return this;
    }

    addText(str) {
        this.__lineCount++;
        this.__text += str + "\n";
        return this;
    }

    inBound(x, y) {
        var dx = x - this.__pos.x;
        var dy = y - this.__pos.y;
        var d = dx * dx + dy * dy;
        return d < (this.__size / 2) * (this.__size / 2);
    }

    draw() {
        fill(this.__color);
        ellipse(this.__pos.x, this.__pos.y, this.__size, this.__size);

        textSize(14);
        textStyle(BOLD);
        textAlign(CENTER, null);
        if (this.__lineCount >= 2) {
           textLeading(16);
        }
        noStroke();
        fill(this.__textColor);
        text(this.__text,
            this.__pos.x - this.__size / 2 + 2,
            this.__pos.y - this.__size / 2 + this.__size / 2 - 14,
            this.__size, this.__size);
    }
}