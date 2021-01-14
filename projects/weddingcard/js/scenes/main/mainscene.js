class MainScene extends AbsScene {
    constructor() {
        super();

        this.__objectInitializer = new ObjectInitializer();

        this.__dragControl = null;

        this.__backgroundBlock = null;
        this.__backgroundParticle = null;

        this.__textViewMap = null;
        this.__imageViewMap = null;
        this.__sprayParticleMap = null;

        this.__mapModule = null;
        this.__galleryFrameModule = null;
        this.__dynamicTextFrameModule = null;
        this.__directionsModule = null;
        this.__dayCountModule = null;
        this.__bankAccountModule = null;

        this.__winSize = null;
        this.__click = false;
    }

    onPreload() {
        TopicManager.ready().write(RESOURCE.DATA, new ResourceLoader()
            .add(ResourcePath.UserFont, ResourceType.Font, ThreadType.Main)
            .add(ResourcePath.MainImage, ResourceType.Image, ThreadType.Background)
            .add(ResourcePath.DynamicTextFrameImage, ResourceType.Image, ThreadType.Background)
            .add(ResourcePath.MapImage, ResourceType.Image, ThreadType.Background)
            .add(ResourcePath.RingImage, ResourceType.Image, ThreadType.Background)
            .add(ResourcePath.GalleryMainImage, ResourceType.Image, ThreadType.Background)
            .add(ResourcePath.SlideShow1Image, ResourceType.Image, ThreadType.Background)
            .add(ResourcePath.SlideShow2Image, ResourceType.Image, ThreadType.Background)
            .add(ResourcePath.SlideShow3Image, ResourceType.Image, ThreadType.Background)
            .add(ResourcePath.SlideShow4Image, ResourceType.Image, ThreadType.Background)
            .add(ResourcePath.SlideShow5Image, ResourceType.Image, ThreadType.Background)
            .add(ResourcePath.SlideShow6Image, ResourceType.Image, ThreadType.Background)
            .setListener((path, threadType) => {
                if (threadType == ThreadType.Background) {
                    this.__objectInitializer.reload();
                    // console.log("img : " + path + ", type : " + threadType);
                }
            })
            .load());
    }

    onCreate() {
        this.initializeObject();
    }

    onStart() {
    }

    onUpdateWithDraw(timeDelta) {
        background(255, 255, 245);
        noStroke();

        if (!this.__click) {
            this.__dragControl.update();
            this.updateObjects(this.__dragControl.getDragVel());
        }
        //=================================================

        for (var block of this.__backgroundBlock) {
            block.updateWithDraw();
        }

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

        if (this.__galleryFrameModule.inScreen(this.__winSize[0], this.__winSize[1])) {
            this.__galleryFrameModule.updateWithDraw(timeDelta);
        }

        for (var [id, particle] of this.__sprayParticleMap.entries()) {
            if (particle.inScreen(this.__winSize[0], this.__winSize[1])) {
                particle.updateWithDraw(timeDelta);
            }
        }

        if (this.__dynamicTextFrameModule.inScreen(this.__winSize[0], this.__winSize[1])) {
            this.__dynamicTextFrameModule.updateWithDraw(timeDelta);
        }

        if (this.__dayCountModule.inScreen(this.__winSize[0], this.__winSize[1])) {
            this.__dayCountModule.updateWithDraw(timeDelta);
        }

        if (this.__directionsModule.inScreen(this.__winSize[0], this.__winSize[1])) {
            this.__directionsModule.updateWithDraw(timeDelta);
        }

        if (this.__bankAccountModule.inScreen(this.__winSize[0], this.__winSize[1])) {
            this.__bankAccountModule.updateWithDraw(timeDelta);
        }

        //   this.__backgroundParticle.updateWithDraw(timeDelta);
    }

    onEnd() {
    }

    onDestroy() {
    }

    onTouchDown(tx, ty) {
        this.__click = true;
        this.__dragControl.setDragVel(0);
        this.__dragControl.setOldPos(tx, ty);

        if (this.__mapModule.inBound(tx, ty)) {
            this.__mapModule.setMapController(true);
        }

        this.__bankAccountModule.inBound(tx, ty);
    }

    onTouchUp(tx, ty) {
        this.__click = false;
        if (!this.__mapModule.isMapController()) {
            this.__mapModule.moveToNaverMap(tx, ty);
        }
        this.__mapModule.setMapController(false);
        this.__directionsModule.selectDirectionInfo(tx, ty);
        this.__bankAccountModule.inBound(tx, ty);
    }

    onTouchMove(tx, ty) {
        var dx = tx - this.__dragControl.getOldPos().x;
        var dy = ty - this.__dragControl.getOldPos().y;
        if (this.__mapModule.isMapController()) {
            this.__mapModule.addCropSrcPos(-dx, -dy);
        } else {
            if (Math.abs(dy) > 3) {
                this.__dragControl.addDragVel(dy * 0.2);
            } else {
                this.__dragControl.setDragVel(this.__dragControl.getDragVel() * 0.7);
            }
            this.updateObjects(dy);
        }
        this.__dragControl.setOldPos(tx, ty);
    }

    updateObjects(vy) {
        this.__dragControl.addDragPos(vy);
        if (this.__dragControl.getDragPos() > this.__dragControl.getStartAreaHeigth()) {
            vy += (this.__dragControl.getStartAreaHeigth() - this.__dragControl.getDragPos()) * 0.2;
            this.__dragControl.addDragPos((this.__dragControl.getStartAreaHeigth() - this.__dragControl.getDragPos()) * 0.2);
        } else if (this.__dragControl.getDragPos() < -this.__dragControl.getEndAreaHeight()) {
            vy += (-this.__dragControl.getEndAreaHeight() - this.__dragControl.getDragPos()) * 0.2;
            this.__dragControl.addDragPos((-this.__dragControl.getEndAreaHeight() - this.__dragControl.getDragPos()) * 0.2);
        }

        for (var block of this.__backgroundBlock) {
            block.addPos(0, vy);
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
        this.__galleryFrameModule.addPos(0, vy);
        this.__mapModule.addPos(0, vy);
        this.__dynamicTextFrameModule.addPos(0, vy);
        this.__dynamicTextFrameModule.addCropSrcPos(0, vy * 0.05);
        this.__directionsModule.addPos(0, vy);
        this.__dayCountModule.addPos(0, vy);
        this.__bankAccountModule.addPos(0, vy);
    }

    increaseDrawCall() {
        this.__drawCallCount++;
    }

    executeDayCounter() {
        var dday = new Date("March 6,2021,12:30:00").getTime();
        var counter = this.__dayCountModule;
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
            var count = TextUtil.pad(h, 2) + " : " + TextUtil.pad(m, 2) + " : " + TextUtil.pad(s, 2);
            counter.setDay("D - " + TextUtil.pad(d, 3));
            counter.setCounter(count);
        }, 1000);
    }

    initializeObject() {
        var resource = TopicManager.ready().read(RESOURCE.DATA);
        var userFont = resource.get(ResourcePath.UserFont).getData();
        textFont(userFont);

        this.__winSize = TopicManager.ready().read(DISPLAY_INFO.WINDOW_SIZE);

        this.__dragControl = new DragCOntrol();
        var windX = (MathUtil.randInt(2, 3) * 0.3) * (MathUtil.randInt(1, 20) <= 10 ? -1 : 1);
        this.__backgroundParticle = EffectFactory.createParticle(Particle.Snow)
            .setup(this.__winSize[0], this.__winSize[1], 40)
            .setWind(windX, 0);

        this.__objectInitializer.initializeBaseObject();

        this.__backgroundBlock = this.__objectInitializer.getBackgroundBlock();

        this.__dragControl.setDragAreaHeigthSize(0, this.__objectInitializer.getEndOfScreem());

        this.__galleryFrameModule = this.__objectInitializer.getGalleryFrameModule();
        this.__dynamicTextFrameModule = this.__objectInitializer.getDynamicTextFrameModule();
        this.__mapModule = this.__objectInitializer.getMapModule();
        this.__directionsModule = this.__objectInitializer.getDirectionsModule();
        this.__dayCountModule = this.__objectInitializer.getDayCountModule();
        this.__bankAccountModule = this.__objectInitializer.getBankAccountModule();

        this.__textViewMap = this.__objectInitializer.getTextMap();
        this.__imageViewMap = this.__objectInitializer.getImageMap();
        this.__sprayParticleMap = this.__objectInitializer.getParticleMap();

        this.executeDayCounter();
    }

    drawDebug() {
        textSize(20);
        noStroke();
        fill(20);
        textAlign(LEFT, TOP);
        text("FPS : " + Math.floor(TimeDeltaUtil.getInstance().getFPS()), 10, 10);
    }
}