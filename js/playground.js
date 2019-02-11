// main module
let __timeDeltaTool;

function setup() {
    createCanvas(600, 400);
    Broker.getInstance().publishOnlyValue(TOPICS.WINDOW_SIZE, [600, 400]);

    __timeDeltaTool = new TimeDelta();
    //__timeDeltaTool.setLoggingFPS(true);

    Broker.getInstance().publish(TOPICS.SCENE_LOADER, new AddressBuilder(SCENES.TITLE)
        .appendArg("update", 1)
        .build());
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