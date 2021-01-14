class PopupInfo {
    constructor() {
        this.__winSize = TopicManager.ready().read(DISPLAY_INFO.WINDOW_SIZE);

        this.__w = 0;
        this.__h = 0;

        this.__pos = new Vector2d();
        this.__text = "";

        this.__textColor = color(250, 250, 250);
        this.__backgroundColor = color(10, 10, 10);
        this.__backgroundColor.setAlpha(190);

        this.__counter = 0;
        this.__isStart = false;
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

    setText(str) {
        this.__text = str;
        return this;
    }

    show() {
        this.__counter = 0;
        this.__isStart = true;
    }

    isShowing() {
        return this.__isStart;
    }

    update(deltaTime) {
        if (!this.__isStart) {
            return;
        }

        this.__counter += deltaTime;
        if (this.__counter >= 2) {
            this.__counter = 2;
            this.__isStart = false;
        }
    }

    draw() {
        if (this.__isStart) {
            fill(this.__backgroundColor);
            rect(this.__pos.x, this.__pos.y, this.__w, this.__h);

            fill(this.__textColor);
            noStroke();
            textAlign(CENTER, CENTER);
            textSize(16);
            text(this.__text, this.__pos.x, this.__pos.y, this.__w, this.__h);
        }
    }
}