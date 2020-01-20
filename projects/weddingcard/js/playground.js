var backgroundEffect;
var tester;
var bubleColor;
var bubleArr;
var testText;

function preload() {
    TopicManager.ready().write(RESOURCE.DATA, new ResourceLoader()
        .add("https://cjftya.github.io/assets/logo2.JPG", ResourceType.Image)
        .add("https://cjftya.github.io/assets/main.jpg", ResourceType.Image)
        .setListener(this.onLoadedResource)
        .load());
}

function setup() {
    createCanvas(windowWidth, windowHeight * 2);
    TopicManager.ready().write(DISPLAY_INFO.WINDOW_SIZE, [windowWidth, windowHeight * 2]);

    this.initialize();

    console.log("wedding card");
}

function draw() {
    background(255, 255, 245);
    noStroke();

    fill(bubleColor);
    for (var b of bubleArr) {
        ellipse(b.x, b.y, b.r, b.r);
    }

    testText.draw();

    tester.draw();

    TimeDeltaUtil.getInstance().update();

    backgroundEffect.update(TimeDeltaUtil.getInstance().getDelta());
    backgroundEffect.draw();

    this.drawFpsCount();
}

function drawFpsCount() {
    textSize(20);
    noStroke();
    fill(20);
    textAlign(LEFT, TOP);
    text("FPS : " + Math.floor(TimeDeltaUtil.getInstance().getFPS()), 10, 10);
}

function mousePressed() {
}

function mouseReleased() {
}

function mouseDragged() {
}

function mouseMoved() {
}

function windowResized() {
    TopicManager.ready().write(DISPLAY_INFO.WINDOW_SIZE, [windowWidth, windowHeight * 2]);
    resizeCanvas(windowWidth, windowHeight);
}

function initialize() {
    var isMobile = /Android|webOS|iPhone|iPad|iPod|Opera Mini/i.test(navigator.userAgent);
    TopicManager.ready().write(DEVICE_INFO.IS_MOBILE, isMobile);

    backgroundEffect = EffectFactory.createParticle(Particle.Snow);

    var winSize = TopicManager.ready().read(DISPLAY_INFO.WINDOW_SIZE);

    tester = new ImageView("https://cjftya.github.io/assets/main.jpg")
        .setPos(70, 60)
        .setWidth(winSize[0] - 140);

    testText = new TextView("❤ We're getting married ❤")
        .setAlign(CENTER, null)
        .setColor(120, 80, 80)
        .setSize(20)
        .setPos(0, 20);

    bubleArr = [];
    var x, y, r;
    bubleColor = color(250, 190, 190);
    bubleColor.setAlpha(8);
    for (var i = 0; i < 8; i++) {
        x = MathUtil.randInt(50, winSize[0] - 50);
        y = MathUtil.randInt(50, winSize[1] - 50);
        r = MathUtil.randInt(250, 800);
        bubleArr.push({ x, y, r });
    }
}

function onLoadedResource(total, count) {
    console.log(total + " : " + count);
}
