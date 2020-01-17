var backgroundEffect;
var counter;
var tester;
var bubleColor;
var bubleArr;

function setup() {
    location.href = "projects/weddingcard/index.html";

    console.log("go to weddingcard");

    // createCanvas(windowWidth, windowHeight+800);
    // TopicManager.ready().write(DISPLAY_INFO.WINDOW_SIZE, [windowWidth, windowHeight]);

    // this.initialize();
}

function draw() {
    // background(20, 20, 40);
    // noStroke();

    // TimeDeltaUtil.getInstance().update();

    // this.drawFpsCount();
}

function drawFpsCount() {
    textSize(20);
    noStroke();
    fill(250);
    textAlign(LEFT, TOP);
    text("FPS : " + Math.floor(TimeDeltaUtil.getInstance().getFPS()), 10, 10);
}

function mousePressed() {
    // counter++;
    // if (counter == 5) {
    //     location.href = "projects/weddingcard/index.html";
    // }
    //    location.replace("projects/viola/index.html");
    //    location.replace("projects/letterbe/index.html");
    //    location.replace("projects/weddingcard/index.html");
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

    counter = 0;
}