// main module
var __currentScene = null;

function setup() {
    createCanvas(600, 400);
    Broker.getInstance().publishOnlyValue(TOPICS.WINDOW_SIZE, [600, 400]);
    
    Broker.getInstance().subscribe(TOPICS.SCENE_LOAD_COMPLETE, function(topic, data) {
    	__currentScene = data;
    });

    Broker.getInstance().publish(TOPICS.SCENE_LOADER, new AddressBuilder(SCENES.TITLE)
        .appendArg("update", 1)
        .build());

	 //TimeDeltaUtil.getInstance().setLoggingFPS(true);   
}

function draw() {
    if (__currentScene != null && __currentScene.isUpdate()) {
        TimeDeltaUtil.getInstance().update();
        __currentScene.onUpdate(TimeDeltaUtil.getInstance().getDelta());
        __currentScene.onDraw();
    }
}

function mousePressed() {
	if(__currentScene != null) {
	    __currentScene.onTouchDown(mouseX, mouseY);
    }
}

function mouseReleased() {
	if(__currentScene != null) {
	    __currentScene.onTouchUp(mouseX, mouseY);
    }
}

function mouseMoved() {
	if(__currentScene != null) {
	    __currentScene.onTouchMove(mouseX, mouseY);
    }
}