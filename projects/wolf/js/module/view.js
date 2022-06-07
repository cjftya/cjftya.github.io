class View {
    constructor(context) {
        this.__context = context;
    }

    getContext() {
        return this.__context;
    }

    getPixiView() {
        return null;
    }

    onCreate() {
    }

    onPause() {
    }

    onDestroy() {
    }

    onUpdateWithDraw(delta) {
    }

    onTouchUp(event) { }
    onTouchDown(event) { }
    onTouchMove(event) { }
}