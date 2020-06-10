class MainSystem extends AbsSystem {
    constructor() {
        super();

        this.__activeDebug = 0;
        this.__isLoading = true;
        this.__scene = null;
    }

    registerSubscribers() {
        // return new SubscriberInstaller()
        //     .add(TOPICS.RESOURCE_LOAD, (topic, data) => {
        //         this.loadResource(topic, data);
        //     });
        return null;
    }

    onPreload() {
        this.loadScene();
    }

    onCreate() {
        super.onCreate();
        createCanvas(windowWidth, windowHeight);

        this.__scene.onCreate();
        this.__scene.onStart();

        this.__isLoading = false;
    }

    onOperate() {
        TimeDeltaUtil.getInstance().update();

        this.__scene.onUpdateWithDraw(TimeDeltaUtil.getInstance().getDelta());

        if (this.isActiveDebug()) {
            this.__scene.drawDebug();
        }
    }

    onDestroy() {
        super.onDestroy();
        this.__scene.onDestroy();
    }

    onTouchUp(mx, my) {
        if (this.__isLoading) {
            return;
        }
        this.__scene.onTouchUp(mx, my);
    }

    onTouchDown(mx, my) {
        if (this.__isLoading) {
            return;
        }

        if (my < 40) {
            this.__activeDebug++;
        }
        this.__scene.onTouchDown(mx, my);
    }

    onTouchMove(mx, my) {
        if (this.__isLoading) {
            return;
        }
        this.__scene.onTouchMove(mx, my);
    }

    onTouchHover(mx, my) {
    }

    isActiveDebug() {
        return this.__activeDebug > 10;
    }

    loadScene() {
        this.__scene = new MainScene();
        this.__scene.onPreload();
    }
}