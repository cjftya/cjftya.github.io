class World {
    constructor() {
        // default setting
        this.__iterator = 1;
        this.__gravity = new Vector2d().set(0, 0.4);
        this.__stopLoop = false;
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
        for (var i = 0; i < this.__iterator; i++) {
            Collisions.module(timeDelta);
        }
    }

    resolveConstraint(timeDelta) {
        for (var i = 0; i < ConnectManager.ready().size(); i++) {
            ConstraintResolver.update(ConnectManager.ready().getAt(i));
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
        }
        this.resolveConstraint(timeDelta);

        list = ObjectPool.shape().getList();
        for (var [id, obj] of list.entries()) {
            if (obj.mode == ShapeMode.Static) {
                continue;
            }
            obj.addForce(this.__gravity.x, this.__gravity.y);
            obj.updateVel(timeDelta);
            obj.updatePos(timeDelta);
        }
        this.resolveContact(timeDelta);
    }
}