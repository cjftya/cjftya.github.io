class ListItem extends View {
    constructor(context) {
        super(context);

        this.__size = TopicManager.ready().read(DISPLAY_INFO.WINDOW_SIZE);
        this.__halfHeight = this.__size.height / 2;

        this.__minTextScale = 0.4;
        this.__maxTextScale = 1.2;

        this.__container = new PIXI.Container();

        this.__offsetPosition = new PIXI.Point();

        this.__w = 150;
        this.__h = 60;

        this.__outLine = null; //new PIXI.Graphics();
        this.__textView = new PIXI.Text('');
        this.__textView.anchor.set(0.5);
        this.__textView.x += this.__w / 2;
        this.__textView.y += this.__h / 2;

        this.__container.addChild(this.__textView);
        if (this.__outLine != null) {
            this.__container.addChild(this.__outLine);
        }
        this.__dataPosition = -1;
    }

    setDataPosition(position) {
        this.__dataPosition = position;
    }

    getDataPosition() {
        return this.__dataPosition;
    }

    isBound(x, y) {
        if (this.__textView.scale.x < 0.6) {
            return false;
        }

        if (x < this.__container.x || x > this.__container.x + this.__w) {
            return false;
        }
        if (y < this.__container.y || y > this.__container.y + this.__h) {
            return false;
        }
        return true;
    }

    recycle() {
    }

    getPixiView() {
        return this.__container;
    }

    getWidth() {
        return this.__w;
    }

    getHeight() {
        return this.__h;
    }

    getX() {
        return this.__container.x;
    }

    getY() {
        return this.__container.y;
    }

    getOffsetX() {
        return this.__offsetPosition.x;
    }

    getOffsetY() {
        return this.__offsetPosition.y;
    }

    add(x, y) {
        this.__container.x += x;
        this.__container.y += y;
        this.__offsetPosition.x += x;
        this.__offsetPosition.y += y;
    }

    setX(x) {
        this.__container.x = x;
    }

    setY(y) {
        this.__container.y = y;
    }

    set(x, y) {
        this.__container.position.set(x, y);
    }

    setText(text) {
        this.__textView.text = text;
    }

    setColor(color) {
        this.__textView.style.fill = color;
        if (this.__outLine != null) {
            this.__outLine.beginFill(0xffffff, 0);
            this.__outLine.lineStyle(1, color);
            this.__outLine.drawRoundedRect(0, 0, this.__w, this.__h, 10);
            this.__outLine.endFill();
        }
    }

    onUpdateWithDraw(delta) {
        if (this.__container.y <= this.__halfHeight) {
            this.setTextScale(Math.max((this.__container.y * this.__maxTextScale) / this.__halfHeight, this.__minTextScale));
        } else {
            this.setTextScale(Math.max(((this.__size.height - this.__container.y) * this.__maxTextScale) / this.__halfHeight, this.__minTextScale));
        }
    }

    setTextScale(s) {
        this.__textView.scale.x = s;
        this.__textView.scale.y = s;
    }
}