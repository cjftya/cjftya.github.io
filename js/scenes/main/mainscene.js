class MainScene extends AbsScene {
    constructor() {
        super();

        this.__circle = null;
        this.__mx = 0;
        this.__my = 0;
    }

    onCreate() {
        this.setPresenter(new MainPresenter(this));

        textSize(20);

        this.__circle = new Circle(50, 200, 20);
        ObjectPool.ready().insert(this.__circle);
        for (var i = 0; i < 70; i++) {
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

        // fill(255);
        // text(this.__debug, 10, 150);

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
        this.__mx = tx;
        this.__my = ty;
        this.getPresenter().onTouchDown(tx, ty);
    }

    onTouchUp(tx, ty) {
        var dx = tx - this.__mx;
        var dy = ty - this.__my;
        var dot = Math.sqrt(dx * dx + dy * dy);
        this.__circle.addForce((dx / dot) * 10, (dy / dot) * 10);
        this.getPresenter().onTouchUp(tx, ty);
    }

    onTouchMove(tx, ty) {
        this.getPresenter().onTouchMove(tx, ty);
    }

    onGyroControl(x, y, z) {
    }
}