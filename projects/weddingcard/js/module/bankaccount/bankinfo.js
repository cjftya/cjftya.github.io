class BankInfo {
    constructor(owner, bank, number) {
        this.__pos = new Vector2d();

        this.__owner = owner;
        this.__bank = bank;
        this.__number = number;
        this.__onlyNum = owner;

        this.__text = "• " + this.__owner + "  " + this.__bank + "  " + this.__number;

        this.__w = 0;
        this.__h = 0;

        this.__textColor = color(0, 0, 0);
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

    getPos() {
        return this.__pos;
    }

    setSize(w, h) {
        this.__w = w;
        this.__h = h;
        return this;
    }

    setTextColor(r, g, b) {
        this.__textColor.setRed(r);
        this.__textColor.setGreen(g);
        this.__textColor.setBlue(b);
        this.__textColor.setAlpha(200);
        return this;
    }

    getNumber() {
        return this.__onlyNum;
    }

    inBound(x, y) {
        if (x < this.__pos.x || x > this.__pos.x + this.__w) {
            return false;
        }
        if (y < this.__pos.y-15 || y > this.__pos.y + 15) {
            return false;
        }
        return true;
    }

    draw() {
        fill(this.__textColor);
        noStroke();
        textAlign(LEFT, null);

        textSize(15);
        text(this.__text, this.__pos.x, this.__pos.y, this.__w, this.__h);
    }
}