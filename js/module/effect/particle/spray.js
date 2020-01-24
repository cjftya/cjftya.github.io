class Spray extends AbsParticle {
    constructor(amount) {
        super(Particle.Spray);

        this.__center = new Vector2d();
        this.__life = 0;

        this.__freq = 0;
        this.__freqCount = 0;
        this.__sprayCount = 0;
        
        this.__aw = 0;
        this.__ah = 0;

        this.__posOffset = new Vector2d();

        this.__amount = amount;
        this.__particles = [];
        for (var i = 0; i < this.__amount; i++) {
            this.__particles.push(new ParticleCircle().setColor(200, 80, 80));
        }
    }

    inScreen(sw, sh) {
        if(this.__center.y > -70 && this.__center.y < sh + 70) {
            return true;
        }
        return false;
    }

    setupPaticle(p) {
        p.pos.x = this.__center.x + this.__posOffset.x + Math.cos(MathUtil.angle2rad(MathUtil.randInt(0, 360))) * this.__aw;
        p.pos.y = this.__center.y + this.__posOffset.y + Math.sin(MathUtil.angle2rad(MathUtil.randInt(0, 360))) * this.__ah;
        p.setRadius(MathUtil.randInt(1, 3));

        p.vel.x = Math.cos(MathUtil.angle2rad(MathUtil.randInt(0, 360))) * (MathUtil.randInt(1, 5) * 0.1);
        p.vel.y = Math.sin(MathUtil.angle2rad(MathUtil.randInt(0, 360))) * (MathUtil.randInt(1, 5) * 0.1);

        p.setAlpha(250);
        p.setLife(this.__life);
    }

    addPos(x, y) {
        this.__posOffset.set(x, y);
        this.__center.x += x;
        this.__center.y += y;
        return this;
    }

    setPos(x, y) {
        this.__center.set(x, y);
        return this;
    }

    setFreq(f) {
        this.__freq = f;
        return this;
    }

    setLife(v) {
        this.__life = v;
        return this;
    }

    setCreateArea(aw, ah) {
        this.__aw = aw;
        this.__ah = ah;
        return this;
    }

    setBlur(v) {
        for (var p of this.__particles) {
            p.setBlur(v);
        }
        return this;
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