class ParticleController {
    constructor() {
        this.__particleList = [];
        for (var i = 0; i < 200; i++) {
            this.__particleList.push(new Particle());
        }
    }

    update() {
        for (var i = 0; i < this.__particleList.length; i++) {
            this.__particleList[i].update();
        }
    }

    draw() {
        for (var i = 0; i < this.__particleList.length; i++) {
            this.__particleList[i].draw();
        }
    }
}