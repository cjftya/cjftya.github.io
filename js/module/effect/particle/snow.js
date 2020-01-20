class Snow extends AbsParticle {
    constructor(w, h, amount) {
        super(Particle.Snow);

        this.__active = false;

        this.__w = w;
        this.__h = h;
        this.__windDir = new Vector2d();
        this.__windEnergy = new Vector2d();

        this.__amount = amount;
        this.__particles = [];
        this.__offsets = [];

        this.__winSize = TopicManager.ready().read(DISPLAY_INFO.WINDOW_SIZE);

        var p;
        for (var i = 0; i < amount; i++) {
            p = new ParticleCircle();
            this.setupParticle(p, true);

            this.__particles.push(p);
            this.__offsets.push(MathUtil.randInt(1, 50) * 0.001);
        }
    }

    setWind(wx, wy) {
        this.__windDir.set(wx < 0 ? -1 : 1, wy < 0 ? -1 : 1);
        this.__windEnergy.set(this.__windDir.x == 1 ? wx : -wx,
            this.__windDir.y == 1 ? wy : -wy);

        for (var i = 0; i < this.__amount; i++) {
            if (wx != 0) {
                this.__particles[i].vel.x = ((MathUtil.randInt(1, 5) * 0.1) * this.__windDir.x) + this.__windEnergy.x;
                this.__offsets[i] = (MathUtil.randInt(1, 50) * 0.001) * this.__windDir.x;
            }
            if (wy != 0) {
                this.__particles[i].vel.y = ((p.getRadius() * 0.1) * this.__windDir.y) + this.__windEnergy.y;
            }
        }
        return this;
    }

    setupParticle(p, firstLoad) {
        p.pos.x = firstLoad ? MathUtil.randInt(0, this.__winSize[0] + 200) - 100 : MathUtil.randInt(50, this.__winSize[0] - 50);
        p.pos.y = firstLoad ? MathUtil.randInt(0, this.__winSize[1] + 500) - 500 : MathUtil.randInt(100, this.__winSize[1]) * -1;
        p.setRadius(MathUtil.randInt(3, 10));

        if (this.__windEnergy.x == 0) {
            p.vel.x = (MathUtil.randInt(1, 5) * 0.1) * (MathUtil.randInt(1, 20) <= 10 ? -1 : 1);
        } else {
            p.vel.x = ((MathUtil.randInt(1, 5) * 0.1) * this.__windDir.x) + this.__windEnergy.x;
        }
        if (this.__windEnergy.y == 0) {
            p.vel.y = p.getRadius() * 0.1;
        } else {
            p.vel.y = ((p.getRadius() * 0.1) * this.__windDir.y) + this.__windEnergy.y;
        }
        var gb = MathUtil.randInt(150, 190);
        p.setColor(MathUtil.randInt(240, 250), gb, gb);
        p.setAlpha(p.getRadius() + 10);
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

            if (p.pos.y > this.__winSize[1] + 60) {
                this.setupParticle(p, false);
            }
            if (p.pos.x < -60) {
                p.pos.x = this.__winSize[0] + 30;
            } else if (p.pos.x > this.__winSize[0] + 60) {
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