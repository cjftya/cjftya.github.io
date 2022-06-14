class PointerEffect extends AbsEffect {
    constructor(context) {
        super(context);

        this.__length = 12;
        this.__start = 0;
        this.__end = 2;
        this.__rangeCount = (this.__end - this.__start) + 1;

        this.__list = [];

        for (var i = 0; i < this.__length; i++) {
            this.__list.push(new Pointer(context));
            this.__list[i].reset();
            this.addChild(this.__list[i]);
        }
    }

    getNextIndex(i) {
        return (i + 1) % this.__length;
    }

    onUpdateWithDraw(delta) {
        for (var i = this.__start, k = 0; k < this.__rangeCount; k++) {
            this.__list[i].onUpdateWithDraw(delta);
            i = this.getNextIndex(i);
        }
    }

    onTouchUp(event) {
        this.__list[this.__end].ready(event.data.global.x, event.data.global.y);
        this.__list[this.__start].reset();

        this.__start = this.getNextIndex(this.__start);
        this.__end = this.getNextIndex(this.__end);
    }

    onTouchDown(event) {
    }
}