class MainSystem extends AbsSystem {
    constructor() {
        super();

        this.__activeDebug = 0;
        this.__isLoading = true;
        this.__scene = null;
        this.__isViewerShow = false;
        this.__viewer = new Viewer(document.getElementById("images"), {
            inline: false,
            button: true,
            navbar: true,
            loop: true,
            slideOnTouch: false,
            toggleOnDblclick: true,
            tooltip: false,
            title: 0,
            toolbar: 0,
            maxZoomRatio: 0.9
        });
        this.__delta = 0;
        this.__counter = 0;
        this.__isConfirmFrameRateCheck = false;

    }

    registerSubscribers() {
        return new SubscriberInstaller()
            .add(TOPICS.QUICK_VIEWER, (topic, data) => {
                this.executeViewer(topic, data);
            })
            .add(TOPICS.FRAME_RATE_CHANGE, (topic, data) => {
                this.changedFrameRate(data);
            })
    }

    onPreload() {
        this.loadScene();
    }

    onCreate() {
        super.onCreate();

        var winSize = TopicManager.ready().read(DISPLAY_INFO.WINDOW_SIZE);
        createCanvas(winSize[0], winSize[1]);

        this.__scene.onCreate();
        this.__scene.onStart();

        this.__isLoading = false;

        frameRate(120);
    }

    onOperate() {
        TimeDeltaUtil.getInstance().update();

        this.__delta = TimeDeltaUtil.getInstance().getDelta();

        if (this.__viewer.isShown) {
            return;
        }

        this.__scene.onUpdateWithDraw(this.__delta);

        if (this.isActiveDebug()) {
            this.drawDebug();
        }
        if (!this.__isConfirmFrameRateCheck) {
            this.__counter += this.__delta;
            if (this.__counter >= 3) {
                TopicManager.ready().publish(TOPICS.FRAME_RATE_CHANGE,
                    frameCount >= 300 ? FrameCounter.Fps120 : FrameCounter.Fps60);
                this.__isConfirmFrameRateCheck = true;
            }
        }
    }

    onDestroy() {
        super.onDestroy();
        this.__scene.onDestroy();
    }

    onTouchUp(mx, my) {
        if (this.__isLoading || this.__viewer.isShown) {
            return;
        }
        this.__scene.onTouchUp(mx, my);
    }

    onTouchDown(mx, my) {
        if (this.__isLoading || this.__viewer.isShown) {
            return;
        }

        if (my < 40) {
            this.__activeDebug++;
        }
        this.__scene.onTouchDown(mx, my);
    }

    onTouchMove(mx, my) {
        if (this.__isLoading || this.__viewer.isShown) {
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

    executeViewer(topic, data) {
        console.log(topic + " : " + data);
        this.__viewer.view(data);
        this.__viewer.show();
    }

    changedFrameRate(topic, data) {
        if (data == FrameCounter.Fps120) {
            frameRate(120);
        } else if (data == FrameCounter.Fps60) {
            frameRate(60);
        }
        console.log("Fps : " + (data == FrameCounter.Fps120 ? 120 : 60));
    }

    drawDebug() {
        textSize(20);
        noStroke();
        fill(20);
        textAlign(LEFT, TOP);
        text("FPS : " + Math.floor(TimeDeltaUtil.getInstance().getFPS()), 10, 10);
    }
}