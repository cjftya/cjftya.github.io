class DragCOntrol {
    constructor() {
        this.__oldPos = new Vector2d();

        this.__dragPos = 0;
        this.__dragVel = 0;

        this.__areaHstart = 0;
        this.__areaHend = 0;
    }

    getOldPos() {
        return this.__oldPos;
    }

    setOldPos(x, y) {
        return this.__oldPos.set(x, y);
    }

    setDragAreaHeigthSize(st, ed) {
        this.__areaHstart = st;
        this.__areaHend = ed;
    }

    getStartAreaHeigth() {
        return this.__areaHstart;
    }

    getEndAreaHeight() {
        return this.__areaHend;
    }

    addDragPos(p) {
        this.__dragPos += p;
    }

    getDragPos() {
        return this.__dragPos;
    }

    addDragVel(v) {
        this.__dragVel += v;
    }

    setDragVel(v) {
        this.__dragVel = v;
    }

    getDragVel() {
        return this.__dragVel;
    }

    update() {
        this.__dragVel *= 0.95;
    }
}