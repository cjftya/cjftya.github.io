var ShapeFactory = (function () {
    var __inst;

    function modules() {
        return {
            rect: function (px, py, w, h, mode) {
                return new Rect(px, py, w, h, mode);
            },
            circle: function (px, py, r, mode) {
                return new Circle(px, py, r, mode);
            }
        }
    }

    return {
        __ready: function () {
            if (__inst == null) {
                __counter = 0;
                __inst = modules();
            }
            return __inst;
        },
        createRect: function (px, py, w, h, mode) {
            return this.__ready().rect(px, py, w, h, mode);
        },
        createCircle: function (px, py, r, mode) {
            return this.__ready().circle(px, py, r, mode);
        }
    };
})();