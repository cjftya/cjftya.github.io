class MainScene extends AbsScene {
    constructor(context) {
        super(context);

        this.__click = false;
    }

    getName() {
        return "MainScene";
    }

    onCreate() {
    }

    onUpdateWithDraw(timeDelta) {

    }

    onDestroy() {
    }

    onTouchDown(event) {
        this.__click = true;

    }

    onTouchUp(event) {
        this.__click = false;

    }

    onTouchMove(event) {

    }
}