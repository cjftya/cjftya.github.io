var EffectFactory = (function () {
    var __inst;

    function modules() {
        return {
            particle: function (type) {
                var winSize = TopicManager.ready().read(DISPLAY_INFO.WINDOW_SIZE);
                var amount = Math.sqrt(Math.pow(winSize[0],2) + Math.pow(winSize[1],2));

                console.log(Math.floor((amount / 2) - 150));
                switch (type) {
                    case Particle.Snow:
                        return new Snow(winSize[0], winSize[1], amount);
                    default:
                        return null;
                }
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
        createParticle: function (type) {
            return this.__ready().particle(type);
        }
    };
})();