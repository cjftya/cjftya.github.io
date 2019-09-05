class MainScene extends AbsScene {
    constructor() {
        super();
    }

    onCreate() {
        this.__world = new World();
        this.__mPoint = new Vector2d();
        this.__selectedObject = null;
    }

    onStart() {
        this.initializeUiObject();
        this.initializePhysicsObject();
    }

    onPause() {
    }

    onUpdate(timeDelta) {
        if (this.__selectedObject != null) {
            Springs.followEasingVel(this.__selectedObject, this.__mPoint, 0.1);
        }

        this.__world.module(timeDelta);
    }

    onDraw() {
        background(255, 255, 255);
        noStroke();

        var list = ObjectPool.shape().getList();
        for (var [id, obj] of list.entries()) {
            obj.draw();
        }
    }

    onEnd() {
        ObjectPool.release();
    }

    onDestroy() {
    }

    onTouchDown(tx, ty) {
        var id = Picker.pick(tx, ty);
        if (id > -1) {
            console.log("obj id : " + id);
            this.__selectedObject = ObjectPool.shape().find(id);
            if (this.__selectedObject.mode == ShapeMode.Static) {
                this.__selectedObject = null;
            }
        }
        this.__mPoint.set(tx, ty);
    }

    onTouchUp(tx, ty) {
        if (this.__selectedObject != null) {
            this.__mPoint.set(this.__selectedObject.pos.x, this.__selectedObject.pos.y);
            this.__selectedObject = null;
        }
    }

    onTouchMove(tx, ty) {
        if (this.__selectedObject != null) {
            this.__mPoint.set(tx, ty);
        }
    }

    initializePhysicsObject() {
        this.__world.setGravity(0, 0);

        for (var i = 0; i < 1; i++) {
            ObjectPool.shape().insert(ShapeFactory.createCircle(MathUtil.randInt(50, 600), MathUtil.randInt(50, 600), MathUtil.randInt(40, 50), ShapeMode.Dynamic));
        }
    }

    initializeUiObject() {
        var button = UiCreator.newButton(100, 100, 100, 50)
            .setText("Collisions")
            .setBgColor(220, 150, 150)
            .setListener(() => {
                this.callScene();
            });
        ObjectPool.ui().insert(button);
    }

    callScene() {
        TopicManager.ready().publish(TOPICS.SCENE_LOADER, SCENES.PHYSICS);
    }
}