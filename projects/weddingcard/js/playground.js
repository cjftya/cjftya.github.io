var backgroundEffect;
var bubleColor;
var bubleArr;

var lineTrace;
var lineTrace2;

var testText;
var testText2;
var testText3;
var testText4;
var testText5;
var testText6;
var invitationTextView;
var invitationTextView2;
var invitationTextView3;
var invitationTextView4;
var parentsTextView;
var parentsTextView2;
var parentsTextView3;
var parentsTextView4;
var locationTextView;
var mapShortcutTextView;

var mainImageView;
var bendlogogImageView;
var mapImageView;

var rectpos1;
var rectpos2;

var imageViewer;
var slideShow;

var spray;
var lineTraceSpray;
var lineTraceSpray2;

var old;
var oldDist;
var dragVel, dragMax;

var clicked;

function preload() {
    TopicManager.ready().write(RESOURCE.DATA, new ResourceLoader()
        .add("https://cjftya.github.io/assets/main.jpg", ResourceType.Image)
        .add("https://cjftya.github.io/assets/bendlogo.jpg", ResourceType.Image)
        .add("https://cjftya.github.io/assets/mask.png", ResourceType.Image)
        .add("https://cjftya.github.io/assets/map.jpg", ResourceType.Image)
        .add("https://cjftya.github.io/assets/mapmask.png", ResourceType.Image)
        .add("https://cjftya.github.io/assets/p1.png", ResourceType.Image)
        .add("https://cjftya.github.io/assets/p2.png", ResourceType.Image)
        .add("https://cjftya.github.io/assets/p3.png", ResourceType.Image)
        .add("https://cjftya.github.io/assets/p4.png", ResourceType.Image)
        .add("https://cjftya.github.io/assets/p5.png", ResourceType.Image)
        .add("https://cjftya.github.io/assets/realratio/p1.png", ResourceType.Image)
        .add("https://cjftya.github.io/assets/realratio/p2.png", ResourceType.Image)
        .add("https://cjftya.github.io/assets/realratio/p3.png", ResourceType.Image)
        .add("https://cjftya.github.io/assets/realratio/p4.png", ResourceType.Image)
        .add("https://cjftya.github.io/assets/realratio/p5.png", ResourceType.Image)
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

    fill(bubleColor);
    for (var b of bubleArr) {
        ellipse(b.x, b.y, b.r, b.r);
    }

    dragVel *= 0.9;
    this.updateWeddingContents(dragVel);

    // wedding contents
    testText.draw();
    mainImageView.draw();
    testText2.draw();

    fill(100, 50);
    rect(rectpos1.x, rectpos1.y, windowWidth, 100);

    testText3.draw();
    testText4.draw();
    parentsTextView.draw();
    parentsTextView2.draw();
    parentsTextView3.draw();
    parentsTextView4.draw();
    invitationTextView.draw();
    invitationTextView2.draw();
    invitationTextView3.draw();
    invitationTextView4.draw();
    testText5.draw();
    testText6.draw();
    bendlogogImageView.draw();

    spray.update(TimeDeltaUtil.getInstance().getDelta());
    spray.draw();

    slideShow.update(TimeDeltaUtil.getInstance().getDelta());
    slideShow.draw();

    lineTrace.update(TimeDeltaUtil.getInstance().getDelta());
    //    lineTrace.draw();

    lineTrace2.update(TimeDeltaUtil.getInstance().getDelta());
    //    lineTrace2.draw();

    lineTraceSpray.setPos(lineTrace.getTraceX(), lineTrace.getTraceY());
    lineTraceSpray.update(TimeDeltaUtil.getInstance().getDelta());
    lineTraceSpray.draw();

    lineTraceSpray2.setPos(lineTrace2.getTraceX(), lineTrace2.getTraceY());
    lineTraceSpray2.update(TimeDeltaUtil.getInstance().getDelta());
    lineTraceSpray2.draw();

    locationTextView.draw();
    mapImageView.draw();
    fill(120, 255);
    rect(rectpos2.x, rectpos2.y, windowWidth, 40);
    mapShortcutTextView.draw();

    imageViewer.update(TimeDeltaUtil.getInstance().getDelta());
    imageViewer.draw();

    this.getTouchPointDist();

    // background effect
    backgroundEffect.update(TimeDeltaUtil.getInstance().getDelta());
    backgroundEffect.draw();

    this.drawFpsCount();
}

function updateWeddingContents(vy) {
    guideY += vy;
    if (guideY > 0) {
        vy += (0 - guideY) * 0.05;
        guideY += (0 - guideY) * 0.05;
    } else if (guideY < -(mapImageView.getPos().y + mapImageView.getHeight() * 5)) {
        vy += (-(mapImageView.getPos().y + mapImageView.getHeight() * 5) - guideY) * 0.05;
        guideY += (-(mapImageView.getPos().y + mapImageView.getHeight() * 5) - guideY) * 0.05;
    }

    testText.addPos(0, vy);
    mainImageView.addPos(0, vy);
    testText2.addPos(0, vy);
    testText3.addPos(0, vy);
    testText4.addPos(0, vy);
    invitationTextView.addPos(0, vy);
    invitationTextView2.addPos(0, vy);
    invitationTextView3.addPos(0, vy);
    invitationTextView4.addPos(0, vy);
    testText5.addPos(0, vy);
    testText6.addPos(0, vy);
    bendlogogImageView.addPos(0, vy);
    bendlogogImageView.addCropSrcPos(0, vy * 0.1);
    lineTrace.addPos(0, vy);
    lineTrace2.addPos(0, vy);
    spray.addPos(0, vy);
    slideShow.addPos(0, vy);
    lineTraceSpray.addPos(0, vy);
    lineTraceSpray2.addPos(0, vy);
    mapImageView.addPos(0, vy);
    locationTextView.addPos(0, vy);
    mapShortcutTextView.addPos(0, vy);
    rectpos1.y += vy;
    rectpos2.y += vy;
    parentsTextView.addPos(0, vy);
    parentsTextView2.addPos(0, vy);
    parentsTextView3.addPos(0, vy);
    parentsTextView4.addPos(0, vy);
}

function drawFpsCount() {
    textSize(20);
    noStroke();
    fill(20);
    textAlign(LEFT, TOP);
    text("FPS : " + Math.floor(TimeDeltaUtil.getInstance().getFPS()), 10, 10);
}

function getTouchPointDist() {
    if (touches.length >= 2) {
        var ax = touches[0][0];
        var ay = touches[0][1];
        var bx = touches[1][0];
        var by = touches[1][1];

        var cx = (bx - ax) / 2;
        var cy = (by - ay) / 2;

        fill(0, 255);
        ellipse(cx, cy, 20, 20);
    }
}

function mousePressed() {
    clicked = true;
    old.set(mouseX, mouseY);
    dragMax = 0;
    mapImageView.onTouchDown(mouseX, mouseY);
}

function mouseReleased() {
    clicked = false;
    if (!imageViewer.isShowing() && slideShow.inBound(mouseX, mouseY)) {
        var resource = TopicManager.ready().read(RESOURCE.DATA);
        imageViewer.setImage(resource.get("https://cjftya.github.io/assets/realratio/p1.png").getData());
        imageViewer.show();
        slideShow.pause();
    }
    if (imageViewer.isShowing() && !imageViewer.inBound(mouseX, mouseY)) {
        imageViewer.hide();
        slideShow.resume();
    }
    if (!imageViewer.isShowing() && !imageViewer.isInputDelay()) {
        mapImageView.onTouchUp(mouseX, mouseY);
    }
}

function mouseDragged() {
    var vx = mouseX - old.x;
    var vy = mouseY - old.y;
    if (imageViewer.isShowing()) {
        if(touches.length < 2) {
            imageViewer.addPos(vx, vy);
        } else {
            imageViewer.addScale(0.01);
        }
    } else {
        var absVy = vy < 0 ? -vy : vy;
        if (dragMax < absVy) {
            dragMax = absVy;
            dragVel = vy * 0.6;
        }
        this.updateWeddingContents(vy);
    }
    old.set(mouseX, mouseY);
}

function mouseMoved() {
}

function keyPressed() {
    if (keyCode === LEFT_ARROW) {
        imageViewer.addScale(0.01);
    }
}

function windowResized() {
    TopicManager.ready().write(DISPLAY_INFO.WINDOW_SIZE, [windowWidth, windowHeight]);
    resizeCanvas(windowWidth, windowHeight);
}

function initialize() {
    var isMobile = /Android|webOS|iPhone|iPad|iPod|Opera Mini/i.test(navigator.userAgent);
    TopicManager.ready().write(DEVICE_INFO.IS_MOBILE, isMobile);

    clicked = false;

    backgroundEffect = EffectFactory.createParticle(Particle.Snow);

    var winSize = TopicManager.ready().read(DISPLAY_INFO.WINDOW_SIZE);
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
    var winSize = TopicManager.ready().read(DISPLAY_INFO.WINDOW_SIZE);
    var resource = TopicManager.ready().read(RESOURCE.DATA);

    imageViewer = new ImageViewer()
        .setPos(winSize[0] / 2, winSize[1] / 2)
        .setImage(resource.get("https://cjftya.github.io/assets/main.jpg").getData());

    testText = new TextView("우 리 결 혼 합 니 다 4")
        .setAlign(CENTER, null)
        .setColor(120, 80, 80)
        .setSize(22)
        .setPos(0, 80);

    mainImageView = new ImageView("https://cjftya.github.io/assets/main.jpg")
        .setPos(45, testText.getPos().y + 60)
        .setWidth(winSize[0] - 90);

    testText2 = new TextView("임현철 ღ 진서영")
        .setAlign(CENTER, null)
        .setColor(120, 80, 80)
        .setSize(17)
        .setPos(0, mainImageView.getHeight() + 170);

    parentsTextView = new TextView("아버지 가나다")
        .setAlign(LEFT, null)
        .setColor(120, 100, 100)
        .setAlpha(180)
        .setSize(15)
        .setPos(50, testText2.getPos().y + 50);

    parentsTextView2 = new TextView("아버지 마바사")
        .setAlign(RIGHT, null)
        .setColor(120, 100, 100)
        .setAlpha(180)
        .setSize(15)
        .setPos(-50, parentsTextView.getPos().y);

    parentsTextView3 = new TextView("어머니 가나다")
        .setAlign(LEFT, null)
        .setColor(120, 100, 100)
        .setAlpha(180)
        .setSize(15)
        .setPos(50, parentsTextView2.getPos().y + 40);

    parentsTextView4 = new TextView("어머니 마바사")
        .setAlign(RIGHT, null)
        .setColor(120, 100, 100)
        .setAlpha(180)
        .setSize(15)
        .setPos(-50, parentsTextView3.getPos().y);

    spray = new Spray(30)
        .setPos(winSize[0] / 2, mainImageView.getHeight() + 170)
        .setCreateArea(50, 15)
        .setLife(100)
        .setFreq(0.08)
        .setBlur(true);

    testText3 = new TextView("2020. 04. 11. SAT  2:00 PM")
        .setAlign(CENTER, null)
        .setColor(120, 100, 100)
        .setSize(15)
        .setPos(0, testText2.getPos().y + 200);

    testText4 = new TextView("더 케이트원타원 A동 LL층 | 아펠가모 웨딩홀")
        .setAlign(CENTER, null)
        .setColor(120, 100, 100)
        .setSize(15)
        .setPos(0, testText3.getPos().y + 30);

    rectpos1 = new Vector2d().set(0, testText3.getPos().y - 30);

    testText5 = new TextView("Invitation")
        .setAlign(CENTER, null)
        .setColor(120, 80, 80)
        .setSize(22)
        .setPos(0, testText4.getPos().y + 120);

    invitationTextView = new TextView("너무나 사랑스럽고 지켜주고싶은 사람을 만났습니다.")
        .setAlign(CENTER, null)
        .setColor(120, 100, 100)
        .setAlpha(180)
        .setSize(12)
        .setPos(0, testText5.getPos().y + 60);

    invitationTextView2 = new TextView("변치않는 마음과 믿음으로 하나가 되어 행복하게 살겠습니다.")
        .setAlign(CENTER, null)
        .setColor(120, 100, 100)
        .setAlpha(180)
        .setSize(12)
        .setPos(0, invitationTextView.getPos().y + 30);

    invitationTextView3 = new TextView("믿은과 사랑을 약속하는 귀한 날에 축복의 걸음을 하시어")
        .setAlign(CENTER, null)
        .setColor(120, 100, 100)
        .setAlpha(180)
        .setSize(12)
        .setPos(0, invitationTextView2.getPos().y + 30);

    invitationTextView4 = new TextView("지켜봐주신다면 더없는 기쁨으로 담아두겠습니다.")
        .setAlign(CENTER, null)
        .setColor(120, 100, 100)
        .setAlpha(180)
        .setSize(12)
        .setPos(0, invitationTextView3.getPos().y + 30);

    bendlogogImageView = new ImageView("https://cjftya.github.io/assets/bendlogo.jpg")
        .setPos(0, invitationTextView4.getPos().y + 140)
        .setWidth(winSize[0])
        .setCropMode(true)
        .setCropSrcPos(200, 450)
        .setCropSize(winSize[0], 100);

    testText6 = new TextView("Gallery")
        .setAlign(CENTER, null)
        .setColor(120, 80, 80)
        .setSize(22)
        .setPos(0, bendlogogImageView.getPos().y + 200);

    slideShow = new SlideShow()
        .addImage("https://cjftya.github.io/assets/p1.png")
        .addImage("https://cjftya.github.io/assets/p2.png")
        .addImage("https://cjftya.github.io/assets/p3.png")
        .addImage("https://cjftya.github.io/assets/p4.png")
        .addImage("https://cjftya.github.io/assets/p5.png")
        .setMask("https://cjftya.github.io/assets/mask.png")
        .setWidth(winSize[0])
        .setDelay(5)
        .setPos(0, testText6.getPos().y + 50);

    lineTrace = new LineTrace();
    var oneSlice = (Math.PI * 2) / 30;
    for (var i = 0; i < 30; i++) {
        var xp = Math.cos(oneSlice * i) * (winSize[0] / 3.0);
        var yp = Math.sin(oneSlice * i) * (winSize[0] / 3.3);
        lineTrace.addPoint(xp + winSize[0] / 2, yp + slideShow.getPos().y + slideShow.getHeight() / 2);
    }
    lineTrace.inverse();
    lineTrace.start();

    lineTrace2 = new LineTrace();
    var oneSlice = Math.PI * 2 / 30;
    for (var i = 0; i < 30; i++) {
        var xp = Math.cos(oneSlice * i) * (winSize[0] / 2.4);
        var yp = Math.sin(oneSlice * i) * (winSize[0] / 3.2);
        lineTrace2.addPoint(xp + winSize[0] / 2, yp + slideShow.getPos().y + slideShow.getHeight() / 2);
    }
    lineTrace2.start();

    lineTraceSpray = new Spray(30)
        .setPos(1000, 1000)
        .setCreateArea(10, 10)
        .setLife(150)
        .setFreq(0.04)
        .setBlur(true);

    lineTraceSpray2 = new Spray(30)
        .setPos(1000, 1000)
        .setCreateArea(10, 10)
        .setLife(150)
        .setFreq(0.04)
        .setBlur(true);

    locationTextView = new TextView("Location")
        .setAlign(CENTER, null)
        .setColor(120, 80, 80)
        .setSize(22)
        .setPos(0, slideShow.getPos().y + slideShow.getHeight() + 120);

    mapImageView = new ImageView("https://cjftya.github.io/assets/map.jpg")
        .setPos(0, locationTextView.getPos().y + 60)
        .setWidth(winSize[0])
        .setListener(() => {
            location.href = "https://m.map.naver.com/search2/site.nhn?query=%EA%B4%91%ED%99%94%EB%AC%B8%EC%95%84%ED%8E%A0%EA%B0%80%EB%AA%A8&sm=shistory&style=v5&code=31738014#/map";
        });

    rectpos2 = new Vector2d().set(0, mapImageView.getPos().y + mapImageView.getHeight() - 40);

    mapShortcutTextView = new TextView("네이버지도 바로가기")
        .setAlign(CENTER, null)
        .setColor(190, 190, 190)
        .setTextStyle(BOLD)
        .setSize(17)
        .setPos(0, rectpos2.y + 40 / 3);
}

function onLoadedResource(total, count) {
    console.log(total + " : " + count);
}
