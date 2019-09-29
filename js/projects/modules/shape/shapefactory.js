var ShapeFactory = (function () {
    var __inst;

    function modules() {
        return {
            pentagon: function (px, py, s, mode) {
                return new Pentagon(px, py, s, mode);
            },
            rect: function (px, py, w, h, mode) {
                return new Rect(px, py, w, h, mode);
            },
            triangle: function (px, py, s, mode) {
                return new Triangle(px, py, s, mode);
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
        createPentagon: function (px, py, s, mode) {
            return this.__ready().pentagon(px, py, s, mode);
        },
        createRect: function (px, py, w, h, mode) {
            return this.__ready().rect(px, py, w, h, mode);
        },
        createTriangle: function (px, py, s, mode) {
            return this.__ready().triangle(px, py, s, mode);
        },
        createCircle: function (px, py, r, mode) {
            return this.__ready().circle(px, py, r, mode);
        }
    };
})();