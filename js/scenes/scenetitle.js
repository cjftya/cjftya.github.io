class SceneTitle extends AbsScene {
    constructor(attr) {
        super(attr);

        this.__rainModule = new Rain();
    }

    onStart() {
        var size = Broker.getInstance().read(TOPICS.WINDOW_SIZE);
        this.__rainModule.setArea(size[0], size[1]);
        this.__rainModule.setWindDirection(0);
        this.__rainModule.setDropSpeed(9.8);
        this.__rainModule.onStart();
    }

    onUpdate(timeDelta) {
        this.__rainModule.onUpdate(timeDelta);
    }

    onDraw() {
        background(10, 10, 80);
        noStroke();

        this.__rainModule.onDraw();
    }

    onTouchDown(tx, ty) {}

    onTouchUp(tx, ty) {}

    onTouchMove(tx, ty) {}
}