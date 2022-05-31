class AbsScene {
    constructor(context) {
        this.__context = context;
    }

    getName() {
        return "AbsScene";
    }

    getContext() {
        return this.__context;
    }

    onCreate() { }
    onPause() { }
    onStart() { }
    onUpdateWithDraw(delta) { }
    onDestroy() { }

    onTouchDown(event) { }
    onTouchUp(event) { }
    onTouchMove(event) { }
}