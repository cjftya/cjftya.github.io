class MainScene extends AbsScene {
    constructor() {
        super();
    }

    onCreate() {
        this.setPresenter(new MainPresenter(this));

        this.__world = new World();
        this.__mPoint = new Vector2d();
        this.__selectedObject = null;
    }

    onStart() {
        this.__world.setGravity(0, 0);

        for (var i = 0; i < 1; i++) {
            ObjectPool.shape().insert(ShapeFactory.createCircle(MathUtil.randInt(50, 600), MathUtil.randInt(50, 600), MathUtil.randInt(40, 50), ShapeMode.Dynamic));
        }
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
        this.getPresenter().onTouchDown(tx, ty);
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
        this.getPresenter().onTouchUp(tx, ty);
        if (this.__selectedObject != null) {
            this.__mPoint.set(this.__selectedObject.pos.x, this.__selectedObject.pos.y);

            if(this.__selectedObject.id == 1) {
                TopicManager.ready().publish(TOPICS.SCENE_LOADER, SCENES.PHYSICS);
            }
            this.__selectedObject = null;
        }
    }

    onTouchMove(tx, ty) {
        this.getPresenter().onTouchMove(tx, ty);
        if (this.__selectedObject != null) {
            this.__mPoint.set(tx, ty);
        }
    }
}