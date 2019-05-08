function setup() {
    installSystem();
    loadSystem();
}

function draw() {
    var system = TopicManager.ready().read(SYSTEMS.MAIN);
    if (system != null) {
        system.onOperate();
    }
}

function touchStarted(event) {
    var system = TopicManager.ready().read(SYSTEMS.MAIN);
    if (system != null) {
        system.onTouchDown(event.clientX, event.clientY);
    }
}

function touchEnded(event) {
    var system = TopicManager.ready().read(SYSTEMS.MAIN);
    if (system != null) {
        system.onTouchUp(event.clientX, event.clientY);
    }
}

function touchMoved(event) {
    var system = TopicManager.ready().read(SYSTEMS.MAIN);
    if (system != null) {
        system.onTouchMove(event.clientX, event.clientY);
    }
}

function installSystem() {
    TopicManager.ready().write(SYSTEMS.MAIN, new MainSystem());
    //..
    //..
}

function loadSystem() {
    var sysArr = [];
    sysArr.push(TopicManager.ready().read(SYSTEMS.MAIN));
    //..
    //..
    for (var i = 0; i < sysArr.length; i++) {
        sysArr[i].onCreate();
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}