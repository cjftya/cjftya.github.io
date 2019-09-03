class World {
    constructor() {
        this.__contactList = new ContackDataStruct();
        this.__iterator = 3;
    }

    resolveContact(timeDelta) {
        for (var i = 0; i < this.__iterator; i++) {
            Collisions.module(this.__contactList, timeDelta);
        }
    }

    runPhysics(timeDelta) {
        for (var i = 0; i < this.__contactList.getConArr().length; i++) {
            var contact = this.__contactList.getConArr()[i];
            var sameCount = this.__contactList.getCount(contact.getIdA());
            CollisionResolver.preUpdate(contact, sameCount);
        }
        this.__contactList.clear();
    }

    module(timeDelta) {
        var list = ObjectPool.shape().getList();
        for (var [id, obj] of list.entries()) {
            if (obj.mode == ShapeMode.Static) {
                continue;
            }
            obj.addForce(0, 0.4);
            obj.updateVel(timeDelta);
            obj.updatePos(timeDelta);
        }

        this.resolveContact(timeDelta);
  //      this.runPhysics(timeDelta);
    }
}