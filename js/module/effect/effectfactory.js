class EffectFactory {
    constructor() { }

    static createParticle(type) {
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