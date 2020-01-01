class ConstraintScene extends AbsScene {
    constructor() {
        super();
    }

    onCreate() {
        this.__world = new World();
        this.__mPoint = new Vector2d();
        this.__selectedObject = null;
    }

    onStart() {
        var winSize = TopicManager.ready().read(DISPLAY_INFO.WINDOW_SIZE);
        var backButton = UiCreator.newButton(winSize[0] - 85, 5, 80, 40)
            .setText("Back")
            .setAllColor(150, 150, 220)
            .setListener(() => {
                TopicManager.ready().publish(TOPICS.SCENE_LOADER, SCENES.MAIN);
            });
        ObjectPool.ui().insert(backButton);

        ConstraintType.createRope(150, 290, 7, 25);
        ConstraintType.createCloth(100, 50, 5, 5, 50);
        ConstraintType.createSoftBox(250, 250, 100);

        this.__world.setGravity(0, 0.4);
    }

    onPause() {
    }

    onUpdate(timeDelta) {
        this.__world.module(timeDelta);
    }

    onDraw() {
        background(20, 20, 40);
        noStroke();

        var list = ObjectPool.connect().getList();
        for (var [id, obj] of list.entries()) {
            obj.draw();
        }
        //ConnectManager.ready().draw();
    }

    onEnd() {
        this.__world.stop();
        ObjectPool.release();
    }

    onDestroy() {
    }

    onTouchDown(tx, ty) {
        var id = Picker.pickConnect(tx, ty);
        if (id > -1) {
            console.log("obj id : " + id);
            this.__selectedObject = ObjectPool.connect().find(id);
            this.__selectedObject.pick(tx, ty);
        }
    }

    onTouchUp(tx, ty) {
        if (this.__selectedObject != null) {
            this.__selectedObject.release(tx, ty);
            this.__selectedObject = null;
        }
    }

    onTouchMove(tx, ty) {
        if (this.__selectedObject != null) {
            this.__selectedObject.move(tx, ty);
        }
    }
}