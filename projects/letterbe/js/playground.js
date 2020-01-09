var characterLock;

function setup() {
    createCanvas(windowWidth, windowHeight);
    TopicManager.ready().write(DISPLAY_INFO.WINDOW_SIZE, [windowWidth, windowHeight]);

    this.initialize();

    console.log("letter be");
}

function draw() {
    background(20, 20, 40);
    noStroke();

    TimeDeltaUtil.getInstance().update();

    characterLock.update(TimeDeltaUtil.getInstance().getDelta());
    characterLock.draw();

    this.drawFpsCount();
}

function drawFpsCount() {
    textSize(20);
    noStroke();
    fill(240);
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

    characterLock = new CharacterLock();
}