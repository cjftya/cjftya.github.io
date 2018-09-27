Broker.getInstance().subscribe(TOPICS.SCENE_LOADER, function (topic, data) {
    var sceneType = AddressUtil.getInstance().getAddress(data);
    switch (sceneType) {
        case SCENES.TITLE:
            __sceneObject = new SceneTitle(data);
            break;
    }
    __sceneObject.onStart();

    console.log("loaded " + sceneType + " scene");
});

var __sceneObject;

function getScene() {
    return __sceneObject;
}

Broker.getInstance().subscribe(TOPICS.SCENE_LIFE_CYCLE, function (topic, data) {
    switch (data) {
        case LIFE_CYCLE.ON_START:
            getScene().onStart();
            break;
        case LIFE_CYCLE.ON_PAUSE:
            getScene().onPause();
            break;
        case LIFE_CYCLE.ON_STOP:
            getScene().onStop();
            break;
    }
    console.log("life cycle : " + data);
});
