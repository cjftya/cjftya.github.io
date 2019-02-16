Broker.getInstance().subscribe(TOPICS.SCENE_LOADER, function (topic, data) {
    var sceneType = AddressUtil.getInstance().getAddress(data);
    var sceneObject = null;
    switch (sceneType) {
        case SCENES.TITLE:
            sceneObject = new TitleScene(data);
            break;
    }
    sceneObject.onStart();
    
    Broker.getInstance().publish(TOPICS.SCENE_LOAD_COMPLETE, sceneObject);

    console.log("loaded " + sceneType + " scene");
});

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
