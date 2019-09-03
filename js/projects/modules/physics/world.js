class World {
    constructor() {
        // default setting
        this.__iterator = 1;
        this.__gravity = new Vector2d().set(0, 0.4);
        this.__stopLoop = false;
    }

    stop() {
        this.__stopLoop = true;
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

    module(timeDelta) {
        if (this.__stopLoop) {
            return;
        }

        var list = ObjectPool.shape().getList();
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