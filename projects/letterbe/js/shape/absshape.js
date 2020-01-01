class AbsShape {
    constructor() {
        this.__alpha = 1;
        this.__colorR = 200;
        this.__colorG = 200;
        this.__colorB = 200;
    }

    setAlpha(v) {
        this.__alpha = v;
    }

    setColor(r, g ,b) {
        this.__colorR = r;
        this.__colorG = g;
        this.__colorB = b;
    }
}