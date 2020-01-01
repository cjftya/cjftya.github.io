var EffectFactory = (function () {
    var __inst;

    function modules() {
        return {
            cursor: function () {
                return null;
            },
            background: function () {
                return null;
            }
        }
    }

    return {
        __ready: function () {
            if (__inst == null) {
                __inst = modules();
            }
            return __inst;
        },
        createCursor: function () {
            return this.__ready().pentagon();
        },
        createBackground: function () {
            return this.__ready().rect();
        }
    };
})();