class Picker {
    constructor() {
    }

    static pick(px, py) {
        var point = new Vector2d();
        var list = ObjectPool.shape().getList();
        for (var [id, obj] of list.entries()) {
            point.set(px, py);
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