export class Message {
    private event: number;
    private data: any;

    constructor(e: number, d: any) {
        this.event = e;
        this.data = d;
    }

    public getEvent(): number {
        return this.event;
    }

    public getData(): any {
        return this.data;
    }

    public static obtain(event: number): Message;
    public static obtain(event: number, data: any): Message;
    public static obtain(event: any, data?: any): any {
        return new Message(event, data);
    }
}