class PositionManager {
    constructor() {
        this.__total = 5;
        this.__history = [];
        for (var i = 0; i < this.__total; i++) {
            this.__history.push(0);
        }
        this.__index = 0;
    }

    add(v) {
        this.__history[this.__index] = v;
        if(++this.__index >= this.__total) {
            this.__index = 0;
        }
    }

    getIndex(index) {
        var idx = (index + this.__index) % this.__total;
        return idx;
    }

    getAverage() {
        var maxN = 0;
        var minN = 9999;
        for (var i = 0; i < 4; i++) {
            if (maxN < this.__history[this.getIndex(i)]) {
                maxN = this.__history[this.getIndex(i)];
            }
            if (minN > this.__history[this.getIndex(i)]) {
                minN = this.__history[this.getIndex(i)];
            }
        }
        return this.__history[this.getIndex(1)] > 0 ? maxN : minN;
    }

    clear() {
        for (var i = 0; i < this.__total; i++) {
            this.__history[i] = 0;
        }
    }

}