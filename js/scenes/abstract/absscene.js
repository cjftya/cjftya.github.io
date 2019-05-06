class AbsScene {
    constructor() {
    }

    setPresenter(presenter) {
        this.__presenter = presenter;
    }
    getPresenter() {
        return this.__presenter;
    }

    onCreate() { }
    onPause() { }
    onStart() { }
    onUpdate(timeDelta) { }
    onDraw() { }
    onEnd() { }
    onDestroy() { }

    onTouchDown(tx, ty) { }
    onTouchUp(tx, ty) { }
    onTouchMove(tx, ty) { }
    onGyroControl(x, y, z) { }
}