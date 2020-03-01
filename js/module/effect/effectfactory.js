var EffectFactory = (function () {
    var __inst;

    function modules() {
        return {
            particle: function (type) {
                switch (type) {
                    case Particle.Snow:
                        return new Snow();
                    case Particle.Spray:
                        return new Spray();
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
        },
        createLineTrace: function () {
            return new LineTrace();
        }
    };
})();