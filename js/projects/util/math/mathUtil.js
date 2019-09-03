class MathUtil {
    constructor() {
    }

    static randNum(a) {
        return Math.floor(Math.random() * a) + 1;
    }

    static randInt(min, max) {
        return Math.floor(Math.random() * ((max - min) + 1)) + min;
    }

    static angle2rad(v) {
        return (v / 180) * Math.PI;
    }

    static rad2angle(v) {
        return (v / Math.PI) * 180;
    }

    static abs(a) {
        return a < 0 ? -a : a;
    }
}