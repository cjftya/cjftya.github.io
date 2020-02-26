var snowPaticle;
var bubleColor;
var bubleArr;

var textViewMap;
var imageViewMap;

var lineTraceMap;

var sprayParticleMap;

var mapView;
var imageViewer;
var slideShow;

var rectpos1;

var old;
var oldDist;
var dragVel, dragMax;

var winSize;

var guideY;

var debugCount = 0;

function preload() {
    TopicManager.ready().write(RESOURCE.DATA, new ResourceLoader()
        .add(ResourcePath.MainImage, ResourceType.Image)
        .add(ResourcePath.BendImage, ResourceType.Image)
        .add(ResourcePath.SlideShowMaskImage, ResourceType.Image)
        .add(ResourcePath.MapImage, ResourceType.Image)
        .add(ResourcePath.SlideShow1Image, ResourceType.Image)
        .add(ResourcePath.SlideShow2Image, ResourceType.Image)
        .add(ResourcePath.SlideShow3Image, ResourceType.Image)
        .add(ResourcePath.SlideShow4Image, ResourceType.Image)
        .add(ResourcePath.SlideShow5Image, ResourceType.Image)
        .add(ResourcePath.RealRatio1Image, ResourceType.Image)
        .add(ResourcePath.RealRatio2Image, ResourceType.Image)
        .add(ResourcePath.RealRatio3Image, ResourceType.Image)
        .add(ResourcePath.RealRatio4Image, ResourceType.Image)
        .add(ResourcePath.RealRatio5Image, ResourceType.Image)
        .setListener(this.onLoadedResource)
        .load());
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    TopicManager.ready().write(DISPLAY_INFO.WINDOW_SIZE, [windowWidth, windowHeight]);

    this.initialize();

    old = new Vector2d();
    dragVel = dragMax = 0;
    guideY = 0;

    console.log("wedding card");
}

function draw() {
    background(255, 255, 245);
    noStroke();

    TimeDeltaUtil.getInstance().update();

    dragVel *= 0.9;
    this.updateWeddingContents(dragVel);

    this.drawBackgroundShape();

    for (var [id, view] of textViewMap.entries()) {
        if (view.inScreen(winSize[0], winSize[1])) {
            view.draw();
            debugCount++;
        }
    }

    for (var [id, view] of imageViewMap.entries()) {
        if (view.inScreen(winSize[0], winSize[1])) {
            view.draw();
            debugCount++;
        }
    }

    fill(100, 50);
    rect(rectpos1.x, rectpos1.y, windowWidth, 100);
    debugCount++;

    if (mapView.inScreen(winSize[0], winSize[1])) {
        mapView.draw();
        debugCount++;
    }

    if (slideShow.inScreen(winSize[0], winSize[1])) {
        slideShow.update(TimeDeltaUtil.getInstance().getDelta());
        slideShow.draw();
        debugCount++;

        imageViewer.update(TimeDeltaUtil.getInstance().getDelta());
        imageViewer.draw();
        debugCount++;
    } else {
        imageViewer.hide();
    }

    if (!imageViewer.isShowing()) {
        for (var [id, trace] of lineTraceMap.entries()) {
            trace.update(TimeDeltaUtil.getInstance().getDelta());
        }
        for (var [id, particle] of sprayParticleMap.entries()) {
            if (id != ParticleContents.MainTitle) {
                var trace = lineTraceMap.get(id);
                particle.setPos(trace.getTraceX(), trace.getTraceY());
            }
            if (particle.inScreen(winSize[0], winSize[1])) {
                particle.update(TimeDeltaUtil.getInstance().getDelta());
                particle.draw();
                debugCount++;
            }
        }
    }

    // background effect
    snowPaticle.update(TimeDeltaUtil.getInstance().getDelta());
    snowPaticle.draw();
    debugCount++;

    debugCount++;
    this.drawFpsCount();

    debugCount = 0;
}

function drawBackgroundShape() {
    fill(bubleColor);
    for (var b of bubleArr) {
        debugCount++;
        ellipse(b.x, b.y, b.r, b.r);
    }
}

