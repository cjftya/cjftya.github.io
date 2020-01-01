class CollisionScene extends AbsScene {
    constructor() {
        super();
    }

    onCreate() {
        this.__world = new World();
        this.__oldPoint = new Vector2d();
        this.__selectedObject = null;
        this.__selectedVertex = null;
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
        var pickData = Picker.pickPoint(tx, ty);
        if (pickData != null) {
            this.__selectedObject = pickData[0];
            this.__selectedVertex = pickData[1];
            if (this.__selectedObject.mode == ShapeMode.Static) {
                this.__selectedObject = null;
            } else {
                this.__selectedObject.pick(this.__selectedVertex);
                console.log("obj id : " + this.__selectedObject + ", vertex id : " + this.__selectedVertex);
            }
        }
    }

    onTouchUp(tx, ty) {
        if (this.__selectedObject != null) {
            this.__selectedObject.release(this.__selectedVertex);
            this.__selectedObject = null;
        }
    }

    onTouchMove(tx, ty) {
        if (this.__selectedObject != null) {
            var nx = tx - this.__oldPoint.x;
            var ny = ty - this.__oldPoint.y;

            this.__selectedObject.move(this.__selectedVertex, nx, ny);

            this.__oldPoint.set(tx, ty);
        }
    }
}

