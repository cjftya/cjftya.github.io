class FadeInOut {
    constructor(resultCallback) {
        this.__callback = resultCallback;
        this.__a = 0;
        this.__c = new Color(255, 255, 255, this.__a);
        this.__in = false;
        this.__am = 2;
        this.__active = false;
    }

    fadeIn() {
        if (!this.__in) {
            this.__am = 2;
            this.__active = true;
        }
    }

    fadeOut() {
        if (this.__in) {
            this.__am = -2;
            this.__active = true;
        }
    }

    update() {
        if (!this.__active) {
            return;
        }

        this.__a += this.__am;
        if (!this.__in) {
            if (this.__a >= 255) {
                this.__in = true;
                this.__active = false;
                this.__callback("in");
            }
        } else {
            if (this.__a < 0) {
                this.__in = false;
                this.__active = false;
                this.__callback("out");
            }
        }
        this.__c.setAlpha(this.__a);
    }

    draw() {
        this.__c.applyColor();
        rect(-20, -20, windowWidth + 20, windowHeight + 20);
    }
}