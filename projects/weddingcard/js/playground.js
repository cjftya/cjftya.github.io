﻿var backgroundEffect;
var tester;
var bubleColor;
var bubleArr;

function preload() {
    TopicManager.ready().write(RESOURCE.DATA, new ResourceLoader()
        .add("https://cjftya.github.io/assets/logo2.JPG", ResourceType.Image)
        .add("https://cjftya.github.io/assets/linkimage.jpg", ResourceType.Image)
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

    // tester.draw();

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
    TopicManager.ready().write(DISPLAY_INFO.WINDOW_SIZE, [windowWidth, windowHeight]);
    resizeCanvas(windowWidth, windowHeight);
}

function initialize() {
    var isMobile = /Android|webOS|iPhone|iPad|iPod|Opera Mini/i.test(navigator.userAgent);
    TopicManager.ready().write(DEVICE_INFO.IS_MOBILE, isMobile);

    backgroundEffect = EffectFactory.createParticle(Particle.Snow);
    tester = new ImageView("https://cjftya.github.io/assets/logo2.JPG")
        .setPos(50, 50)
        .setScale(0.6);

    bubleColor = color(250, 190, 190);
    bubleColor.setAlpha(10);

    bubleArr = [];
    var x, y, r;
    for (var i = 0; i < 5; i++) {
        x = MathUtil.randInt(50, windowWidth - 50);
        y = MathUtil.randInt(50, windowHeight * 2 - 50);
        r = MathUtil.randInt(250, 800);
        bubleArr.push({ x, y, r });
    }
}

function onLoadedResource(total, count) {
    console.log(total + " : " + count);
}
