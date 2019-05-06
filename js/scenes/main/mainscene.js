class MainScene extends AbsScene {
    constructor() {
        super();

        this.__circle = null;
    }

    onCreate() {
        this.setPresenter(new MainPresenter(this));

        this.__circle = new Circle(50, 200, 20);
        ObjectPool.ready().insert(this.__circle);
        for (var i = 0; i < 50; i++) {
            ObjectPool.ready().insert(new Circle(MathUtil.randInt(50, 600), MathUtil.randInt(50, 600), MathUtil.randInt(10, 20)));
        }
    }

    onPause() {
    }

    onStart() {
    }

    onUpdate(timeDelta) {
        var list = ObjectPool.ready().getList();
        for (var [id1, obj1] of list.entries()) {
            for (var [id2, obj2] of list.entries()) {
                if (id1 == id2) {
                    continue;
                }
                Collisions.ready().isCollide(obj1, obj2, timeDelta);
            }
        }
        for (var [id1, obj1] of list.entries()) {
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
        background(0, 0, 0);
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
        this.__circle.addForce(20, 0);

        this.getPresenter().onTouchDown(tx, ty);
    }

    onTouchUp(tx, ty) {
        this.getPresenter().onTouchUp(tx, ty);
    }

    onTouchMove(tx, ty) {
        this.getPresenter().onTouchMove(tx, ty);
    }

    onGyroControl(x, y, z) {
        this.__circle.addForce(x * 4, y * 4);
    }
}