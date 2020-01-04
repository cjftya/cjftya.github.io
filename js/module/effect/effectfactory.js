var EffectFactory = (function () {
    var __inst;

    function modules() {
        return {
            particle: function (type) {
                switch (type) {
                    case Particle.Snow:
                        return new Snow();
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