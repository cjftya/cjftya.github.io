class Snow extends AbsParticle {
    constructor() {
        super(Particle.Snow);

        this.__active = true;
        this.__w = 0;
        this.__h = 0;
        this.__amount = 0;

        this.__windDir = new Vector2d();
        this.__windEnergy = new Vector2d();

        this.__particles = [];
        this.__offsets = [];

        this.__ws = TopicManager.ready().read(DISPLAY_INFO.WINDOW_SIZE);
    }

    setup(w, h, amount) {
        this.__w = w;
        this.__h = h;
        this.__amount = amount;

        var p;
        for (var i = 0; i < amount; i++) {
            p = new BlurCircle();
            this.setupParticle(p, true);

            this.__particles.push(p);
            this.__offsets.push(MathUtil.randInt(1, 50) * 0.001);
        }
        return this;
    }

    setWind(wx, wy) {
        if (this.__particles.length == 0) {
            return this;
        }

        this.__windDir.set(wx < 0 ? -1 : 1, wy < 0 ? -1 : 1);
        this.__windEnergy.set(this.__windDir.x == 1 ? wx : -wx,
            this.__windDir.y == 1 ? wy : -wy);

        for (var i = 0; i < this.__amount; i++) {
            if (wx != 0) {
                this.__particles[i].vel.x = ((MathUtil.randInt(1, 5) * 0.1) * this.__windDir.x) + this.__windEnergy.x;
                this.__offsets[i] = (MathUtil.randInt(1, 50) * 0.001) * this.__windDir.x;
            }
            if (wy != 0) {
                this.__particles[i].vel.y = ((1 * 0.1) * this.__windDir.y) + this.__windEnergy.y;
            }
        }
        return this;
    }

    setupParticle(p, firstLoad) {
        p.pos.x = firstLoad ? MathUtil.randInt(0, this.__ws[0] + 200) - 100 : MathUtil.randInt(50, this.__ws[0] - 50);
        p.pos.y = firstLoad ? MathUtil.randInt(0, this.__ws[1] + 500) - 500 : MathUtil.randInt(100, this.__ws[1]) * -1;
        var r = MathUtil.randInt(3, 10);
        p.setRadiusWithBlur(r, r * 3, r * 5);

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

    updateWithDraw(delta) {
        this.update(delta);
        this.draw();
    }

    update(delta) {
        if (!this.__active) {
            return;
        }

        var p, offset;
        for (var i = 0; i < this.__particles.length; i++) {
            p = this.__particles[i];
            offset = this.__offsets[i];

            p.pos.x += p.vel.x + offset;
            p.pos.y += p.vel.y;

            if (p.pos.y > this.__ws[1] + 60) {
                this.setupParticle(p, false);
            }
            if (p.pos.x < -60) {
                p.pos.x = this.__ws[0] + 30;
            } else if (p.pos.x > this.__ws[0] + 60) {
                p.pos.x = -30;
            }
        }
    }

    draw() {
        if (!this.__active) {
            return;
        }
        for (var i = 0; i < this.__particles.length; i++) {
            this.__particles[i].draw();
        }
    }
}