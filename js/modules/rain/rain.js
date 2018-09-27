class Rain {
    constructor() {
        this.__drop = [];
        this.__w = 0;
        this.__h = 0;
    }

    setArea(w, h) {
        this.__w = w;
        this.__h = h;
    }

    onStart() {
        for (var i = 0; i < 10; i++) {
            this.__drop.push(new RainDrop(random(this.__w), random(this.__h)));
        }
    }

    onUpdate(timeDelta) {
        for (var i = 0; i < this.__drop.length; i++) {
            this.__drop[i].onUpdate(timeDelta);
        }
    }

    onDraw() {
        fill(50, 50, 150);
        for (var i = 0; i < this.__drop.length; i++) {
            this.__drop[i].onDraw();
        }
    }
}