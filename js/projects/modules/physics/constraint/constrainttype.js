class ConstraintType {
    constructor() { }

    static createRope(px, py, count, l) {
        var list = [];
        for (var i = 0; i < count; i++) {
            list.push(ObjectPool.connect().insert(new Point(px + (l * i), py)));
        }
        list[0].fixPoint();
        for (var i = 0; i < list.length - 1; i++) {
            ConnectManager.ready().add(new Connect(list[i].id, list[i + 1].id, l, 0.5, 0.0));
        }
    }
}