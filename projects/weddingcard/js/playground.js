var backgroundEffect;
var bubleColor;
var bubleArr;

var lineTrace;

var testText;
var testText2;
var testText3;
var testText4;
var testText5;
var testText6;
var mainImageView;
var bendlogogImageView;
var imageViewer;
var slideShow;

var spray;

var old;
var dragVel, dragMax;

var clicked;

function preload() {
    TopicManager.ready().write(RESOURCE.DATA, new ResourceLoader()
        .add("https://cjftya.github.io/assets/logo2.JPG", ResourceType.Image)
        .add("https://cjftya.github.io/assets/main.jpg", ResourceType.Image)
        .add("https://cjftya.github.io/assets/bendlogo.jpg", ResourceType.Image)
        .add("https://cjftya.github.io/assets/mask.png", ResourceType.Image)
        .add("https://cjftya.github.io/assets/p1.png", ResourceType.Image)
        .add("https://cjftya.github.io/assets/p2.png", ResourceType.Image)
        .add("https://cjftya.github.io/assets/p3.png", ResourceType.Image)
        .add("https://cjftya.github.io/assets/p4.png", ResourceType.Image)
        .add("https://cjftya.github.io/assets/p5.png", ResourceType.Image)
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
    testText3.draw();
    testText4.draw();
    testText5.draw();
    testText6.draw();
    bendlogogImageView.draw();

    spray.update(TimeDeltaUtil.getInstance().getDelta());
    spray.draw();

    slideShow.draw();

    imageViewer.draw();

    // lineTrace.update(TimeDeltaUtil.getInstance().getDelta());
    // lineTrace.draw();

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
    }

    testText.addPos(0, vy);
    mainImageView.addPos(0, vy);
    testText2.addPos(0, vy);
    testText3.addPos(0, vy);
    testText4.addPos(0, vy);
    testText5.addPos(0, vy);
    testText6.addPos(0, vy);
    bendlogogImageView.addPos(0, vy);
    lineTrace.addPos(0, vy);
    spray.addPos(0, vy);
    slideShow.addPos(0, vy);
}

function drawFpsCount() {
    textSize(20);
    noStroke();
    fill(20);
    textAlign(LEFT, TOP);
    text("FPS : " + Math.floor(TimeDeltaUtil.getInstance().getFPS()), 10, 10);
}

function mousePressed() {
    clicked = true;
    old.set(mouseX, mouseY);
    dragMax = 0;
    if (imageViewer.isShowing() && !imageViewer.inBound(mouseX, mouseY)) {
        imageViewer.hide();
    }
}

function mouseReleased() {
    clicked = false;
}

function mouseDragged() {
    var vx = mouseY - old.x;
    var vy = mouseY - old.y;
    if (imageViewer.isShowing()) {
        imageViewer.addPos(vx, vy);
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

    lineTrace = new LineTrace();
    var oneSlice = Math.PI * 2 / 20;
    for (var i = 0; i < 20; i++) {
        var xp = Math.cos(oneSlice * i) * 100;
        var yp = Math.sin(oneSlice * i) * 100;
        lineTrace.addPoint(xp + winSize[0] / 2, yp + 1750);
    }
    lineTrace.start();

    this.initializeWeddingContents();
}

function initializeWeddingContents() {
    var winSize = TopicManager.ready().read(DISPLAY_INFO.WINDOW_SIZE);
    var resource = TopicManager.ready().read(RESOURCE.DATA);

    imageViewer = new ImageViewer()
        .setPos(winSize[0] / 2, winSize[1] / 2)
        .setImage(resource.get("https://cjftya.github.io/assets/main.jpg").getData());

    testText = new TextView("We're getting married")
        .setAlign(CENTER, null)
        .setColor(120, 80, 80)
        .setSize(22)
        .setTextStyle(BOLD)
        .setPos(0, 80);

    mainImageView = new ImageView("https://cjftya.github.io/assets/main.jpg")
        .setPos(45, 130)
        .setWidth(winSize[0] - 90);

    testText2 = new TextView("임현철 ღ 진서영")
        .setAlign(CENTER, null)
        .setColor(120, 80, 80)
        .setSize(17)
        .setTextStyle(BOLD)
        .setPos(0, 130 + mainImageView.getHeight() + 40);

    spray = new Spray()
        .setPos(winSize[0] / 2, 130 + mainImageView.getHeight() + 40)
        .setLife(100)
        .setFreq(0.08);

    testText3 = new TextView("2020. 04. 11. SAT  2:00 PM")
        .setAlign(CENTER, null)
        .setColor(120, 100, 100)
        .setSize(15)
        .setPos(0, 130 + mainImageView.getHeight() + 140);

    testText4 = new TextView("더 케이트원타원 A동 LL층 | 아펠가모 웨딩홀")
        .setAlign(CENTER, null)
        .setColor(120, 100, 100)
        .setSize(15)
        .setPos(0, 130 + mainImageView.getHeight() + 160);

    testText5 = new TextView("Invitation")
        .setAlign(CENTER, null)
        .setColor(120, 80, 80)
        .setSize(22)
        .setTextStyle(BOLD)
        .setPos(0, 130 + mainImageView.getHeight() + 250);

    bendlogogImageView = new ImageView("https://cjftya.github.io/assets/bendlogo.jpg")
        .setPos(0, 1400)
        .setWidth(winSize[0])
        .setCropMode(true)
        .setCropSrcPos(winSize[0] / 4, 200)
        .setCropSize(winSize[0], 100);

    testText6 = new TextView("Gallery")
        .setAlign(CENTER, null)
        .setColor(120, 80, 80)
        .setSize(22)
        .setTextStyle(BOLD)
        .setPos(0, 1550);

    slideShow = new SlideShow()
        .addImage("https://cjftya.github.io/assets/p1.png")
        .addImage("https://cjftya.github.io/assets/p2.png")
        .addImage("https://cjftya.github.io/assets/p3.png")
        .addImage("https://cjftya.github.io/assets/p4.png")
        .addImage("https://cjftya.github.io/assets/p5.png")
        .set(winSize[0] - 200)
}

function onLoadedResource(total, count) {
    console.log(total + " : " + count);
}
