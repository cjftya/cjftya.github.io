class UiButton extends UiObject {
    constructor(px, py, w, h) {
        super(UiType.BUTTON);

        this.pos = new Vector2d().set(px, py);
        this.w = w;
        this.h = h;
        this.rounding = 5;
        
        this.text = "button";
        this.textSize = 15;
        this.strokeWeight = 1;

        this.textColor = color(240, 240, 240);
        this.bgColor = color(170, 170, 170);

        this.listener = null;
        this.click = false;
        this.hover = false;

        this.alphaDim = 100;
    }

    onDraw() {
        if (this.hover && !this.click) {
            this.bgColor.setAlpha(50);
        } else {
            this.bgColor.setAlpha(this.click ? 255 : 0);
        }
        fill(this.bgColor);
        stroke(this.strokeColor);
        strokeWeight(this.strokeWeight);
        rect(this.pos.x, this.pos.y, this.w, this.h, this.rounding);

        if (this.text != null) {
            fill(this.click ? 255 : this.textColor);
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
        this.bgColor.setAlpha(0);
        this.click = false;
    }

    onTouchHover(tx, ty) {
        if (!this.click) {
            if (this.intersects(tx, ty)) {
                this.hover = true;
            } else {
                this.hover = false;
            }
        }
    }

    setListener(listener) {
        this.listener = listener;
        return this;
    }

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

    setAllColor(r, g, b) {
        this.setTextColor(r, g, b);
        this.setBgColor(r, g, b);
        this.setStrokeColor(r, g, b);
        return this;
    }

    setTextColor(r, g, b) {
        this.textColor = color(r, g, b);
        return this;
    }

    setBgColor(r, g, b) {
        this.bgColor = color(r, g, b, 0);
        return this;
    }

    setStrokeColor(r, g, b) {
        this.strokeColor = color(r, g, b);
        return this;
    }

    setRound(r) {
        this.rounding = r;
    }
}