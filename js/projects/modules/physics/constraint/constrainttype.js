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

    static createCloth(px, py, wc, hc, l) {
        var list = [];
        for (var i = 0; i < hc; i++) {
            list.push([]);
            for (var k = 0; k < wc; k++) {
                list[i].push(ObjectPool.connect().insert(new Point(px + (l * k), py + (l * i))));
            }
        }
        list[0][0].fixPoint();
        list[0][wc - 1].fixPoint();

        var ax = [1, 1, 0, 1];
        var ay = [-1, 0, 1, 1];
        for (var i = 0; i < hc; i++) {
            for (var k = 0; k < wc; k++) {
                for (var p = 0; p < 4; p++) {
                    var tx = k + ax[p];
                    var ty = i + ay[p];
                    if (tx >= 0 && tx < wc && ty >= 0 && ty < hc) {
                        var dist = Vector2d.sub(list[i][k].pos, list[ty][tx].pos).length();
                        ConnectManager.ready().add(new Connect(list[i][k].id, list[ty][tx].id, dist, 0.9, 0.5));
                    }
                }
            }
        }
    }
}