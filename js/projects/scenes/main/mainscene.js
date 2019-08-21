class MainScene extends AbsScene {
    constructor() {
        super();

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
            Springs.followEasing(this.__selectedObject.pos, this.__mPoint, 0.1);
        }

        var list = ObjectPool.shape().getList();
        Collisions.module(list, timeDelta);
        for (var [id1, obj1] of list.entries()) {
            if (obj1.mode == ShapeMode.Static) {
                continue;
            }
            obj1.vel.y += 0.3;
            obj1.updateVel(timeDelta);
            obj1.updatePos(timeDelta);

            if (obj1.pos.x < 0 + obj1.radius) {
                obj1.pos.x = 0 + obj1.radius;
                obj1.vel.x *= -0.6;
            } else if (obj1.pos.x > windowWidth - obj1.radius) {
                obj1.pos.x = windowWidth - obj1.radius;
                obj1.vel.x *= -0.6;
            }
            if (obj1.pos.y < 0 + obj1.radius) {
                obj1.pos.y = 0 + obj1.radius;
                obj1.vel.y *= -0.6;
            } else if (obj1.pos.y > windowHeight - obj1.radius) {
                obj1.pos.y = windowHeight - obj1.radius;
                obj1.vel.y *= -0.6;
            }
        }
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
            this.__selectedObject.vel.zero();
            this.__mPoint.set(tx, ty);
        }
    }
}