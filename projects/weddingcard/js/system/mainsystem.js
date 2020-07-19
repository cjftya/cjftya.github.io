class MainSystem extends AbsSystem {
    constructor() {
        super();

        this.__activeDebug = 0;
        this.__isLoading = true;
        this.__scene = null;
        this.__isViewerShow = false;
        this.__viewer = new Viewer(document.getElementById("image"), {
            inline: false,
            button: false,
            navbar: false,
            loop: false,
            slideOnTouch: false,
            toggleOnDblclick: false,
            tooltip: false,
            title: 0,
            toolbar: 0,
            maxZoomRatio: 0.6
        });

    }

    registerSubscribers() {
        return new SubscriberInstaller()
            .add(TOPICS.QUICK_VIEWER, (topic, data) => {
                this.executeViewer(topic, data);
            });
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
        var imgElement = document.getElementById("image");
        imgElement.setAttribute("src", data);
        this.__viewer.show();
    }
}