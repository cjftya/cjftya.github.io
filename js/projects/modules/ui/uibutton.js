class UiButton extends UiObject {
    constructor(px, py, w, h) {
        super(UiType.BUTTON);

        this.pos = new Vector2d().set(px, py);
        this.w = w;
        this.h = h;
        this.rounding = 10;
        
        this.text = "button";
        this.textSize = 15;
        this.strokeWeight = 3;

        this.textColor = color(240, 240, 240);
        this.bgColor = color(170, 170, 170);

        this.listener = null;
        this.click = false;

        this.alphaDim = 100;
    }

    onDraw() {
        this.bgColor.setAlpha(this.click ? 255 - this.alphaDim : 255);
        fill(this.bgColor);
        stroke(240);
        strokeWeight(this.strokeWeight);
        rect(this.pos.x, this.pos.y, this.w, this.h, this.rounding);

        if (this.text != null) {
            this.textColor.setAlpha(this.click ? 255 - this.alphaDim : 255);
            fill(this.textColor);
            noStroke();
            textSize(this.textSize);
            textAlign(CENTER, CENTER);
            text(this.text, this.pos.x + 3, this.pos.y + 3, this.w, this.h);
        }
    }

    intersects(tx, ty) {
        if (this.pos.x > tx || this.pos.y > ty) {
            return false;
        } else if (this.pos.x + this.w < tx || this.pos.y + this.h < ty) {
            return false;
        }
        return true;
    }

    onTouchDown(tx, ty) {
        if (this.intersects(tx, ty)) {
            this.click = true;
        }
    }

    onTouchUp(tx, ty) {
        if (this.intersects(tx, ty) && this.click) {
            if (this.listener != null) {
                this.listener();
            }
        }
        this.click = false;
    }

    setListener(listener) {
        this.listener = listener;
        return this;
    }

    // chain builder

    setText(text) {
        this.text = text;
        return this;
    }

    setTextSize(size) {
        this.textSize = size;
        return this;
    }

    setStrokeWeight(weight) {
        this.strokeWeight = weight;
        return this;
    }

    setTextColor(r, g, b) {
        this.textColor = color(r, g, b);
        return this;
    }

    setBgColor(r, g, b) {
        this.bgColor = color(r, g, b);
        return this;
    }

    setRound(r) {
        this.rounding = r;
    }
}