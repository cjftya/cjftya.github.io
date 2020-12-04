class MainScene extends AbsScene {
    constructor() {
        super();

        this.__objectInitializer = new ObjectInitializer();

        this.__dragControl = null;

        this.__background = null;
        this.__backgroundParticle = null;

        this.__textViewMap = null;
        this.__imageViewMap = null;
        this.__sprayParticleMap = null;

        this.__traceModule = null;
        this.__mapModule = null;
        this.__slideShowModule = null;
        this.__dynamicTextFrameModule = null;

        this.__winSize = null;
    }

    onPreload() {
        TopicManager.ready().write(RESOURCE.DATA, new ResourceLoader()
            .add(ResourcePath.MainImage, ResourceType.Image, ThreadType.Background)
            .add(ResourcePath.DynamicTextFrameImage, ResourceType.Image, ThreadType.Background)
            .add(ResourcePath.SlideShowMaskImage, ResourceType.Image, ThreadType.Background)
            .add(ResourcePath.MapImage, ResourceType.Image, ThreadType.Background)
            .add(ResourcePath.ManFaceImage, ResourceType.Image, ThreadType.Background)
            .add(ResourcePath.ManFaceMaskImage, ResourceType.Image, ThreadType.Background)
            .add(ResourcePath.WomenFaceImage, ResourceType.Image, ThreadType.Background)
            .add(ResourcePath.DayCounterImage, ResourceType.Image, ThreadType.Background)
            .add(ResourcePath.RingMaskImage, ResourceType.Image, ThreadType.Background)
            .add(ResourcePath.SlideShow1Image, ResourceType.Image, ThreadType.Background)
            .add(ResourcePath.SlideShow2Image, ResourceType.Image, ThreadType.Background)
            .add(ResourcePath.SlideShow3Image, ResourceType.Image, ThreadType.Background)
            .add(ResourcePath.SlideShow4Image, ResourceType.Image, ThreadType.Background)
            .add(ResourcePath.SlideShow5Image, ResourceType.Image, ThreadType.Background)
            .add(ResourcePath.SlideShow6Image, ResourceType.Image, ThreadType.Background)
            .setListener((path, threadType) => {
                if (threadType == ThreadType.Background) {
                    this.__objectInitializer.reload();
                    console.log("img : " + path + ", type : " + threadType);
                }
             //   console.log("img : " + path + ", type : " + threadType);
            })
            .load());
    }

    onCreate() {
        this.initializeObject();
    }

    onStart() {
        this.executeDayCountDown();
    }

    onUpdateWithDraw(timeDelta) {
        background(255, 255, 245);
        noStroke();

        this.__dragControl.update();
        this.updateObjects(this.__dragControl.getDragVel());
        //=================================================

        this.__background.draw();

        for (var [id, view] of this.__imageViewMap.entries()) {
            if (view.inScreen(this.__winSize[0], this.__winSize[1])) {
                view.draw();
            }
        }

        for (var [id, view] of this.__textViewMap.entries()) {
            if (view.inScreen(this.__winSize[0], this.__winSize[1])) {
                view.draw();
            }
        }

        if (this.__mapModule.inScreen(this.__winSize[0], this.__winSize[1])) {
            this.__mapModule.draw();
        }

        if (this.__slideShowModule.inScreen(this.__winSize[0], this.__winSize[1])) {
            this.__slideShowModule.updateWithDraw(timeDelta);
        }

        for (var [id, particle] of this.__sprayParticleMap.entries()) {
            if (particle.inScreen(this.__winSize[0], this.__winSize[1])) {
                particle.updateWithDraw(timeDelta);
            }
        }

        if (this.__traceModule.inScreen(this.__winSize[0], this.__winSize[1])) {
            this.__traceModule.updateWithDraw(timeDelta);
        }

        if (this.__dynamicTextFrameModule.inScreen(this.__winSize[0], this.__winSize[1])) {
            this.__dynamicTextFrameModule.updateWithDraw(timeDelta);
        }

        this.__backgroundParticle.updateWithDraw(timeDelta);
    }

    onEnd() {
    }

    onDestroy() {
    }

    onTouchDown(tx, ty) {
        this.__dragControl.setOldPos(tx, ty);
        this.__dragControl.setDragMax(0);

        if (this.__mapModule.inBound(tx, ty)) {
            this.__mapModule.setMapController(true);
        }
    }

    onTouchUp(tx, ty) {
        if (!this.__mapModule.isMapController()) {
            this.__mapModule.moveToNaverMap(tx, ty);
        }
        this.__slideShowModule.selectIndicator(tx, ty);
        if (this.__slideShowModule.inBound(tx, ty)) {
            TopicManager.ready().publish(TOPICS.QUICK_VIEWER, this.__slideShowModule.getCurrentImage());
        }
        this.__mapModule.setMapController(false);
    }

    onTouchMove(tx, ty) {
        var dx = mouseX - this.__dragControl.getOldPos().x;
        var dy = mouseY - this.__dragControl.getOldPos().y;
        if (this.__mapModule.isMapController()) {
            this.__mapModule.addCropSrcPos(-dx, -dy);
        } else {
            this.__dragControl.addDragVel(dy * 0.15);
        }
        this.__dragControl.setOldPos(tx, ty);
    }

    updateObjects(vy) {
        this.__dragControl.addDragPos(vy);
        if (this.__dragControl.getDragPos() > this.__dragControl.getStartAreaHeigth()) {
            vy += (this.__dragControl.getStartAreaHeigth() - this.__dragControl.getDragPos()) * 0.05;
            this.__dragControl.addDragPos((this.__dragControl.getStartAreaHeigth() - this.__dragControl.getDragPos()) * 0.05);
        } else if (this.__dragControl.getDragPos() < -this.__dragControl.getEndAreaHeight()) {
            vy += (-this.__dragControl.getEndAreaHeight() - this.__dragControl.getDragPos()) * 0.05;
            this.__dragControl.addDragPos((-this.__dragControl.getEndAreaHeight() - this.__dragControl.getDragPos()) * 0.05);
        }

        for (var [id, view] of this.__textViewMap.entries()) {
            view.addPos(0, vy);
        }
        for (var [id, view] of this.__imageViewMap.entries()) {
            view.addPos(0, vy);
        }
        for (var [id, view] of this.__sprayParticleMap.entries()) {
            view.addPos(0, vy);
        }
        this.__slideShowModule.addPos(0, vy);
        this.__mapModule.addPos(0, vy);
        this.__traceModule.addPos(0, vy);
        this.__dynamicTextFrameModule.addPos(0, vy);
        this.__dynamicTextFrameModule.addCropSrcPos(0, vy * 0.05);
    }

    increaseDrawCall() {
        this.__drawCallCount++;
    }

    initializeObject() {
        this.__winSize = TopicManager.ready().read(DISPLAY_INFO.WINDOW_SIZE);

        this.__dragControl = new DragCOntrol();
        var windX = (MathUtil.randInt(2, 3) * 0.3) * (MathUtil.randInt(1, 20) <= 10 ? -1 : 1);
        this.__backgroundParticle = EffectFactory.createParticle(Particle.Snow)
            .setup(this.__winSize[0], this.__winSize[1], 40)
            .setWind(windX, 0);

        this.__background = new BgBubble(this.__winSize[0], this.__winSize[1]);

        this.__objectInitializer.initializeBaseObject();

        this.__dragControl.setDragAreaHeigthSize(0, this.__objectInitializer.getEndOfScreem());

        this.__traceModule = this.__objectInitializer.getTraceModule();
        this.__slideShowModule = this.__objectInitializer.getSlideShowModule();
        this.__dynamicTextFrameModule = this.__objectInitializer.getDynamicTextFrameModule();
        this.__mapModule = this.__objectInitializer.getMapModule();

        this.__textViewMap = this.__objectInitializer.getTextMap();
        this.__imageViewMap = this.__objectInitializer.getImageMap();
        this.__sprayParticleMap = this.__objectInitializer.getParticleMap();
    }

    executeDayCountDown() {
        var dday = new Date("March 6,2021,12:30:00").getTime();
        var view = this.__textViewMap.get(TextContents.DayCounter);
        setInterval(function () {
            var now = new Date();
            var distance = dday - now;
            var d = Math.floor(distance / (1000 * 60 * 60 * 24));
            var h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            var m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            var s = Math.floor((distance % (1000 * 60)) / 1000);
            if (s < 10) {
                s = '0' + s;
            }
            var str = TextUtil.pad(d, 2) + "일 " + TextUtil.pad(h, 2) + "시 " +
                TextUtil.pad(m, 2) + "분 " + TextUtil.pad(s, 2) + "초";
            view.setText(str);
        }, 1000);
    }

    drawDebug() {
        textSize(20);
        noStroke();
        fill(20);
        textAlign(LEFT, TOP);
        text("FPS : " + Math.floor(TimeDeltaUtil.getInstance().getFPS()), 10, 10);
    }
}