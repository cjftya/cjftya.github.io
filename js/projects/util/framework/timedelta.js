var TimeDeltaUtil = (function () {
    var __timeDeltaUtil;

    var __frameCount;
    var __timeElapsed;
    var __lastTime;
    var __timeDelta;
    var __fpsCount;
    var __isLoggingFPS;

    function modules() {
        return {
            setLoggingFPS: function (enable) {
                __isLoggingFPS = enable;
            },

            update: function () {
                var newTime = Date.now();
                __timeDelta = (newTime - __lastTime) * 0.001;

                __frameCount++;
                __timeElapsed += __timeDelta;
                if (__timeElapsed >= 1.0) {
                    __fpsCount = __frameCount / __timeElapsed;
                    __frameCount = 0;
                    __timeElapsed = 0;
                }
                __lastTime = newTime;
            },

            getDelta: function () {
                return __timeDelta;
            },

            getFPS: function () {
                return __fpsCount;
            }
        }
    }

    return {
        getInstance: function () {
            if (__timeDeltaUtil == null) {
                __timeDeltaUtil = modules();
                __newTime = __frameCount = __timeElapsed = __timeDelta
                = __fpsCount = 0;
                __lastTime = Date.now();
                __isLoggingFPS = false;
            }
            return __timeDeltaUtil;
        }
    };
})();