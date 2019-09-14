var ConnectManager = (function () {
    var __inst;
    var __list;

    function modules() {
        return {
            add(connect) {
                if (!this.containts(connect)) {
                    __list.push(connect);
                }
            },
            getAt(i) {
                return __list[i];
            },
            size() {
                return __list.length;
            },
            clear() {
                __list = [];
            },
            containts(obj) {
                for (var i = 0; i < __list.length; i++) {
                    var con = __list[i];
                    if ((obj.getIdA() == con.getIdA() && obj.getIdB() == con.getIdB()) ||
                        (obj.getIdA() == con.getIdB() && obj.getIdB() == con.getIdA()) ||
                        (obj.getIdB() == con.getIdA() && obj.getIdA() == con.getIdB())) {
                        return true;
                    }
                }
                return false;
            },
            draw() {
                strokeWeight(1);
                for (var i = 0; i < __list.length; i++) {
                    var aObj = ObjectPool.connect().find(__list[i].getIdA());
                    var bObj = ObjectPool.connect().find(__list[i].getIdB());
                    var color = __list[i].getColor();
                    stroke(color[0], color[1], color[2]);
                    line(aObj.pos.x, aObj.pos.y, bObj.pos.x, bObj.pos.y);
                }
            }
        }
    }

    return {
        ready: function () {
            if (__inst == null) {
                __list = [];
                __inst = modules();
            }
            return __inst;
        }
    };
})();