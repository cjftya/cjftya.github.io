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
        this.loadResource();
    }

    onCreate() {
        super.onCreate();
        createCanvas(windowWidth, windowHeight);

        this.loadScene();

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
        this.__scene.onCreate();
        this.__scene.onStart();
    }

    loadResource() {
        TopicManager.ready().write(RESOURCE.DATA, new ResourceLoader()
            .add(ResourcePath.MainImage, ResourceType.Image)
            .add(ResourcePath.DynamicTextFrameImage, ResourceType.Image)
            .add(ResourcePath.SlideShowMaskImage, ResourceType.Image)
            .add(ResourcePath.MapImage, ResourceType.Image)
            .add(ResourcePath.ManFaceImage, ResourceType.Image)
            .add(ResourcePath.ManFaceMaskImage, ResourceType.Image)
            .add(ResourcePath.WomenFaceImage, ResourceType.Image)
            .add(ResourcePath.DayCounterImage, ResourceType.Image)
            .add(ResourcePath.SlideShow1Image, ResourceType.Image)
            .add(ResourcePath.SlideShow2Image, ResourceType.Image)
            .add(ResourcePath.SlideShow3Image, ResourceType.Image)
            .add(ResourcePath.SlideShow4Image, ResourceType.Image)
            .add(ResourcePath.SlideShow5Image, ResourceType.Image)
            .add(ResourcePath.SlideShow6Image, ResourceType.Image)
            .setListener((count, path) => {
                console.log("Load counter [ count : " + count + ", path : " + path + " ]");
            })
            .setCompletedListener((total, loadTime) => {
                console.log("Resouce load complete [ total : " + total + ", load time (sec) : " + loadTime + " ]");
            })
            .load());
    }
}