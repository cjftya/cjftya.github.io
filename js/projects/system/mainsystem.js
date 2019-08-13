class MainSystem extends AbsSystem {
    constructor() {
        super();

        this.__scene = null;
        this.__fpsCount = "null";
    }

    registerSubscribers() {
        return new SubscriberInstaller()
            .add(TOPICS.SCENE_LOADER, this.loadScece);
    }

    onCreate() {
        super.onCreate();
        createCanvas(windowWidth, windowHeight);
        textSize(20);

        TopicManager.ready().publish(TOPICS.SCENE_LOADER, SCENES.MAIN);
        this.__scene = TopicManager.ready().read(SCENES.CURRENT);
    }

    onPause() {
        this.__scene.onPause();
    }

    onOperate() {
        TimeDeltaUtil.getInstance().update();

        this.__scene.onUpdate(TimeDeltaUtil.getInstance().getDelta());
        this.__scene.onDraw();

        this.drawFpsCount();
    }

    onDestroy() {
        super.onDestroy();
        this.__scene.onDestroy();
    }

    onTouchUp(mx, my) {
        this.__scene.onTouchUp(mx, my);
    }

    onTouchDown(mx, my) {
        this.__scene.onTouchDown(mx, my);
    }

    onTouchMove(mx, my) {
        this.__scene.onTouchMove(mx, my);
    }

    loadScece(topic, data) {
        console.log("load scene : " + data);

        switch (data) {
            case SCENES.MAIN:
                this.__scene = new MainScene();
                break;
            default:
                console.log("unknown scene type : " + topic);
                break;
        }
        this.__scene.onCreate();
        this.__scene.onStart();
        TopicManager.ready().write(SCENES.CURRENT, this.__scene);
    }

    drawFpsCount() {
        this.__fpsCount = "FPS : " + Math.floor(TimeDeltaUtil.getInstance().getFPS());
        fill(0);
        text(this.__fpsCount, 10, 20);
    }
}