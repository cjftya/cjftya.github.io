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

function mouseMoved() {
    var system = TopicManager.ready().read(SYSTEMS.MAIN);
    if (system != null) {
        system.onTouchMove(mouseX, mouseY);
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

// accelerometer Data
window.addEventListener('deviceorientation', function (e) {
    alpha = e.alpha;
    beta = e.beta;
    gamma = e.gamma;
});