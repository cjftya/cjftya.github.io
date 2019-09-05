var UiManager = (function () {
    var __inst;

    function modules() {
        return {
            draw: function () {
                var list = ObjectPool.ui().getList();
                for (var [id, obj] of list.entries()) {
                    obj.onDraw();
                }
            },
            touchDown: function (px, py) {
                var list = ObjectPool.ui().getList();
                for (var [id, obj] of list.entries()) {
                    obj.onTouchDown(px, py);
                }
            },
            touchUp: function (px, py) {
                var list = ObjectPool.ui().getList();
                for (var [id, obj] of list.entries()) {
                    obj.onTouchUp(px, py);
                }
            },
            touchMove: function (px, py) {
                var list = ObjectPool.ui().getList();
                for (var [id, obj] of list.entries()) {
                    obj.onTouchMove(px, py);
                }
            }
        }
    }

    return {
        ready: function () {
            if (__inst == null) {
                __inst = modules();
            }
            return __inst;
        }
    };
})();