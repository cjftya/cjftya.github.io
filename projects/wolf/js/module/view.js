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

    // Call super
    onDestroy() {
        this.__context = null;
    }

    onUpdateWithDraw(delta) {
    }

    onTouchUp(event) { }
    onTouchDown(event) { }
    onTouchMove(event) { }
}