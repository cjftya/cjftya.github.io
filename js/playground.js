// main module
let __timeDeltaTool;

function setup() {
    createCanvas(400, 720);
    Broker.getInstance().publishOnlyValue(TOPICS.WINDOW_SIZE, [400, 720]);

    __timeDeltaTool = new TimeDelta();
    //__timeDeltaTool.setLoggingFPS(true);

    var address = new AddressBuilder(SCENES.TITLE)
        .appendArg("update", 1)
        .build();
    Broker.getInstance().publish(TOPICS.SCENE_LOADER, address);
}

function draw() {
    var scene = getScene();
    if (scene != null && scene.isUpdate()) {
        __timeDeltaTool.update();
        scene.onUpdate(__timeDeltaTool.getDelta());
        scene.onDraw();
    }
}

function mousePressed() {
    getScene().onTouchDown(mouseX, mouseY);
}

function mouseReleased() {
    getScene().onTouchUp(mouseX, mouseY);
}

function mouseMoved() {
    getScene().onTouchMove(mouseX, mouseY);
}