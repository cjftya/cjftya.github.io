function preload() {
    this.initialize();
    this.installSystem();
}

function setup() {
    frameRate(60);
    this.loadSystem();
}

function draw() {
    var system = TopicManager.ready().read(SYSTEMS.MAIN);
    if (system != null) {
        system.onOperate();
    }
}

function mousePressed() {
    var system = TopicManager.ready().read(SYSTEMS.MAIN);
    if (system != null) {
        system.onTouchDown(mouseX, mouseY);
    }
}

function mouseReleased() {
    var system = TopicManager.ready().read(SYSTEMS.MAIN);
    if (system != null) {
        system.onTouchUp(mouseX, mouseY);
    }
}

function mouseDragged() {
    var system = TopicManager.ready().read(SYSTEMS.MAIN);
    if (system != null) {
        system.onTouchHover(mouseX, mouseY); // mobile issue fix
        system.onTouchMove(mouseX, mouseY);
    }
}

function installSystem() {
    var sysMap = new Map();
    sysMap.set(SYSTEMS.MAIN, new MainSystem());
    //..
    for (var [topic, system] of sysMap.entries()) {
        system.onPreload();
        TopicManager.ready().write(topic, system);
    }
}

function loadSystem() {
    var sysArr = [];
    sysArr.push(TopicManager.ready().read(SYSTEMS.MAIN));
    //..
    for (var s of sysArr) {
        s.onCreate();
    }
}

function windowResized() {
    TopicManager.ready().write(DISPLAY_INFO.WINDOW_SIZE, [windowWidth, windowHeight]);
    resizeCanvas(windowWidth, windowHeight);
}

function initialize() {
    var isMobile = /Android|webOS|iPhone|iPad|iPod|Opera Mini/i.test(navigator.userAgent);
    TopicManager.ready().write(DEVICE_INFO.IS_MOBILE, isMobile);

    if (isMobile) {
        TopicManager.ready().write(DISPLAY_INFO.WINDOW_SIZE, [windowWidth, windowHeight]);
    } else {
        TopicManager.ready().write(DISPLAY_INFO.WINDOW_SIZE, [380, 570]);
    }
}