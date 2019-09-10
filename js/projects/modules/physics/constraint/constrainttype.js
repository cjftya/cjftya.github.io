class ConstraintType {
    constructor() { }

    static __getConnect(a, b, l, cf, df) {
        return new Connect(a.id, b.id, l, cf, df);
    }

    static __getConnectAutoDist(a, b, cf, df) {
        var dist = Vector2d.sub(a.pos, b.pos).length();
        return new Connect(a.id, b.id, dist, cf, df);
    }

    static __getRandomColor() {
        return [MathUtil.randNum(255), MathUtil.randNum(255), MathUtil.randNum(255)];   
    }

    static createRope(px, py, count, l) {
        var list = [];
        var color = this.__getRandomColor();
        for (var i = 0; i < count; i++) {
            var p = new Point(px + (l * i), py);
            p.color = color;
            list.push(ObjectPool.connect().insert(p));
        }
        list[0].fixPoint();
        for (var i = 0; i < list.length - 1; i++) {
            ConnectManager.ready().add(this.__getConnect(list[i], list[i + 1], l, 0.5, 0));
        }
    }

    static createSoftBox(px, py, size) {
        var list = [];
        var color = this.__getRandomColor();
        var s = size / 2;
        for (var i = 0, ip = py - s; i < 3; i++ , ip += s) {
            list.push([]);
            for (var k = 0, kp = px - s; k < 3; k++ , kp += s) {
                if (i == 1 && k == 1) {
                    list[i].push(null);
                    continue;
                }
                var p = new Point(kp, ip);
                p.color = color;
                list[i].push(ObjectPool.connect().insert(p));
            }
        }
        /*
        0,0  0,1  0,2
        1,0  1,1  1,2
        2,0  2,1  2,2
        */
        var energy = 0.5;
        ConnectManager.ready().add(this.__getConnectAutoDist(list[0][0], list[0][1], energy, 0.0));
        ConnectManager.ready().add(this.__getConnectAutoDist(list[0][1], list[0][2], energy, 0.0));
        ConnectManager.ready().add(this.__getConnectAutoDist(list[0][2], list[1][2], energy, 0.0));
        ConnectManager.ready().add(this.__getConnectAutoDist(list[1][2], list[2][2], energy, 0.0));
        ConnectManager.ready().add(this.__getConnectAutoDist(list[2][2], list[2][1], energy, 0.0));
        ConnectManager.ready().add(this.__getConnectAutoDist(list[2][1], list[2][0], energy, 0.0));
        ConnectManager.ready().add(this.__getConnectAutoDist(list[2][0], list[1][0], energy, 0.0));
        ConnectManager.ready().add(this.__getConnectAutoDist(list[0][0], list[1][0], energy, 0.0));

        ConnectManager.ready().add(this.__getConnectAutoDist(list[0][1], list[1][0], energy, 0.0));
        ConnectManager.ready().add(this.__getConnectAutoDist(list[0][2], list[2][0], energy, 0.0));
        ConnectManager.ready().add(this.__getConnectAutoDist(list[1][2], list[2][1], energy, 0.0));

        ConnectManager.ready().add(this.__getConnectAutoDist(list[1][0], list[2][1], energy, 0.0));
        ConnectManager.ready().add(this.__getConnectAutoDist(list[0][0], list[2][2], energy, 0.0));
        ConnectManager.ready().add(this.__getConnectAutoDist(list[0][1], list[1][2], energy, 0.0));

        ConnectManager.ready().add(this.__getConnectAutoDist(list[0][1], list[2][1], energy, 0.0));
        ConnectManager.ready().add(this.__getConnectAutoDist(list[1][0], list[1][2], energy, 0.0));
    }

    static createCloth(px, py, wc, hc, l) {
        var list = [];
        var color = this.__getRandomColor();
        for (var i = 0; i < hc; i++) {
            list.push([]);
            for (var k = 0; k < wc; k++) {
                var p = new Point(px + (l * k), py + (l * i));
                p.color = color;
                list[i].push(ObjectPool.connect().insert(p));
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
                        var con = this.__getConnectAutoDist(list[i][k], list[ty][tx], 0.9, 0.5);
                        con.setIgnoreCompressForce(true);
                        ConnectManager.ready().add(con);
                    }
                }
            }
        }
    }
}