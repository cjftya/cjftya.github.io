function setup() {
    installSystem();
    loadSystem();

    // if (/Android|webOS|iPhone|iPad|iPod|Opera Mini/i.test(navigator.userAgent)) {
    //     alert("aaa");
    // } else {
    //     alert("bbb");
    // }
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
        system.onTouchMove(mouseX, mouseY);
    }
}

function mouseMoved() {
    var system = TopicManager.ready().read(SYSTEMS.MAIN);
    if (system != null) {
        system.onTouchHover(mouseX, mouseY);
    }
}

function installSystem() {
    TopicManager.ready().write(DISPLAY_INFO.WINDOW_SIZE, [windowWidth, windowHeight]);
    
    TopicManager.ready().write(SYSTEMS.MAIN, new MainSystem());
    TopicManager.ready().write(SYSTEMS.SOUND, new SoundSystem());
}

function loadSystem() {
    var sysArr = [];
    sysArr.push(TopicManager.ready().read(SYSTEMS.MAIN));
    sysArr.push(TopicManager.ready().read(SYSTEMS.SOUND));
    //..
    //..
    for (var i = 0; i < sysArr.length; i++) {
        sysArr[i].onCreate();
    }
}

function windowResized() {
    TopicManager.ready().write(DISPLAY_INFO.WINDOW_SIZE, [windowWidth, windowHeight]);
    resizeCanvas(windowWidth, windowHeight);
}