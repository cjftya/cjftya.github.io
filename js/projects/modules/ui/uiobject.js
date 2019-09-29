class UiObject extends AbsObject {
    constructor() {
        super();
    }

    onCreate() { }
    onUpdate() { }
    onDraw() { }
    onDestory() { }

    intersects(tx, ty) {
        return false;
    }

    onTouchDown(tx, ty) { }
    onTouchUp(tx, ty) { }
    onTouchMove(tx, ty) { }
    onTouchHover(tx, ty) { }
}