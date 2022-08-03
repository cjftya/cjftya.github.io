
export class MediaItem {

    private name: string;
    private color: number;
    private stageId: number;

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

    public setStageId(id: number): void {
        this.stageId = id;
    }

    public getStageId(): number {
        return this.stageId;
    }
}