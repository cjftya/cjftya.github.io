function setup() {
    this.initialize();
    this.decidePage();
}

function draw() {
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
}

function decidePage() {
    var isMobile = TopicManager.ready().read(DEVICE_INFO.IS_MOBILE);
    if (isMobile) {
        location.href = "projects/weddingcard/index.html";
    } else {
        location.href = "projects/viola/index.html";
    }
}