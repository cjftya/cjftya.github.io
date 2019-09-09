class MainSystem extends AbsSystem {
    constructor() {
        super();

        this.__scene = null;
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

        TopicManager.ready().publish(TOPICS.SCENE_LOADER, SCENES.MAIN);
    }

    onPause() {
        this.__scene.onPause();
    }

    onOperate() {
        TimeDeltaUtil.getInstance().update();

        this.__scene.onUpdate(TimeDeltaUtil.getInstance().getDelta());
        this.__scene.onDraw();

        UiManager.ready().draw();

        this.drawFpsCount();
    }

    onDestroy() {
        super.onDestroy();
        this.__scene.onDestroy();
    }

    onTouchUp(mx, my) {
        UiManager.ready().touchUp(mx, my);
        this.__scene.onTouchUp(mx, my);
    }

    onTouchDown(mx, my) {
        UiManager.ready().touchDown(mx, my);
        this.__scene.onTouchDown(mx, my);
    }

    onTouchMove(mx, my) {
        //iManager.ready().touchMove(mx, my);
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
            case SCENES.COLLISION:
                curScene = new CollisionScene();
                break;
            case SCENES.CONSTRAINT:
                curScene = new ConstraintScene();
                break;
            case SCENES.PERFORMANCE:
                curScene = new PerformanceScene();
                break;
            case SCENES.PARTICLE:
                curScene = new ParticleScene();
                break;
            case SCENES.ETC:
                curScene = new EtcScene();
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
            console.log("scene load fail : " + data);
        }
    }

    drawFpsCount() {
        textSize(20);
        noStroke();
        fill(0);
        textAlign(LEFT, TOP);
        text("FPS : " + Math.floor(TimeDeltaUtil.getInstance().getFPS()), 10, 10);
    }
}