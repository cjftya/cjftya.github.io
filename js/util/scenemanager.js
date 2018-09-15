Broker.getInstance().subscribe(TOPICS.SCENE_LOADER, function (topic, data) {
    loadScene(data);
});

var __sceneObject;

function loadScene(sceneType) {
    switch (sceneType) {
        case SCENES.TITLE:
        __sceneObject = new SceneTitle();
            break;
    }
    __sceneObject.onStart();
}

function getScene() {
    return __sceneObject;
}
