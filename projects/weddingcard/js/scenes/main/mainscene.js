class MainScene extends AbsScene {
    constructor() {
        super();

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

        //debug only
        this.__drawCallCount = 0;
    }

    onCreate() {
        this.initializeObject();
    }

    onStart() {
        this.executeDayCountDown("April 11,2020,14:00:00");
    }

    onUpdateWithDraw(timeDelta) {
        background(255, 255, 245);
        noStroke();

        this.__dragControl.update();
        this.updateObjects(this.__dragControl.getDragVel());
        //=================================================

        this.__background.draw();
        this.increaseDrawCall();

        for (var [id, view] of this.__imageViewMap.entries()) {
            if (view.inScreen(this.__winSize[0], this.__winSize[1])) {
                view.draw();
                this.increaseDrawCall();
            }
        }

        for (var [id, view] of this.__textViewMap.entries()) {
            if (view.inScreen(this.__winSize[0], this.__winSize[1])) {
                view.draw();
                this.increaseDrawCall();
            }
        }

        if (this.__mapModule.inScreen(this.__winSize[0], this.__winSize[1])) {
            this.__mapModule.draw();
            this.increaseDrawCall();
        }

        if (this.__slideShowModule.inScreen(this.__winSize[0], this.__winSize[1])) {
            this.__slideShowModule.updateWithDraw(timeDelta);
            this.increaseDrawCall();
        }

        for (var [id, particle] of this.__sprayParticleMap.entries()) {
            if (particle.inScreen(this.__winSize[0], this.__winSize[1])) {
                particle.updateWithDraw(timeDelta);
                this.increaseDrawCall();
            }
        }

        if (this.__traceModule.inScreen(this.__winSize[0], this.__winSize[1])) {
            this.__traceModule.updateWithDraw(timeDelta);
            this.increaseDrawCall();
        }

        if (this.__dynamicTextFrameModule.inScreen(this.__winSize[0], this.__winSize[1])) {
            this.__dynamicTextFrameModule.updateWithDraw(timeDelta);
            this.increaseDrawCall();
        }

        this.__backgroundParticle.updateWithDraw(timeDelta);
        this.increaseDrawCall();
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
        this.__mapModule.setMapController(false);
    }

    onTouchMove(tx, ty) {
        var dx = mouseX - this.__dragControl.getOldPos().x;
        var dy = mouseY - this.__dragControl.getOldPos().y;
        if (this.__mapModule.isMapController()) {
            this.__mapModule.addCropSrcPos(-dx, -dy);
        } else {
            var absDy = dy < 0 ? -dy : dy;
            if (this.__dragControl.getDragMax() < absDy) {
                this.__dragControl.setDragMax(absDy);
                this.__dragControl.setDragVel(dy * 0.6);
            }
            this.updateObjects(dy * 0.6);
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
            if (id == ImageContents.DayCounter) {
                view.addCropSrcPos(0, vy * 0.2);
            }
        }
        for (var [id, view] of this.__sprayParticleMap.entries()) {
            view.addPos(0, vy);
        }
        this.__slideShowModule.addPos(0, vy);
        this.__mapModule.addPos(0, vy);
        this.__traceModule.addPos(0, vy);
        this.__dynamicTextFrameModule.addPos(0, vy);
        this.__dynamicTextFrameModule.addCropSrcPos(0, vy * 0.1);
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

        var objIntializer = new ObjectInitializer();
        objIntializer.initializeBaseObject();

        this.__dragControl.setDragAreaHeigthSize(0, objIntializer.getEndOfScreem());

        this.__traceModule = objIntializer.getTraceModule();
        this.__slideShowModule = objIntializer.getSlideShowModule();
        this.__dynamicTextFrameModule = objIntializer.getDynamicTextFrameModule();
        this.__mapModule = objIntializer.getMapModule();

        this.__textViewMap = objIntializer.getTextMap();
        this.__imageViewMap = objIntializer.getImageMap();
        this.__sprayParticleMap = objIntializer.getParticleMap();
    }

    executeDayCountDown(objectDay) {
        var dday = new Date(objectDay).getTime();
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
            console.log("098")
            var str = TextUtil.pad(d, 2) + "일 " + TextUtil.pad(h, 2) + "시 " +
                TextUtil.pad(m, 2) + "분 " + TextUtil.pad(s, 2) + "초";
            this.__textViewMap.get(TextContents.DayCounter).setText(str);
        }, 1000);
    }

    drawDebug() {
        textSize(20);
        noStroke();
        fill(20);
        textAlign(LEFT, TOP);
        text("FPS : " + Math.floor(TimeDeltaUtil.getInstance().getFPS()) + ", draw call : " + debugCount, 10, 10);

        this.__drawCallCount = 0;
    }
}