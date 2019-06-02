class MainScene extends AbsScene {
    constructor() {
        super();

        this.__mPoint = new Vector2d();
        this.__selectedObject = null;
    }

    onCreate() {
        this.setPresenter(new MainPresenter(this));

        for (var i = 0; i < 70; i++) {
            ObjectPool.ready().insert(new Circle(MathUtil.randInt(50, 600), MathUtil.randInt(50, 600), MathUtil.randInt(10, 20)));
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

        var list = ObjectPool.ready().getList();
        for (var [id1, obj1] of list.entries()) {
            for (var [id2, obj2] of list.entries()) {
                if (id1 == id2) {
                    continue;
                }
                Collisions.checkCollision(obj1, obj2, timeDelta);
            }
        }
        for (var [id1, obj1] of list.entries()) {
            obj1.updateVel(timeDelta);
            obj1.updatePos(timeDelta);

            if (obj1.pos.x < 0 + obj1.radius) {
                obj1.pos.x = 0 + obj1.radius;
            } else if (obj1.pos.x > windowWidth - obj1.radius) {
                obj1.pos.x = windowWidth - obj1.radius;
            }
            if (obj1.pos.y < 0 + obj1.radius) {
                obj1.pos.y = 0 + obj1.radius;
            } else if (obj1.pos.y > windowHeight - obj1.radius) {
                obj1.pos.y = windowHeight - obj1.radius;
            }
        }
    }

    onDraw() {
        background(255, 255, 255);
        noStroke();

        var list = ObjectPool.ready().getList();
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
            this.__selectedObject = ObjectPool.ready().find(id);
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