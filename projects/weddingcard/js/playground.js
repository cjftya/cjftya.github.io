var backgroundEffect;
var bubleColor;
var bubleArr;

var textViewMap;
var imageViewMap;

var lineTraceMap;

var sprayParticleMap;

var imageViewer;
var slideShow;
var mapImageView;

var rectpos1;
var rectpos2;

var old;
var oldDist;
var dragVel, dragMax;

var clicked;

var winSize;

var debugCount = 0;

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

    dragVel *= 0.9;
    this.updateWeddingContents(dragVel);

    fill(bubleColor);
    for (var b of bubleArr) {
        ellipse(b.x, b.y, b.r, b.r);
    }

    for (var [id, view] of textViewMap.entries()) {
        if (view.inScreen(winSize[0], winSize[1])) {
            view.draw();
        }
    }

    for (var [id, view] of imageViewMap.entries()) {
        if (view.inScreen(winSize[0], winSize[1])) {
            view.draw();
        }
    }

    fill(100, 50);
    rect(rectpos1.x, rectpos1.y, windowWidth, 100);

    slideShow.update(TimeDeltaUtil.getInstance().getDelta());
    slideShow.draw();

    for (var [id, trace] of lineTraceMap.entries()) {
        trace.update(TimeDeltaUtil.getInstance().getDelta());
        // trace.draw();
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

    mapImageView.draw();

    fill(120, 255);
    rect(rectpos2.x, rectpos2.y, windowWidth, 40);

    imageViewer.update(TimeDeltaUtil.getInstance().getDelta());
    imageViewer.draw();

    // background effect
    backgroundEffect.update(TimeDeltaUtil.getInstance().getDelta());
    backgroundEffect.draw();

    this.drawFpsCount();

    debugCount = 0;
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
    mapImageView.addPos(0, vy);
    rectpos1.y += vy;
    rectpos2.y += vy;
}

function drawFpsCount() {
    textSize(20);
    noStroke();
    fill(20);
    textAlign(LEFT, TOP);
    text("FPS : " + Math.floor(TimeDeltaUtil.getInstance().getFPS()) + ", debug : " + debugCount, 10, 10);
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
    mapImageView.onTouchDown(mouseX, mouseY);
}