function updateWeddingContents(vy) {
    guideY += vy;
    if (guideY > 0) {
        vy += (0 - guideY) * 0.05;
        guideY += (0 - guideY) * 0.05;
    } else if (guideY < -mapView.getGuideEnd()) {
        vy += (-mapView.getGuideEnd() - guideY) * 0.05;
        guideY += (-mapView.getGuideEnd() - guideY) * 0.05;
    }

    for (var [id, view] of textViewMap.entries()) {
        view.addPos(0, vy);
    }
    for (var [id, view] of imageViewMap.entries()) {
        view.addPos(0, vy);
        if (id == ImageContents.Bend) {
            view.addCropSrcPos(0, vy * 0.1);
        }
    }
    for (var [id, view] of sprayParticleMap.entries()) {
        view.addPos(0, vy);
    }
    for (var [id, trace] of lineTraceMap.entries()) {
        trace.addPos(0, vy);
    }
    slideShow.addPos(0, vy);
    mapView.addPos(0, vy);
    rectpos1.y += vy;
}

function drawFpsCount() {
    textSize(20);
    noStroke();
    fill(20);
    textAlign(LEFT, TOP);
    text("FPS : " + Math.floor(TimeDeltaUtil.getInstance().getFPS()) + ", draw call : " + debugCount, 10, 10);
}

function getTouchPointDist() {
    if (touches.length >= 2) {
        var dx = touches[1].x - touches[0].x;
        var dy = touches[1].y - touches[0].y;
        return dx * dx + dy * dy;
    }
    return 0;
}

function mousePressed() {
    old.set(mouseX, mouseY);
    dragMax = 0;
    oldDist = this.getTouchPointDist();

    if (mapView.inBound(mouseX, mouseY)) {
        mapView.setMapController(true);
    }
}

function mouseReleased() {
    if (!imageViewer.isShowing() && slideShow.inBound(mouseX, mouseY) && !imageViewer.isInputDelay()) {
        imageViewer.setIndex(slideShow.getCurrentIndex());
        imageViewer.setScaleLimit(-1, 0.8)
        imageViewer.show();
        slideShow.pause();
    }
    if (imageViewer.isShowing() && !imageViewer.inBound(mouseX, mouseY) && !imageViewer.isInputDelay()) {
        imageViewer.hide();
        slideShow.resume();
    }
    if (!imageViewer.isShowing() && !imageViewer.isInputDelay()) {
        mapView.moveToNaverMap(mouseX, mouseY);
    }
    mapView.setMapController(false);
}

function mouseDragged() {
    var vx = mouseX - old.x;
    var vy = mouseY - old.y;
    if (imageViewer.isShowing()) {
        if (touches.length < 2) {
            imageViewer.addPos(vx, vy);
        } else {
            var newDist = this.getTouchPointDist();
            var vz = newDist - oldDist;
            imageViewer.addScale(vz * 0.00001);
            oldDist = newDist;
        }
    } else {
        if (mapView.isMapController()) {
            mapView.addCropSrcPos(-vx, -vy);
        } else {
            var absVy = vy < 0 ? -vy : vy;
            if (dragMax < absVy) {
                dragMax = absVy;
                dragVel = vy * 0.6;
            }
            this.updateWeddingContents(vy);
        }
    }
    old.set(mouseX, mouseY);
}

// function mouseMoved() {
// }

// function keyPressed() {
//     if (keyCode == LEFT_ARROW) {
//         imageViewer.addScale(-0.01);
//     } else if (keyCode == RIGHT_ARROW) {
//         imageViewer.addScale(0.01);
//     }
// }

function windowResized() {
    winSize = [windowWidth, windowHeight];
    TopicManager.ready().write(DISPLAY_INFO.WINDOW_SIZE, winSize);
    resizeCanvas(windowWidth, windowHeight);
}

function initialize() {
    var isMobile = /Android|webOS|iPhone|iPad|iPod|Opera Mini/i.test(navigator.userAgent);
    TopicManager.ready().write(DEVICE_INFO.IS_MOBILE, isMobile);

    winSize = TopicManager.ready().read(DISPLAY_INFO.WINDOW_SIZE);

    var windX = (MathUtil.randInt(2, 3) * 0.3) * (MathUtil.randInt(1, 20) <= 10 ? -1 : 1);
    snowPaticle = EffectFactory.createParticle(Particle.Snow)
        .setup(winSize[0], winSize[1], 40)
        .setWind(windX, 0);

    var x, y, r;
    bubleArr = [];
    bubleColor = color(250, 190, 190);
    bubleColor.setAlpha(8);
    for (var i = 0; i < 8; i++) {
        x = MathUtil.randInt(50, winSize[0] - 50);
        y = MathUtil.randInt(50, winSize[1] - 50);
        r = MathUtil.randInt(250, 800);
        bubleArr.push({ x, y, r });
    }
    this.initializeWeddingContents();
}

