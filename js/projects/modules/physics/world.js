class World {
    constructor() {
        // default setting
        this.__iterator = 5;
        this.__gravity = new Vector2d().set(0, 0.2);
        this.__stopLoop = false;
        this.__screen = TopicManager.ready().read(DISPLAY_INFO.WINDOW_SIZE);
    }

    stop() {
        this.__stopLoop = true;
        ConnectManager.ready().clear();
    }

    setGravity(gx, gy) {
        this.__gravity.set(gx, gy);
    }

    setIteratorWorld(count) {
        this.__iterator = count;
    }

    resolveContact(timeDelta) {
        Collisions.module(timeDelta);
    }

    resolveConstraint(timeDelta) {
        for (var i = 0; i < ConnectManager.ready().size(); i++) {
            ConstraintResolver.update(ConnectManager.ready().getAt(i));
        }
    }

    resolveConstraintBlock(point) {
        if (point.pos.x < 0) {
            point.pos.x = 0;
        } else if (point.pos.x > this.__screen[0]) {
            point.pos.x = this.__screen[0];
        }
        if (point.pos.y < 0) {
            point.pos.y = 0;
        } else if (point.pos.y > this.__screen[1]) {
            point.pos.y = this.__screen[1];
            point.pos.x -= (point.pos.x - point.oldPos.x) + point.accel.x;
        }
    }

    module(timeDelta) {
        if (this.__stopLoop) {
            return;
        }

        var list = ObjectPool.connect().getList();
        for (var [id, obj] of list.entries()) {
            obj.addForce(this.__gravity.x, this.__gravity.y);
            obj.updatePos(timeDelta);
            this.resolveConstraintBlock(obj);
        }
        this.resolveConstraint(timeDelta);

        list = ObjectPool.shape().getList();
        for (var [id, obj] of list.entries()) {
            if (obj.mode == ShapeMode.Static) {
                continue;
            }
            obj.updatePos(timeDelta, this.__gravity.x, this.__gravity.y);
        }
        for (var i = 0; i < this.__iterator; i++) {
            for (var [id, obj] of list.entries()) {
                if (obj.mode == ShapeMode.Dynamic) {
                    obj.updateConstraint();
                }
                obj.syncBody();
            }
            this.resolveContact(timeDelta);
        }
    }
}