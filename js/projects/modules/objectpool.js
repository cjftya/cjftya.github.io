var ObjectPool = (function () {
    var __pool;
    var __list;
    var __objectCounter;

    function modules(type) {
        return {
            insert: function (object) {
                object.setId(++__objectCounter);
                object.setOriginType(type);
                __list.get(type).set(object.id, object);
            },
            remove: function (id) {
                __list.get(type).delete(id);
            },
            clear: function () {
                __list.get(type).clear();
            },
            find: function (id) {
                return __list.get(type).get(id);
            },
            getList: function () {
                return __list.get(type);
            }
        }
    }

    return {
        __ready: function (type) {
            if (__pool == null) {
                __objectCounter = 0;
                __pool = new Map();
                __list = new Map();
            }
            if (__pool.get(type) == null) {
                if (__list.get(type) == null) {
                    __list.set(type, new Map());
                }
                __pool.set(type, modules(type));
            }
            return __pool.get(type);
        },
        release: function() {
            this.__ready(PoolType.Shape).clear();
            this.__ready(PoolType.UI).clear();
        },
        shape: function () {
            return this.__ready(PoolType.Shape);
        },
        ui: function () {
            return this.__ready(PoolType.UI);
        }
    };
})();