class WriteEffect {
    constructor() {
        this.__ptCount = 0;
        this.__dustList = [];
        this.__pos = new Point();
        for (var i = 0; i < 500; i++) {
            this.__dustList.push(new ParticleBasic());
        }
    }

    active(px, py) {
        this.__dustList[this.__ptCount].__pos.set(px, py);
        this.__dustList[this.__ptCount].__vel.set(Tools.randInt(-2, 2), Tools.randInt(-2, 2));
        this.__dustList[this.__ptCount].__visible = true;
        this.__ptCount++;
        if (this.__ptCount >= 499) {
            this.__ptCount = 0;
        }
    }

    update() {
        for (var i = 0; i < this.__dustList.length; i++) {
            if (!this.__dustList[i].__visible) {
                continue;
            }

            this.__dustList[i].__pos.x += this.__dustList[i].__vel.x;
            this.__dustList[i].__pos.y += this.__dustList[i].__vel.y;
            this.__dustList[i].__r -= 0.5;
            this.__dustList[i].__s = this.__dustList[i].__r * 2;
            if (this.__dustList[i].__r < 0) {
                this.__dustList[i].__r = Tools.randInt(3, 20);
                this.__dustList[i].__s = this.__dustList[i].__r * 2;
                this.__dustList[i].__visible = false;
            }
        }
    }

    draw() {
        noStroke();
        for (var i = 0; i < this.__dustList.length; i++) {
            if (!this.__dustList[i].__visible) {
                continue;
            }
            this.__dustList[i].draw();
        }
    }
}