class ListItem extends View {
    constructor(context) {
        super(context);

        this.__size = TopicManager.ready().read(DISPLAY_INFO.WINDOW_SIZE);
        this.__halfHeight = this.__size.height / 2;

        this.__minValueRate = 0.05;
        this.__maxValueRate = 1.0;

        this.__container = new PIXI.Container();

        this.__offsetPosition = new PIXI.Point();

        this.__w = 250;
        this.__h = 60;

        const style = new PIXI.TextStyle({
            fontFamily: "Helvetica",
            fontVariant: "small-caps",
            fontSize: 16,
            fill: '#000000'
        });
        this.__outLine = null; // new PIXI.Graphics();
        this.__textView = new PIXI.Text('', style);
        this.__textView.anchor.set(0.5);
        this.__textView.x += this.__w / 2;
        this.__textView.y += this.__h / 2;

        if (this.__outLine != null) {
            this.__container.addChild(this.__outLine);
        }
        this.__container.addChild(this.__textView);
        this.__dataPosition = -1;
    }

    setDataPosition(position) {
        this.__dataPosition = position;
    }

    getDataPosition() {
        return this.__dataPosition;
    }

    isBound(x, y) {
        if (this.__container.alpha < 0.5) {
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
            this.__outLine.clear();
            this.__outLine.beginFill(0xf4f4f4, 0);
            this.__outLine.lineStyle(1, color);
            this.__outLine.drawRoundedRect(0, 0, this.__w, this.__h, 6);
            this.__outLine.endFill();
        }
    }

    onUpdateWithDraw(delta) {
        if (this.__container.y <= this.__halfHeight) {
            this.setValueRate(Math.max((this.__container.y * this.__maxValueRate) / this.__halfHeight, this.__minValueRate));
        } else {
            this.setValueRate(Math.max(((this.__size.height - this.__container.y) * this.__maxValueRate) / this.__halfHeight, this.__minValueRate));
        }
    }

    setValueRate(s) {
        // this.__textView.alpha = s;
        this.__container.alpha = s;
    }
}