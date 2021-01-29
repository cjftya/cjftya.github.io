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

    }

    registerSubscribers() {
        return new SubscriberInstaller()
            .add(TOPICS.QUICK_VIEWER, (topic, data) => {
                this.executeViewer(topic, data);
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
    }

    onOperate() {
        TimeDeltaUtil.getInstance().update();

        if(this.__viewer.isShown){
            return;
        }

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
}