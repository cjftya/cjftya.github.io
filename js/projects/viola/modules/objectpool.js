var ObjectPool = (function () {
    var __pool;
    var __list;
    var __counter;

    function modules() {
        return {
            insert: function (object) {
                __list.set(object.id, object);
            },
            remove: function (id) {
                __list.delete(id);
            },
            clear: function () {
                __list.clear();
            },
            find: function (id) {
                return __list.get(id);
            },
            getList: function () {
                return __list;
            },
            getCounter() {
                return __counter++;
            }
        }
    }

    return {
        ready: function () {
            if (__pool == null) {
                __pool = modules();
                __list = new Map();
                __counter = 0;
            }
            return __pool;
        }
    };
})();