function mouseReleased() {
    if (!imageViewer.isShowing() && slideShow.inBound(mouseX, mouseY) && !imageViewer.isInputDelay()) {
        var resource = TopicManager.ready().read(RESOURCE.DATA);
        imageViewer.setImage(resource.get("https://cjftya.github.io/assets/realratio/p1.png").getData());
        imageViewer.setScaleLimit(-1, 1.1)
        imageViewer.show();
        slideShow.pause();
    }
    if (imageViewer.isShowing() && !imageViewer.inBound(mouseX, mouseY) && !imageViewer.isInputDelay()) {
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
        if (touches.length < 2) {
            imageViewer.addPos(vx, vy);
        } else {
            var newDist = this.getTouchPointDist();
            var vz = newDist - oldDist;
            imageViewer.addScale(vz * 0.00001);
            oldDist = newDist;
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

    clicked = false;

    backgroundEffect = EffectFactory.createParticle(Particle.Snow);

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
    var resource = TopicManager.ready().read(RESOURCE.DATA);

    imageViewer = new ImageViewer()
        .setPos(winSize[0] / 2, winSize[1] / 2);

    var titleTextView = new TextView("우 리 결 혼 합 니 다")
        .setAlign(CENTER, null)
        .setColor(120, 80, 80)
        .setSize(22)
        .setPos(0, 80);

    var mainImageView = new ImageView("https://cjftya.github.io/assets/main.jpg")
        .setPos(45, titleTextView.getPos().y + 60)
        .setWidth(winSize[0] - 90);

    var mainImageTitleTextView = new TextView("가나다 ღ 마바사")
        .setAlign(CENTER, null)
        .setColor(120, 80, 80)
        .setSize(17)
        .setPos(0, mainImageView.getHeight() + 170);

    var parentsFatherATextView = new TextView("아버지 가나다")
        .setAlign(LEFT, null)
        .setColor(120, 100, 100)
        .setAlpha(180)
        .setSize(15)
        .setPos(50, mainImageTitleTextView.getPos().y + 50);

    var parentsFatherBTextView = new TextView("아버지 마바사")
        .setAlign(RIGHT, null)
        .setColor(120, 100, 100)
        .setAlpha(180)
        .setSize(15)
        .setPos(-50, parentsFatherATextView.getPos().y);

    var parentsMotherATextView = new TextView("어머니 가나다")
        .setAlign(LEFT, null)
        .setColor(120, 100, 100)
        .setAlpha(180)
        .setSize(15)
        .setPos(50, parentsFatherBTextView.getPos().y + 40);

    var parentsMotherBTextView = new TextView("어머니 마바사")
        .setAlign(RIGHT, null)
        .setColor(120, 100, 100)
        .setAlpha(180)
        .setSize(15)
        .setPos(-50, parentsMotherATextView.getPos().y);

    var mainTitleParticle = new Spray(30)
        .setPos(winSize[0] / 2, mainImageView.getHeight() + 170)
        .setCreateArea(50, 15)
        .setLife(100)
        .setFreq(0.08)
        .setBlur(true);

    var weddingDateTextView = new TextView("2020. 04. 11. SAT  2:00 PM")
        .setAlign(CENTER, null)
        .setColor(120, 100, 100)
        .setSize(15)
        .setPos(0, mainImageTitleTextView.getPos().y + 200);

    var weddingLocationTextView = new TextView("더 케이트원타원 A동 LL층 | 아펠가모 웨딩홀")
        .setAlign(CENTER, null)
        .setColor(120, 100, 100)
        .setSize(15)
        .setPos(0, weddingDateTextView.getPos().y + 30);

    rectpos1 = new Vector2d().set(0, weddingDateTextView.getPos().y - 30);

    var invitationTextView = new TextView("Invitation")
        .setAlign(CENTER, null)
        .setColor(120, 80, 80)
        .setSize(22)
        .setPos(0, weddingLocationTextView.getPos().y + 120);

    var invitationLetterTextView1 = new TextView("너무나 사랑스럽고 지켜주고싶은 사람을 만났습니다.")
        .setAlign(CENTER, null)
        .setColor(120, 100, 100)
        .setAlpha(180)
        .setSize(12)
        .setPos(0, invitationTextView.getPos().y + 60);

    var invitationLetterTextView2 = new TextView("변치않는 마음과 믿음으로 하나가 되어 행복하게 살겠습니다.")
        .setAlign(CENTER, null)
        .setColor(120, 100, 100)
        .setAlpha(180)
        .setSize(12)
        .setPos(0, invitationLetterTextView1.getPos().y + 30);

    var invitationLetterTextView3 = new TextView("믿은과 사랑을 약속하는 귀한 날에 축복의 걸음을 하시어")
        .setAlign(CENTER, null)
        .setColor(120, 100, 100)
        .setAlpha(180)
        .setSize(12)
        .setPos(0, invitationLetterTextView2.getPos().y + 30);

    var invitationLetterTextView4 = new TextView("지켜봐주신다면 더없는 기쁨으로 담아두겠습니다.")
        .setAlign(CENTER, null)
        .setColor(120, 100, 100)
        .setAlpha(180)
        .setSize(12)
        .setPos(0, invitationLetterTextView3.getPos().y + 30);

    var bendImageView = new ImageView("https://cjftya.github.io/assets/bendlogo.jpg")
        .setPos(0, invitationLetterTextView4.getPos().y + 140)
        .setWidth(winSize[0])
        .setCropMode(true)
        .setCropSrcPos(200, 450)
        .setCropSize(winSize[0], 100);

    var galleryTextView = new TextView("Gallery")
        .setAlign(CENTER, null)
        .setColor(120, 80, 80)
        .setSize(22)
        .setPos(0, bendImageView.getPos().y + 200);

    slideShow = new SlideShow()
        .addImage("https://cjftya.github.io/assets/p1.png")
        .addImage("https://cjftya.github.io/assets/p2.png")
        .addImage("https://cjftya.github.io/assets/p3.png")
        .addImage("https://cjftya.github.io/assets/p4.png")
        .addImage("https://cjftya.github.io/assets/p5.png")
        .setMask("https://cjftya.github.io/assets/mask.png")
        .setWidth(winSize[0])
        .setDelay(5)
        .setPos(0, galleryTextView.getPos().y + 50);

    var lineTrace1 = new LineTrace();
    var oneSlice = (Math.PI * 2) / 30;
    for (var i = 0; i < 30; i++) {
        var xp = Math.cos(oneSlice * i) * (winSize[0] / 3.0);
        var yp = Math.sin(oneSlice * i) * (winSize[0] / 3.3);
        lineTrace1.addPoint(xp + winSize[0] / 2, yp + slideShow.getPos().y + slideShow.getHeight() / 2);
    }
    lineTrace1.inverse();
    lineTrace1.start();

    var lineTrace2 = new LineTrace();
    var oneSlice = Math.PI * 2 / 30;
    for (var i = 0; i < 30; i++) {
        var xp = Math.cos(oneSlice * i) * (winSize[0] / 2.4);
        var yp = Math.sin(oneSlice * i) * (winSize[0] / 3.2);
        lineTrace2.addPoint(xp + winSize[0] / 2, yp + slideShow.getPos().y + slideShow.getHeight() / 2);
    }
    lineTrace2.start();

    var slideShowParticle1 = new Spray(30)
        .setPos(1000, 1000)
        .setCreateArea(10, 10)
        .setLife(150)
        .setFreq(0.04)
        .setBlur(true);

    var slideShowParticle2 = new Spray(30)
        .setPos(1000, 1000)
        .setCreateArea(10, 10)
        .setLife(150)
        .setFreq(0.04)
        .setBlur(true);

    var locationTextView = new TextView("Location")
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

    var shortcutNaverTextView = new TextView("네이버지도 바로가기")
        .setAlign(CENTER, null)
        .setColor(190, 190, 190)
        .setTextStyle(BOLD)
        .setSize(17)
        .setPos(0, rectpos2.y + 40 / 3);
    
    lineTraceMap = new Map();
    lineTraceMap.set(ParticleContents.SlideShow1, lineTrace1);
    lineTraceMap.set(ParticleContents.SlideShow2, lineTrace2);

    sprayParticleMap = new Map();
    sprayParticleMap.set(ParticleContents.MainTitle, mainTitleParticle);
    sprayParticleMap.set(ParticleContents.SlideShow1, slideShowParticle1);
    sprayParticleMap.set(ParticleContents.SlideShow2, slideShowParticle2);

    imageViewMap = new Map();
    imageViewMap.set(ImageContents.Main, mainImageView);
    imageViewMap.set(ImageContents.Bend, bendImageView);

    textViewMap = new Map();
    textViewMap.set(TextContents.Title, titleTextView);
    textViewMap.set(TextContents.MainImageTitle, mainImageTitleTextView);
    textViewMap.set(TextContents.ParentsFatherA, parentsFatherATextView);
    textViewMap.set(TextContents.ParentsFatherB, parentsFatherBTextView);
    textViewMap.set(TextContents.ParentsMotherA, parentsMotherATextView);
    textViewMap.set(TextContents.ParentsMotherB, parentsMotherBTextView);
    textViewMap.set(TextContents.WeddingDate, weddingDateTextView);
    textViewMap.set(TextContents.WeddingLocation, weddingLocationTextView);
    textViewMap.set(TextContents.Invitation, invitationTextView);
    textViewMap.set(TextContents.InvitationLetter1, invitationLetterTextView1);
    textViewMap.set(TextContents.InvitationLetter2, invitationLetterTextView2);
    textViewMap.set(TextContents.InvitationLetter3, invitationLetterTextView3);
    textViewMap.set(TextContents.InvitationLetter4, invitationLetterTextView4);
    textViewMap.set(TextContents.Gallery, galleryTextView);
    textViewMap.set(TextContents.Location, locationTextView);
    textViewMap.set(TextContents.ShortcutNaver, shortcutNaverTextView);
}

function onLoadedResource(total, count) {
    console.log(total + " : " + count);
}
