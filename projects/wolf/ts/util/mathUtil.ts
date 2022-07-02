export class MathUtil {

    public static randNum(a: number): number {
        return Math.floor(Math.random() * a) + 1;
    }

    public static randInt(min: number, max: number): number {
        return Math.floor(Math.random() * ((max - min) + 1)) + min;
    }

    public static angle2rad(v: number): number {
        return (v / 180) * Math.PI;
    }

    public static rad2angle(v: number): number {
        return (v / Math.PI) * 180;
    }

    public static abs(a: number): number {
        return a < 0 ? -a : a;
    }
}