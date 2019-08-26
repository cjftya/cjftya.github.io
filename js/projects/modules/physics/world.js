class World {
    constructor() {
        this.__contactList = new ContackDataStruct();
    }

    resolveContact(timeDelta) {
        Collisions.module(this.__contactList, timeDelta);
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
        for (var [id1, obj1] of list.entries()) {
            if (obj1.mode == ShapeMode.Static) {
                continue;
            }
            obj1.addForce(0, 0.4);
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

        this.resolveContact(timeDelta);
  //      this.runPhysics(timeDelta);
    }
}