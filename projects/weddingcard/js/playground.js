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
var endGuideLine;

var debugCount = 0;

function preload() {
    TopicManager.ready().write(RESOURCE.DATA, new ResourceLoader()
        .add(ResourcePath.MainImage, ResourceType.Image)
        .add(ResourcePath.BendImage, ResourceType.Image)
        .add(ResourcePath.SlideShowMaskImage, ResourceType.Image)
        .add(ResourcePath.MapImage, ResourceType.Image)
        .add(ResourcePath.ManFaceImage, ResourceType.Image)
        .add(ResourcePath.WomenFaceImage, ResourceType.Image)
        .add(ResourcePath.DayCounterImage, ResourceType.Image)
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
    this.executeDayCounter();

    old = new Vector2d();
    dragVel = dragMax = 0;
    guideY = 0;
}

function draw() {
    background(255, 255, 245);
    noStroke();

    TimeDeltaUtil.getInstance().update();

    dragVel *= 0.9;
    this.updateWeddingContents(dragVel);

    this.drawBackgroundShape();

    for (var [id, view] of imageViewMap.entries()) {
        if (view.inScreen(winSize[0], winSize[1])) {
            view.draw();
            debugCount++;
        }
    }

    for (var [id, view] of textViewMap.entries()) {
        if (view.inScreen(winSize[0], winSize[1])) {
            view.draw();
            debugCount++;
        }
    }

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
    } else if (guideY < -endGuideLine) {
        vy += (-endGuideLine - guideY) * 0.05;
        guideY += (-endGuideLine - guideY) * 0.05;
    }

    for (var [id, view] of textViewMap.entries()) {
        view.addPos(0, vy);
    }
    for (var [id, view] of imageViewMap.entries()) {
        view.addPos(0, vy);
        if (id == ImageContents.Bend) {
            view.addCropSrcPos(0, vy * 0.05);
        }
        if (id == ImageContents.DayCounter) {
            view.addCropSrcPos(0, vy * 0.2);
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
    var mainImageView = UiFactory.createImageView()
        .setImagePath(ResourcePath.MainImage)
        .setPos(0, 0)
        .setWidth(winSize[0]);
0
    var titleTextView = UiFactory.createTextView()
        .addText("❀ We are getting married ❀")
        .addText("______")
        .setTextGap(15)
        .setAlign(CENTER, null)
        .setColor(160, 110, 110)
        .setTextStyle(BOLD)
        .setSize(22)
        .setPos(0, mainImageView.getHeight() + 60);

    var mainImageTitleTextView = UiFactory.createTextView()
        .addText("현 철   💗   서 영")
        .setAlign(CENTER, null)
        .setColor(160, 110, 110)
        .setTextStyle(BOLD)
        .setSize(20)
        .setPos(0, titleTextView.getPos().y + 90);

    var mainTitleParticle = new Spray(15)
        .setPos(winSize[0] / 2, mainImageTitleTextView.getPos().y)
        .setCreateArea(50, 15)
        .setLife(120)
        .setFreq(0.08)
        .setBlur(true);

    var manFaceImageView = UiFactory.createImageView()
        .setImagePath(ResourcePath.ManFaceImage)
        .setPos(70, mainImageTitleTextView.getPos().y + 45)
        .setScale(0.35)

    var womenFaceImageView = UiFactory.createImageView()
        .setImagePath(ResourcePath.WomenFaceImage)
        .setPos((winSize[0]-115.5)-70, mainImageTitleTextView.getPos().y + 45)
        .setScale(0.35)

    var weddingInfoTextView = UiFactory.createTextView()
        .addText("2020. 04. 11. SAT  2:00 PM")
        .setAlign(CENTER, null)
        .setColor(250, 250, 250)
        .setAlpha(190)
        .setTextStyle(BOLD)
        .setSize(18)
        .setPos(0, mainImageTitleTextView.getPos().y + 260);

    var ddayLabelTextView = UiFactory.createTextView()
        .addText("D - Day")
        .setAlign(CENTER, null)
        .setColor(250, 250, 250)
        .setAlpha(210)
        .setTextStyle(BOLD)
        .setSize(30)
        .setPos(0, weddingInfoTextView.getPos().y + 90);

    var dayCounterTextView = UiFactory.createTextView()
        .addText("00일 00시 00분 00초")
        .setAlign(CENTER, null)
        .setColor(250, 250, 250)
        .setAlpha(230)
        .setTextStyle(BOLD)
        .setSize(35)
        .setPos(0, ddayLabelTextView.getPos().y + 100);

    var dayCounterImageView = UiFactory.createImageView()
        .setImagePath(ResourcePath.DayCounterImage)
        .setPos(0, manFaceImageView.getPos().y + 180)
        .setCropMode(true)
        .setCropSrcPos(((800 - winSize[0]) / 2), 800)
        .setCropSize(winSize[0], 300);

    var invitationTextView = UiFactory.createTextView()
        .addText("❀ Invitation ❀")
        .setAlign(CENTER, null)
        .setColor(160, 110, 110)
        .setTextStyle(BOLD)
        .setSize(22)
        .setPos(0, weddingInfoTextView.getPos().y + 380);

    var invitationLetterTextView = UiFactory.createTextView()
        .addText("행복이 피어나는 따뜻한 봄")
        .addText("저희 두사람 새로운 출발을 하려고 합니다.")
        .addText("서로를 향한 사랑과 믿음을 하나가 되는 자리에")
        .addText("축복으로 함께해주시면 감사하겠습니다.")
        .setTextGap(40)
        .setAlign(CENTER, null)
        .setColor(190, 130, 130)
        .setTextStyle(BOLD)
        .setAlpha(180)
        .setSize(16)
        .setPos(0, invitationTextView.getPos().y + 60);

    var bendImageView = UiFactory.createImageView()
        .setImagePath(ResourcePath.BendImage)
        .setPos(0, invitationLetterTextView.getPos().y + 230)
        .setWidth(winSize[0])
        .setCropMode(true)
        .setCropSrcPos(((1300 - winSize[0]) / 2) - 50, 500)
        .setCropSize(winSize[0], 100);

    var galleryTextView = UiFactory.createTextView()
        .addText("❀ Gallery ❀")
        .setAlign(CENTER, null)
        .setColor(160, 110, 110)
        .setTextStyle(BOLD)
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

    var locationTextView = UiFactory.createTextView()
        .addText("❀ Location ❀")
        .setAlign(CENTER, null)
        .setColor(160, 110, 110)
        .setTextStyle(BOLD)
        .setSize(22)
        .setPos(0, slideShow.getPos().y + slideShow.getHeight() + 120);

    mapView = new MapView(ResourcePath.MapImage)
        .setPos(0, locationTextView.getPos().y + 60)
        .setCropSrcPos(340, 200)
        .setShortcutText("네이버지도 바로가기")
        .setCropSize(winSize[0], 250);

    var locationSubwayInfoTextView = UiFactory.createTextView()
        .addText("  ▶지하철")
        .addText("  광화문역 2번 출구 (5호선) 방향으로 나와 경북궁")
        .addText("  방면으로 직진 후 역사박물관에서 우회전 후, 사거리에서")
        .addText("  좌측 대각선 첫 번째 건물")
        .addText("  경북궁역 6번 출구 (3호선) 방향으로 나와 광화문")
        .addText("  삼거리 건넌 후 광화문 열린시민마당 건너편 건물")
        .setTextGap(30)
        .setAlign(LEFT, null)
        .setColor(190, 130, 130)
        .setTextStyle(BOLD)
        .setAlpha(180)
        .setSize(14)
        .setPos(0, mapView.getPos().y + 340);

    var locationBusInfoTextView = UiFactory.createTextView()
        .addText("  ▶버  스")
        .addText("  간선(파랑) : 103, 109, 150, 171, 272, 401,")
        .addText("      402(심야), 406, 408, 606, 607, 700, 704,")
        .addText("      706, 707, 708")
        .addText("  지선(초록) : 1020, 1711, 7016, 7018, 7022, 7212, 7025")
        .addText("  마을버스 : 종로 09, 종로 11")
        .addText("  ❅ 세종문화회관, KT광화문지사, 경북궁 정류장 하자")
        .addText("     더 케이 트윈타워 LL층")
        .setTextGap(30)
        .setAlign(LEFT, null)
        .setColor(190, 130, 130)
        .setTextStyle(BOLD)
        .setAlpha(180)
        .setSize(14)
        .setPos(0, locationSubwayInfoTextView.getPos().y + 210);

    endGuideLine = locationBusInfoTextView.getPos().y - 200;

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
    imageViewMap.set(ImageContents.ManFaceImage, manFaceImageView);
    imageViewMap.set(ImageContents.WomenFaceImage, womenFaceImageView);
    imageViewMap.set(ImageContents.DayCounter, dayCounterImageView);

    textViewMap = new Map();
    textViewMap.set(TextContents.Title, titleTextView);
    textViewMap.set(TextContents.MainImageTitle, mainImageTitleTextView);
    textViewMap.set(TextContents.WeddingInfo, weddingInfoTextView);
    textViewMap.set(TextContents.DDayLabel, ddayLabelTextView);
    textViewMap.set(TextContents.DayCounter, dayCounterTextView);
    textViewMap.set(TextContents.Invitation, invitationTextView);
    textViewMap.set(TextContents.InvitationLetter, invitationLetterTextView);
    textViewMap.set(TextContents.Gallery, galleryTextView);
    textViewMap.set(TextContents.Location, locationTextView);
    textViewMap.set(TextContents.SubwayInfo, locationSubwayInfoTextView);
    textViewMap.set(TextContents.BusInfo, locationBusInfoTextView);
}

function onLoadedResource(total, count) {
    console.log(total + " : " + count);
}

function executeDayCounter() {
    var dday = new Date("Apr 11,2020,14:00:00").getTime();
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
        textViewMap.get(TextContents.DayCounter).setText(str);
    }, 1000);
}