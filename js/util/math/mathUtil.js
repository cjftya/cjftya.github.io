class MathUtil {
    constructor() {
    }

    static randNum(a) {
        return Math.floor(Math.random() * a) + 1;
    }

    static randInt(min, max) {
        return Math.floor(Math.random() * ((max - min) + 1)) + min;
    }
}