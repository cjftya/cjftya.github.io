class Spray extends AbsParticle {
    constructor() {
        super(Particle.Spray);

        this.__center = new Vector2d();
        this.__life = 0;

        this.__freq = 0;
        this.__freqCount = 0;
        this.__sprayCount = 0;

        this.__amount = 30;
        this.__particles = [];
        for (var i = 0; i < this.__amount; i++) {
            this.__particles.push(new ParticleCircle());
        }
    }

    setupPaticle(p) {
        p.pos.x = this.__center.x + Math.cos(MathUtil.angle2rad(MathUtil.randInt(0, 360))) * 15;
        p.pos.y = this.__center.y + Math.sin(MathUtil.angle2rad(MathUtil.randInt(0, 360))) * 15;
        p.setRadius(MathUtil.randInt(1, 3));

        p.vel.x = Math.cos(MathUtil.angle2rad(MathUtil.randInt(0, 360))) * (MathUtil.randInt(1, 5) * 0.1);
        p.vel.y = Math.sin(MathUtil.angle2rad(MathUtil.randInt(0, 360))) * (MathUtil.randInt(1, 5) * 0.1);

        p.setAlpha(250);
        p.setLife(this.__life);
    }

    setPos(x, y) {
        this.__center.set(x, y);
    }

    setFreq(f) {
        this.__freq = f;
    }

    setLife(v) {
        this.__life = v;
    }

    start() {

    }

    pause() {

    }

    stop() {

    }

    update(delta) {
        this.__freqCount += delta;
        if (this.__freqCount >= this.__freq) {
            this.__freqCount = 0;

            this.setupPaticle(this.__particles[this.__sprayCount++]);
            if (this.__sprayCount == this.__particles.length - 1) {
                this.__sprayCount = 0;
            }
        }
        for (var p of this.__particles) {
            if (p.getLife() > 0) {
                p.pos.x += p.vel.x;
                p.pos.y += p.vel.y;
                p.decreaseLife(delta * 100);
                p.setAlpha((250 * p.getLife()) / this.__life);
            }
        }
    }

    draw() {
        for (var p of this.__particles) {
            p.draw();
        }
    }
}