function initializeWeddingContents() {
    var titleTextView = UiFactory.createTextView()
        .addText("우 리 결 혼 합 니 다")
        .setAlign(CENTER, null)
        .setColor(120, 80, 80)
        .setSize(22)
        .setPos(0, 80);

    var mainImageView = UiFactory.createImageView()
        .setImagePath(ResourcePath.MainImage)
        .setPos(45, titleTextView.getPos().y + 60)
        .setWidth(winSize[0] - 90);

    var mainImageTitleTextView = UiFactory.createTextView()
        .addText("가나다 ღ 마바사")
        .setAlign(CENTER, null)
        .setColor(120, 80, 80)
        .setSize(17)
        .setPos(0, mainImageView.getHeight() + 170);

    var parentsATextView = UiFactory.createTextView()
        .addText("아버지 가나다")
        .addText("아버지 마바사")
        .setTextGap(35)
        .setAlign(LEFT, null)
        .setColor(120, 100, 100)
        .setAlpha(180)
        .setSize(15)
        .setPos(50, mainImageTitleTextView.getPos().y + 50);

    var parentsBTextView = UiFactory.createTextView()
        .addText("어머니 가나다")
        .addText("어머니 마바사")
        .setTextGap(35)
        .setAlign(RIGHT, null)
        .setColor(120, 100, 100)
        .setAlpha(180)
        .setSize(15)
        .setPos(-50, mainImageTitleTextView.getPos().y + 50);

    var mainTitleParticle = new Spray(15)
        .setPos(winSize[0] / 2, mainImageView.getHeight() + 170)
        .setCreateArea(50, 15)
        .setLife(120)
        .setFreq(0.08)
        .setBlur(true);

    //2020. 04. 11. SAT  2:00 PM
    //더 케이트원타원 A동 LL층 | 아펠가모 웨딩홀
    var weddingInfoTextView = UiFactory.createTextView()
        .addText("AAAAAAAAAAAAAAAAAAAAAAAAAAAA")
        .addText("VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV")
        .setTextGap(30)
        .setAlign(CENTER, null)
        .setColor(120, 100, 100)
        .setSize(15)
        .setPos(0, mainImageTitleTextView.getPos().y + 200);

    rectpos1 = new Vector2d().set(0, weddingInfoTextView.getPos().y - 30);

    var invitationTextView = UiFactory.createTextView()
        .addText("Invitation")
        .setAlign(CENTER, null)
        .setColor(120, 80, 80)
        .setSize(22)
        .setPos(0, weddingInfoTextView.getPos().y + 120);

    var invitationLetterTextView = UiFactory.createTextView()
        .addText("너무나 사랑스럽고 지켜주고싶은 사람을 만났습니다.")
        .addText("변치않는 마음과 믿음으로 하나가 되어 행복하게 살겠습니다.")
        .addText("믿은과 사랑을 약속하는 귀한 날에 축복의 걸음을 하시어")
        .addText("지켜봐주신다면 더없는 기쁨으로 담아두겠습니다.")
        .setTextGap(45)
        .setAlign(CENTER, null)
        .setColor(120, 100, 100)
        .setAlpha(180)
        .setSize(13)
        .setPos(0, invitationTextView.getPos().y + 60);

    var bendImageView = UiFactory.createImageView()
        .setImagePath(ResourcePath.BendImage)
        .setPos(0, invitationLetterTextView.getPos().y + 230)
        .setWidth(winSize[0])
        .setCropMode(true)
        .setCropSrcPos(200, 450)
        .setCropSize(winSize[0], 100);

    var galleryTextView = UiFactory.createTextView()
        .addText("Gallery")
        .setAlign(CENTER, null)
        .setColor(120, 80, 80)
        .setSize(22)
        .setPos(0, bendImageView.getPos().y + 200);

    slideShow = new SlideShow()
        .addImagePath(ResourcePath.SlideShow1Image)
        .addImagePath(ResourcePath.SlideShow2Image)
        .addImagePath(ResourcePath.SlideShow3Image)
        .addImagePath(ResourcePath.SlideShow4Image)
        .addImagePath(ResourcePath.SlideShow5Image)
        .setMask(ResourcePath.SlideShowMaskImage)
        .setWidth(winSize[0])
        .setDelay(5)
        .setPos(0, galleryTextView.getPos().y + 50);

    imageViewer = new ImageViewer()
        .addImagePath(ResourcePath.RealRatio1Image)
        .addImagePath(ResourcePath.RealRatio2Image)
        .addImagePath(ResourcePath.RealRatio3Image)
        .addImagePath(ResourcePath.RealRatio4Image)
        .addImagePath(ResourcePath.RealRatio5Image)
        .setPos(winSize[0] / 2, winSize[1] / 2);


    var p1 = MathUtil.randInt(0, 29);
    var p2, p3;
    if (p1 + 10 > 29) {
        p2 = (p1 + 10) - 29;
    } else {
        p2 = p1 + 10;
    }
    if (p2 + 10 > 29) {
        p3 = (p2 + 10) - 29;
    } else {
        p3 = p2 + 10;
    }

    var lineTrace1 = new LineTrace();
    var oneSlice = (Math.PI * 2) / 30;
    for (var i = 0; i < 30; i++) {
        var xp = Math.cos(oneSlice * i) * (winSize[0] / 3.0);
        var yp = Math.sin(oneSlice * i) * (winSize[0] / 3.0);
        lineTrace1.addPoint(xp + winSize[0] / 2, yp + slideShow.getPos().y + slideShow.getHeight() / 2);
    }
    lineTrace1.start(p1, 1);

    var lineTrace2 = new LineTrace();
    var oneSlice = Math.PI * 2 / 30;
    for (var i = 0; i < 30; i++) {
        var xp = Math.cos(oneSlice * i) * (winSize[0] / 3.0);
        var yp = Math.sin(oneSlice * i) * (winSize[0] / 3.0);
        lineTrace2.addPoint(xp + winSize[0] / 2, yp + slideShow.getPos().y + slideShow.getHeight() / 2);
    }
    lineTrace2.start(p2, 1);

    var lineTrace3 = new LineTrace();
    var oneSlice = Math.PI * 2 / 30;
    for (var i = 0; i < 30; i++) {
        var xp = Math.cos(oneSlice * i) * (winSize[0] / 3.0);
        var yp = Math.sin(oneSlice * i) * (winSize[0] / 3.0);
        lineTrace3.addPoint(xp + winSize[0] / 2, yp + slideShow.getPos().y + slideShow.getHeight() / 2);
    }
    lineTrace3.start(p3, 1);

    var slideShowParticle1 = new Spray(20)
        .setPos(1000, 1000)
        .setCreateArea(10, 10)
        .setLife(160)
        .setFreq(0.06)
        .setBlur(true);

    var slideShowParticle2 = new Spray(20)
        .setPos(1000, 1000)
        .setCreateArea(10, 10)
        .setLife(160)
        .setFreq(0.06)
        .setBlur(true);

    var slideShowParticle3 = new Spray(20)
        .setPos(1000, 1000)
        .setCreateArea(10, 10)
        .setLife(160)
        .setFreq(0.06)
        .setBlur(true);

    var locationTextView = new TextView("Location")
        .setAlign(CENTER, null)
        .setColor(120, 80, 80)
        .setSize(22)
        .setPos(0, slideShow.getPos().y + slideShow.getHeight() + 120);

    mapView = new MapView(ResourcePath.MapImage)
        .setPos(0, locationTextView.getPos().y + 60)
        .setCropSrcPos(340, 200)
        .setShortcutText("네이버지도 바로가기")
        .setCropSize(winSize[0], 250);

    lineTraceMap = new Map();
    lineTraceMap.set(ParticleContents.SlideShow1, lineTrace1);
    lineTraceMap.set(ParticleContents.SlideShow2, lineTrace2);
    lineTraceMap.set(ParticleContents.SlideShow3, lineTrace3);

    sprayParticleMap = new Map();
    sprayParticleMap.set(ParticleContents.MainTitle, mainTitleParticle);
    sprayParticleMap.set(ParticleContents.SlideShow1, slideShowParticle1);
    sprayParticleMap.set(ParticleContents.SlideShow2, slideShowParticle2);
    sprayParticleMap.set(ParticleContents.SlideShow3, slideShowParticle3);

    imageViewMap = new Map();
    imageViewMap.set(ImageContents.Main, mainImageView);
    imageViewMap.set(ImageContents.Bend, bendImageView);

    textViewMap = new Map();
    textViewMap.set(TextContents.Title, titleTextView);
    textViewMap.set(TextContents.MainImageTitle, mainImageTitleTextView);
    textViewMap.set(TextContents.ParentsA, parentsATextView);
    textViewMap.set(TextContents.ParentsB, parentsBTextView);
    textViewMap.set(TextContents.WeddingInfo, weddingInfoTextView);
    textViewMap.set(TextContents.Invitation, invitationTextView);
    textViewMap.set(TextContents.InvitationLetter, invitationLetterTextView);
    textViewMap.set(TextContents.Gallery, galleryTextView);
    textViewMap.set(TextContents.Location, locationTextView);
}

function onLoadedResource(total, count) {
    console.log(total + " : " + count);
}
