class CollisionScene extends AbsScene {
    constructor() {
        super();
    }

    onCreate() {
        this.__world = new World();
        this.__oldPoint = new Vector2d();
        this.__selectedObject = null;
    }

    onStart() {
        var winSize = TopicManager.ready().read(DISPLAY_INFO.WINDOW_SIZE);
        var backButton = UiCreator.newButton(winSize[0] - 115, 5, 80, 40)
            .setText("Back")
            .setAllColor(220, 150, 150)
            .setListener(() => {
                TopicManager.ready().publish(TOPICS.SCENE_LOADER, SCENES.MAIN);
            });
        ObjectPool.ui().insert(backButton);

        DemoCollsion.Demo2(ObjectPool.shape());
    }

    onPause() {
    }

    onUpdate(timeDelta) {
        // if (this.__selectedObject != null) {
        //     Springs.followEasingVel(this.__selectedObject, this.__mPoint, 0.1);
        // }

        this.__world.module(timeDelta);
    }

    onDraw() {
        background(20, 20, 40);
        noStroke();

        var list = ObjectPool.shape().getList();
        for (var [id, obj] of list.entries()) {
            obj.draw();
        }
    }

    onEnd() {
        this.__world.stop();
        ObjectPool.release();
    }

    onDestroy() {
    }

    onTouchDown(tx, ty) {
        this.__oldPoint.set(tx, ty);

        var id = Picker.pick(tx, ty);
        if (id > -1) {
            console.log("obj id : " + id);
            this.__selectedObject = ObjectPool.shape().find(id);
            if (this.__selectedObject.mode == ShapeMode.Static) {
                this.__selectedObject = null;
            }
        }
    }

    onTouchUp(tx, ty) {
        if (this.__selectedObject != null) {
            this.__selectedObject = null;
        }
    }

    onTouchMove(tx, ty) {
        if (this.__selectedObject != null) {
            var vx = (tx - this.__oldPoint.x) * 0.1;
            var vy = (ty - this.__oldPoint.y) * 0.1;

            this.__selectedObject.movePos(vx, vy);

            this.__oldPoint.set(tx, ty);
        }
    }
}

