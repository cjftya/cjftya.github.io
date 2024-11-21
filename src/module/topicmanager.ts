export interface TopicListener {
    (topic: string, data: any): void;
}

export class TopicManager {
    private topicMap: Map<string, TopicListener[]>;
    private valueMap: Map<string, any>;

    constructor() {
        this.topicMap = new Map<string, TopicListener[]>();
        this.valueMap = new Map<string, any>();
    }

    public read(topic: string): any {
        let value: any = this.valueMap.get(topic);
        if (value == null) {
            console.log("not found data : " + topic);
        }
        return value;
    }

    public write(topic: string, value: any): void {
        if (value instanceof Function) {
            throw new Error("data type is Function : " + topic);
        }
        if (this.valueMap.get(topic)) {
            console.log("value overwrite : " + topic);
        }
        this.valueMap.set(topic, value);
    }

    public publish(topic: string, data: any): void {
        let listenerArr: TopicListener[] = this.topicMap.get(topic) as TopicListener[];
        if (!listenerArr) {
            console.log("not found " + topic + " topic");
        } else {
            for (const l of listenerArr) {
                l(topic, data);
            }
        }
    }

    public subscribe(topic: string, listener: TopicListener): void {
        if (!this.topicMap.has(topic)) {
            this.topicMap.set(topic, []);
        }
        let listenerArr: TopicListener[] = this.topicMap.get(topic) as TopicListener[];
        listenerArr.push(listener);
    }

    public erase(topic: string): void {
        let result: boolean = false;
        let type: string = "none";
        if (this.topicMap.has(topic)) {
            this.topicMap.delete(topic);
            result = true;
            type = "listener";
        }
        if (this.valueMap.has(topic)) {
            this.valueMap.delete(topic);
            result = true;
            type = "value";
        }
        console.log("topic : " + topic + " erased, result : " + result + ", type : " + type);
    }

    public clear(): void {
        this.topicMap.clear();
        this.valueMap.clear();
    }
}