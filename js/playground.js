var sceneObject;

function setup() {
    onStart();
}

function draw() {
    onUpdate();
    onDraw();
}

//==================

function onStart() {
    createCanvas(500, 500);
    Broker.getInstance().publish(TOPICS.SCENE_LOADER, SCENES.TITLE);

    var str = new AddressBuilder(SCENES.TITLE)
        .appendArg("engery", 100.12)
        .appendArg("okay", "true")
        .build();

    console.log(str);
}

function onPause() {

}

function onUpdate() {
    getScene().onUpdate();
}

function onStop() {

}

function onDraw() {
    getScene().onDraw();
}