class MainSystem extends AbsSystem {
    constructor() {
        super();

        this.__scene = null;
        this.__fpsCount = "null";
    }

    registerSubscribers() {
        return new SubscriberInstaller()
            .add(TOPICS.SCENE_LOADER, (topic, data) => {
                this.loadScece(topic, data);
            });
    }

    onCreate() {
        super.onCreate();
        createCanvas(windowWidth, windowHeight);
        textSize(20);

        TopicManager.ready().publish(TOPICS.SCENE_LOADER, SCENES.MAIN);
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
        var curScene = TopicManager.ready().read(SCENES.CURRENT);
        if (curScene != null) {
            console.log("exit scene : " + curScene);
            curScene.onEnd();
            curScene.onDestroy();
            curScene = null;
        }

        switch (data) {
            case SCENES.MAIN:
                curScene = new MainScene();
                break;
            case SCENES.PHYSICS:
                curScene = new PhysicsScene();
                break;
            default:
                console.log("unknown scene type : " + data);
                break;
        }
        if (curScene != null) {
            curScene.onCreate();
            curScene.onStart();
            this.__scene = curScene;
            TopicManager.ready().write(SCENES.CURRENT, curScene);
        } else {
            console.log("scene load fail" + data);
        }
    }

    drawFpsCount() {
        this.__fpsCount = "FPS : " + Math.floor(TimeDeltaUtil.getInstance().getFPS());
        fill(0);
        text(this.__fpsCount, 10, 20);
    }
}