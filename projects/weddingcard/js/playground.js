var backgroundEffect;
var bubleColor;
var bubleArr;

var testText;
var testText2;
var testText3;
var testText4;
var testText5;
var mainImageView;
var bendlogogImageView;

var oldY;
var dragPos;
var dragVel;
var deltaVel;

var clicked;

function preload() {
    TopicManager.ready().write(RESOURCE.DATA, new ResourceLoader()
        .add("https://cjftya.github.io/assets/logo2.JPG", ResourceType.Image)
        .add("https://cjftya.github.io/assets/main.jpg", ResourceType.Image)
        .add("https://cjftya.github.io/assets/bendlogo.jpg", ResourceType.Image)
        .add("https://cjftya.github.io/assets/mask1.png", ResourceType.Image)
        .add("https://cjftya.github.io/assets/godoMaum.ttf", ResourceType.Font)
        .setListener(this.onLoadedResource)
        .load());
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    TopicManager.ready().write(DISPLAY_INFO.WINDOW_SIZE, [windowWidth, windowHeight]);

    this.initialize();

    oldY = 0;
    dragPos = 0;
    dragVel = 0;

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

    this.updateWeddingContents();

    // wedding contents
    testText.draw();
    mainImageView.draw();
    testText2.draw();
    testText3.draw();
    testText4.draw();
    testText5.draw();
    bendlogogImageView.draw();


    // background effect
    backgroundEffect.update(TimeDeltaUtil.getInstance().getDelta());
    backgroundEffect.draw();

    this.drawFpsCount();
}

function updateWeddingContents() {
    if (clicked) {
   //     return;
    }

    // dragPos += dragVel;
    dragVel *= 0.9;

    testText.addPos(0, dragVel);
    mainImageView.addPos(0, dragVel);
    testText2.addPos(0, dragVel);
    testText3.addPos(0, dragVel);
    testText4.addPos(0, dragVel);
    testText5.addPos(0, dragVel);
    bendlogogImageView.addPos(0, dragVel);
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
    oldY = mouseY;
}

function mouseReleased() {
    clicked = false;
    dragPos = 0;
}

function mouseDragged() {
    var vx = mouseY - oldY;
    var absVx = vx < 0 ? -vx : vx;
    if(dragPos < absVx) {
        dragPos = absVx;
        dragVel = vx * 0.8;
    }

    testText.addPos(0, vx);
    mainImageView.addPos(0, vx);
    testText2.addPos(0, vx);
    testText3.addPos(0, vx);
    testText4.addPos(0, vx);
    testText5.addPos(0, vx);
    bendlogogImageView.addPos(0, vx);

    oldY = mouseY;
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

    var resource = TopicManager.ready().read(RESOURCE.DATA);
//    textFont(resource.get("https://cjftya.github.io/assets/godoMaum.ttf").getData());

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

    testText = new TextView("~ ෆ We're getting married ෆ ~")
        .setAlign(CENTER, null)
        .setColor(120, 80, 80)
        .setSize(20)
        .setPos(0, 80);

    mainImageView = new ImageView("https://cjftya.github.io/assets/main.jpg")
        .setPos(45, 130)
        .setWidth(winSize[0] - 90);

    testText2 = new TextView("임현철 ღ 진서영")
        .setAlign(CENTER, null)
        .setColor(120, 80, 80)
        .setSize(17)
        .setPos(0, 130 + mainImageView.getHeight() + 40);

    testText3 = new TextView("2020. 04. 11. SAT  2:00 PM")
        .setAlign(CENTER, null)
        .setColor(120, 80, 80)
        .setSize(15)
        .setPos(0, 130 + mainImageView.getHeight() + 140);

    testText4 = new TextView("더 케이트원타원 A동 LL층 | 아펠가모 웨딩홀")
        .setAlign(CENTER, null)
        .setColor(120, 80, 80)
        .setSize(15)
        .setPos(0, 130 + mainImageView.getHeight() + 160);

    testText5 = new TextView("~ ෆ Initation ෆ ~")
        .setAlign(CENTER, null)
        .setColor(120, 80, 80)
        .setSize(20)
        .setPos(0, 130 + mainImageView.getHeight() + 250);

    bendlogogImageView = new ImageView("https://cjftya.github.io/assets/bendlogo.jpg")
        .setPos(0, 1400)
        .setWidth(winSize[0])
        .setCropMode(true)
        .setCropSrcPos(winSize[0] / 4, 200)
        .setCropSize(winSize[0], 100);
}

function onLoadedResource(total, count) {
    console.log(total + " : " + count);
}
