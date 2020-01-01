var test = "aasdasd";

function setup() {
    createCanvas(windowWidth, windowHeight);
    TopicManager.ready().write(DISPLAY_INFO.WINDOW_SIZE, [windowWidth, windowHeight]);

    this.initialize();

    console.log("letter be");
}

function draw() {
    background(20, 20, 40);
    noStroke();
}

function mousePressed() {
    // var system = TopicManager.ready().read(SYSTEMS.MAIN);
    // if (system != null) {
    //     system.onTouchDown(mouseX, mouseY);
    // }
}

function mouseReleased() {
    // var system = TopicManager.ready().read(SYSTEMS.MAIN);
    // if (system != null) {
    //     system.onTouchUp(mouseX, mouseY);
    // }
}

function mouseDragged() {
    // var system = TopicManager.ready().read(SYSTEMS.MAIN);
    // if (system != null) {
    //     system.onTouchHover(mouseX, mouseY); // mobile issue fix
    //     system.onTouchMove(mouseX, mouseY);
    // }
}

function mouseMoved() {
    // var isMobile = TopicManager.ready().read(DEVICE_INFO.IS_MOBILE);
    // if (!isMobile) {
    //     var system = TopicManager.ready().read(SYSTEMS.MAIN);
    //     if (system != null) {
    //         system.onTouchHover(mouseX, mouseY);
    //     }
    // }
}

function windowResized() {
    TopicManager.ready().write(DISPLAY_INFO.WINDOW_SIZE, [windowWidth, windowHeight]);
    resizeCanvas(windowWidth, windowHeight);
}

function initialize() {
    var isMobile = /Android|webOS|iPhone|iPad|iPod|Opera Mini/i.test(navigator.userAgent);
   // TopicManager.ready().write(DEVICE_INFO.IS_MOBILE, isMobile);
}