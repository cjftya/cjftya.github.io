class ListView extends ViewGroup {
    constructor(context, dataCount) {
        super(context);

        this.__listItemGap = 35;
        this.__maxScrollSpeed = 70;

        this.__clickIndex = -1;
        this.__click = false;
        this.__size = TopicManager.ready().read(DISPLAY_INFO.WINDOW_SIZE);

        this.__adapter = null;
        this.__views = [];

        this.__oldPos = new PIXI.Point();
        this.__vel = new PIXI.Point();

        this.__firstListIndex = 0;
        this.__lastListIndex = -1;

        var limitCount = 0;
        for (var i = 0; ; i++) {
            this.__views.push(new ListItem(this.getContext()));
            this.addChild(this.__views[i]);
            if ((this.__views[i].getHeight() + this.__listItemGap) * (i + 1) > this.__size.height) {
                if (++limitCount > 2) {
                    this.__lastListIndex = i;
                    break;
                } else {
                    continue;
                }
            }
        }
        console.log("create view item : " + this.__views.length);
    }

    onCreate() {
        super.onCreate();
        for (var i = 0; i < this.__views.length; i++) {
            this.__views[i].set(this.__size.width / 2 - this.__views[i].getWidth() / 2,
                this.getPositionFromViewPosition(i, this.__views[i].getHeight()));
            this.__adapter.bindItem(this.__views[i], i);
        }
    }

    getPositionFromViewPosition(position, height) {
        return position * height + (position * this.__listItemGap);
    }

    setAdapter(adapter) {
        this.__adapter = adapter;
    }

    onItemClicked(view, dataPosition) {
        console.log("clicked : " + dataPosition);
    }

    onUpdateWithDraw(delta) {
        this.__vel.y *= 0.99;
        for (var i = 0; i < this.__views.length; i++) {
            if (!this.__click) {
                this.__views[i].add(0, this.__vel.y * delta);
            }
            this.__views[i].onUpdateWithDraw(delta);
        }
        this.updateArea();
    }

    onTouchUp(event) {
        this.__click = false;
        if (this.__clickIndex != -1) {
            if (this.checkBound(event.data.global.x, event.data.global.y) == this.__clickIndex) {
                this.onItemClicked(this.__views[this.__clickIndex], this.__views[this.__clickIndex].getDataPosition());
            }
            this.__clickIndex = -1;
        }
    }

    onTouchDown(event) {
        this.__click = true;
        this.__oldPos.set(event.data.global.x, event.data.global.y);
        this.__vel.set(0, 0);
        this.__clickIndex = this.checkBound(event.data.global.x, event.data.global.y);
    }

    onTouchMove(event) {
        if (this.__click) {
            this.__clickIndex = -1;
            this.__vel.y = this.getScrollSpeed(event.data.global.y - this.__oldPos.y);
            this.__oldPos.set(event.data.global.x, event.data.global.y);

            for (var i = 0; i < this.__views.length; i++) {
                this.__views[i].add(0, this.__vel.y);
            }
        }
    }

    getScrollSpeed(v) {
        return v > this.__maxScrollSpeed ? this.__maxScrollSpeed :
            (v < -this.__maxScrollSpeed ? -this.__maxScrollSpeed : v);
    }

    updateArea() {
        for (var i = 0; i < this.__views.length; i++) {
            var topLimit = this.__views[i].getY() + (this.__views[i].getHeight() + this.__listItemGap) * 2;
            var bottomLimit = (this.__views[i].getY() + this.__views[i].getHeight()) - (this.__views[i].getHeight() + this.__listItemGap) * 2;
            if (topLimit < 0) {
                var yPos = this.getPositionFromViewPosition(this.__lastListIndex + 1, this.__views[i].getHeight());
                this.__adapter.bindItem(this.__views[i], Math.abs(this.__lastListIndex + 1) % this.__adapter.getCount());
                this.__views[i].setY(yPos + this.__views[i].getOffsetY());
                this.__firstListIndex++;
                this.__lastListIndex++;
                // console.log("load item bottom : view=" + i + ", data=" + this.__lastListIndex);
                break;
            } else if (bottomLimit > this.__size.height) {
                var yPos = this.getPositionFromViewPosition(this.__firstListIndex - 1, this.__views[i].getHeight());
                this.__adapter.bindItem(this.__views[i], Math.abs(this.__firstListIndex - 1) % this.__adapter.getCount());
                this.__views[i].setY(yPos + this.__views[i].getOffsetY());
                this.__firstListIndex--;
                this.__lastListIndex--;
                // console.log("load item top : view=" + i + ", data=" + this.__firstListIndex);
                break;
            }
        }
    }

    checkBound(x, y) {
        for (var i = 0; i < this.__views.length; i++) {
            if (this.__views[i].isBound(x, y)) {
                return i;
            }
        }
        return -1;
    }
}