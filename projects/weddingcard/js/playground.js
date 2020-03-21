var backgroundDrawable;

var textViewMap;
var imageViewMap;
var sprayParticleMap;

var snowPaticle;
var heartTrace;
var mapView;
var slideShow;

var dragControl;

var winSize;
var isLoading;
var deltaTime;

var activeDebugCount = 0;
var debugCount = 0;

function preload() {
    isLoading = true;
    TopicManager.ready().write(RESOURCE.DATA, new ResourceLoader()
        .add(ResourcePath.MainImage, ResourceType.Image)
        .add(ResourcePath.BendImage, ResourceType.Image)
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

function setup() {
    var t0 = performance.now();

    createCanvas(windowWidth, windowHeight);
    TopicManager.ready().write(DISPLAY_INFO.WINDOW_SIZE, [windowWidth, windowHeight]);

    this.initialize();
    this.executeDayCounter();

    isLoading = false;

    var t1 = performance.now();
    console.log("Initialize complete (sec) : " + (t1 - t0) / 1000);
}

function draw() {
    background(255, 255, 245);
    noStroke();

    TimeDeltaUtil.getInstance().update();
    deltaTime = TimeDeltaUtil.getInstance().getDelta();
    //=================================================

    dragControl.update();
    this.updateWeddingContents(dragControl.getDragVel());
    //=================================================

    backgroundDrawable.draw();
    debugCount++;

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
        slideShow.updateWithDraw(deltaTime);
        debugCount++;
    }

    for (var [id, particle] of sprayParticleMap.entries()) {
        if (particle.inScreen(winSize[0], winSize[1])) {
            particle.updateWithDraw(deltaTime);
            debugCount++;
        }
    }

    if(heartTrace.inScreen(winSize[0], winSize[1])) {
        heartTrace.updateWithDraw();
        debugCount++;
    }

    snowPaticle.updateWithDraw(deltaTime);
    debugCount++;

    debugCount++;
    if (activeDebugCount > 10) {
        this.drawFpsCount();
    }
    debugCount = 0;
}

function drawFpsCount() {
    textSize(20);
    noStroke();
    fill(20);
    textAlign(LEFT, TOP);
    text("FPS : " + Math.floor(TimeDeltaUtil.getInstance().getFPS()) + ", draw call : " + debugCount, 10, 10);
}

function updateWeddingContents(vy) {
    dragControl.addDragPos(vy);
    if (dragControl.getDragPos() > dragControl.getStartAreaHeigth()) {
        vy += (dragControl.getStartAreaHeigth() - dragControl.getDragPos()) * 0.05;
        dragControl.addDragPos((dragControl.getStartAreaHeigth() - dragControl.getDragPos()) * 0.05);
    } else if (dragControl.getDragPos() < -dragControl.getEndAreaHeight()) {
        vy += (-dragControl.getEndAreaHeight() - dragControl.getDragPos()) * 0.05;
        dragControl.addDragPos((-dragControl.getEndAreaHeight() - dragControl.getDragPos()) * 0.05);
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
    slideShow.addPos(0, vy);
    mapView.addPos(0, vy);
    heartTrace.addPos(0, vy);
}

function mousePressed() {
    if (isLoading) {
        return;
    }

    dragControl.setOldPos(mouseX, mouseY);
    dragControl.setDragMax(0);

    if (mapView.inBound(mouseX, mouseY)) {
        mapView.setMapController(true);
    }

    // debug code
    if (mouseY < 40) {
        activeDebugCount++;
    }
}

function mouseReleased() {
    if (isLoading) {
        return;
    }

    if (!mapView.isMapController()) {
        mapView.moveToNaverMap(mouseX, mouseY);
    }
    slideShow.selectIndicator(mouseX, mouseY);
    mapView.setMapController(false);
}

function mouseDragged() {
    if (isLoading) {
        return;
    }

    var dx = mouseX - dragControl.getOldPos().x;
    var dy = mouseY - dragControl.getOldPos().y;
    if (mapView.isMapController()) {
        mapView.addCropSrcPos(-dx, -dy);
    } else {
        var absDy = dy < 0 ? -dy : dy;
        if (dragControl.getDragMax() < absDy) {
            dragControl.setDragMax(absDy);
            dragControl.setDragVel(dy * 0.6);
        }
        this.updateWeddingContents(dy * 0.6);
    }
    dragControl.setOldPos(mouseX, mouseY);
}

// function keyPressed() {
//     if (keyCode == LEFT_ARROW) {
//     }
//     else if (keyCode == RIGHT_ARROW) {
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

    dragControl = new DragCOntrol();

    backgroundDrawable = new BgBubble(winSize[0], winSize[1]);

    this.initializeWeddingContents();
}

function initializeWeddingContents() {
    var mainImageView = UiFactory.createImageView()
        .setImagePath(ResourcePath.MainImage)
        .setPos(0, 0)
        .setWidth(winSize[0], true);

    var titleTextView = UiFactory.createTextView()
        .addText("♡ · · ·  W e d d i n g  · · · ♡")
        .setAlign(CENTER, null)
        .setColor(160, 110, 110)
        .setTextStyle(BOLD)
        .setSize(20)
        .setPos(0, mainImageView.getHeight() + 60);

        //현 철   ღ   서 영
    var mainImageTitleTextView = UiFactory.createTextView()
        .addText("가 나   ღ   다 라")
        .setAlign(CENTER, null)
        .setColor(160, 110, 110)
        .setTextStyle(BOLD)
        .setSize(18)
        .setPos(0, titleTextView.getPos().y + 100);

    var mainTitleParticle = EffectFactory.createParticle(Particle.Spray)
        .setRadius(1, 5)
        .setBlurRadiusPow(3, 5)
        .setAmount(15)
        .setPos(winSize[0] / 2, mainImageTitleTextView.getPos().y)
        .setCreateArea(50, 15)
        .setLife(120)
        .setFreq(0.08);

    var manFaceImageView = UiFactory.createImageView()
        .setImagePath(ResourcePath.ManFaceImage)
        .setImageMode(CENTER)
        .setMaskPath(ResourcePath.ManFaceMaskImage)
        .setPos(winSize[0] / 2 - (winSize[0] / 5),
            mainImageTitleTextView.getPos().y + (winSize[0] / 5) + 20)
        .setWidth(winSize[0] / 2.8, true)

    var womenFaceImageView = UiFactory.createImageView()
        .setImagePath(ResourcePath.WomenFaceImage)
        .setImageMode(CENTER)
        .setMaskPath(ResourcePath.ManFaceMaskImage)
        .setPos(winSize[0] / 2 + (winSize[0] / 5),
            mainImageTitleTextView.getPos().y + + (winSize[0] / 5) + 20)
        .setWidth(winSize[0] / 2.8, true)

        //2020년 04월 11일 토요일 오후 2시
    var weddingInfoTextView = UiFactory.createTextView()
        .addText("7777년 77월 77일 7요일 오후 7시")
        .setAlign(CENTER, null)
        .setColor(250, 250, 250)
        .setAlpha(190)
        .setTextStyle(BOLD)
        .setSize(18)
        .setPos(0, womenFaceImageView.getPos().y + 180);

    var ddayLabelTextView = UiFactory.createTextView()
        .addText("D - Day")
        .setAlign(CENTER, null)
        .setColor(250, 250, 250)
        .setAlpha(210)
        .setTextStyle(BOLD)
        .setSize(40)
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
        .setPos(0, manFaceImageView.getPos().y + 140)
        .setEnableCrop(true)
        .setCropSrcPos(((800 - winSize[0]) / 2), 800)
        .setCropSize(winSize[0], 300);

    var invitationTextView = UiFactory.createTextView()
        .addText("♡ · · ·  I n v i t a t i on  · · · ♡")
        .setAlign(CENTER, null)
        .setColor(160, 110, 110)
        .setTextStyle(BOLD)
        .setSize(20)
        .setPos(0, weddingInfoTextView.getPos().y + 380);

    var invitationLetterTextView = UiFactory.createTextView()
        .addText("·  ·  ·  ·  ·  ·  ·  ·  ·  ·")
        .addText("·  ·  행복이 피어나는 따뜻한 봄  ·  ·")
        .addText("·  저희 두사람 새로운 출발을 하려고 합니다  ·")
        .addText("·  서로를 향한 사랑과 믿음을 하나가 되는 자리에  ·")
        .addText("·  축복으로 함께해주시면 감사하겠습니다  ·")
        .addText("·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·")
        .setTextGap(40)
        .setAlign(CENTER, null)
        .setColor(190, 130, 130)
        .setTextStyle(BOLD)
        .setAlpha(180)
        .setSize(15)
        .setPos(0, invitationTextView.getPos().y + 80);

    var bendImageView = UiFactory.createImageView()
        .setImagePath(ResourcePath.BendImage)
        .setPos(0, invitationLetterTextView.getPos().y + 320)
        .setWidth(winSize[0], true)
        .setEnableCrop(true)
        .setCropSrcPos(((1300 - winSize[0]) / 2) - 50, 500)
        .setCropSize(winSize[0], 100);

    var bendTextView = UiFactory.createTextView()
        .addText("“ 언제나 그대곁에 · · · ”")
        .setAlign(CENTER, null)
        .setColor(240, 240, 240)
        .setAlpha(190)
        .setSize(20)
        .setPos(0, bendImageView.getPos().y + 40);

    var galleryTextView = UiFactory.createTextView()
        .addText("♡ · · ·  G a l l e r y  · · · ♡")
        .setAlign(CENTER, null)
        .setColor(160, 110, 110)
        .setTextStyle(BOLD)
        .setSize(20)
        .setPos(0, bendImageView.getPos().y + 210);

    slideShow = new SlideShow()
        .addImagePath(ResourcePath.SlideShow1Image)
        .addImagePath(ResourcePath.SlideShow2Image)
        .addImagePath(ResourcePath.SlideShow3Image)
        .addImagePath(ResourcePath.SlideShow4Image)
        .addImagePath(ResourcePath.SlideShow5Image)
        .addImagePath(ResourcePath.SlideShow6Image)
        .setMask(ResourcePath.SlideShowMaskImage)
        .setWidth(winSize[0])
        .setDelay(5)
        .setPos(0, galleryTextView.getPos().y + 50);

    heartTrace = new HeartTrace()
        .setHeartSize(slideShow.getWidth(), slideShow.getHeight())
        .setPos(slideShow.getPos().x + slideShow.getWidth() / 2,
            slideShow.getPos().y + slideShow.getHeight() / 2)
        .setMovePointCount(1);

    var locationTextView = UiFactory.createTextView()
        .addText("♡ · · ·  L o c a t i o n  · · · ♡")
        .setAlign(CENTER, null)
        .setColor(160, 110, 110)
        .setTextStyle(BOLD)
        .setSize(20)
        .setPos(0, slideShow.getPos().y + slideShow.getHeight() + 170);

    mapView = new MapView(ResourcePath.MapImage)
        .setPos(0, locationTextView.getPos().y + 80)
        .setCropSrcPos(((1560 - winSize[0]) / 2), 240)
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


    var copyRightTextView = UiFactory.createTextView()
        .addText("·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·")
        .addText("Copyright ⓒ HyunChurl Lim")
        .addText("·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·")
        .setTextGap(35)
        .setAlign(CENTER, null)
        .setColor(190, 130, 130)
        .setTextStyle(BOLD)
        .setSize(16)
        .setPos(0, locationBusInfoTextView.getPos().y + 300);



    dragControl.setDragAreaHeigthSize(0, copyRightTextView.getPos().y - 480);



    // set map
    sprayParticleMap = new Map();
    sprayParticleMap.set(ParticleContents.MainTitle, mainTitleParticle);

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
    textViewMap.set(TextContents.Bend, bendTextView);
    textViewMap.set(TextContents.DDayLabel, ddayLabelTextView);
    textViewMap.set(TextContents.DayCounter, dayCounterTextView);
    textViewMap.set(TextContents.Invitation, invitationTextView);
    textViewMap.set(TextContents.InvitationLetter, invitationLetterTextView);
    textViewMap.set(TextContents.Gallery, galleryTextView);
    textViewMap.set(TextContents.Location, locationTextView);
    textViewMap.set(TextContents.SubwayInfo, locationSubwayInfoTextView);
    textViewMap.set(TextContents.BusInfo, locationBusInfoTextView);
    textViewMap.set(TextContents.Copyright, copyRightTextView);
}

function executeDayCounter() {
    var dday = new Date("April 11,2020,14:00:00").getTime();
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