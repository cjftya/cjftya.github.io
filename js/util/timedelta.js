class TimeDelta {
    constructor() {
        this.__newTime = 0;
        this.__frameCount = 0;
        this.__timeElapsed = 0;
        this.__lastTime = Date.now();

        this.__timeDelta = 0;
        this.__fpsCount = 0;
    }

    update() {
        var newTime = Date.now();
        this.__timeDelta = (newTime - this.__lastTime) * 0.001;
    
        this.__frameCount++;
        this.__timeElapsed += this.__timeDelta;
        if(this.__timeElapsed >= 1.0) {
            this.__fpsCount = this.__frameCount / this.__timeElapsed;
            this.__frameCount = 0;
            this.__timeElapsed = 0;
        }
        this.__lastTime = newTime;
    }

    getDelta() {
        return this.__timeDelta;
    }

    getFps() {
        return this.__fpsCount;
    }
}