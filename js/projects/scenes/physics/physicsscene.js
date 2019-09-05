class PhysicsScene extends AbsScene {
    constructor() {
        super();
    }

    onCreate() {
        this.__world = new World();
        this.__mPoint = new Vector2d();
        this.__selectedObject = null;
    }

    onStart() {
        for (var i = 0; i < 5; i++) {
            ObjectPool.shape().insert(ShapeFactory.createCircle(MathUtil.randInt(50, 600), MathUtil.randInt(50, 600), MathUtil.randInt(10, 20), ShapeMode.Dynamic));
        }
        for (var i = 0; i < 5; i++) {
            ObjectPool.shape().insert(ShapeFactory.createRect(MathUtil.randInt(50, 600), MathUtil.randInt(50, 600),
                MathUtil.randInt(30, 80), MathUtil.randInt(20, 50), MathUtil.randInt(0, 45), ShapeMode.Dynamic));
        }
        // ground
        ObjectPool.shape().insert(ShapeFactory.createRect(windowWidth / 2, windowHeight,
            windowWidth, 30, 0, ShapeMode.Static));

        // left
        ObjectPool.shape().insert(ShapeFactory.createRect(0, windowHeight / 2,
            30, windowHeight, 0, ShapeMode.Static));

        // right
        ObjectPool.shape().insert(ShapeFactory.createRect(windowWidth, windowHeight / 2,
            30, windowHeight, 0, ShapeMode.Static));

        // right
        ObjectPool.shape().insert(ShapeFactory.createRect(150, windowHeight / 2,
            windowWidth / 3, 50, 35, ShapeMode.Static));
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
}

