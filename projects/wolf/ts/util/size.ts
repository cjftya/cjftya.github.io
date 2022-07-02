export class Size {
    private width: number;
    private height: number;
    private halfWidth: number;
    private halfHeight: number;

    constructor(w: number, h: number) {
        this.setSize(w, h);
    }

    public setSize(w: number, h: number) {
        this.width = w;
        this.height = h;
        this.halfWidth = w / 2;
        this.halfHeight = h / 2;
    }

    public getWidth(): number {
        return this.width;
    }

    public getHeigth(): number {
        return this.height
    }

    public getHalfWidth(): number {
        return this.halfWidth;
    }

    public getHalfHeight(): number {
        return this.halfHeight;
    }
}