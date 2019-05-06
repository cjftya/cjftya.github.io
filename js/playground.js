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

window.addEventListener('deviceorientation', function (e) {
    var system = TopicManager.ready().read(SYSTEMS.MAIN);
    if (system != null) {
        var beta = e.beta;
        if (beta > 90) {
            beta = 90;
        } else if (beta < -90) {
            beta = -90;
        }
        system.onGyroControl(e.gamma / 1, beta / 1, e.alpha);
    }
}, false);