class Rain {
    constructor() {
        this.__drop = [];
        this.__w = 0;
        this.__h = 0;
        this.__fx = 0;
        this.__fy = 0;
    }

    setArea(w, h) {
        this.__w = w;
        this.__h = h;
    }

    setWindDirection(dx) {
        this.__fx = dx;
    }

    setDropSpeed(delta) {
        this.__fy = delta;
    }

    setAmount(amount) {
        this.__amount = amount;
    }

    onStart() {
        for (var i = 0; i < this.__amount; i++) {
            this.__drop.push(new RainDrop(random(this.__w) + (this.__fx * -0.7), -random(this.__h * 2)));
        }
    }

    onUpdate(timeDelta) {
        for (var i = 0; i < this.__amount; i++) {
            this.__drop[i].vel.x = this.__fx * timeDelta
            this.__drop[i].vel.y += this.__fy * timeDelta;
            this.__drop[i].pos.add(this.__drop[i].vel);

            if (this.__drop[i].pos.y > this.__h + 100) {
                this.__drop[i].pos.x = random(this.__w) + (this.__fx * -0.7);
                this.__drop[i].pos.y = -random(this.__h * 2);
                this.__drop[i].vel.y *= 0.5;
            }
        }
    }

    onDraw() {
        for (var i = 0; i < this.__drop.length; i++) {
            this.__drop[i].onDraw();
        }
    }
}