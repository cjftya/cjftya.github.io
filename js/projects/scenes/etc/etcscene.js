class EtcScene extends AbsScene {
    constructor() {
        super();
    }

    onCreate() {
    }

    onStart() {
        var winSize = TopicManager.ready().read(DISPLAY_INFO.WINDOW_SIZE);
        var backButton = UiCreator.newButton(winSize[0] - 100, 5, 80, 40)
            .setText("Back")
            .setBgColor(220, 150, 220)
            .setListener(() => {
                TopicManager.ready().publish(TOPICS.SCENE_LOADER, SCENES.MAIN);
            });
        ObjectPool.ui().insert(backButton);
    }

    onPause() {
    }

    onUpdate(timeDelta) {
    }

    onDraw() {
        background(255, 255, 255);
        noStroke();
    }

    onEnd() {
        ObjectPool.release();
    }

    onDestroy() {
    }

    onTouchDown(tx, ty) {
    }

    onTouchUp(tx, ty) {
    }

    onTouchMove(tx, ty) {
    }
}