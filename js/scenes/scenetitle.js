class SceneTitle extends AbsScene {
    constructor(attr) {
        super(attr);

        this.__rainModule = new Rain();
    }

    onStart() {
        var size = Broker.getInstance().read(TOPICS.WINDOW_SIZE);
        this.__rainModule.setArea(size[0], size[1]);
        this.__rainModule.addForce(0, 1000);
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