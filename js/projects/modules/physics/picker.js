class Picker {
    constructor() {
    }

    static pickConnect(px, py) {
        var point = new Vector2d().set(px, py);
        var list = ObjectPool.connect().getList();
        for (var [id, obj] of list.entries()) {
            if (Collisions.circle2point(obj, point)) {
                return id;
            }
        }
        return -1;
    }

    static pick(px, py) {
        var point = new Vector2d().set(px, py);
        var list = ObjectPool.shape().getList();
        for (var [id, obj] of list.entries()) {
            switch (obj.type) {
                case ShapeType.Circle:
                    if (Collisions.circle2point(obj, point)) {
                        return id;
                    }
                    break;
                case ShapeType.Poly:
                    if (Collisions.poly2point(obj, point)) {
                        return id;
                    }
                    break;
            }
        }
        return -1;
    }
}