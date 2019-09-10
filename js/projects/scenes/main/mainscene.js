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
    }

    initializeUiObject() {
        var px = 30;
        var py = 100;
        var hdiff = 90;
        var collsionButton = UiCreator.newButton(px, py, 100, 50)
            .setText("Collisions")
            .setBgColor(220, 150, 150)
            .setListener(() => {
                this.publishScene(SCENES.COLLISION);
            });
        
        var performanceButton = UiCreator.newButton(px, py + (hdiff * 1), 100, 50)
            .setText("Performance")
            .setBgColor(150, 220, 150)
            .setListener(() => {
                this.publishScene(SCENES.PERFORMANCE);
            });

        var constraintButton = UiCreator.newButton(px, py + (hdiff * 2), 100, 50)
            .setText("Constraint")
            .setBgColor(150, 150, 220)
            .setListener(() => {
                this.publishScene(SCENES.CONSTRAINT);
            });

        var particleButton = UiCreator.newButton(px, py + (hdiff * 3), 100, 50)
            .setText("Particle")
            .setBgColor(220, 220, 150)
            .setListener(() => {
                this.publishScene(SCENES.PARTICLE);
            });

        var etcButton = UiCreator.newButton(px, py + (hdiff * 4), 100, 50)
            .setText("Etc")
            .setBgColor(220, 150, 220)
            .setListener(() => {
                this.publishScene(SCENES.ETC);
            });

        ObjectPool.ui().insert(collsionButton);
        ObjectPool.ui().insert(performanceButton);
        ObjectPool.ui().insert(constraintButton);
        ObjectPool.ui().insert(particleButton);
        ObjectPool.ui().insert(etcButton);
    }

    publishScene(sceneType) {
        TopicManager.ready().publish(TOPICS.SCENE_LOADER, sceneType);
    }
}