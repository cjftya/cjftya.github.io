class Snow extends AbsParticle {
    constructor() {
        super(Particle.Snow);

        this.__active = false;
        this.__amount = 500;

        this.__particles = [];
        this.__offsets = [];

        var p;
        for (var i = 0; i < this.__amount; i++) {
            p = new ParticleCircle();
            this.setupParticle(p);

            this.__particles.push(p);
            this.__offsets.push(MathUtil.randInt(1, 50) * 0.001);
        }
    }

    setAmount(a) {
        this.__amount = a;
    }

    setupParticle(p) {
        p.pos.x = MathUtil.randInt(50, windowWidth - 50);
        p.pos.y = MathUtil.randInt(100, windowHeight * 2) * -1;
        p.setRadius(MathUtil.randInt(3, 10));

        p.vel.x = (MathUtil.randInt(1, 5) * 0.1) * (MathUtil.randInt(1, 20) <= 10 ? -1 : 1);
        p.vel.y = p.getRadius() * 0.2;

        p.setColor(255, 255, 255);
        p.setAlpha(p.getRadius() * 20);
    }

    start() {
        this.__active = true;
    }

    pause() {
        this.__active = false;
    }

    stop() {
        this.__active = false;
    }

    update(delta) {
        var p, offset;
        for (var i = 0; i < this.__particles.length; i++) {
            p = this.__particles[i];
            offset = this.__offsets[i];

            p.pos.x += p.vel.x + offset;
            p.pos.y += p.vel.y;

            if (p.pos.y > windowHeight + 60) {
                this.setupParticle(p);
            }
            if (p.pos.x < -60) {
                p.pos.x = windowWidth + 30;
            } else if (p.pos.x > windowWidth + 60) {
                p.pos.x = -30;
            }
        }
    }

    draw() {
        for (var i = 0; i < this.__particles.length; i++) {
            this.__particles[i].draw();
        }
    }
}