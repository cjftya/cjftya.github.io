
export class MediaItem {

    private name: string;
    private color: number;

    public setName(str: string): void {
        this.name = str;
    }

    public getName(): string {
        return this.name;
    }

    public setColor(c: number): void {
        this.color = c;
    }

    public getColor(): number {
        return this.color;
    }
}