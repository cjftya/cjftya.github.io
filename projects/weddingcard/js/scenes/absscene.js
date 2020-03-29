class AbsScene {
    constructor() {
    }

    onCreate() { }
    onPause() { }
    onStart() { }
    onUpdateWithDraw(timeDelta) { }

    onEnd() { }
    onDestroy() { }

    onTouchDown(tx, ty) { }
    onTouchUp(tx, ty) { }
    onTouchMove(tx, ty) { }
}