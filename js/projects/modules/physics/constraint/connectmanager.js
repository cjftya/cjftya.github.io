var ConnectManager = (function () {
    var __inst;
    var __list;

    function modules() {
        return {
            add(connect) {
                __list.push(connect);
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
            draw() {
                for (var i = 0; i < __list.length; i++) {
                    var aObj = ObjectPool.connect().find(__list[i].getIdA());
                    var bObj = ObjectPool.connect().find(__list[i].getIdB());
                    stroke(0);
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