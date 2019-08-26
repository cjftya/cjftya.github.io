class MainScene extends AbsScene {
    constructor() {
        super();

        this.__world = new World();
        this.__mPoint = new Vector2d();
        this.__selectedObject = null;
    }

    onCreate() {
        this.setPresenter(new MainPresenter(this));

        for (var i = 0; i < 50; i++) {
            ObjectPool.shape().insert(ShapeFactory.createCircle(MathUtil.randInt(50, 600), MathUtil.randInt(50, 600), MathUtil.randInt(10, 20), ShapeMode.Dynamic));
        }
        for (var i = 0; i < 7; i++) {
            ObjectPool.shape().insert(ShapeFactory.createRect(MathUtil.randInt(50, 600), MathUtil.randInt(50, 600),
                MathUtil.randInt(30, 80), MathUtil.randInt(10, 50), MathUtil.randInt(0, 45), ShapeMode.Dynamic));
        }
        
    }

    onPause() {
    }

    onStart() {
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
    }

    onDestroy() {
    }

    onTouchDown(tx, ty) {
        this.getPresenter().onTouchDown(tx, ty);
        var id = Picker.pick(tx, ty);
        if (id > -1) {
            console.log("obj id : " + id);
            this.__selectedObject = ObjectPool.shape().find(id);
        }
        this.__mPoint.set(tx, ty);
    }

    onTouchUp(tx, ty) {
        this.getPresenter().onTouchUp(tx, ty);
        if (this.__selectedObject != null) {
            this.__mPoint.set(this.__selectedObject.pos.x, this.__selectedObject.pos.y);
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